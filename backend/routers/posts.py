from fastapi import APIRouter,HTTPException,Header,Depends,Query,BackgroundTasks
from models import Posts,Users,Friendship,Like,Comment,Tags,Notifcation,Interest
from schema import PostCreate,Post,CommentCreate,PaginatedPosts
from database import SessionLocal
from authentication import verifytoken,getcurrentuser
from typing import Optional
from sqlalchemy.orm import Session,joinedload,selectinload,load_only
from datetime import datetime
from emailservice import sendemail
from rag import rag
from sqlalchemy import func
from feedservice import FeedService
from redisclient import getcache,setcache,deletecache
router=APIRouter(prefix="/posts",tags=["posts"])

def post_response(post,comments_limit=5):
    likes=list(getattr(post,"likes",None) or [])
    comments=list(getattr(post,"comments",None) or [])
    comments=sorted(comments,key=lambda c:c.created_at,reverse=True)
    comments_total=len(comments)
    visible=comments[:comments_limit]
    return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,
           "image":post.image,"created_at":post.created_at.isoformat() if post.created_at else None,"published_at":post.published_at.isoformat() if post.published_at else None,"username":post.owner.name if post.owner else None,"owner_id":post.owner_id,"tagged_users":[{"id":tag.user.id,"name":tag.user.name} for tag in getattr(post,"tagged_friends",[]) if tag.user],
            "likes":{"count":len(likes),"users":[{"id":l.user.id,"username":l.user.name} for l in likes if l.user]},
            "comments":[{"id":c.id,"content":c.content,"username":c.user.name if c.user else "unknown",
                         "created_at":c.created_at,"user_id":c.user_id} for c in visible],
            "comments_total":comments_total
            }

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def post_query(db:Session):
    return (db.query(Posts).options(joinedload(Posts.owner)))

def indexpost(post_id:int):
    db=SessionLocal()
    try:
        post= (post_query(db).options(selectinload(Posts.likes),selectinload(Posts.comments),selectinload(Posts.tagged_friends).joinedload(Tags.user)).filter(Posts.id==post_id).first())
        if not post:
            return
        authorname=post.owner.name if post.owner else "unknown"
        likescount=len(post.likes)
        commentscount=len(post.comments)
        taggednames=[tag.user.name for tag in post.tagged_friends if tag.user]
        taggedids=[tag.user.id for tag in post.tagged_friends if tag.user]
        post_text=f"""POST ID: {post.id}
            TITLE:{post.title}
            AUTHOR:{authorname}
            AUTHOR ID:{post.owner_id}
            CONTENT:{post.description}
            CATEGORY:{post.category}
            STATUS:{post.status}
            CREATED:{post.created_at}
            LIKES:{likescount}
            COMMENTS:{commentscount}
            TAGGED USERS: {', '.join(taggednames) if taggednames else 'None'}""" 
        rag.addpost(
            post_id=f"post_{post.id}",
            content=post_text,
            metadata={
                "type":"post",
                "id":post.id,
                "owner_id":post.owner_id,
                "title":post.title,
                "author":authorname,
                "category":post.category,
                "status":post.status,
                "likes":likescount,
                "comments":commentscount,
                "tagged_users":taggedids,
                "created_at":str(post.created_at)
            }
        )
        print(f"Indexed post {post.id} in RAG")
    except Exception as e:
        print(f"Error indexing post {post_id}: {e}")
    finally:
        db.close()
def get_post(post_id:int,db:Session=Depends(get_db)):
    post=db.query(Posts).filter(Posts.id==post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="Post is not found")
    return post

def deletefromrag(post_id:int):
    try:
        rag.collection.delete(ids=[f"post_{post_id}"])
        print(f"Removed post {post_id}")
    except Exception as e:
        print(f"RAG delete failed: {e}")

async def sendcommentemail(email,username,title):
    await sendemail(email,f"{username} commented on your post '{title}'.","comment")

def getuserwtoken(authorization:Optional[str]=Header(None),db:Session=Depends(get_db)):
    if not authorization:
        return None
    try:
        token=authorization.split(" ")[1]
        payload=verifytoken(token)
        if not payload:
            return None
        user=db.query(Users).filter(Users.id==payload["id"]).first()
        return user
    except Exception:
        return None


@router.get("/me")
def myposts(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    posts=db.query(Posts).options(load_only(Posts.id,Posts.title,Posts.category,Posts.status,Posts.image,Posts.created_at,Posts.published_at)).filter(Posts.owner_id==currentuser.id).order_by(Posts.created_at.desc()).all()
    return[{"id":p.id,"title":p.title,"category":p.category,"status":p.status,"image":p.image,"created_at":p.created_at,"published_at":p.published_at}
           for p in posts]

def strip_data_uri(image:str):
    if image and image.startswith("data:image"):
        return image.split(",")[1] if "," in image else image
    return image

def backgroundindexpost(post_id:int):
    indexpost(post_id)

@router.get("/me/drafts")
def mydrafts(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    drafts=(db.query(Posts).options(load_only(Posts.id,Posts.title,Posts.category,Posts.image,Posts.created_at)).filter(Posts.owner_id==currentuser.id,Posts.status=="draft").order_by(Posts.created_at.desc()).all())
    return[{"id":p.id,"title":p.title,"category":p.category,"created_at":p.created_at,"image":p.image}
           for p in drafts]

@router.post("/",response_model=Post)
def makepost(post:PostCreate,backgroundtasks:BackgroundTasks,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    newpost=Posts(title=post.title,description=post.description,
    category=post.category,status=post.status,
    image=strip_data_uri(post.image),
    owner_id=currentuser.id,
    published_at=datetime.utcnow() if post.status == "published" else None)
    db.add(newpost)
    currentuser.post_count=(currentuser.post_count or 0)+1
    db.flush()
    friends=db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id.in_(post.tagged_users)).all()
    friend_ids={f.friend_id for f in friends}
    db.bulk_save_objects([Tags(post_id=newpost.id,user_id=fid) for fid in friend_ids])
    if newpost.status=="published":
        notifications=[Notifcation(user_id=fid,post_id=newpost.id,message=f"{currentuser.name} tagged you in a post with title-{post.title}")for fid in friend_ids]
        db.bulk_save_objects(notifications)
        feedservice=FeedService(db)
        feedservice.clear_cache()
    db.commit()
    deletecache("posts:*")
    db.refresh(newpost)
    backgroundtasks.add_task(indexpost,newpost.id)
    return post_response(newpost)

    
@router.get("/",response_model=PaginatedPosts)
def listposts(search:Optional[str]=Query(None),db:Session =Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(10,ge=1),currentuser=Depends(getuserwtoken)):
    query=(db.query(Posts).options( load_only(Posts.id,Posts.title,Posts.description,
            Posts.category,Posts.status,Posts.image,Posts.owner_id,Posts.created_at,Posts.published_at),
            joinedload(Posts.owner).load_only(Users.id,Users.name),selectinload(Posts.tagged_friends).joinedload(Tags.user).
            load_only(Users.id,Users.name),selectinload(Posts.likes).joinedload(Like.user).load_only(Users.id,Users.name),
            selectinload(Posts.comments).joinedload(Comment.user).load_only(Users.id,Users.name)).filter(Posts.status=="published").order_by(Posts.published_at.desc()))
    if search:
        query=query.filter(Posts.title.ilike(f"%{search}%"))
    total=query.count()
    posts=(query.offset(skip).limit(limit).all())
    res={"total":total,"skip":skip,"limit":limit,"has_more":skip+limit<total,"posts":[post_response(post) for post in posts]}
    return res


@router.get("/friends")
def getfriends(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    friends=(db.query(Users).join(Friendship,Friendship.friend_id==Users.id).filter(Friendship.user_id==currentuser.id).all())
    return[{"id":fr.id,"name":fr.name} for fr in friends]

@router.get("/categories")
def getcategories(db:Session=Depends(get_db)):
    categories=(db.query(Posts.category).filter(Posts.category!=None,Posts.category!="").distinct().all())
    return[c[0] for c in categories]

@router.get("/{post_id}",response_model=Post)
def getposts(post_id:int,db: Session = Depends(get_db),currentuser=Depends(getuserwtoken)):
    post=(db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.tagged_friends).joinedload(Tags.user),selectinload(Posts.likes).joinedload(Like.user),selectinload(Posts.comments).joinedload(Comment.user)).filter(Posts.id==post_id).first())
    if not post:
        raise HTTPException(status_code=404,detail="post is not found")
    if post.status=="draft":
        if not currentuser:
            raise HTTPException(status_code=403,detail="This post is private")
        if post.owner_id!=currentuser.id and currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="This post is private")
    res=post_response(post)
    return res


@router.put("/{post_id}",response_model=Post)
def editpost(post_id:int,post:PostCreate,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
        dbpost=(db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.tagged_friends).joinedload(Tags.user)).filter(Posts.id==post_id).first())
        if dbpost:
            if dbpost.owner_id!=currentuser.id and currentuser.role!="admin":
                raise HTTPException(status_code=403,detail="Not allowed")
            dbpost.title=post.title
            dbpost.description=post.description
            dbpost.category=post.category
            oldstatus=dbpost.status
            dbpost.status=post.status
            if oldstatus!="published" and dbpost.status=="published":
                dbpost.published_at=datetime.utcnow()
                feedservice=FeedService(db)
                feedservice.clear_cache()
            dbpost.image=strip_data_uri(post.image)
            db.query(Tags).filter(Tags.post_id==dbpost.id).delete()
            friends=db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id.in_(post.tagged_users)).all()
            friend_ids={f.friend_id for f in friends}
            db.bulk_save_objects([Tags(post_id=dbpost.id,user_id=fid) for fid in friend_ids])
            if dbpost.status=="published":
                notifications=[Notifcation(user_id=fid,post_id=dbpost.id,message=f"{currentuser.name} tagged you in a post with title-{post.title}")for fid in friend_ids]
                db.bulk_save_objects(notifications)
            db.commit()
            deletecache("posts:*")
            deletecache(f"post:{post_id}")
            indexpost(dbpost.id)
            return post_response(dbpost)
        else:
            raise HTTPException(status_code=404,detail="NO POST FOUND")
    
@router.delete("/{post_id}")
def deletepost(post_id:int,backgroundtasks:BackgroundTasks,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
        dbpost=db.query(Posts).filter(Posts.id==post_id).first()
        if not dbpost:
            raise HTTPException(status_code=404,detail="POST NOT FOUND")
        if dbpost.owner_id!=currentuser.id and currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="NOT ALLOWED TO DELETE POST")
        owner=db.query(Users).filter(Users.id==dbpost.owner_id).first()
        if owner and owner.post_count>0:
                owner.post_count-=1
        backgroundtasks.add_task(deletefromrag,post_id)
        db.delete(dbpost)
        db.commit()
        deletecache("posts:*")
        deletecache(f"post:{post_id}")
        return{"message":"post is deleted"}

@router.post("/{post_id}/like")
def likepost(post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    postexist=db.query(Posts.id).filter(Posts.id==post_id).first()
    if not postexist:
        raise HTTPException(status_code=404,detail="Post not found")
    exist=db.query(Like).filter(Like.post_id==post_id,Like.user_id==currentuser.id).first()
    if exist:
        raise HTTPException(status_code=400,detail="Can not like this post again")
    like=Like(post_id=post_id,user_id=currentuser.id)
    db.add(like)
    currentuser.likes_given=(currentuser.likes_given or 0)+1
    owner=db.query(Users).join(Posts,Posts.owner_id==Users.id).filter(Posts.id==post_id).first()
    if owner:
        owner.likes_received=(owner.likes_received or 0)+1
    try:
        db.commit()
    except Exception:
        db.rollback()
    deletecache("posts:*")
    deletecache(f"post:{post_id}")
    return{"message":"Liked post successfully"}

@router.delete("/{post_id}/like")
def unlikepost(post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    like=db.query(Like).filter(Like.post_id==post_id,Like.user_id==currentuser.id).first()
    if not like:
        raise HTTPException(status_code=404,detail="No like found")
    db.delete(like)
    if currentuser.likes_given>0:
        currentuser.likes_given-=1
    owner=db.query(Users).join(Posts,Posts.owner_id==Users.id).filter(Posts.id==post_id).first()
    if owner and owner.likes_received>0:
        owner.likes_received-=1
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500,detail="Failed to remove like")
    deletecache("posts:*")
    deletecache(f"post:{post_id}")
    return{"message":"Like is removed successfully"}

@router.get("/{post_id}/likes")
def getlikes(post_id:int,db: Session = Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(50,ge=1,le=100)):
    total=db.query(func.count(Like.id)).filter(Like.post_id==post_id).scalar()
    users=db.query(Users.id,Users.name).join(Like,Like.user_id==Users.id).filter(Like.post_id==post_id).order_by(Like.created_at.desc()).offset(skip).limit(limit).all()
    return{"Likes":total,"users":[{"id":user.id,"username":user.name} for user in users]}

@router.post("/{post_id}/comments")
async def addcomment(comment:CommentCreate,post_id:int,backgroundtasks:BackgroundTasks,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    post=get_post(post_id,db)
    comment=Comment(content=comment.content,post_id=post_id,user_id=currentuser.id)
    db.add(comment)
    currentuser.comment_count=(currentuser.comment_count or 0)+1
    if post.owner_id!=currentuser.id:
        db.add(Notifcation(user_id=post.owner_id,post_id=post_id,message=f"{currentuser.name} commented on your post"))
        backgroundtasks.add_task(sendcommentemail,post.owner.email,currentuser.name,post.title)
    db.commit()
    deletecache("posts:*")
    deletecache(f"post:{post_id}")
    db.refresh(comment)
    return{"id":comment.id,"content":comment.content,"user_id":comment.user_id}

@router.get("/{post_id}/comments")
def getcomments(post_id:int,db:Session=Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(20,ge=1,le=100)):
    total=db.query(func.count(Comment.id)).filter(Comment.post_id==post_id).scalar()
    comments=(db.query(Comment).options(joinedload(Comment.user)).filter(Comment.post_id==post_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all())
    return{"total":total,"skip":skip,"limit":limit,"comments":[{"id":com.id,"content":com.content,"username":com.user.name if com.user else "unknown","created_at":com.created_at,"user_id":com.user_id} for com in comments]}

@router.delete("/{post_id}/comments/{comment_id}")
def deletecomment(post_id:int,comment_id:int,backgroundtasks:BackgroundTasks,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    comment=db.query(Comment).filter(Comment.id==comment_id,Comment.post_id==post_id).first()
    if not comment:
        raise HTTPException(status_code=404,detail="No such comment")
    if (comment.user_id!=currentuser.id and currentuser.role!="admin"):
        raise HTTPException(status_code=403,detail="Not allowed")
    owner=comment.user
    if owner and owner.comment_count>0:
        owner.comment_count-=1
    db.delete(comment)
    db.commit()
    deletecache("posts:*")
    deletecache(f"post:{post_id}")
    backgroundtasks.add_task(backgroundindexpost,post_id)
    return{"message":"Comment is deleted successfully"}

@router.get("/user/{user_id}/posts")
def userposts(user_id:int,db:Session=Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(10,ge=1,le=50)):
    posts=(db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.tagged_friends).joinedload(Tags.user),
                                       selectinload(Posts.likes).joinedload(Like.user),
                                       selectinload(Posts.comments).joinedload(Comment.user)).filter(Posts.owner_id==user_id,Posts.status=="published").order_by(Posts.created_at.desc()).offset(skip).limit(limit).all())
    return{"posts":[post_response(post) for post in posts],"has_more":len(posts)==limit}

def backgroundindexallposts():
    db=SessionLocal()
    try:
        posts=(db.query(Posts.id).filter(Posts.status=="published").yield_per(100))
        success=0
        failed=0
        for (post_id,) in posts:
            try:
                indexpost(post_id)
                success+=1
            except Exception as e:
                failed+=1
                print(f"Index failed {post_id}:{e}")
        print(f"Indexed:{success},Failed:{failed}")
    finally:
        db.close()

@router.post("/index-all")
def indexallposts(backgroundtasks:BackgroundTasks,db:Session=Depends(get_db),currentuser=Depends(getcurrentuser)):
    if currentuser.role!="admin":
        raise HTTPException(status_code=403,detail="Admin only")
    backgroundtasks.add_task(backgroundindexallposts)
    return {"message":"Indexed posts successfully"}


@router.get("/interests")
def get_interest(db:Session=Depends(get_db)):
    category=(db.query(func.lower(func.trim(Posts.category))).filter(Posts.category.isnot(None)).filter(func.trim(Posts.category) != "").distinct().order_by(func.lower(func.trim(Posts.category))).all())
    return[mycategory[0] for mycategory in category]
  
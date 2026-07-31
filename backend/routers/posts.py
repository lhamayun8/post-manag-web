from fastapi import APIRouter,HTTPException,Header,Depends,Query
from models import Posts,Users,Friendship,Like,Comment,Tags,Notifcation
from schema import PostCreate,Post,CommentCreate
from database import SessionLocal
from authentication import verifytoken,getcurrentuser
from typing import Optional
from sqlalchemy.orm import Session,joinedload,selectinload
from datetime import datetime
from emailservice import sendemail
from rag import rag

router=APIRouter(prefix="/posts",tags=["posts"])

def post_response(post):
    return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,
           "image":post.image,"created_at":post.created_at,"published_at":post.published_at,"username":post.owner.name if post.owner else None,"owner_id":post.owner_id,"tagged_users":[{"id":tag.user.id,"name":tag.user.name} for tag in post.tagged_friends]}

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def post_query(db:Session):
    return db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.likes),selectinload(Posts.comments),selectinload(Posts.tagged_friends).joinedload(Tags.user))

def indexpost(post_id:int,db:Session):
    try:
        post=post_query(db).filter(Posts.id==post_id).first()
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
def get_post(post_id:int,db:Session=Depends(get_db)):
    post=post_query(db).filter(Posts.id==post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="post is not found")
    return post

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
    except:
        return None


@router.get("/me")
def myposts(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    posts=post_query(db).filter(Posts.owner_id==currentuser.id).order_by(Posts.created_at.desc()).all()
    return[{"id":p.id,"title":p.title,"category":p.category,"status":p.status,"image":p.image,"created_at":p.created_at,"published_at":p.published_at}
           for p in posts]

def strip_data_uri(image:str):
    if image and image.startswith("data:image"):
        return image.split(",")[1] if "," in image else image
    return image

@router.get("/me/drafts")
def mydrafts(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    drafts=post_query(db).filter(Posts.owner_id==currentuser.id,Posts.status=="draft").order_by(Posts.created_at.desc()).all()
    return[{"id":p.id,"title":p.title,"category":p.category,"created_at":p.created_at,"image":p.image}
           for p in drafts]

@router.post("/",response_model=Post)
def makepost(post:PostCreate,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    newpost=Posts(title=post.title,description=post.description,
    category=post.category,status=post.status,
    image=strip_data_uri(post.image),
    owner_id=currentuser.id)
    db.add(newpost)
    db.commit()
    db.refresh(newpost)
    friends=db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id.in_(post.tagged_users)).all()
    friend_ids={f.friend_id for f in friends}
    for friend_id in friend_ids:
        db.add(Tags(post_id=newpost.id,user_id=friend_id))
        if newpost.status=="published":
            db.add(Notifcation(user_id=friend_id,post_id=newpost.id,message=f"{currentuser.name} tagged you in a post with title-{post.title}"))
    db.commit()
    db.refresh(newpost)
    indexpost(newpost.id,db)
    return post_response(newpost)

    
@router.get("/",response_model=list[Post])
def listposts(search:Optional[str]=Query(None),db:Session =Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(10,ge=1),currentuser=Depends(getuserwtoken)):
    query=post_query(db).filter(Posts.status=="published").order_by(Posts.published_at.desc())
    if search:
        query=query.filter(Posts.title.ilike(f"%{search}%"))
    posts=query.offset(skip).limit(limit).all()
    return [post_response(post) for post in posts]

@router.get("/friends")
def getfriends(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    friends=(db.query(Users).join(Friendship,Friendship.friend_id==Users.id).filter(Friendship.user_id==currentuser.id).all())
    return[{"id":fr.id,"name":fr.name} for fr in friends]

@router.get("/{post_id}",response_model=Post)
def getposts(post_id:int,db: Session = Depends(get_db),currentuser=Depends(getuserwtoken)):
    post=post_query(db).filter(Posts.id==post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="post is not found")
    if post.status=="draft":
        if not currentuser:
            raise HTTPException(status_code=403,detail="this post is private")
        if post.owner_id!=currentuser.id and currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="this post is private")
    return post_response(post)


@router.put("/{post_id}",response_model=Post)
def editpost(post_id:int,post:PostCreate,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
        dbpost=post_query(db).filter(Posts.id==post_id).first()
        if dbpost:
            if dbpost.owner_id!=currentuser.id and currentuser.role!="admin":
                raise HTTPException(status_code=403,detail="not allowed")
            dbpost.title=post.title
            dbpost.description=post.description
            dbpost.category=post.category
            oldstatus=dbpost.status
            dbpost.status=post.status
            if oldstatus!="published" and dbpost.status=="published":
                dbpost.published_at=datetime.utcnow()
            dbpost.image=strip_data_uri(post.image)
            db.query(Tags).filter(Tags.post_id==dbpost.id).delete()
            friends=db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id.in_(post.tagged_users)).all()
            friend_ids={f.friend_id for f in friends}
            for friend_id in friend_ids:
                db.add(Tags(post_id=dbpost.id,user_id=friend_id))
                if dbpost.status=="published":
                    db.add(Notifcation(user_id=friend_id,post_id=dbpost.id,message=f"{currentuser.name} tagged you in a post with title-{post.title}"))
            db.commit()
            db.refresh(dbpost)
            indexpost(dbpost.id,db)
            return post_response(dbpost)
        else:
            raise HTTPException(status_code=404,detail="NO POST FOUND")
    
@router.delete("/{post_id}")
def deletepost(post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
        dbpost=db.query(Posts).filter(Posts.id==post_id).first()
        if not dbpost:
            raise HTTPException(status_code=404,detail="POST NOT FOUND")
        if dbpost.owner_id!=currentuser.id and currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="NOT ALLOWED TO DELETE POST")
        try:
            rag.collection.delete(ids=[f"post_{post_id}"])
            print(f"Removed post {post_id} from RAG")
        except Exception as e:
            print("Error")
        db.delete(dbpost)
        db.commit()
        return{"message":"post is deleted"}

@router.post("/{post_id}/like")
def likepost(post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    get_post(post_id,db)
    exist=db.query(Like).filter(Like.post_id==post_id,Like.user_id==currentuser.id).first()
    if exist:
        raise HTTPException(status_code=400,detail="Can not like this post again")
    like=Like(post_id=post_id,user_id=currentuser.id)
    db.add(like)
    db.commit()
    db.refresh(like)
    indexpost(post_id,db)
    return{"message":"Liked post successfully"}

@router.delete("/{post_id}/like")
def unlikepost(post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    like=db.query(Like).filter(Like.post_id==post_id,Like.user_id==currentuser.id).first()
    if not like:
        raise HTTPException(status_code=404,detail="No like found")
    db.delete(like)
    db.commit()
    indexpost(post_id,db)
    return{"message":"Like is removed successfully"}

@router.get("/{post_id}/likes")
def getlikes(post_id:int,currentuser=Depends(getuserwtoken),db: Session = Depends(get_db)):
    likes=(db.query(Like).options(joinedload(Like.user)).filter(Like.post_id==post_id).all())
    return{"Likes":len(likes),"users":[{"id":like.user.id,"username":like.user.name} for like in likes]}

@router.post("/{post_id}/comments")
async def addcomment(comment:CommentCreate,post_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    post=get_post(post_id,db)
    comment=Comment(content=comment.content,post_id=post_id,user_id=currentuser.id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    if post.owner_id!=currentuser.id:
        db.add(Notifcation(user_id=post.owner_id,post_id=post_id,message=f"{currentuser.name} commented on your post"))
        await sendemail(post.owner.email,f"{currentuser.name} commented on your post '{post.title}'.","comment")
        db.commit()
    indexpost(post_id,db)
    return{"id":comment.id,"content":comment.content,"user_id":comment.user_id}

@router.get("/{post_id}/comments")
def getcomments(post_id:int,db:Session=Depends(get_db)):
    comments=(db.query(Comment).options(joinedload(Comment.user)).filter(Comment.post_id==post_id).order_by(Comment.created_at.desc()).all())
    return[{"id":com.id,"content":com.content,"username":com.user.name if com.user else "unknown","created_at":com.created_at,"user_id":com.user_id} for com in comments]

@router.delete("/{post_id}/comments/{comment_id}")
def deletecomment(post_id:int,comment_id:int,currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    comment=db.query(Comment).filter(Comment.id==comment_id,Comment.post_id==post_id).first()
    if not comment:
        raise HTTPException(status_code=404,detail="No such comment")
    if comment.user_id!=currentuser.id and currentuser.role!="admin":
        raise HTTPException(status_code=403,detail="Not allowed")
    db.delete(comment)
    db.commit()
    indexpost(post_id,db)
    return{"message":"Comment is deleted successfully"}

@router.get("/user/{user_id}/posts")
def userposts(user_id:int,db:Session=Depends(get_db)):
    posts=(db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.tagged_friends).joinedload(Tags.user)).filter(Posts.owner_id==user_id,Posts.status=="published").order_by(Posts.created_at.desc()).all())
    return[post_response(post) for post in posts]

@router.post("/index-all")
def indexallposts(db:Session=Depends(get_db)):
    posts=db.query(Posts).all()
    count=0
    for post in posts:
        try:
            indexpost(post.id,db)
            count+=1
        except Exception as e:
            print("Error")
    return {"message":f"Indexed {count} posts successfully"}
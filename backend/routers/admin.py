from fastapi import APIRouter,HTTPException,Header,Depends,Query
from database import SessionLocal
from models import Users,Posts,Comment
from authentication import verifytoken,getcurrentuser
from schema import Post,User,PostCreate
from typing import List,Optional
from sqlalchemy.orm import Session,joinedload,selectinload
router=APIRouter(prefix="/admin",tags=["admin"])
from sqlalchemy import or_,desc

def post_response(post):
     return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,"image":post.image,"created_at":post.created_at,
            "published_at":post.published_at,
            "username":post.owner.name if post.owner else None,
            "owner_id":post.owner_id,"owner_email":post.owner.email if post.owner else None}

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verifyadmin(currentuser=Depends(getcurrentuser)):
    if currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="Can not access")
    return currentuser

def get_post(post_id:int,db:Session=Depends(get_db)):
     post=(db.query(Posts).options(joinedload(Posts.owner)).filter(Posts.id==post_id).first())
     if not post:
          raise HTTPException(status_code=404,detail="Post not found")
     return post

def get_comment(comment_id:int,db:Session=Depends(get_db)):
     comment=db.query(Comment).filter(Comment.id==comment_id).first()
     if not comment:
          raise HTTPException(status_code=404,detail="Comment not found")
     return comment

def get_user(user_id:int,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="No such user ")
    return user

@router.put("/makeadmin/{user_id}")
def makeadmin(user_id:int,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
        if user_id==admin.id:
          raise HTTPException(status_code=400, detail="Cannot change your own role")
        update=(db.query(Users).filter(Users.id==user_id).update({Users.role:"admin"}))
        if not update:
             raise HTTPException(status_code=404,detail="No such user")
        db.commit()
        return{"message":"Now an admin"}

@router.get("/users")
def users(limit:int=Query(10,ge=1,le=100),skip:int=Query(0,ge=0),search:Optional[str]=Query(None),admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     query=db.query(Users).filter(Users.is_verified==True)
     if search:
          search_term = f"%{search}%"
          query = query.filter(
            or_(
                Users.name.ilike(search_term),
                Users.email.ilike(search_term)
            )
        )
     query = query.order_by(desc(Users.id))
     total=query.count()
     users=query.offset(skip).limit(limit).all()
     return {"users": [{"id": u.id,"name": u.name,"email": u.email,"role": u.role,
                         "is_active": u.is_active,"is_verified": u.is_verified,"last_seen": u.last_seen,"post_count": u.post_count,
                         "comment_count": u.comment_count}for u in users],
          "total": total,"skip": skip,"limit": limit,"has_more": skip + limit < total
               }
    
@router.get("/posts")
def posts(limit:int=Query(10,ge=1,le=100),skip:int=Query(0,ge=0),status: Optional[str] = Query(None),search:Optional[str]=Query(None),admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     query=db.query(Posts).options(joinedload(Posts.owner),selectinload(Posts.likes),selectinload(Posts.comments)).filter(Posts.status=="published")
     if status:
          query=query.filter(Posts.status==status)
     if search:
         search_term = f"%{search}%"
         query = query.filter(
              or_(
                    Posts.title.ilike(search_term),
                    Posts.description.ilike(search_term)
                    )
                    )
     query = query.order_by(desc(Posts.id))
     total=query.count()
     posts=query.offset(skip).limit(limit).all()
     return {"posts": [{"id": p.id,"title": p.title,"description":p.description[:200]+"..." if len(p.description)>200 else p.description,
                       "category":p.category,"status":p.status,"image":p.image,"created_at":p.created_at,"published_at":p.published_at,
                       "username":p.owner.name if p.owner else "unknown","owner_id":p.owner_id,"owner_email":p.owner.email if p.owner else None,
                       "likes_count":len(p.likes) if hasattr(p,'likes') else 0,
                       "comments_count":len(p.comments) if hasattr(p,'comments') else 0
     }for p in posts],
              "total": total,"skip": skip,"limit": limit,"has_more": skip + limit < total
                   }

@router.put("/block/{user_id}")
def blockuser(user_id:int,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     user=get_user(user_id,db)
     if user.id==admin.id:
          raise HTTPException(status_code=400,detail="Admin cannot block himself")
     if user.role=="admin":
          raise HTTPException(status_code=400,detail="Cannot block another admin")
     user.is_active=False
     db.commit()
     return{"message":"User is blocked"}

@router.put("/activate/{user_id}")
def activateuser(user_id:int,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     update=(db.query(Users).filter(Users.id==user_id).update({Users.is_active:True}))
     if not update:
          raise HTTPException(status_code=404,detail="No such user")
     db.commit()
     return{"message":"User is activated"}

@router.put("/posts/{post_id}")
def editpost(post_id:int,data:PostCreate,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     post=get_post(post_id,db)
     post.title=data.title
     post.description=data.description
     post.category=data.category
     post.status=data.status
     db.commit()
     db.refresh(post)
     return{"message":"Post is updated","post":post}

@router.delete("/posts/{post_id}")
def deletepost(post_id:int,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     post=get_post(post_id,db)
     db.delete(post)
     db.commit()
     return{"message":"Post is deleted"}

@router.delete("/comments/{comment_id}")
def deletecomment(comment_id:int,admin=Depends(verifyadmin),db:Session=Depends(get_db)):
     comment=get_comment(comment_id,db)
     db.delete(comment)
     db.commit()
     return{"message":"Comment is deleted"}

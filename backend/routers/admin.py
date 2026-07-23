from fastapi import APIRouter,HTTPException,Header,Depends
from database import SessionLocal
from models import Users,Posts,Comment
from authentication import verifytoken,getcurrentuser
from schema import Post,User,PostCreate
from typing import List,Optional
from sqlalchemy.orm import Session
router=APIRouter(prefix="/admin",tags=["admin"])

def post_response(post):
     return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,"image":post.image,"created_at":post.created_at,
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
     post=db.query(Posts).filter(Posts.id==post_id).first()
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
        user=get_user(user_id,db)
        user.role="admin"
        db.commit()
        return{"message":"Now an admin"}

@router.get("/users",response_model=List[User])
def users(admin=Depends(verifyadmin),db:Session=Depends(get_db)):
    users=db.query(Users).filter(Users.is_verified == True).all()
    return[{"id":u.id,"name":u.name,"email":u.email,"role":u.role,"is_active":u.is_active} for u in users]
    
@router.get("/posts",response_model=List[Post])
def posts(admin=Depends(verifyadmin),db:Session=Depends(get_db)):
    posts=db.query(Posts).filter(Posts.status=="published").all()
    return[post_response(post) for post in posts]

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
     user=get_user(user_id,db)
     user.is_active=True
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

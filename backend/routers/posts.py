from fastapi import APIRouter,HTTPException,Header,Depends,File,UploadFile,Form
from models import Posts,Users
from schema import PostCreate,Post
from database import SessionLocal
from authentication import verifytoken
from typing import List,Optional
from sqlalchemy.orm import Session
router=APIRouter(prefix="/posts",tags=["posts"])

def getuser(token:str):
    payload=verifytoken(token)
    if not payload:
        return None
    db=SessionLocal()
    try:
        return db.query(Users).filter(Users.id==payload["id"]).first()
    finally:
        db.close()
    
@router.post("/",response_model=Post)
def makepost(post:PostCreate,authorization:Optional[str]=Header(None)):
    token=authorization.split(" ")[1]
    user=getuser(token)
    if not user:
        raise HTTPException(status_code=401,detail="Invalid token")
    if post.image and post.image.startswith('data:image'):
        post.image=post.image.split(',')[1] if ',' in post.image else post.image
    else:
        post.image=post.image
    db=SessionLocal()
    try:  
            newpost=Posts(title=post.title,description=post.description,
                     category=post.category,status=post.status,
                     image=post.image,
                     owner_id=user.id)
            db.add(newpost)
            db.commit()
            db.refresh(newpost)
            print(f"Post created {newpost.id}")
            return newpost
    finally:
            db.close()

    
@router.get("/",response_model=list[Post])
def listposts():
    with SessionLocal() as db:
        return db.query(Posts).all()

@router.get("/{post_id}",response_model=Post)
def getposts(post_id:int):
    db=SessionLocal()
    post=db.query(Posts).filter(Posts.id==post_id).first()
    if not post:
        raise HTTPException(status_code=404,detail="post is not found")
    return post


@router.put("/{post_id}",response_model=Post)
def editpost(post_id:int,post:PostCreate,authorization:Optional[str]=Header(None)):
    token=authorization.split(" ")[1]
    user=verifytoken(token)
    if not user:
        raise HTTPException("invalid token")
    
    with SessionLocal() as db:
        dbpost=db.query(Posts).filter(Posts.id==post_id).first()
        if dbpost:
            if dbpost.owner_id!=user["id"]:
                raise HTTPException(status_code=401,detail="not allowed")
            dbpost.title=post.title
            dbpost.description=post.description
            dbpost.category=post.category
            dbpost.status=post.status
            if post.image:
                dbpost.image=post.image
                if post.image.startswith('data:image'):
                    post.image=post.image.split(',')[1] if ',' in post.image else post.image
            db.commit()
            db.refresh(dbpost)
            return dbpost
        else:
            raise HTTPException("NO POST FOUND")
    
@router.delete("/{post_id}")
def deletepost(post_id:int,authorization:Optional[str]=Header(None)):
    if not authorization:
        raise HTTPException(status_code=401,detail="invalid token")
    token=authorization.split(" ")[1]
    user=getuser(token)
    with SessionLocal() as db:
        user=getuser(token)
        dbpost=db.query(Posts).filter(Posts.id==post_id).first()
        if not dbpost:
            raise HTTPException(status_code=404,detail="POST NOT FOUND")
        if dbpost.owner_id!=user.id and user.role!="admin":
            raise HTTPException(status_code=401,detail="NOT ALLOWED TO DELETE POST")
        db.delete(dbpost)
        db.commit()
        return{"message":"post is deleted"}

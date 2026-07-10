from fastapi import APIRouter,HTTPException,Header,Depends,Query
from models import Posts,Users,Friendship
from schema import PostCreate,Post
from database import SessionLocal
from authentication import verifytoken,getcurrentuser
from typing import List,Optional
from sqlalchemy.orm import Session
router=APIRouter(prefix="/posts",tags=["posts"])

def post_response(post):
    return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,
           "image":post.image,"created_at":post.created_at,"username":post.owner.name if post.owner else None,"owner_id":post.owner_id}
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    posts=db.query(Posts).filter(Posts.owner_id==currentuser.id).order_by(Posts.created_at.desc()).all()
    return[{"id":p.id,"title":p.title,"category":p.category,"status":p.status,"image":p.image,"created_at":p.created_at}
           for p in posts]

def strip_data_uri(image:str):
    if image and image.startswith("data:image"):
        return image.split(",")[1] if "," in image else image
    return image

@router.get("/me/drafts")
def mydrafts(currentuser=Depends(getcurrentuser),db: Session = Depends(get_db)):
    drafts=db.query(Posts).filter(Posts.owner_id==currentuser.id,Posts.status=="draft").all()
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
    return post_response(newpost)

    
@router.get("/",response_model=list[Post])
def listposts(search:Optional[str]=Query(None),db:Session =Depends(get_db),skip:int=Query(0,ge=0),limit:int=Query(10,ge=1),currentuser=Depends(getuserwtoken)):
    query=db.query(Posts).order_by(Posts.created_at.desc())
    query=db.query(Posts).filter(
        Posts.status=="published"
    ).order_by(Posts.created_at.desc())
    if search:
        query=query.filter(Posts.title.ilike(f"%{search}%"))
    posts=query.offset(skip).limit(limit).all()
    return [post_response(post) for post in posts]

@router.get("/{post_id}",response_model=Post)
def getposts(post_id:int,db: Session = Depends(get_db),currentuser=Depends(getuserwtoken)):
    post=db.query(Posts).filter(Posts.id==post_id).first()
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
        dbpost=db.query(Posts).filter(Posts.id==post_id).first()
        if dbpost:
            if dbpost.owner_id!=currentuser.id and currentuser.role!="admin":
                raise HTTPException(status_code=403,detail="not allowed")
            dbpost.title=post.title
            dbpost.description=post.description
            dbpost.category=post.category
            dbpost.status=post.status
            dbpost.image=strip_data_uri(post.image)
            db.commit()
            db.refresh(dbpost)
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
        db.delete(dbpost)
        db.commit()
        return{"message":"post is deleted"}

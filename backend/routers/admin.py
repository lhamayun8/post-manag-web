from fastapi import APIRouter,HTTPException,Header,Depends
from database import SessionLocal
from models import Users,Posts
from authentication import verifytoken
from schema import Post,User
from typing import List,Optional
router=APIRouter(prefix="/admin",tags=["admin"])

def verifyadmin(authorization:Optional[str]=Header(None)):
    if not authorization:
        raise HTTPException(status_code=401,detail="invalid token")
    token=authorization.split(" ")[1]
    user=verifytoken(token)
    with SessionLocal() as db:
        user=db.query(Users).filter(Users.id==user["id"]).first()
        if not user or user.role!="admin":
            raise HTTPException(status_code=403,detail="can not access")
    return user
@router.put("/makeadmin/{user_id}")
def makeadmin(user_id:int,admin=Depends(verifyadmin)):
      with SessionLocal() as db:
           user=db.query(Users).filter(Users.id==user_id).first()
           if not user:
               raise HTTPException(status_code=404,detail="no such user ")
           user.role="admin"
           db.commit()
           return{"message":"Now an admin"}

@router.get("/users",response_model=List[User])
def users(admin=Depends(verifyadmin)):
    with SessionLocal() as db:
        return db.query(Users).all()
    
@router.get("/posts",response_model=List[Post])
def posts(admin=Depends(verifyadmin)):
    with SessionLocal() as db:
        return db.query(Posts).all()
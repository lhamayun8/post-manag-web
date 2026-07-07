from fastapi import APIRouter,HTTPException,Header,Depends
from database import SessionLocal
from models import Users,Posts
from authentication import verifytoken,getcurrentuser
from schema import Post,User
from typing import List,Optional
router=APIRouter(prefix="/admin",tags=["admin"])

def verifyadmin(currentuser=Depends(getcurrentuser)):
    if currentuser.role!="admin":
            raise HTTPException(status_code=403,detail="can not access")
    return currentuser
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
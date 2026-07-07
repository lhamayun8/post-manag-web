from fastapi import APIRouter,HTTPException,Header,Depends
from models import Users,Posts
from database import SessionLocal
from schema import UserCreate,User,UserLogin,UserEdit,ChangePass
from authentication import hashpass,verifypass,createtoken,getcurrentuser
from authentication import verifytoken
from typing import Optional
router=APIRouter(prefix="/users",tags=["users"])

@router.post("/register",response_model=User)
def registeruser(user:UserCreate):
    db=SessionLocal()
    if db.query(Users).filter(Users.email==user.email).first():
        db.close()
        raise HTTPException(status_code=400,detail="EMAIL ALREADY EXISTS")
    newuser=Users(name=user.name,email=user.email,password=hashpass(user.password),role="user")
    db.add(newuser)
    db.commit()
    db.refresh(newuser)
    db.close()
    return newuser

@router.post("/login")
def login(user:UserLogin):
    db=SessionLocal()
    dbuser=db.query(Users).filter_by(email=user.email).first()
    if dbuser and verifypass(user.password,dbuser.password):
        token=createtoken({"id":dbuser.id,"email":dbuser.email,"role":dbuser.role})
        db.close()
        return {"access_token":token,"role":dbuser.role,"user":{"id":dbuser.id,"name":dbuser.name
                                                                ,"email":dbuser.email,"role":dbuser.role}}
    else:
        db.close()
        raise HTTPException(status_code=401,detail="Invalid email or password.")

@router.get("/me",response_model=User)
def me(currentuser=Depends(getcurrentuser)):
    return currentuser
    
@router.post("/logout")
def logout():
    return{"message":"User is logged out"}

@router.put("/edit")
def editprofile(data:UserEdit,currentuser=Depends(getcurrentuser)):
    with SessionLocal() as db:
        user=db.query(Users).filter(Users.id==currentuser.id).first()
        if user:
            user.name=data.name
            user.email=data.email
            db.commit()
            db.refresh(user)
            return {"message":"Profile is updated"}
        else:
            raise HTTPException(status_code=404,detail="user not found")

@router.put("/changepass")
def editpassword(data:ChangePass,currentuser=Depends(getcurrentuser)):
    with SessionLocal() as db:
        user=db.query(Users).filter(Users.id==currentuser.id).first()
        if user:
            if verifypass(data.old,user.password):
                user.password=hashpass(data.new)
                db.commit()
                return{"message":"Password is changed"}
            else:
                raise HTTPException(status_code=400,detail="old password issue ")
        else:
            raise HTTPException(status_code=404,detail="user not found")
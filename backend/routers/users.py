from fastapi import APIRouter,HTTPException,Header,Depends
from models import Users,Posts
from database import SessionLocal
from schema import UserCreate,User,UserLogin,UserEdit,ChangePass,VerifyCode
from authentication import hashpass,verifypass,createtoken,getcurrentuser
from authentication import verifytoken
from typing import Optional
import random
from emailservice import sendemail
router=APIRouter(prefix="/users",tags=["users"])

@router.post("/register",response_model=User)
async def registeruser(user:UserCreate):
    db=SessionLocal()
    if db.query(Users).filter(Users.email==user.email).first():
        db.close()
        raise HTTPException(status_code=400,detail="Email already exists")
    code=str(random.randint(100000,999999))
    newuser=Users(name=user.name,email=user.email,password=hashpass(user.password),role="user",verfcode=code,is_verified=False)
    db.add(newuser)
    db.commit()
    db.refresh(newuser)
    await sendemail(newuser.email,code)
    db.close()
    return newuser

@router.post("/verify")
def verifyemail(data:VerifyCode):
    db=SessionLocal()
    user=db.query(Users).filter(Users.email==data.email).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404,detail="User not found")
    if user.is_verified:
        db.close()
        raise HTTPException(status_code=400,detail="Email is already verified")
    if user.verfcode!=data.code:
        db.close()
        raise HTTPException(status_code=400,detail="Invalid verification code")
    user.is_verified=True
    user.verfcode=None
    db.commit()
    db.refresh(user)
    db.close()
    return{ "message":"email verified"}
@router.post("/login")
def login(user:UserLogin):
    db=SessionLocal()
    dbuser=db.query(Users).filter_by(email=user.email).first()
    if dbuser and verifypass(user.password,dbuser.password):
        if not dbuser.is_verified:
            db.close()
            raise HTTPException(status_code=403,detail="Please verify your email")
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
            raise HTTPException(status_code=404,detail="User not found")

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
                raise HTTPException(status_code=400,detail="Current password is not correct. ")
        else:
            raise HTTPException(status_code=404,detail="User not found")
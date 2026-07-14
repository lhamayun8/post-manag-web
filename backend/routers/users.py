from fastapi import APIRouter,HTTPException,Header,Depends,Query
from models import Users,Posts,FriendRequests,Friendship
from database import SessionLocal
from sqlalchemy.orm import Session
from schema import UserCreate,User,UserLogin,UserEdit,ChangePass,VerifyCode,ForgetPassword,ResetPassword
from authentication import hashpass,verifypass,createtoken,getcurrentuser
from authentication import verifytoken
from typing import Optional
import random
from emailservice import sendemail
from datetime import datetime,timedelta
router=APIRouter(prefix="/users",tags=["users"])

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user(user_id:int,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return user

def checkemail(email:str,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.email==email).first()
    if not user:
        raise HTTPException(status_code=404,detail="No such email exists.Please register this email.")
    return user

def emailexist(email:str,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.email==email).first()
    if user:

        raise HTTPException(status_code=400,detail="Email already exists")
    return user

@router.post("/register",response_model=User)
async def registeruser(user:UserCreate,db:Session=Depends(get_db)):
    emailexist(user.email,db)
    if db.query(Users).filter(Users.name==user.name).first():
        db.close()
        raise HTTPException(status_code=400,detail="Username already exists. Choose a new username")
    code=str(random.randint(100000,999999))
    newuser=Users(name=user.name,email=user.email,password=hashpass(user.password),role="user",verfcode=code,is_verified=False)
    db.add(newuser)
    db.commit()
    db.refresh(newuser)
    await sendemail(newuser.email,code,"verify")
    db.close()
    return newuser

@router.post("/reset-password-code")
def reset_password_code(data:VerifyCode,db:Session=Depends(get_db)):
    user=checkemail(data.email,db)
    if user.resetcode!=data.code:
        db.close()
        raise HTTPException(status_code=400,detail="invalid reset code.Try again!!")
    db.close() 
    return{"message":"code verified"}

@router.post("/forgot-password")
async def forgotpassword(email:str=Query(...),db:Session=Depends(get_db)):
    user=checkemail(email,db)
    code=str(random.randint(100000,999999))
    user.resetcode=code
    user.resetcode_expiry=datetime.utcnow()+timedelta(minutes=15)
    db.commit()
    await sendemail(user.email,code,"reset")
    db.close()
    return{"message":"Password resend code is sent"}

@router.post("/reset-password")
async def resetpassword(data:ResetPassword,db:Session=Depends(get_db)):
    user=checkemail(data.email,db)
    if user.resetcode!=data.code:
        db.close()
        raise HTTPException(status_code=400,detail="Invalid verification code")
    if user.resetcode_expiry is None or datetime.utcnow()>user.resetcode_expiry:
        db.close()
        raise HTTPException(status_code=400,detail='Reset code is expired')
    user.password=hashpass(data.new_password)
    user.resetcode=None
    db.commit()
    db.close()
    return{"message":"Password is reset successfully"}

@router.post("/verify")
def verifyemail(data:VerifyCode,db:Session=Depends(get_db)):
    user=checkemail(data.email,db)
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

@router.post("/resend-verification")
async def resend_verification(email:str=Query(...),db:Session=Depends(get_db)):
    user=checkemail(email,db)
    if user.is_verified:
        db.close()
        raise HTTPException(status_code=400,detail="Email is already verified")
    code=str(random.randint(100000,999999))
    user.verfcode=code
    user.verfcode_expiry=datetime.utcnow()+timedelta(minutes=15)
    db.commit()
    await sendemail(user.email,code,"verify")
    db.close()
    return{"message":"New email verification code is sent"}

@router.post("/login")
def login(user:UserLogin,db:Session=Depends(get_db)):
    dbuser=db.query(Users).filter_by(email=user.email).first()
    if dbuser and verifypass(user.password,dbuser.password):
        if not dbuser.is_active:
            raise HTTPException(status_code=403,detail="Your account has been blocked by admin")
        if not dbuser.is_verified:
            db.close()
            raise HTTPException(status_code=403,detail="Please verify your email")
        token=createtoken({"id":dbuser.id,"email":dbuser.email,"role":dbuser.role})
        db.close()
        return {"access_token":token,"role":dbuser.role,"user":{"id":dbuser.id,"name":dbuser.name
                                                                ,"email":dbuser.email,"role":dbuser.role}}
    else:
        raise HTTPException(status_code=401,detail="Invalid email or password.")

@router.get("/me",response_model=User)
def me(currentuser=Depends(getcurrentuser)):
    return currentuser
    
@router.post("/logout")
def logout():
    return{"message":"User is logged out"}

@router.put("/edit")
def editprofile(data:UserEdit,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
        user=get_user(currentuser.id,db)
        if db.query(Users).filter(Users.name==data.name,Users.id!=currentuser.id).first():
            db.close()
            raise HTTPException(status_code=400,detail="Username already exists. Choose a new username")
        user.name=data.name
        db.commit()
        db.refresh(user)
        return {"message":"Profile is updated"}

@router.put("/changepass")
def editpassword(data:ChangePass,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
        user=get_user(currentuser.id,db)
        if verifypass(data.old,user.password):
            user.password=hashpass(data.new)
            db.commit()
            return{"message":"Password is changed"}
        else:
            raise HTTPException(status_code=400,detail="Current password is not correct. ")
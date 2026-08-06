from fastapi import APIRouter,HTTPException,Depends,Query
from models import Users,Notifcation,Posts,Interest as InterestModel
from database import SessionLocal
from sqlalchemy.orm import Session
from schema import UserCreate,User,UserLogin,UserEdit,ChangePass,VerifyCode,ResetPassword,Interest as InterestSchema
from authentication import hashpass,verifypass,createtoken,getcurrentuser
from emailservice import sendemail
from datetime import datetime,timedelta
from rag import rag
from fastapi import BackgroundTasks
from sqlalchemy import or_
import secrets

router=APIRouter(prefix="/users",tags=["users"])

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def indexuser(user_id:int):
    db=SessionLocal()
    try:
        user=(db.query(Users).filter(Users.id==user_id).first())
        if not user:
            return False
        posts=user.post_count
        comments=user.comment_count
        likesgiven=user.likes_given
        likesreceived=user.likes_received
        usertext=f"""USERID:{user.id}
                NAME:{user.name}
                ROLE:{user.role}
                STATUS:{'Active' if user.is_active else 'Inactive'}
                POSTS:{posts}
                COMMENTS:{comments}
                LIKES GIVEN:{likesgiven}
                Likes Received:{likesreceived}"""
        rag.addpost(
                    post_id=f"user_{user.id}",
                    content=usertext,
                    metadata={"type":"user","id":user.id,"name":user.name,"role":user.role})
        return True
    except Exception as e:
        print(e)
        return False
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


@router.post("/register",response_model=User)
async def registeruser(user:UserCreate,backgroundtasks:BackgroundTasks,db:Session=Depends(get_db)):
    user.email=user.email.lower().strip()
    user.name=user.name.strip().lower()
    exist=(db.query(Users).filter(or_(Users.email==user.email,Users.name==user.name)).first())
    if exist:
        if exist.is_verified:
            if exist.email==user.email:
                raise HTTPException(status_code=400,detail="Email already exists")
            if exist.name==user.name:
                raise HTTPException(status_code=400,detail="Username already exists. Choose a new username")
        db.delete(exist)
        db.commit()
    code=str(secrets.randbelow(900000)+100000)
    newuser=Users(name=user.name,email=user.email,password=hashpass(user.password),role="user",verfcode=code,is_verified=False,verfcode_expiry=datetime.utcnow()+timedelta(minutes=15))
    try:
        db.add(newuser)
        db.commit()
        db.refresh(newuser)
    except Exception:
        db.rollback()
        raise
    try:
        backgroundtasks.add_task(sendemail,newuser.email,code,"verify")
    except Exception:
        db.delete(newuser)
        db.commit()
        raise HTTPException(status_code=500,detail="Failed to send verification email")
    return newuser

@router.post("/reset-password-code")
def reset_password_code(data:VerifyCode,db:Session=Depends(get_db)):
    user=checkemail(data.email,db)
    if user.resetcode!=data.code:
        raise HTTPException(status_code=400,detail="invalid reset code.Try again!!")
    if user.resetcode_expiry is None or datetime.utcnow()>user.resetcode_expiry:
        raise HTTPException(status_code=400,detail='Reset code is expired')
    return{"message":"code verified"}

@router.post("/forgot-password")
async def forgotpassword(backgroundtasks:BackgroundTasks,email:str=Query(...),db:Session=Depends(get_db)):
    user=checkemail(email,db)
    code=str(secrets.randbelow(900000)+100000)
    user.resetcode=code
    user.resetcode_expiry=datetime.utcnow()+timedelta(minutes=15)
    db.commit()
    backgroundtasks.add_task(sendemail,user.email,code,"reset")
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
    return{"message":"Password is reset successfully"}

@router.post("/verify")
def verifyemail(data:VerifyCode,backgroundtask:BackgroundTasks,db:Session=Depends(get_db)):
    user=checkemail(data.email,db)
    if user.is_verified:
        db.close()
        raise HTTPException(status_code=400,detail="Email is already verified")
    if user.verfcode!=data.code:
        db.close()
        raise HTTPException(status_code=400,detail="Invalid verification code")
    if user.verfcode_expiry is None or datetime.utcnow()>user.verfcode_expiry:
        db.close()
        raise HTTPException(status_code=400,detail="Verification code is expired")
    user.is_verified=True
    user.verfcode=None
    db.commit()
    db.refresh(user)
    backgroundtask.add_task(indexuser,user.id)
    return{ "message":"email verified"}

@router.post("/resend-verification")
async def resend_verification(backgroundtasks:BackgroundTasks,email:str=Query(...),db:Session=Depends(get_db)):
    user=checkemail(email,db)
    if user.is_verified:
        raise HTTPException(status_code=400,detail="Email is already verified")
    code=str(secrets.randbelow(900000)+100000)
    user.verfcode=code
    user.verfcode_expiry=datetime.utcnow()+timedelta(minutes=15)
    db.commit()
    backgroundtasks.add_task(sendemail,user.email,code,"verify")
    return{"message":"New email verification code is sent"}

@router.post("/login")
def login(user:UserLogin,db:Session=Depends(get_db)):
    user.email=user.email.strip().lower()
    dbuser=db.query(Users).filter_by(email=user.email).first()
    if dbuser and verifypass(user.password,dbuser.password):
        if not dbuser.is_active:
            raise HTTPException(status_code=403,detail="Your account has been blocked by admin")
        if not dbuser.is_verified:
            raise HTTPException(status_code=403,detail="Please verify your email")
        token=createtoken({"id":dbuser.id,"email":dbuser.email,"role":dbuser.role})
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
def editprofile(data:UserEdit,backgroundtask:BackgroundTasks,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
        user=get_user(currentuser.id,db)
        if db.query(Users).filter(Users.name==data.name,Users.id!=currentuser.id).first():
            db.close()
            raise HTTPException(status_code=400,detail="Username already exists. Choose a new username")
        user.name=data.name.strip().lower()
        db.commit()
        db.refresh(user)
        backgroundtask.add_task(indexuser,user.id)
        return {"message":"Profile is updated"}

@router.put("/changepass")
def editpassword(data:ChangePass,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
        user=get_user(currentuser.id,db)
        if not verifypass(data.old,user.password):
            raise HTTPException(status_code=400,detail="Current password is not correct")
        if verifypass(data.new,user.password):
            raise HTTPException(status_code=400,detail="New password must be different from the current password")
        user.password=hashpass(data.new)
        db.commit()
        db.refresh(user)
        return{"message":"Password is changed"}
        
@router.get("/notifications")
def notifications(skip:int=0,limit:int=Query(20,le=100),currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    notif=(db.query(Notifcation).filter(Notifcation.user_id==currentuser.id).order_by(Notifcation.created_at.desc()).offset(skip).limit(limit).all())
    return notif

@router.put("/notifications/{id}/read")
def mynotifications(id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    notif=db.query(Notifcation).filter(Notifcation.id==id,Notifcation.user_id==currentuser.id).first()
    if not notif:
        raise HTTPException(status_code=404,detail="No notification found")
    notif.is_read=True
    db.commit()
    return{"message":"Your notifications"}

@router.delete("/notifications/{id}")
def deletenotification(id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    notif=db.query(Notifcation).filter(Notifcation.id==id,Notifcation.user_id==currentuser.id).first()
    if not notif:
        raise HTTPException(status_code=404,detail="No notification found")
    db.delete(notif)
    db.commit()
    return{"message":"Notification is deleted successfully"}

@router.post("/index-all")
def indexallusers(db:Session=Depends(get_db)):
    BATCH=1000
    count=0
    total=db.query(Users.id).count()
    for offset in range(0,total,BATCH):
        users=db.query(Users.id).offset(offset).limit(BATCH).all()
        for (user_id,) in users:
            try:
                if indexuser(user_id):
                    count+=1
            except Exception as e:
                print(f"Error indexing user {user_id}: {e}")
    return{"indexed":count}

@router.post("/interests")
def saveinterest(data:InterestSchema,db:Session=Depends(get_db),currentuser=Depends(getcurrentuser)):
    for item in data.interests:
        interest=InterestModel(user_id=currentuser.id,interest=item)
        db.add(interest)
    db.commit()
    return{"message":"Interest is saved"}


@router.get("/interests")
def getuserinterest(db:Session=Depends(get_db),currentuser=Depends(getcurrentuser)):
    interests=db.query(InterestModel).filter(InterestModel.user_id==currentuser.id).all()
    return[i.interest for i in interests]
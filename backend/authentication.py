from passlib.context import CryptContext
from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from dotenv import load_dotenv
from models import Users
from fastapi import HTTPException,Header
from database import SessionLocal
load_dotenv()
import os
passhash=CryptContext(schemes=["bcrypt"])
SECRET_KEY =os.getenv("SECRET_KEY")
ALGO="HS512"
def hashpass(password:str):
    return passhash.hash(password)
def verifypass(password:str,hashedpass:str):
    return passhash.verify(password,hashedpass)
def createtoken(data:dict):
    payload=data.copy()
    payload["exp"]=datetime.now(timezone.utc)+timedelta(minutes=15)
    return jwt.encode(payload,SECRET_KEY,algorithm=ALGO)
def verifytoken(token:str):
    try:
        return jwt.decode(token,SECRET_KEY,algorithms=[ALGO])
    except JWTError:
        return None
def getcurrentuser(authorization:str=Header(None)):
    if not authorization:
        raise HTTPException(status_code=401,detail="unauthorized")
    token=authorization.split(" ")[1]
    payload=verifytoken(token)
    if not payload:
        raise HTTPException(status_code=401,detail="invalid token")
    with SessionLocal() as db:
        user=db.query(Users).filter(Users.id==payload["id"]).first()
        if not user:
            raise HTTPException(status_code=401,detail="no such user")
        return user
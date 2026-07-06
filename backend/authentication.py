from passlib.context import CryptContext
from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError

passhash=CryptContext(schemes=["bcrypt"])
SECRET_KEY="laibahamayun123"
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

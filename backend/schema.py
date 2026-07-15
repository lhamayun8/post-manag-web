from pydantic import BaseModel,EmailStr,Field
from typing import Optional
from datetime import datetime
class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str=Field(...,min_length=8)

class UserLogin(BaseModel):
    email:EmailStr
    password:str=Field(...,min_length=8)

class UserEdit(BaseModel):
    name: str

class ForgetPassword(BaseModel):
    email:EmailStr

class ResetPassword(BaseModel):
    email:EmailStr
    code:str
    new_password:str=Field(...,min_length=8)

class VerifyCode(BaseModel):
    email:EmailStr
    code:str
    
class User(BaseModel):
    id:int
    name:str
    email:str
    role:str="user"
    is_active:bool=True
    class Config:
        from_attributes=True

class ChangePass(BaseModel):
    old:str=Field(...,min_length=8)
    new:str=Field(...,min_length=8)
class PostCreate(BaseModel):
    title:str=Field(...,min_length=1)
    description:str
    category:str
    status:str="draft"
    image:Optional[str]=None
    tagged_users:list[int]=[]

class Post(BaseModel):
    id:int
    title:str
    description:str
    category:str
    status:str
    owner_id:int
    image:Optional[str]=None
    created_at:datetime
    username:str
    tagged_users:list[Taggeduser]=[]
    class Config:
        from_attributes=True
        
class CommentCreate(BaseModel):
    content:str
class CommentResponse(BaseModel):
    id:int
    content:str
    user_id:int
    created_at:datetime
    class Config:
        from_attributes=True

class Like(BaseModel):
    id:int
    user_id:int
    post_id:int
    class Config:
        from_attributes=True

class Taggeduser(BaseModel):
    id:int
    name:str
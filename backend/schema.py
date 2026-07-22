from pydantic import BaseModel,EmailStr,Field,field_validator
from typing import Optional
from datetime import datetime
class UserCreate(BaseModel):
    name:str=Field
    email:EmailStr
    password:str=Field(...,min_length=8)
    @field_validator("name")
    @classmethod
    def validatename(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value
class UserLogin(BaseModel):
    email:EmailStr
    password:str=Field(...,min_length=8)

class UserEdit(BaseModel):
    name: str
    @field_validator("name")
    @classmethod
    def validatename(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value

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
    title:str
    description:str
    category:str
    status:str="draft"
    image:Optional[str]=None
    tagged_users:list[int]=[]
    @field_validator("title")
    @classmethod
    def validatetitle(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("title cannot be empty")
        return value

class Post(BaseModel):
    id:int
    title:str
    description:str
    category:str
    status:str
    owner_id:int
    image:Optional[str]=None
    created_at:datetime
    published_at:Optional[datetime]=None
    username:str      
    tagged_users:list[Taggeduser]=[]
    class Config:
        from_attributes=True
        
class CommentCreate(BaseModel):
    content:str
    @field_validator("content")
    @classmethod
    def validatename(cls,value):
        value=value.strip()
        if not value:
            raise ValueError("Comment cannot be empty")
        return value
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

class MessageCreate(BaseModel):
    receiver_id:int
    content:str

class MessageResponse(BaseModel):
    id:int
    sender_id:int
    receiver_id:int
    convo_id:int
    content:str
    is_read:bool
    created_at:datetime
    class Config:
        from_attributes=True
    
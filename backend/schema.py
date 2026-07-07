from pydantic import BaseModel,EmailStr,Field
from typing import Optional
class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str=Field(...,min_length=8)

class UserLogin(BaseModel):
    email:EmailStr
    password:str=Field(...,min_length=8)

class UserEdit(BaseModel):
    name: str
    email: EmailStr

class User(BaseModel):
    id:int
    name:str
    email:str
    role:str="user"
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

class Post(BaseModel):
    id:int
    title:str
    description:str
    category:str
    status:str
    owner_id:int
    image:Optional[str]=None
    class Config:
        from_attributes=True
        
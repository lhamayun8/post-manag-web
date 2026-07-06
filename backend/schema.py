from pydantic import BaseModel
from typing import Optional
class UserCreate(BaseModel):
    name:str
    email:str
    password:str

class UserLogin(BaseModel):
    email:str
    password:str

class UserEdit(BaseModel):
    name: str
    email: str

class User(BaseModel):
    id:int
    name:str
    email:str
    role:Optional[str]
    class Config:
        from_attributes=True

class ChangePass(BaseModel):
    old:str
    new:str
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
        
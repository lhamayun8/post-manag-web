from database import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Text,Boolean
from sqlalchemy.orm import relationship

class Users(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String)
    email=Column(String,unique=True,index=True)
    password=Column(String)
    posts=relationship("Posts",back_populates="owner")
    is_verified=Column(Boolean,default=False)
    verfcode=Column(String,nullable=True)
    role=Column(String,default="user")
    resetcode=Column(String,nullable=True)
    
class Posts(Base):
    __tablename__="posts"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String)
    description=Column(String)
    category=Column(String)
    status=Column(String,default="draft")
    owner_id=Column(Integer,ForeignKey("users.id"))
    image=Column(Text,nullable=True)
    owner=relationship("Users",back_populates="posts")
from database import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Text,Boolean,DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Users(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,unique=True,nullable=False)
    email=Column(String,unique=True,index=True)
    password=Column(String)
    posts=relationship("Posts",back_populates="owner",cascade="all,delete",passive_deletes=True)
    is_verified=Column(Boolean,default=False)
    verfcode=Column(String,nullable=True)
    verfcode_expiry=Column(DateTime,nullable=True)
    role=Column(String,default="user")
    resetcode=Column(String,nullable=True)
    resetcode_expiry=Column(DateTime,nullable=True)


class Posts(Base):
    __tablename__="posts"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String)
    description=Column(String)
    category=Column(String)
    created_at=Column(DateTime,default=datetime.utcnow)
    status=Column(String,default="draft")
    owner_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"))
    image=Column(Text,nullable=True)
    owner=relationship("Users",back_populates="posts")
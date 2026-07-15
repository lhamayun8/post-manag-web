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
    comment=relationship("Comment")
    likes=relationship("Like")
    is_active=Column(Boolean,default=True)
    tagged_posts=relationship("Tags",back_populates="user")

class Posts(Base):
    __tablename__="posts"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String)
    description=Column(String)
    category=Column(String)
    created_at=Column(DateTime,default=datetime.utcnow)
    updated_at=Column(DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)
    published_at=Column(DateTime,nullable=True)
    status=Column(String,default="draft")
    owner_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"))
    image=Column(Text,nullable=True)
    owner=relationship("Users",back_populates="posts")
    comments=relationship("Comment",back_populates="post",cascade="all,delete")
    likes=relationship("Like",cascade="all,delete")
    tagged_friends=relationship("Tags",back_populates="post",cascade="all,delete")

class FriendRequests(Base):
    __tablename__="friend-requests"
    id=Column(Integer,primary_key=True)
    sender_id=Column(Integer,ForeignKey("users.id"))
    receiver_id=Column(Integer,ForeignKey("users.id"))
    status=Column(String,default="pending")
    created_at=Column(DateTime,default=datetime.utcnow)
    sender=relationship("Users",foreign_keys=[sender_id])
    receiver=relationship("Users",foreign_keys=[receiver_id])

class Friendship(Base):
    __tablename__="friends"
    id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    friend_id=Column(Integer,ForeignKey("users.id"))
    created_at=Column(DateTime,default=datetime.utcnow)
    friend=relationship("Users",foreign_keys=[friend_id])

class Like(Base):
    __tablename__="likes"
    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    post_id=Column(Integer,ForeignKey("posts.id"))
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users")
    post=relationship("Posts")

class Comment(Base):
    __tablename__="comments"
    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    post_id=Column(Integer,ForeignKey("posts.id"))
    content=Column(String,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users")
    post=relationship("Posts",back_populates="comments")

class Tags(Base):
    __tablename__="tags"
    id=Column(Integer,primary_key=True)
    post_id=Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"))
    user_id=Column(Integer,ForeignKey("users.id"))
    post=relationship("Posts",back_populates="tagged_friends")
    user=relationship("Users",back_populates="tagged_posts")

class Notifcation(Base):
    __tablename__="notifications"
    id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"))
    post_id=Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"))
    message=Column(String,nullable=False)
    is_read=Column(Boolean,default=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users")
    post=relationship("Posts")
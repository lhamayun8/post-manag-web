from database import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Text,Boolean,DateTime,Index,UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

class Users(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,unique=True,nullable=False)
    email=Column(String,unique=True,index=True,nullable=False)
    password=Column(String,nullable=False)
    posts=relationship("Posts",back_populates="owner",cascade="all,delete",passive_deletes=True)
    is_verified=Column(Boolean,default=False)
    verfcode=Column(String,nullable=True)
    verfcode_expiry=Column(DateTime,nullable=True)
    role=Column(String,default="user") 
    resetcode=Column(String,nullable=True)
    resetcode_expiry=Column(DateTime,nullable=True)
    comments=relationship("Comment",back_populates="user",cascade="all,delete")
    likes=relationship("Like",back_populates="user")
    is_active=Column(Boolean,default=True)
    tagged_posts=relationship("Tags",back_populates="user")
    is_online=Column(Boolean,default=False)
    last_seen=Column(DateTime,nullable=True)
    post_count = Column(Integer, default=0, nullable=False,index=True)
    comment_count = Column(Integer, default=0, nullable=False)
    likes_given = Column(Integer, default=0, nullable=False)
    likes_received = Column(Integer, default=0, nullable=False)
    __table_args__ = (
        Index("ix_users_name","name"),
        Index("ix_users_verified","is_verified"),
        Index("ix_users_active","is_active"),
    )

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
    likes=relationship("Like",back_populates="post",cascade="all,delete")
    tagged_friends=relationship("Tags",back_populates="post",cascade="all,delete")
    __table_args__=(
        Index("ix_posts_owner_id","owner_id"),Index("ix_posts_status","status"),
        Index("ix_posts_category","category"),Index("ix_posts_created_at","created_at"),
        Index("ix_posts_published_at","published_at")
        )

class FriendRequests(Base):
    __tablename__="friend-requests"
    id=Column(Integer,primary_key=True)
    sender_id=Column(Integer,ForeignKey("users.id"))
    receiver_id=Column(Integer,ForeignKey("users.id"))
    status=Column(String,default="pending")
    created_at=Column(DateTime,default=datetime.utcnow)
    sender=relationship("Users",foreign_keys=[sender_id])
    receiver=relationship("Users",foreign_keys=[receiver_id])
    __table_args__ = (
        Index("ix_friend_requests_sender","sender_id"),
        Index("ix_friend_requests_receiver","receiver_id"),
        Index("ix_friend_requests_status","status")
        )

class Friendship(Base):
    __tablename__="friends"
    id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    friend_id=Column(Integer,ForeignKey("users.id"))
    created_at=Column(DateTime,default=datetime.utcnow)
    friend=relationship("Users",foreign_keys=[friend_id])
    __table_args__ = (
        Index("ix_friends_user","user_id"),
        Index("ix_friends_friend","friend_id")
        )

class Like(Base):
    __tablename__="likes"
    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    post_id=Column(Integer,ForeignKey("posts.id"))
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users",back_populates="likes")
    post=relationship("Posts",back_populates="likes")
    __table_args__ = (
        Index("ix_likes_user","user_id"),
        Index("ix_likes_post","post_id"),
        UniqueConstraint(
        "user_id",
        "post_id",
        name="uq_user_post_like"
    )
    )

class Comment(Base):
    __tablename__="comments"
    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    post_id=Column(Integer,ForeignKey("posts.id"))
    content=Column(String,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users",back_populates="comments")
    post=relationship("Posts",back_populates="comments")
    __table_args__ = (
    Index("ix_comments_user","user_id"),
    Index("ix_comments_post","post_id")
    )

class Tags(Base):
    __tablename__="tags"
    id=Column(Integer,primary_key=True)
    post_id=Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"))
    user_id=Column(Integer,ForeignKey("users.id"))
    post=relationship("Posts",back_populates="tagged_friends")
    user=relationship("Users",back_populates="tagged_posts")
    __table_args__ = (
        Index("ix_tags_post","post_id"),
        Index("ix_tags_user","user_id")
    )

class Notifcation(Base):
    __tablename__="notifications"
    id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"))
    post_id=Column(Integer,ForeignKey("posts.id",ondelete="CASCADE"))
    message=Column(String,nullable=False)
    is_read=Column(Boolean,default=False)
    convo_id=Column(Integer,ForeignKey("conversations.id"),nullable=True)
    created_at=Column(DateTime,default=datetime.utcnow)
    user=relationship("Users")
    post=relationship("Posts")
    __table_args__ = (
        Index("ix_notifications_user","user_id"),
        Index("ix_notifications_post","post_id"),
        Index("ix_notifications_conversation","convo_id"),
        Index("ix_notifications_user_created","user_id","created_at"),
    )

class Message(Base):
    __tablename__="messages"
    id=Column(Integer,primary_key=True,index=True)
    convo_id=Column(Integer,ForeignKey("conversations.id"),nullable=False)
    content=Column(Text,nullable=False)
    is_read=Column(Boolean,default=False)
    is_delivered=Column(Boolean,default=False)
    delivered_at=Column(DateTime,nullable=True)
    sender_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    receiver_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)
    sender=relationship("Users",foreign_keys=[sender_id])
    receiver=relationship("Users",foreign_keys=[receiver_id])
    conversation=relationship("Conversation",back_populates="messages")
    deletedbysender=Column(Boolean,default=False)
    deletedbyreceiver=Column(Boolean,default=False)
    __table_args__ = (
        Index("ix_messages_conversation","convo_id"),
        Index("ix_messages_sender","sender_id"),
        Index("ix_messages_receiver","receiver_id"),
        Index("ix_messages_created","created_at"),
        Index(
        "ix_messages_convo_receiver_read",
        "convo_id",
        "receiver_id",
        "is_read"),
    )

class Conversation(Base):
    __tablename__="conversations"
    id=Column(Integer,primary_key=True,index=True)
    created_at=Column(DateTime,default=datetime.utcnow)
    messages=relationship("Message",back_populates="conversation",cascade="all,delete-orphan")
    status=Column(String,default="accepted")
    deletedbysender=Column(Boolean,default=False)
    deletedbyreceiver=Column(Boolean,default=False)
    user1_id=Column(Integer,ForeignKey("users.id"))
    user2_id=Column(Integer,ForeignKey("users.id"))
    deleted_by_user1_at=Column(DateTime,nullable=True)
    deleted_by_user2_at=Column(DateTime,nullable=True)
    user1=relationship("Users",foreign_keys=[user1_id])
    user2=relationship("Users",foreign_keys=[user2_id])
    __table_args__ = (
        Index("ix_conversation_user1","user1_id"),
        Index("ix_conversation_user2","user2_id")
)
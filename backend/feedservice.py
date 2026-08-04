from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, desc
from models import Posts, Like, Comment, Tags, Users
from rag import rag
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import math

class FeedService:
    def __init__(self,db: Session):
        self.db=db
        self._cache=None
        self._cache_time=None
        self._cache_total=0
    def gettrendingfeed(self,limit:int=20,skip:int=0,days:int=7,search:Optional[str]=None):
        if skip==0 and not search and self._cache is not None:
            time=(datetime.utcnow()-self._cache_time).seconds
            if time<300:
                total=self._cache_total
                has_more=skip+limit<total
                return{"posts":self._cache[skip:skip+limit],"total":total,"skip":skip,"limit":limit,
                    "has_more":has_more
                }
        
        cutoff=datetime.utcnow()-timedelta(days=days)
        likes=(self.db.query(Like.post_id, func.count(Like.id).label('lc')).filter(Like.created_at >= cutoff)
               .group_by(Like.post_id).subquery())
        
        comments=(self.db.query(Comment.post_id,func.count(Comment.id).label('cc')).filter(Comment.created_at >= cutoff)
                  .group_by(Comment.post_id).subquery())
        query=(self.db.query(Posts,func.coalesce(likes.c.lc,0).label('likes'),
                             func.coalesce(comments.c.cc,0).label('comments'))
            .outerjoin(likes,Posts.id==likes.c.post_id).outerjoin(comments,Posts.id==comments.c.post_id)
            .options(joinedload(Posts.owner).load_only(Users.id, Users.name),selectinload(Posts.tagged_friends).joinedload(Tags.user).load_only(Users.id, Users.name))
            .filter(Posts.status=="published",Posts.published_at >= cutoff))
        if search:
            query=query.filter(Posts.title.ilike(f"%{search}%") | Posts.description.ilike(f"%{search}%"))
        total=query.count()
        results=(query.order_by(desc(func.coalesce(likes.c.lc, 0) * 2 + func.coalesce(comments.c.cc, 0) * 3)).offset(skip)
                 .limit(limit).all()
                 )
        posts=[]
        for post, likes_count, comments_count in results:
            score = likes_count * 2 + comments_count * 3
            post_data = self.serialize(post, score)
            post_data['likes_count'] = likes_count
            post_data['comments_count'] = comments_count
            posts.append(post_data)
    
        if skip==0 and not search:
            self._cache=posts
            self._cache_time=datetime.utcnow()
            self._cache_total=total
        
        has_more=skip+limit<total
        return {"posts": posts,"total": total,
                "skip": skip,
                "limit": limit,
                "has_more": has_more}

    def builduserprofile(self,user_id:int)->str:
        parts=[]
        liked=(self.db.query(Posts.title, Posts.category, Posts.description).join(Like)
                .filter(Like.user_id == user_id, Posts.status == "published").limit(30).all()
                )
        
        commented=(self.db.query(Posts.title, Posts.category, Posts.description).join(Comment)
                    .filter(Comment.user_id == user_id, Posts.status == "published").limit(30).all())
        own = (self.db.query(Posts.title, Posts.category, Posts.description)
                .filter(Posts.owner_id == user_id, Posts.status == "published").limit(20).all()
                )
        for post in liked+commented+own:
            if post.title:
                parts.append(post.title)
            if post.category:
                parts.append(post.category)
            if post.description:
                parts.append(post.description[:200])
        return " ".join(parts[:300])

    def serialize(self, post, score: float) -> dict:
        return {
            "id": post.id,
            "title": post.title,
            "description": post.description,
            "category": post.category,
            "status": post.status,
            "image": post.image,
            "created_at": post.created_at,
            "published_at": post.published_at,
            "username": post.owner.name if post.owner else None,
            "owner_id": post.owner_id,
            "tagged_users": [
                {"id": t.user.id, "name": t.user.name} 
                for t in getattr(post, "tagged_friends", []) 
                if t.user
            ],
            "likes": len(post.likes) if hasattr(post, 'likes') else 0,
            "comments": len(post.comments) if hasattr(post, 'comments') else 0,
            "score": round(float(score), 2)
        }

    def clear_cache(self):
        self._cache = None
        self._cache_time = None
        self._cache_total = 0
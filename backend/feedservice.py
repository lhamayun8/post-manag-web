from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, desc
from models import Posts, Like, Comment, Tags, Users
from rag import rag
from redisclient import getcache,deletecache,setcache
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import math

CACHE_TTL_SECONDS=300
TRENDING_CACHE_SIZE=50
PERSONALISED_CACHE_SIZE=50

class FeedService:
    def __init__(self,db: Session):
        self.db=db

    def gettrendingfeed(self,limit:int=20,skip:int=0,days=30,search:Optional[str]=None):
        cachekey=f"feed:trending:{days}"
        cacheable=skip==0 and not search
        if cacheable:
            cached=getcache(cachekey)
            if cached is not None:
                total=cached["total"]
                return{"posts":cached["posts"][:limit],"total":total,"skip":skip,"limit":limit,
                    "has_more":limit<total
                }

        cutoff=datetime.utcnow()-timedelta(days=days)
        likes=(self.db.query(Like.post_id, func.count(Like.id).label('lc')).filter(Like.created_at >= cutoff)
               .group_by(Like.post_id).subquery())
        
        comments=(self.db.query(Comment.post_id,func.count(Comment.id).label('cc')).filter(Comment.created_at >= cutoff)
                  .group_by(Comment.post_id).subquery())
        query=(self.db.query(Posts,func.coalesce(likes.c.lc,0).label('likes'),
                             func.coalesce(comments.c.cc,0).label('comments'))
            .outerjoin(likes,Posts.id==likes.c.post_id).outerjoin(comments,Posts.id==comments.c.post_id)
            .options(joinedload(Posts.owner).load_only(Users.id, Users.name),selectinload(Posts.tagged_friends).joinedload(Tags.user).load_only(Users.id, Users.name),
                     selectinload(Posts.likes).joinedload(Like.user).load_only(Users.id,Users.name),
                     selectinload(Posts.comments).joinedload(Comment.user).load_only(Users.id,Users.name))
            .filter(Posts.status=="published",Posts.published_at >= cutoff))
        if search:
            query=query.filter(Posts.title.ilike(f"%{search}%") | Posts.description.ilike(f"%{search}%"))
        total=query.count()
        fetchlimit=TRENDING_CACHE_SIZE if cacheable else limit
        fetchskip=0 if cacheable else skip
        results=(query.order_by(desc(func.coalesce(likes.c.lc, 0) * 2 + func.coalesce(comments.c.cc, 0) * 3)).offset(fetchskip)
                 .limit(fetchlimit).all()
                 )
        posts=[]
        for post, likes_count, comments_count in results:
            score = likes_count * 2 + comments_count * 3
            post_data = self.serialize(post, score)
            post_data['likes_count'] = likes_count
            post_data['comments_count'] = comments_count
            posts.append(post_data)

        if cacheable:
            setcache(
    cachekey,
    {"posts": posts, "total": total},
    expire=CACHE_TTL_SECONDS
)
            posts=posts[:limit]

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
        likes=list(getattr(post,"likes",None) or [])
        comments=list(getattr(post,"comments",None) or [])
        comments=sorted(comments,key=lambda c:c.created_at,reverse=True)
        comments_total=len(comments)
        visible=comments[:5]
        return {
            "id": post.id,
            "title": post.title,
            "description": post.description,
            "category": post.category,
            "status": post.status,
            "image": post.image,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "username": post.owner.name if post.owner else None,
            "owner_id": post.owner_id,
            "tagged_users": [
                {"id": t.user.id, "name": t.user.name} 
                for t in getattr(post, "tagged_friends", []) 
                if t.user
            ],
            "likes": {"count": len(likes), "users": [{"id": l.user.id, "username": l.user.name} for l in likes if l.user]},
            "comments": [{"id": c.id, "content": c.content, "username": c.user.name if c.user else "unknown",
                          "created_at": c.created_at.isoformat() if c.created_at else None, "user_id": c.user_id} for c in visible],
            "comments_total": comments_total,
            "score": round(float(score), 2)
        }

    def clear_cache(self):
        deletecache("feed:trending:*")
        deletecache("feed:personalised:*")
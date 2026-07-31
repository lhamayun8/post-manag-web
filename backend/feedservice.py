from sqlalchemy.orm import Session
from models import Posts,Like,Comment
from rag import rag
from datetime import datetime, timezone
class FeedService:
    def __init__(self,db: Session):
        self.db=db
    def getpersonalisedfeed(self,user_id:int):
        profile=self.builduserprofile(user_id)
        if not profile.strip():
            return self.gettrendingfeed()
        results=rag.semanticfeed(profile, limit=50)
        rankedposts=[]
        seen=set()
        for result in results:
            post_id=result["post_id"]
            if post_id in seen:
                continue
            seen.add(post_id)
            post=(self.db.query(Posts).filter(Posts.id==result["post_id"],Posts.status=="published").first())
            if not post:
                continue
            score=self.personalisedscore(post,result["similarity"])
            rankedposts.append((score, post))
        rankedposts.sort(key=lambda x:x[0],reverse=True)
        return [self.serialize(post,score)for score,post in rankedposts]
    def gettrendingfeed(self):
        posts=(self.db.query(Posts).filter(Posts.status=="published").all())
        ranked=sorted(posts,key=self.trending_score,reverse=True)
        return [self.serialize(post,self.trending_score(post))for post in ranked]
    def builduserprofile(self,user_id:int):
        profile=[]
        likedposts=(self.db.query(Posts).join(Like).filter(Like.user_id == user_id).all())
        commentedposts=(
            self.db.query(Posts).join(Comment).filter(Comment.user_id == user_id).all())
        ownposts=(self.db.query(Posts).filter(Posts.owner_id==user_id,Posts.status=="published").all())
        for post in likedposts+commentedposts+ownposts:
            profile.append(post.title)
            profile.append(post.category)
            profile.append(post.description)
        return " ".join(profile)
    def trending_score(self,post):
        likes=len(post.likes)
        comments=len(post.comments)
        return likes*2+comments*3
    def personalisedscore(self,post,similarity):
        engagement=len(post.likes)*2+len(post.comments)*3
        return(similarity*70+engagement*0.2)
    def serialize(self,post,score):
        return{"id":post.id,"title":post.title,"description":post.description,"category":post.category,"status":post.status,
               "image":post.image,"created_at":post.created_at,"published_at":post.published_at,
               "username":post.owner.name if post.owner else None,"owner_id":post.owner_id,
               "tagged_users":[{"id":tag.user.id,"name":tag.user.name}for tag in post.tagged_friends],
               "likes":len(post.likes),"comments":len(post.comments),"score":score}
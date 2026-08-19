from database import SessionLocal
from models import Posts, Users, Comment, Like, Friendship, Conversation, Message
from rag import rag

def indexalldata():
    db=SessionLocal()
    users=db.query(Users).all()
    for user in users:
        user_text=f"""USER ID: {user.id}
        NAME:{user.name}
        EMAIL:{user.email}
        ROLE:{user.role}
        STATUS:{'Active' if user.is_active else 'Inactive'}"""
        rag.addpost(
            post_id=f"user_{user.id}",
            content=user_text,
            metadata={"type":"user","id":user.id,"name":user.name,"email":user.email,"role":user.role,"is_active":user.is_active})
    posts=db.query(Posts).all()
    for post in posts:
        commentscount=db.query(Comment).filter(Comment.post_id == post.id).count()
        likescount=db.query(Like).filter(Like.post_id==post.id).count()
        author=db.query(Users).filter(Users.id==post.owner_id).first()
        authorname=author.name if author else "unknown"
        taggedusers=[]
        for tag in post.tagged_friends:
            if tag.user:
                taggedusers.append(tag.user.name)          
                post_text=f"""POST ID: {post.id}
                    TITLE:{post.title}
                    AUTHOR:{authorname}
                    AUTHOR ID:{post.owner_id}
                    CONTENT:{post.description}
                    CATEGORY:{post.category}
                    STATUS:{post.status}
                    CREATED:{post.created_at}
                    LIKES:{likescount}
                    COMMENTS:{commentscount}
                    TAGGED USERS:{', '.join(taggedusers) if taggedusers else 'None'}"""
        rag.addpost(post_id=f"post_{post.id}",content=post_text,metadata={
                "type":"post",
                "id":post.id,
                "owner_id":post.owner_id,
                "title":post.title,
                "author":authorname,
                "category":post.category,
                "likes":likescount,
                "comments":commentscount,
                "status":post.status,
                "created_at":str(post.created_at)})
    comments=db.query(Comment).all()
    for comment in comments:
        user=db.query(Users).filter(Users.id==comment.user_id).first()
        comment_text=f"""COMMENT ID: {comment.id}
        POST ID:{comment.post_id}
        USER:{user.name if user else 'Unknown'}
        CONTENT:{comment.content}
        CREATED:{comment.created_at}"""
        rag.addpost(post_id=f"comment_{comment.id}",content=comment_text,
            metadata={"type":"comment","id":comment.id,"post_id":comment.post_id,"user_id":comment.user_id})
    friendships=db.query(Friendship).all()
    for friendship in friendships:
        user1=db.query(Users).filter(Users.id==friendship.user_id).first()
        user2=db.query(Users).filter(Users.id==friendship.friend_id).first()
        if user1 and user2:
            friend_text=f"""FRIENDSHIP
            USER:{user1.name}(ID:{user1.id})
            FRIEND:{user2.name}(ID:{user2.id})"""
            rag.addpost(
                post_id=f"friend_{friendship.id}",
                content=friend_text,
                metadata={"type":"friendship","id":friendship.id,
                    "user_id":friendship.user_id,"friend_id":friendship.friend_id})
    db.close()
    total=rag.collection.count()
    return total
if __name__ == "__main__":
    indexalldata()
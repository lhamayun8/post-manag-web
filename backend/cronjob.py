from database import SessionLocal
from models import Users,Posts
from emailservice import sendemail
from sqlalchemy.orm import joinedload

async def sendrecommendations():
    db=SessionLocal()
    try:
        users=db.query(Users).options(joinedload(Users.interests)).all()
        recent=(db.query(Posts).order_by(Posts.created_at.desc()).limit(500).all())
        for user in users:
            interests=[i.interest for i in user.interests]
            if not interests:
                continue
            posts=[post for post in recent if post.category in interests][:5]
            if not posts:
                continue
            content=""
            for post in posts:
                content+=f""" <h3>{post.title}</h3>
                <p>Category:{post.category}</p>
                <hr>
                """

            await sendemail(email=user.email,content=content,email_type="recommendation")
    finally:
        db.close()
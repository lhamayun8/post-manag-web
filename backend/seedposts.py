from random import choice, randint
from models import Users, Posts
from database import SessionLocal, engine, Base,create_engine
from models import Users, Posts, Like, Comment, Friendship
from rag import rag
from faker import Faker
from random import randint, choice, sample
from datetime import datetime, timezone
from dotenv import load_dotenv
from authentication import hashpass
import os
db = SessionLocal()
fake = Faker()
load_dotenv()
DATABASE_URL=os.getenv("DATABASE_URL")
engine=create_engine(DATABASE_URL)
all_users = db.query(Users).all()
posts = []

categories = [
    "Technology",
    "Programming",
    "AI",
    "Gaming",
    "Sports",
    "Travel",
    "Food",
    "Art"
]


for i in range(5000):

    owner = choice(all_users)

    post = Posts(
        title=fake.sentence(nb_words=6),
        description=fake.paragraph(nb_sentences=5),
        category=choice(categories),
        status="published",
        owner_id=owner.id,
        created_at=datetime.now(timezone.utc),
        published_at=datetime.now(timezone.utc)
    )

    posts.append(post)


db.bulk_save_objects(posts)
db.commit()

print("5000 posts created")

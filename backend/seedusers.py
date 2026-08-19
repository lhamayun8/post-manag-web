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
users=[]

used_names=set()

for i in range(1000):

    name=fake.user_name()

    while name in used_names:
        name=fake.user_name()

    used_names.add(name)

    user=Users(
        name=name,
        email=fake.unique.email(),
        password=hashpass("12345678"),
        is_online=False,
        role="user",
        is_verified=True,
        is_active=True
    )

    users.append(user)

db.add_all(users)
db.commit()

print("1000 users created")


from database import SessionLocal
from models import Users

with SessionLocal() as db:
    user=db.query(Users).filter(Users.email=="admin123@gmail.com").first()
    if user:
        user.role="admin"
        db.commit()
        print(f"{user.email} is now an admin")
    else:
        print("user not found")
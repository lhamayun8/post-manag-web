from database import SessionLocal
from models import Users
import sys
def admin(email:str):
    with SessionLocal() as db:
        user=db.query(Users).filter(Users.email==email).first()
        if user:
            user.role="admin"
            db.commit()
            print(f"{user.email} is now an admin")
        else:
            print("user not found")

admin(sys.argv[1])
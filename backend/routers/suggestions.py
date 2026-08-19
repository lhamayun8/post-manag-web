from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from authentication import getcurrentuser
from friendservice import FriendSuggestion

router=APIRouter(prefix="/suggestions",tags=["Friend Suggestions"])
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def suggestions(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    service=FriendSuggestion(db)
    return service.getsuggestions(currentuser.id)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from authentication import getcurrentuser
from feedservice import FeedService
router=APIRouter(prefix="/feed",tags=["Feed"])
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/personalised")
def personalisedfeed(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    service=FeedService(db)
    return service.getpersonalisedfeed(currentuser.id)
@router.get("/trending")
def trendingfeed(skip:int=0,limit:int=10,days:int=7,refresh:bool=False,db:Session=Depends(get_db)):
    service=FeedService(db)
    if refresh:
        service.clear_cache()
    return service.gettrendingfeed(limit=limit,skip=skip,days=days,search=None)
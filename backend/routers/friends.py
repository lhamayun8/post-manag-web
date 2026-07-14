from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Users,FriendRequests,Friendship
from authentication import getcurrentuser
from routers.sockets import notify_user
router=APIRouter(prefix="/friends",tags=["friends"])
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/users")
def users(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id!=currentuser.id).all()
    result=[]
    for u in user:
        status="none"
        friend=db.query(Friendship).filter(Friendship.user_id==currentuser.id,
                                           Friendship.friend_id==u.id).first()
        if friend:
            status="friends"
        else:
            request=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,
                                                    FriendRequests.receiver_id==u.id,
                                                    FriendRequests.status=="pending").first()
            if request:
                status="pending"
            else:
                rec=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,
                                                    FriendRequests.receiver_id==u.id,
                                                    FriendRequests.status=="pending").first()
                if rec:
                    status="received"
        result.append({"id":u.id,"name":u.name,"email":u.email,"status":status})
    return result

@router.post("/request/{user_id}")
async def send_request(user_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    if user_id==currentuser.id:
        db.close()
        raise HTTPException(status_code=400,detail="Can not send request to yourself.")
    set=db.query(Users).filter(Users.id==user_id).first()
    if not set:
        db.close()
        raise HTTPException(status_code=404,detail="User does not exist")
    exist=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,
                                          FriendRequests.receiver_id==user_id,
                                          FriendRequests.status=="pending").first()
    if exist:
        db.close()
        raise HTTPException(status_code=400,detail="Request already sent")
    request=FriendRequests(sender_id=currentuser.id,receiver_id=user_id)
    db.add(request)
    db.commit()
    await notify_user(user_id,{"type":"friend_request","message":"You recieved a friend request"})
    return{"message":"Request sent"}

@router.get("/requests")
def requests(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    req=db.query(FriendRequests).filter(FriendRequests.receiver_id==currentuser.id,
                                        FriendRequests.status=="pending").all()
    return[{"id":request.id,"from":request.sender.name,"user_id":request.sender.id} for request in req]

@router.put("/accept/{request_id}")
def acceptrequest(request_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
     req=db.query(FriendRequests).filter(FriendRequests.id==request_id,FriendRequests.receiver_id==currentuser.id).first()
     if not req:
         db.close()
         raise HTTPException(status_code=404,detail="No request")
     req.status="accepted"
     user1=Friendship(user_id=req.sender_id,friend_id=req.receiver_id)
     user2=Friendship(user_id=req.receiver_id,friend_id=req.sender_id)
     db.add_all([user1,user2])
     db.commit()
     return{"message":"you are now friends"}

@router.put("/reject/{request_id}")
def rejectrequest(request_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
     req=db.query(FriendRequests).filter(FriendRequests.id==request_id,FriendRequests.receiver_id==currentuser.id).first()
     if not req:
         db.close()
         raise HTTPException(status_code=404,detail="No request")
     req.status="rejected"
     db.commit()
     return{"message":"request is rejected"}       

@router.get("/")
def friendlist(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    friends=db.query(Friendship).filter(Friendship.user_id==currentuser.id).all()
    return[{"id":fr.friend_id,"name":fr.friend.name} for fr in friends]                          

@router.get("/sent")
def requestssent(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    request=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,FriendRequests.status=="pending").all()
    return[{"id":req.id,"name":req.receiver.name,"email":req.receiver.email} for req in request]

@router.get("/user/{user_id}")
def getuserprofile(user_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return{"id":user.id,"name":user.name,"email":user.email,"role":user.role}

@router.delete("/{friend_id}")
def removefriend(friend_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id==friend_id).delete()
    db.query(Friendship).filter(Friendship.user_id==friend_id,Friendship.friend_id==currentuser.id).delete()
    db.commit()
    return{"message":"friend is removed"}
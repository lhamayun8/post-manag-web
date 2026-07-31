from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Users,FriendRequests,Friendship,Notifcation,Posts,Like,Comment
from authentication import getcurrentuser
from routers.sockets import notify_user
from rag import rag
router=APIRouter(prefix="/friends",tags=["friends"])

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def indexfriendship(user_id:int,db: Session):
    try:
        friendships=db.query(Friendship).filter(Friendship.user_id==user_id).all()
        for friendship in friendships:
            friend=db.query(Users).filter(Users.id==friendship.friend_id).first()
            if not friend:
                continue
            friend_text=f"""FRIENDSHIP
            USER:{friend.name}(ID:{friend.id})
            FRIEND OF:{user_id}
            STATUS:active"""
            rag.addpost(
                post_id=f"friend_{friendship.id}",
                content=friend_text,
                metadata={
                    "type":"friendship",
                    "id":friendship.id,
                    "user_id":user_id,
                    "friend_id":friend.id,
                    "friend_name":friend.name})
        print(f"Indexed {len(friendships)} friendships for user {user_id}")
        return True
    except Exception:
        print("Error")
        return False

def indexuser(user_id:int,db:Session):
    try:
        user=db.query(Users).filter(Users.id==user_id).first()
        if not user:
            return False
        posts=db.query(Posts).filter(Posts.owner_id==user_id).count()
        comments=db.query(Comment).filter(Comment.user_id==user_id).count()
        likesgiven=db.query(Like).filter(Like.user_id==user_id).count()
        likesreceived=db.query(Like).join(Posts).filter(Posts.owner_id==user_id).count()
        friendscount=db.query(Friendship).filter(Friendship.user_id==user_id).count()
        usertext=f"""USERID:{user.id}
                NAME:{user.name}
                EMAIL:{user.email}
                ROLE:{user.role}
                STATUS:{'Active' if user.is_active else 'Inactive'}
                POSTS:{posts}
                COMMENTS:{comments}
                LIKES GIVEN:{likesgiven}
                Likes Received:{likesreceived}
                FRIENDS:{friendscount}"""
        rag.addpost(
                    post_id=f"user_{user.id}",
                    content=usertext,
                    metadata={"type":"user","id":user.id,"name":user.name,"email":user.email,"role":user.role,"is_active":user.is_active,"posts_count":posts,"comments_count":comments,"friends_count":friendscount})
        print(f"Indexed user in {user.id}")
        return True
    except Exception:
        print("ERROR")
        return False
    
def get_user(user_id:int,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return user

@router.get("/users")
def users(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id!=currentuser.id,Users.is_verified == True).all()
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
                rec=db.query(FriendRequests).filter(FriendRequests.sender_id==u.id,
                                                    FriendRequests.receiver_id==currentuser.id,
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
    get_user(user_id,db)
    exist=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,
                                          FriendRequests.receiver_id==user_id,
                                          FriendRequests.status=="pending").first()
    if exist:
        db.close()
        raise HTTPException(status_code=400,detail="Request already sent")
    request=FriendRequests(sender_id=currentuser.id,receiver_id=user_id)
    db.add(request)
    db.add(Notifcation(user_id=user_id,post_id=None,message=f"{currentuser.name} sent you a friend request"))
    db.commit()
    await notify_user(user_id,{"type":"friend_request","message":"You recieved a friend request"})
    return{"message":"Request sent"}

@router.get("/requests")
def requests(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    req=db.query(FriendRequests).filter(FriendRequests.receiver_id==currentuser.id,
                                        FriendRequests.status=="pending").all()
    return[{"id":request.id,"from":request.sender.name,"user_id":request.sender.id} for request in req]

@router.put("/accept/{request_id}")
async def acceptrequest(request_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
     req=db.query(FriendRequests).filter(FriendRequests.id==request_id,FriendRequests.receiver_id==currentuser.id).first()
     if not req:
         db.close()
         raise HTTPException(status_code=404,detail="No request")
     req.status="accepted"
     user1=Friendship(user_id=req.sender_id,friend_id=req.receiver_id)
     user2=Friendship(user_id=req.receiver_id,friend_id=req.sender_id)
     db.add_all([user1,user2])
     db.add(Notifcation(user_id=req.sender_id,post_id=None,message=f"{currentuser.name} accepted your friend request"))
     db.commit()
     indexfriendship(req.sender_id,db)
     indexfriendship(req.receiver_id,db)
     indexuser(req.sender_id,db)
     indexuser(req.receiver_id,db)
     await notify_user(req.sender_id,{"type":"friend_accept","message":f"{currentuser.name} accepted your request"})
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
    user=get_user(user_id,db)
    return{"id":user.id,"name":user.name,"email":user.email,"role":user.role}

@router.delete("/{friend_id}")
def removefriend(friend_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    friend1=db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id==friend_id).first()
    friend2=db.query(Friendship).filter(Friendship.user_id==friend_id,Friendship.friend_id==currentuser.id).first()
    db.query(Friendship).filter(Friendship.user_id==currentuser.id,Friendship.friend_id==friend_id).delete()
    db.query(Friendship).filter(Friendship.user_id==friend_id,Friendship.friend_id==currentuser.id).delete()
    db.commit()
    if friend1:
        try:
            rag.collection.delete(ids=[f"friend_{friend1.id}"])
            print(f"Removed friendship")
        except Exception:
            print("Error")
    if friend2:
        try:
            rag.collection.delete(ids=[f"friend_{friend2.id}"])
            print(f"Removed friendship")
        except Exception as e:
            print("Error")
    indexuser(currentuser.id,db)
    indexuser(friend_id,db)
    return{"message":"friend is removed"}

@router.post("/index-all")
def indexallfriendships(db:Session=Depends(get_db)):
    users=db.query(Users).all()
    count=0
    for user in users:
        try:
            if indexfriendship(user.id,db):
                count+=1
        except Exception:
            print("Error")
    return {
        "message":f"Indexed friendships for {count} users","users_processed":count}
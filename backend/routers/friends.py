from fastapi import APIRouter,Depends,HTTPException,Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Users,FriendRequests,Friendship,Notifcation,Posts,Like,Comment
from authentication import getcurrentuser
from routers.sockets import notify_user
from rag import rag
from typing import Optional
from fastapi import BackgroundTasks
from sqlalchemy import func


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
        if not friendships:
            return True
        friend_ids=[f.friend_id for f in friendships]
        friends={f.id:f for f in db.query(Users).filter(Users.id.in_(friend_ids)).all()}
        for friendship in friendships:
            friend=friends.get(friendship.friend_id)
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

def update_rag_after_friend_removal(
    current_user_id,
    friend_id,
    friendship_ids
):
    try:
        rag.collection.delete(
            ids=[f"friend_{fid}" for fid in friendship_ids]
        )
    except Exception as e:
        print(f"RAG delete error: {e}")
    try:
        db = SessionLocal()
        indexuser(current_user_id, db)
        indexuser(friend_id, db)
        db.close()
    except Exception as e:
        print(f"RAG re-index error: {e}")
def update_rag_after_accept(
    sender_id: int,
    receiver_id: int):
    db = SessionLocal()
    try:
        indexfriendship(sender_id, db)
        indexfriendship(receiver_id, db)
        indexuser(sender_id, db)
        indexuser(receiver_id, db)
    except Exception as e:
        print(f"RAG indexing error: {e}")
    finally:
        db.close()
def get_user(user_id:int,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return user

@router.get("/users")
def users(search:Optional[str]=None,limit:int=Query(10,ge=1,le=50),skip:int=Query(0,ge=0),currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    query=db.query(Users).filter(Users.id!=currentuser.id,Users.is_verified == True,Users.is_active==True)
    if search and search.strip():
        searchterm=search.strip().lower()
        query=query.filter((func.lower(Users.name).contains(searchterm)) |(func.lower(Users.email).contains(searchterm)))
    total=query.count()
    users=query.offset(skip).limit(limit).all()
    if not users:
        return{
             "users": [],
            "total": 0,
            "skip": skip,
            "limit": limit,
            "has_more": False
        }
    user_ids=[u.id for u in users]
    friendships={f.friend_id:f for f in db.query(Friendship).filter(Friendship.user_id==currentuser.id,
                                                                    Friendship.friend_id.in_(user_ids)).all()}
    sentrequests={r.receiver_id:r for r in db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,
                                                                           FriendRequests.receiver_id.in_(user_ids),
                                                                           FriendRequests.status=="pending").all()}
    receivedrequests={r.sender_id:r for r in db.query(FriendRequests).filter(FriendRequests.receiver_id==currentuser.id,
                                                                           FriendRequests.sender_id.in_(user_ids),
                                                                           FriendRequests.status=="pending").all()}
    result=[]
    for user in users:
        if user.id in friendships:
            status="friends"
        elif user.id in sentrequests:
            status="pending"
        elif user.id in receivedrequests:
            status="received"
        else:
            status="none"
        result.append({"id":user.id,"name":user.name,"email":user.email,"status":status})
        has_more=skip+limit<total
    return {"users": result,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": has_more}

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
async def acceptrequest(request_id:int,background_tasks: BackgroundTasks,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    req=db.query(FriendRequests).filter(FriendRequests.id==request_id,FriendRequests.receiver_id==currentuser.id).first()
    if not req:
         raise HTTPException(status_code=404,detail="No request")
    req.status="accepted"
    sender_id = req.sender_id
    receiver_id = req.receiver_id

    user1 = Friendship(
        user_id=sender_id,
        friend_id=receiver_id
    )
    user2 = Friendship(
        user_id=receiver_id,
        friend_id=sender_id
    )
    db.add_all([user1,user2])
    db.add(Notifcation(user_id=req.sender_id,post_id=None,message=f"{currentuser.name} accepted your friend request"))
    db.commit()
    background_tasks.add_task(
        update_rag_after_accept,
        sender_id,
        receiver_id
    )
    await notify_user(
        sender_id,
        {
            "type": "friend_accept",
            "message": f"{currentuser.name} accepted your request"
        }
    )
    return {"message": "you are now friends"}
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
    if not friends:
        return []
    friend_ids=[f.friend_id for f in friends]
    friend_users={u.id:u for u in db.query(Users).filter(Users.id.in_(friend_ids)).all()}
    return[{"id":fr.friend_id,"name":friend_users[fr.friend_id].name if fr.friend_id in friend_users else "Unknown"} for fr in friends]                          

@router.get("/sent")
def requestssent(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    request=db.query(FriendRequests).filter(FriendRequests.sender_id==currentuser.id,FriendRequests.status=="pending").all()
    return[{"id":req.id,"name":req.receiver.name,"email":req.receiver.email} for req in request]

@router.get("/user/{user_id}")
def getuserprofile(user_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    user=get_user(user_id,db)
    return{"id":user.id,"name":user.name,"email":user.email,"role":user.role}

@router.delete("/{friend_id}")
def removefriend(
    friend_id: int,
    background_tasks: BackgroundTasks,
    currentuser=Depends(getcurrentuser),
    db: Session = Depends(get_db)
):
    friendship_ids = [
        row[0]
        for row in db.query(Friendship.id)
        .filter(
            ((Friendship.user_id == currentuser.id) & 
             (Friendship.friend_id == friend_id))
            |
            ((Friendship.user_id == friend_id) & 
             (Friendship.friend_id == currentuser.id))
        )
        .all()
    ]

    if not friendship_ids:
        return {"message": "Friendship does not exist"}

    db.query(Friendship).filter(
        Friendship.id.in_(friendship_ids)
    ).delete(synchronize_session=False)

    db.commit()

    # Schedule slow RAG work after the response
    background_tasks.add_task(
        update_rag_after_friend_removal,
        currentuser.id,
        friend_id,
        friendship_ids
    )

    return {"message": "friend is removed"}
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
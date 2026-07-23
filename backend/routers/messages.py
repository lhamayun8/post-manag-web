from fastapi import APIRouter,HTTPException,Header,Depends,Query
from models import Posts,Users,Friendship,Like,Comment,Tags,Notifcation,Conversation,Message
from schema import PostCreate,Post,CommentCreate,CommentResponse,MessageCreate,MessageResponse
from database import SessionLocal
from authentication import verifytoken,getcurrentuser
from typing import List,Optional
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import or_,and_
from routers.sockets import notify_user,sio,onlineusers
router=APIRouter(prefix="/messages",tags=["messages"])

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

def getconvo(user1,user2,db):
    convo=(db.query(Conversation).filter(or_(and_(Conversation.user1_id==user1,Conversation.user2_id==user2),and_(Conversation.user1_id==user2,Conversation.user2_id==user1))).order_by(Conversation.id.desc()).first())
    return convo

@router.get("/status/{user_id}")
def user_status(user_id:int,db:Session=Depends(get_db)):
    user=db.query(Users).filter(Users.id==user_id).first()
    if not user:
        raise HTTPException(status_code=404,detail="User is not found")
    return{"online":user.is_online,"last_seen":user.last_seen}

@router.post("/",response_model=MessageResponse)
async def sendmessage(data:MessageCreate,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    receiver=db.query(Users).filter(Users.id==data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404,detail="User does not exist")
    friend=db.query(Friendship).filter(or_(and_(Friendship.user_id==currentuser.id,Friendship.friend_id==data.receiver_id),and_(Friendship.user_id==data.receiver_id,Friendship.friend_id==currentuser.id))).first()
    convo=getconvo(currentuser.id,data.receiver_id,db)
    if convo and convo.status=="accepted" and not friend:
        convo.status="pending"
        db.commit()
    if not convo:
        status="accepted" if friend else "pending"
        convo=Conversation(user1_id=currentuser.id,user2_id=data.receiver_id,status=status)
        db.add(convo)
        db.commit()
        db.refresh(convo)
    if convo.status=="declined":
        convo.status="pending"
        db.commit()
    message=Message(convo_id=convo.id,sender_id=currentuser.id,receiver_id=data.receiver_id,content=data.content)
    if onlineusers.get(data.receiver_id):
        message.is_delivered=True
        message.delivered_at=datetime.utcnow()
    db.add(message)
    if convo.status=="pending":
        db.add(Notifcation(user_id=data.receiver_id,post_id=None,convo_id=convo.id,message=f"{currentuser.name} sent you a message request"))
    db.commit()
    db.refresh(message)
    await sio.emit("new_message",{"id":message.id,"conversation_id":convo.id,"sender_id":currentuser.id,"receiver_id":data.receiver_id,"sender":currentuser.name,"content":message.content,"created_at":str(message.created_at),"is_read":message.is_read,"is_delivered":message.is_delivered,"status":convo.status},room=f"conversation_{convo.id}")
    await sio.emit("inbox_update",{"conversation_id":convo.id,"content":message.content,"created_at":str(message.created_at),"user_id":data.receiver_id,"user_name":receiver.name},room=f"user_{currentuser.id}")
    await sio.emit("inbox_update",{"conversation_id":convo.id,"content":message.content,"created_at":str(message.created_at),"user_id":currentuser.id,"user_name":currentuser.name},room=f"user_{data.receiver_id}")
    await notify_user(data.receiver_id,{"type":"message_request" if convo.status=="pending" else "message","convo_id":convo.id,"message":message.content,"sender":currentuser.name})
    return {"id":message.id,"convo_id":convo.id,"sender_id":currentuser.id,"receiver_id":data.receiver_id,"content":message.content,"is_read":message.is_read,"is_delivered":message.is_delivered,"delivered_at":message.delivered_at,"created_at":message.created_at,"status":convo.status}

@router.get("/inbox")
def myconversation(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    conversations=(db.query(Conversation).filter(or_(Conversation.user1_id==currentuser.id,Conversation.user2_id==currentuser.id)).all())
    result=[]
    for convo in conversations:
        is_user1=currentuser.id==convo.user1_id
        deleted=convo.deletedbysender if is_user1 else convo.deletedbyreceiver
        end=convo.deleted_by_user1_at if is_user1 else convo.deleted_by_user2_at
        query=db.query(Message).filter(Message.convo_id==convo.id)
        query=query.filter(or_(
            and_(Message.sender_id==currentuser.id,Message.deletedbysender==False),
            and_(Message.receiver_id==currentuser.id,Message.deletedbyreceiver==False),
        ))
        if deleted and end:
            query=query.filter(Message.created_at>end)
        mess=query.order_by(Message.created_at.desc()).first()
        if not mess:
            continue
        otherid=convo.user2_id if currentuser.id==convo.user1_id else convo.user1_id
        other=db.query(Users).filter(Users.id==otherid).first()
        if not other:
            continue
        unread=db.query(Message).filter(Message.convo_id==convo.id,Message.receiver_id==currentuser.id,Message.is_read==False)
        un=unread.count()
        result.append({"conversation_id":convo.id,"user_id":other.id,"unread":un>0,"last_message":mess.content if mess else None,"user_name":other.name if mess else None,"time":mess.created_at if mess else convo.created_at})
        result.sort(key=lambda x:x["time"],reverse=True)
    return result

@router.delete("/inbox/{conversation_id}")
def deleteconversation(conversation_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    convo=db.query(Conversation).filter(Conversation.id==conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404,detail="Conversation not found")
    now=datetime.utcnow()
    if currentuser.id==convo.user1_id:
        convo.deletedbysender=True
        convo.deleted_by_user1_at=now
    elif currentuser.id==convo.user2_id:
        convo.deletedbyreceiver=True
        convo.deleted_by_user2_at=now
    else:
        raise HTTPException(status_code=403,detail="Not allowed to delete this conversation")
    db.commit()
    return{"message":"Conversation deleted","conversation_id":conversation_id}

@router.get("/requests")
def messagerequests(currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    requests=(db.query(Conversation).join(Message).filter(Conversation.status=="pending",Message.receiver_id==currentuser.id).all())
    result=[]
    for convo in requests:
        message=db.query(Message).filter(Message.convo_id==convo.id,Message.receiver_id==currentuser.id).order_by(Message.created_at.desc()).first()
        result.append({"conversation_id":convo.id,"sender_id":message.sender.id,"from":message.sender.name,"message":message.content})
    return result

@router.put("/{conversation_id}/accept")
async def acceptrequest(conversation_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    convo=db.query(Conversation).filter(Conversation.id==conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404,detail="No conversation is found")
    first=db.query(Message).filter(Message.convo_id==conversation_id,Message.receiver_id==currentuser.id).first()
    if not first:
        raise HTTPException(status_code=403,detail="Not able to accept this request")
    convo.status="accepted"
    db.commit()
    db.refresh(convo)
    await notify_user(first.sender_id,{"type":"message_reqaccepted","conversation_id":conversation_id})
    return{"message":"request is accepted","conversation_id":conversation_id}

@router.put("/{conversation_id}/decline")
def declinerequest(conversation_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    convo=db.query(Conversation).filter(Conversation.id==conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404,detail="No conversation is found")
    convo.status="declined"
    db.commit()
    return{"message":"request is declined","conversation_id":conversation_id}

@router.get("/search")
def searchusers(find:str,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    users=db.query(Users).filter(Users.name.ilike(f"%{find}%")).filter(Users.id!=currentuser.id).all()
    return users

@router.get("/{conversation_id}")
def getmessages(conversation_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    conversation=db.query(Conversation).filter(Conversation.id==conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404,detail="Conversation not found")
    if currentuser.id == conversation.user1_id:
        other_id = conversation.user2_id
    elif currentuser.id == conversation.user2_id:
        other_id = conversation.user1_id
    else:
        raise HTTPException(status_code=403,detail="Not allowed")
    query=db.query(Message).filter(Message.convo_id==conversation_id)
    query=query.filter(or_(and_(Message.sender_id==currentuser.id,Message.deletedbysender==False),
                           and_(Message.receiver_id==currentuser.id,Message.deletedbyreceiver==False),))
    is_user1=currentuser.id==conversation.user1_id
    end=conversation.deleted_by_user1_at if is_user1 else conversation.deleted_by_user2_at
    deleted=conversation.deletedbysender if is_user1 else conversation.deletedbyreceiver
    if deleted and end:
        query=query.filter(Message.created_at>end)
    messages=query.order_by(Message.created_at).all()
    otheruser=db.query(Users).filter(Users.id==other_id).first()
    return {
        "messages":messages,"conversation_status":conversation.status,"user_status":{
            "id":otheruser.id,"name":otheruser.name,"is_online":otheruser.is_online,"last_seen":otheruser.last_seen
        }
    }
@router.put("/{conversation_id}/read")
async def messageread(conversation_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    unread_ids=[m.id for m in db.query(Message).filter(Message.convo_id==conversation_id,Message.receiver_id==currentuser.id,Message.is_read==False).all()]
    if unread_ids:
        db.query(Message).filter(Message.id.in_(unread_ids)).update({Message.is_read:True},synchronize_session=False)
        db.commit()
        await sio.emit("messages_read",{"conversation_id":conversation_id,"message_ids":unread_ids},room=f"conversation_{conversation_id}")
    return{"message":"Message is read"}

@router.delete("/message/{message_id}")
async def deletemessage(message_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    message=db.query(Message).filter(Message.id==message_id).first()
    if not message:
        raise HTTPException(status_code=404,detail="No such message found ")
    if(message.sender_id!=currentuser.id and message.receiver_id!=currentuser.id):
        raise HTTPException(status_code=403,detail="Not allowed to delete")
    db.delete(message)
    db.commit()
    await sio.emit("message_deleted",{"message_id":message_id},room=f"conversation_{message.convo_id}")
    
@router.put("/message/{message_id}/deleteforme")
async def deleteforme(message_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    message=db.query(Message).filter(Message.id==message_id).first()
    if not message:
        raise HTTPException(status_code=404,detail="Message not found")
    if currentuser.id==message.sender_id:
        message.deletedbysender=True
    elif currentuser.id==message.receiver_id:
        message.deletedbyreceiver=True
    else:
        raise HTTPException(status_code=403,detail="Not allowed to delete")
    db.commit()
    return{"message":"Message deleted for me"}

@router.delete("/message/{message_id}/everyone")
async def deleteforeveryone(message_id:int,currentuser=Depends(getcurrentuser),db:Session=Depends(get_db)):
    message=db.query(Message).filter(Message.id==message_id).first()
    if not message:
        raise HTTPException(status_code=404,detail="Message not found")
    if message.sender_id!=currentuser.id:
        raise HTTPException(status_code=403,detail="Only sender can delete for everyone")
    convo=message.convo_id
    db.delete(message)
    db.commit()
    await sio.emit("message_deleted",{"message_id":message_id},room=f"conversation_{convo}")
    return{"message":"Message deleted for everyone"}
import socketio
from fastapi import APIRouter
from database import SessionLocal
from models import Users
from datetime import datetime
router=APIRouter()
sio=socketio.AsyncServer(async_mode="asgi",cors_allowed_origins=["http://localhost:5173"])
onlineusers={}
@sio.event
async def connect(sid,environ):
    print("Connected",sid)

@sio.event
async def register(sid,user_id):
    user_id=int(user_id)
    if user_id not in onlineusers:
        onlineusers[user_id]=[]
    onlineusers[user_id].append(sid)
    await sio.enter_room(sid,f"user_{user_id}")
    db=SessionLocal()
    user=db.query(Users).filter(Users.id==user_id).first()
    if user:
        user.is_online=True
        user.last_seen=None
        db.commit()
    db.close()
    await sio.emit("status",{"user_id":user_id,"is_online":True,"last_seen":None})
    print("Online",user_id )

@sio.event
async def disconnect(sid):
    for user_id,sockets in list(onlineusers.items()):
        if sid in sockets:
            sockets.remove(sid)
            if len(sockets)==0:
                del onlineusers[user_id]
                db=SessionLocal()
                user=db.query(Users).filter(Users.id==user_id).first()
                if user:
                    user.is_online=False
                    user.last_seen=datetime.utcnow()
                    db.commit()
                db.close()
                await sio.emit("status",{"user_id":user_id,"is_online":False,"last_seen":str(datetime.utcnow())})
            print("Offline",user_id)
            break

@sio.event
async def joinconvo(sid,data):
    conversation_id=data.get("conversation_id")
    if not conversation_id:
        print("Missing", data)
        return
    room=f"conversation_{conversation_id}" 
    await sio.enter_room(sid,room)
    print(sid,"joined",room)

@sio.event
async def leaveconvo(sid,data):
    conversation_id=data.get("conversation_id")
    if not conversation_id:
        print("Missing", data)
        return
    room=f"conversation_{conversation_id}" 
    await sio.leave_room(sid,room)

@sio.event
async def typing(sid,data):
    await sio.emit("user_typing",data,room=f"conversation_{data['conversation_id']}",skip_sid=sid)

@sio.event
async def stoptyping(sid,data):
    await sio.emit("user_stop_typing",data,room=f"conversation_{data['conversation_id']}",skip_sid=sid)

async def notify_user(user_id,data):
    sockets=onlineusers.get(user_id)
    if sockets:
        for sid in sockets:
            await sio.emit("notification",data,to=sid)

async def send_to_user(user_id,event,data):
    sockets=onlineusers.get(user_id)
    if sockets:
        for sid in sockets:
            await sio.emit(event,data,to=sid)
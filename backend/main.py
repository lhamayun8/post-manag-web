from fastapi import FastAPI
import socketio
from database import Base,engine,SessionLocal
from models import Users
from routers import users,posts,admin,friends,sockets,connections,messages,chat,personal,suggestions
from fastapi.middleware.cors import CORSMiddleware
from routers.sockets import sio
from scheduler import startscheduler
app=FastAPI()
Base.metadata.create_all(bind=engine)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(admin.router)
app.include_router(friends.router)
app.include_router(sockets.router)
app.include_router(messages.router)
app.include_router(connections.router)
app.include_router(chat.router)
app.include_router(personal.router)
app.include_router(suggestions.router)
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173","http://127.0.0.1:5173", "https://post-manag-app.netlify.app","https://post-manag-web.vercel.app"],allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"],)

@app.on_event("startup")
def resetonlinestatus():
    db=SessionLocal()
    try:
        db.query(Users).filter(Users.is_online==True).update({Users.is_online:False})
        db.commit()
    finally:
        db.close()
    startscheduler()
@app.get("/")
def root():
    return {"message":"backend is running"}

socket_app=socketio.ASGIApp(sio,other_asgi_app=app)

app=socket_app
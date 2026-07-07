from fastapi import FastAPI
from database import Base,engine
from routers import users,posts,admin
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI()
Base.metadata.create_all(bind=engine)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(admin.router)

app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"],)
@app.get("/")
def root():
    return {"message":"backend is running"}
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from models import Like,Comment,Posts,Users
from schema import CommentCreate,CommentResponse
from authentication import getcurrentuser

router=APIRouter(prefix="/posts",tags=["Connections"])
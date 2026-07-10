from fastapi import APIRouter,WebSocket

router=APIRouter()
connections={}

@router.websocket("/ws/{user_id}")
async def websocket(web:WebSocket,user_id:int):
    await web.accept()
    connections[user_id]=web
    try:
        while True:
            await web.receive_text()
    except:
        del connections[user_id]

async def notify_user(user_id:int,message:dict):
    if user_id in connections:
        await connections[user_id].send_json(message)
    
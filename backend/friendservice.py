from sqlalchemy.orm import Session
from models import Users, Friendship
class FriendSuggestion:
    def __init__(self,db:Session):
        self.db=db
    def getsuggestions(self,user_id:int):
        friends=self.getfriends(user_id)
        suggestions={}
        for friend_id in friends:
            sec=self.getfriends(friend_id)
            for newid in sec:
                if newid==user_id:
                    continue
                if newid in friends:
                    continue
                if newid not in suggestions:
                    suggestions[newid]=0
                suggestions[newid]+=1
        ranked=[]
        for newid,score in suggestions.items():
            user=self.db.query(Users).filter(Users.id==newid).first()
            if user:
                ranked.append({"id":user.id,"name":user.name,"mutual_friends":score})
        ranked.sort(key=lambda x:x["mutual_friends"],reverse=True)
        return ranked
    def getfriends(self,user_id):
        friends=self.db.query(Friendship).filter(Friendship.user_id==user_id).all()
        return [f.friend_id for f in friends]
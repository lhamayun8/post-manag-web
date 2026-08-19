# seed_one_chat.py
from database import SessionLocal
from models import Users, Conversation, Message, Friendship
from datetime import datetime, timedelta
import random
from faker import Faker

fake = Faker()

def sendmessages(user1_id, user2_id, num_messages=50):
    db = SessionLocal()
    
    try:
        user1 = db.query(Users).filter(Users.id == user1_id).first()
        user2 = db.query(Users).filter(Users.id == user2_id).first()
        
        if not user1 or not user2:
            print(f" Users not found: {user1_id}, {user2_id}")
            return
        
        print(f"Seeding chat between {user1.name} and {user2.name}")
        
        friendship = db.query(Friendship).filter(
            ((Friendship.user_id == user1_id) & (Friendship.friend_id == user2_id)) |
            ((Friendship.user_id == user2_id) & (Friendship.friend_id == user1_id))
        ).first()
        
        if not friendship:
            db.add(Friendship(user_id=user1_id, friend_id=user2_id))
            db.add(Friendship(user_id=user2_id, friend_id=user1_id))
            db.commit()
        
        conversation = db.query(Conversation).filter(
            ((Conversation.user1_id == user1_id) & (Conversation.user2_id == user2_id)) |
            ((Conversation.user1_id == user2_id) & (Conversation.user2_id == user1_id))
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user1_id=user1_id,
                user2_id=user2_id,
                status="accepted",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 7))
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            print(f" Created conversation ID: {conversation.id}")
        else:
            print(f" Using existing conversation ID: {conversation.id}")
        
        templates = [
            "Hey! How are you?",
            "What's up?",
            "Did you see the latest post?",
            "That was a great post!",
            "I totally agree.",
            "When are you free?",
            "Let's catch up soon!",
            "What do you think?",
            "I'm working on a project.",
            "Check this out!",
            "How's your day?",
            "Any weekend plans?",
            "I miss our chats!",
            "That's interesting.",
            "Can you help me?",
            "I'll get back to you.",
            "Thanks for your help!",
            "No problem!",
            "That's awesome!",
            "I'm excited!",
            "Let me know what you think.",
            "I'll send details.",
            "Great minds think alike!",
            "We should do this more.",
            "Have a great day!",
            "See you around!",
            "Take care!",
            "Good luck!",
            "I'm glad we're friends.",
            "This is fun!",
            "Did you hear?",
            "What's your opinion?",
            "That makes sense.",
            "I'll try that!",
            "It's been a while.",
            "We should meet up!",
            "What are you up to?",
            "Just checking in!",
            "Hope you're well.",
            "Let's grab coffee!",
            "I've been thinking...",
            "Exactly what I needed!",
            "You're the best!",
            "I appreciate you!",
            "Stay awesome!",
            "I'm learning new things.",
            "This is amazing!",
            "Congratulations!",
            "I'm proud of you!",
            "That's great news!"
        ]
        
        messages = []
        current_time = conversation.created_at
        total = 0
        
        for i in range(num_messages):
            gap = random.randint(1, 60)
            if random.random() < 0.3:
                gap = random.randint(60, 480)
            
            current_time += timedelta(minutes=gap)
            if current_time > datetime.utcnow():
                current_time = datetime.utcnow() - timedelta(minutes=random.randint(1, 30))
            
            sender = user1_id if random.random() < 0.5 else user2_id
            receiver = user2_id if sender == user1_id else user1_id
            
            content = random.choice(templates)
            if random.random() < 0.3:
                content += " " + fake.sentence()
            
            is_read = random.random() < 0.8
            is_delivered = random.random() < 0.95
            
            messages.append(Message(
                convo_id=conversation.id,
                sender_id=sender,
                receiver_id=receiver,
                content=content,
                created_at=current_time,
                is_read=is_read,
                is_delivered=is_delivered,
                delivered_at=current_time if is_delivered else None,
                deletedbysender=False,
                deletedbyreceiver=False
            ))
            total += 1
            
            if len(messages) >= 50:
                db.bulk_save_objects(messages)
                db.commit()
                messages = []
        
        if messages:
            db.bulk_save_objects(messages)
            db.commit()
        
        print(f" Seeded {total} messages")
        print(f" Conversation ID: {conversation.id}")
        return conversation.id
        
    except Exception as e:
        print(f" Error: {e}")
        db.rollback()
    finally:
        db.close()

def list_users():
    db = SessionLocal()
    try:
        users = db.query(Users).filter(Users.is_verified == True).all()
        print("\n Available Users:")
        for user in users:
            print(f"ID: {user.id} | Name: {user.name} | Email: {user.email}")
        return users
    finally:
        db.close()

def list_conversations():
    db = SessionLocal()
    try:
        convos = db.query(Conversation).all()
        print("\n Conversations:")
        for convo in convos:
            u1 = db.query(Users).filter(Users.id == convo.user1_id).first()
            u2 = db.query(Users).filter(Users.id == convo.user2_id).first()
            count = db.query(Message).filter(Message.convo_id == convo.id).count()
            print(f"ID: {convo.id} | {u1.name} <-> {u2.name} | Status: {convo.status} | Messages: {count}")
        return convos
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        user1_id = int(sys.argv[1])
        user2_id = int(sys.argv[2])
        num_messages = int(sys.argv[3]) if len(sys.argv) > 3 else 50
        sendmessages(user1_id, user2_id, num_messages)
    elif len(sys.argv) == 2:
        if sys.argv[1] == "users":
            list_users()
        elif sys.argv[1] == "list":
            list_conversations()
        elif sys.argv[1] == "help":
            print("\nUsage:")
            print("  python seedmessages.py <user1_id> <user2_id> [num_messages]")
            print("  python seedmessages.py users")
            print("  python seedmessages.py list")
            print("  python seedmessages.py clear <conversation_id>")
            print("\nExamples:")
            print("  python seedmessages.py 15 9 50")
            print("  python seedmessages.py 15 9 100")
            print("  python seedmessages.py users")
            print("  python seedmessages.py list")
            print("  python seedmessages.py clear 5")
        else:
            print("Unknown command. Use 'python seedmessages.py help' for usage.")
    else:
        print("\nUsage:")
        print("  python seedmessages.py <user1_id> <user2_id> [num_messages]")
        print("  python seedmessages.py users")
        print("  python seedmessages.py list")
        print("  python seedmessages.py clear <conversation_id>")
        print("\nExamples:")
        print("  python seedmessages.py 15 9 50")
        print("  python seedmessages.py 15 9 100")
        print("  python seedmessages.py users")
        print("  python seedmessages.py list")
        print("  python seedmessages.py clear 5")
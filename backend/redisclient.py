import redis 
import json

redisclient=redis.Redis(host="172.22.43.66",port=6379,decode_responses=True)

def setcache(key,value,expiry=300):
    redisclient.set(key,json.dumps(value),ex=expiry)

def getcache(key):
    data=redisclient.get(key)
    if data:
        return json.loads(data)
    return None

def deletecache(key):
    keys=redisclient.keys(key)
    if keys:
        redisclient.delete(*keys)

if __name__ == "__main__":
    setcache("test", {"message": "hello"})
    print(getcache("test"))
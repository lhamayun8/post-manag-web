import os
import redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redisclient = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)


def getcache(key):
    try:
        return redisclient.get(key)
    except Exception as e:
        print(f"Redis GET failed: {e}")
        return None


def setcache(key, value, expire=300):
    try:
        redisclient.set(key, value, ex=expire)
    except Exception as e:
        print(f"Redis SET failed: {e}")


def deletecache(key):
    try:
        keys = redisclient.keys(key)

        if keys:
            redisclient.delete(*keys)

        print(f"Redis cache deleted: {key}")

    except Exception as e:
        print(f"Redis DELETE failed for {key}: {e}")
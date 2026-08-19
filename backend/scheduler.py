from apscheduler.schedulers.asyncio import AsyncIOScheduler
from cronjob import sendrecommendations
from zoneinfo import ZoneInfo
scheduler=AsyncIOScheduler(timezone=ZoneInfo("Asia/Karachi"))

def startscheduler():
    scheduler.add_job(sendrecommendations,trigger="cron",hour=2,minute=5,id="dailypostrecommendation",replace_existing=True,misfire_grace_time=300)
    scheduler.start()
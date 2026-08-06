from apscheduler.schedulers.asyncio import AsyncIOScheduler
from cronjob import sendrecommendations
scheduler=AsyncIOScheduler()

def startscheduler():
    scheduler.add_job(sendrecommendations,trigger="cron",hour=12,minute=33,id="dailypostrecommendation",replace_existing=True)
    scheduler.start()
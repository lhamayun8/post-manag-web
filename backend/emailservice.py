from fastapi_mail import FastMail,MessageSchema,ConnectionConfig
from dotenv import load_dotenv
import os
load_dotenv()
con=ConnectionConfig(MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
                     MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
                     MAIL_FROM=os.getenv("MAIL_FROM"),
                     MAIL_PORT=int(os.getenv("MAIL_PORT")),
                     MAIL_SERVER=os.getenv("MAIL_SERVER"),
                     MAIL_STARTTLS=True,MAIL_SSL_TLS=False,
                     USE_CREDENTIALS=True)
async def sendemail(email:str,code):
    message=MessageSchema(subject="Verify your account",recipients=[email],body=f"""Welcome to PostManager!!
                          Your verification code is:
                          {code}""",subtype="plain")
    fm=FastMail(con)
    await fm.send_message(message)
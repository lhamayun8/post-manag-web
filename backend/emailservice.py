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
async def sendemail(email:str,code,email_type:str):
    if email_type=="verify":
        subject="Verify Your Email - PostManager"
        heading="Email Verification"
        greeting="Thank you for registering with PostManager"
        instruction="Use the verification code below to verify your email address"
    elif email_type=="reset":
        subject="Reset Password - PostManager"
        heading="Password Reset"
        greeting="We recieved a request from you to reset your password"
        instruction="Use the verification code below to reset your password"
    elif email_type=="comment":
        subject="Comment Alert - PostManager"
        heading="Comment Alert"
        greeting="Someone just commented on your post!!"
        instruction="View the new comment and engage!!"
    else:
        raise ValueError("invalid email type")
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                background-color: #f4f6f9;
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 30px;
            }}
            .container {{
                max-width: 600px;
                margin: auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }}
            .header {{
                background: #2563eb;
                color: white;
                text-align: center;
                padding: 30px;
            }}
            .logo {{
                width: 70px;
                margin-bottom: 10px;
            }}
            .content {{
                padding: 35px;
                color: #444;
                line-height: 1.8;
            }}
            .code {{
                text-align: center;
                background: #f1f5f9;
                border: 2px dashed #2563eb;
                font-size: 34px;
                letter-spacing: 8px;
                color: #2563eb;
                padding: 18px;
                margin: 30px 0;
                border-radius: 10px;
                font-weight: bold;
            }}
            .note {{
                background:#fff7ed;
                border-left:4px solid #f59e0b;
                padding:15px;
                border-radius:6px;
                margin-top:20px;
            }}
            .footer {{
                text-align: center;
                color: #888;
                font-size: 13px;
                padding: 20px;
                background: #f8fafc;
            }}
        </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>PostManager</h1>
            <h3>{heading}</h3>
        </div>
        <div class="content">
            <h2>Hello</h2>
            <p>
                {greeting}
            </p>
            <p>
                {instruction}
            </p>
            <div class="code">
                {code}
            </div>
             <div class="note">
                    <strong>Important</strong><br>
                    • This code is valid for <strong>15 minutes</strong>.<br>
                    • Use only the most recently received code.<br>
                    • If you didn't request this, you can safely ignore this email.
            </div>
            <p>
                Thank you,<br>
                <strong>PostManager Team</strong>
            </p>
        </div>
        <div class="footer">
            © 2026 PostManager
            <br>
            Secure • Reliable • Fast
        </div>
    </div>
    </body>
    </html>
    """
    message = MessageSchema(
        subject="Verify Your Email - PostManager",
        recipients=[email],
        body=html,
        subtype="html",
    )
    fm=FastMail(con)
    await fm.send_message(message)
# post-manag-web
Post management application 
APPLICATION FEATURES:
User Management
Registration
Users should be able to:

Register with name, email, and password
Validate user details
Store encrypted passwords
Prevent duplicate email registration
Login
Users should be able to:

Login using email and password
Receive authentication token
Access authorized features after login
Logout

User should be able to logout
Authentication session/token should be cleared

User Authorization
Implement role-based access control.
User Role
Users can:

Create posts
View posts
Update their own posts
Delete their own posts
Manage their profile
Admin Role
Admin can:

View all users
View all posts
Edit any post
Delete any post
Manage users


Post Management
Create Post
User should be able to create posts with:

Title
Description/content
Image (optional)
Category
Status

View Posts
System should provide:

List of posts
Post details
Search functionality
Pagination


Update Post
Users can update only their own posts
Admin can update any post

Delete Post
Users can delete only their own posts
Admin can delete any post

User Profile
Users should be able to:

View profile
Update profile details
Change password

INSTALLATION SETUP:
Backend:
git clone <github.com/lhamayun8/post-manag-web>
cd backend
pip install fastapi uvicorn sqlalchemy python-jose passlib bcrypt pyhton-multipart
#for PostgreSQL:
pip install psycopg2-binary 
uvicorn main:app --reload
127.0.0.1/docs

Frontend:
npm install
npm run dev

## Database Migration (Alembic)
This project uses **Alembic** for managing database schema changes with SQLAlchemy. Alembic allows creating, tracking, and applying database migrations without manually modifying database tables.
### Installation
Install Alembic using pip:
```bash
pip install alembic

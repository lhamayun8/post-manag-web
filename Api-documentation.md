API DOCUMENTATION
The Post Management System is a full-stack web application that allows users to create, manage, and delete posts. It includes authentication, authorization, and role-based access control using JWT.
Frontend
React.js

Backend
Python FastAPI

Database
SQLite

Authentication
JWT-based authentication
Password hashing

Base URL:
localhost

Swagger docs:
localhost/docs

API ENDPOINTS
POST /users/register
POST /users/login
GET /users/me
PUT /users/edit
PUT /users/changepass
POST /users/logout
POST /posts/
GET /posts/
GET /posts/{id}
PUT /posts/{id}
DELETE /posts/{id}
GET /admin/users
GET /admin/posts

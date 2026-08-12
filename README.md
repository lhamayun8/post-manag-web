# post-manag-web

A full-stack social post management and recommendation application that allows users to create, discover, and interact with posts while connecting with other users through a friendship system.

The application provides secure authentication, role-based authorization, post management, social interactions, personalized content recommendations, notifications, scheduled recommendation emails, and intelligent user/friendship indexing.

---

# APPLICATION FEATURES

## 1. User Management

### Registration

Users can:

- Register with name, email, and password
- Validate registration details
- Prevent duplicate email registration
- Securely hash user passwords
- Verify user accounts

### Login

Users can:

- Login using email and password
- Receive an authentication token
- Access protected application features
- Maintain an authenticated session

### Logout

Users can:

- Logout from the application
- Clear the authentication token/session
- Prevent access to protected features after logout

---

# 2. User Authorization

The application implements **role-based access control**.

## User Role

Regular users can:

- Create posts
- View published posts
- Search posts
- Update their own posts
- Delete their own posts
- Like and unlike posts
- Add comments
- Delete their own comments
- Tag users in posts
- Manage their profile
- Change their password
- Select interests
- Find other users
- Send friend requests
- Accept or reject friend requests
- View sent requests
- View received requests
- View friends
- Remove friends
- View friend suggestions
- Receive notifications
- Receive personalized post recommendations

## Admin Role

Administrators can:

- View users
- View posts
- Edit any post
- Delete any post
- Manage users
- Access administrative functionality

---

# 3. Post Management

## Create Post

Users can create posts containing:

- Title
- Description/content
- Image (optional)
- Category
- Status

Posts can be created with different statuses such as draft or published.

## View Posts

The system provides:

- List of posts
- Post details
- Search functionality
- Pagination
- Published post filtering
- Post categories
- Post owner information
- Tagged users
- Like information
- Comments

Posts are displayed according to their publication date.

## Update Post

- Users can update only their own posts
- Admin can update any post

## Delete Post

- Users can delete only their own posts
- Admin can delete any post

---

# 4. Post Search

Users can search for posts using the available search functionality.

The system supports:

- Keyword-based post search
- Category-based content discovery
- Search combined with pagination
- Dynamic loading of search results

---

# 5. Pagination

Pagination is implemented to improve application performance and avoid loading large amounts of data at once.

The backend supports:

- `skip`
- `limit`
- `total`
- `has_more`

Pagination is used for areas such as:

- Posts
- Users
- Comments

The frontend provides "See More" functionality for loading additional records.

---

# 6. Likes

Users can interact with posts using likes.

Features include:

- Like a post
- Unlike a post
- View total likes
- View users who liked a post
- Track likes given by users
- Track likes received by post owners

---

# 7. Comments

Users can interact with posts through comments.

Features include:

- Add comments
- View comments
- Display comment author
- Display comment creation time
- Delete own comments
- Paginate comments
- Track user comment activity

---

# 8. User Tagging

Users can tag other users when creating posts.

The application stores tagged users and displays them with the associated post.

This allows users to directly associate other users with specific content.

---

# 9. Friendship System

The application provides a complete user friendship system.

## Find Friends

Users can:

- Search users by name
- Browse available users
- View users using pagination
- Check friendship status
- Send friend requests

## Friend Requests

Users can:

- Send friend requests
- View received requests
- Accept friend requests
- Reject friend requests
- View sent requests
- Track pending requests

## Friends

Users can:

- View their friends
- Remove friends
- Check friendship status

When a request is accepted, a two-way friendship relationship is created.

---

# 10. Friend Suggestions

The application provides a **Friend Suggestions** feature to help users discover potential connections.

The system can use user and friendship information to support intelligent friend discovery.

---

# 11. User Interests

Users can select categories that they are interested in.

Example interests include:

- AI
- Programming
- Technology
- Gaming
- Sports
- Food
- Travel
- Art

The application:

- Retrieves available post categories
- Normalizes category names
- Removes duplicate categories
- Stores selected interests
- Retrieves saved interests for each user
- Uses interests for personalized recommendations

Example:

```text
User
 ├── Food
 └── Technology
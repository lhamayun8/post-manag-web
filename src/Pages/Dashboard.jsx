import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [users,setUsers]=useState([])
  const [posts,setPosts]=useState([])
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [error,setError]=useState("")
  const [tab,setTab]=useState("users")
  const navigate=useNavigate()
  const {user}=useAuth()
  const [userPage,setUserPage]=useState(0)
  const [userTotal,setUserTotal]=useState(0)
  const [userHasMore,setUserHasMore]=useState(true)
  const [userLoading,setUserLoading]=useState(false)
  const userLimit=10
  const [postPage,setPostPage]=useState(0)
  const [postTotal,setPostTotal]=useState(0)
  const [postHasMore,setPostHasMore]=useState(true)
  const [postLoading,setPostLoading]=useState(false)
  const postLimit=10
  const closeerror=()=>{
    setError("")
  }
  const fetchUsers=async(reset=true)=> {
    if (userLoading) 
      return
    setUserLoading(true)
    try {
      const skip=reset?0:userPage*userLimit
      const set=await api.get("/admin/users", {params: { limit: userLimit, skip: skip,search: userSearch || undefined }})
      const usersData=set.data.users || []
      const total=set.data.total || 0
      if (reset){
        setUsers(usersData);
        setUserPage(1);
      } else {
        setUsers(prev => [...prev, ...usersData]);
        setUserPage(prev => prev + 1);
      }
      setUserTotal(total);
      setUserHasMore(set.data.has_more || false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load users");
    } finally {
      setUserLoading(false);
    }
  }
  const fetchPosts=async(reset=true) => {
    if (postLoading) 
      return;
    setPostLoading(true);
    try {
      const skip=reset?0:postPage*postLimit
      const set=await api.get("/admin/posts", {params: { limit: postLimit, skip: skip,search:postSearch||undefined }})
      const postsData=set.data.posts|| []
      const total=set.data.total|| 0
      if (reset) {
        setPosts(postsData)
        setPostPage(1)
      } else {
        setPosts(prev => [...prev, ...postsData])
        setPostPage(prev => prev + 1)
      }
      setPostTotal(total)
      setPostHasMore(set.data.has_more || false)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load posts");
    } finally {
      setPostLoading(false)
    }
  }
  const fetchData=async()=> {
    await Promise.all([fetchUsers(true), fetchPosts(true)])
  };

  useEffect(() => {
    if (user?.role==="admin") {
      fetchData()
    }
  }, [user])
   useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === "users") {
        fetchUsers(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === "posts") {
        fetchPosts(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [postSearch]);

  const loadMoreUsers = () => {
    if (!userLoading && userHasMore) {
      fetchUsers(false)
    }
  }
  const loadMorePosts = () => {
    if (!postLoading && postHasMore) {
      fetchPosts(false)
    }
  }
  const promoteUser = async (id) => {
    try {
      await api.put(`/admin/makeadmin/${id}`);
      await fetchUsers(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to promote user");
    }
  };

  const blockUser = async (id) => {
    try {
      await api.put(`/admin/block/${id}`);
      await fetchUsers(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to block");
    }
  };

  const activateUser = async (id) => {
    try {
      await api.put(`/admin/activate/${id}`);
      await fetchUsers(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to activate user");
    }
  };
  const handleUserSearch = () => {
    fetchUsers(true);
  };

  const handlePostSearch = () => {
    fetchPosts(true);
  };
  const deletePost = async (id) => {
    try {
      if (!window.confirm("Delete this post?")) return;
      await api.delete(`/admin/posts/${id}`);
      await fetchPosts(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete post");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="auth-container">
        <p>You cannot access this page</p>
        <button onClick={() => navigate("/posts")} className="btn btn-primary">
          Go to posts
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-sidebar">
        <button 
          className={tab === "users" ? "active" : ""} 
          onClick={() => setTab("users")}
        >
          Users
        </button>
        <button 
          className={tab === "posts" ? "active" : ""} 
          onClick={() => setTab("posts")}
        >
          Posts
        </button>
      </div>
      <div className="admin-content">
        <h1>Admin Dashboard</h1>
        {tab === "users" && (
          <section className="admin-section">
            <h2>USERS ({userTotal})</h2>
            <div className="search-container">
        <input
          type="text"
          placeholder="Search User..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        ></input>
        <button onClick={handleUserSearch} className="btn btn-primary">
          Search
        </button>
              </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.is_active ? 'active' : 'blocked'}`}>
                          {u.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {u.role !== "admin" && (
                            <button 
                              onClick={() => promoteUser(u.id)} 
                              className="btn btn-primary btn-sm"
                            >
                              Make Admin
                            </button>
                          )}
                          {u.is_active ? (
                            <button 
                              onClick={() => blockUser(u.id)} 
                              className="btn btn-danger btn-sm"
                            >
                              Block
                            </button>
                          ) : (
                            <button 
                              onClick={() => activateUser(u.id)} 
                              className="btn btn-success btn-sm"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {userLoading && <p className="loading-text">Loading more users...</p>}
            
            {userHasMore && !userLoading && users.length > 0 && (
              <div className="see-more-container">
                <button className="btn-btn-primary" onClick={loadMoreUsers}>
                  Load More Users ({users.length} of {userTotal})
                </button>
              </div>
            )}
            
            {!userHasMore && users.length > 0 && (
              <p className="text-muted text-center">All users loaded</p>
            )}
          </section>
        )}
        {tab === "posts" && (
          <section className="admin-section">
            <h2>POSTS ({postTotal})</h2>
            <div className="search-container">
        <input
          type="text"
          placeholder="Search Posts..."
          value={postSearch}
          onChange={(e) => setPostSearch(e.target.value)}
        ></input>
        <button onClick={handlePostSearch} className="btn btn-primary">
          Search
        </button>
        </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <strong>{post.title}</strong>
                      </td>
                      <td>
                        {post.description && post.description.length > 100 
                          ? `${post.description.slice(0, 100)}...` 
                          : post.description}
                      </td>
                      <td>
                        <span className={`status-badge ${post.status}`}>
                          {post.status}
                        </span>
                      </td>
                      <td>{post.username || "unknown"}</td>
                      <td>
                        <button 
                          onClick={() => deletePost(post.id)} 
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {postLoading && <p className="loading-text">Loading more posts...</p>}
            
            {postHasMore && !postLoading && posts.length > 0 && (
              <div className="see-more-container">
                <button className="btn-btn-primary" onClick={loadMorePosts}>
                  Load More Posts ({posts.length} of {postTotal})
                </button>
              </div>
            )}
            
            {!postHasMore && posts.length > 0 && (
              <p className="text-muted text-center">All posts loaded</p>
            )}
          </section>
        )}
        {error && (
          <div className="error-box">
            <span>{error}</span>
            <button onClick={closeerror}>X</button>
          </div>
        )}
      </div>
    </div>
  );
}
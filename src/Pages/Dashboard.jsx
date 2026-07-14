import React, { act, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const[error,setError]=useState("")
  const navigate = useNavigate();
  const { user } = useAuth();
  const closeerror=()=>{
    setError("")
  }
  const fetchdata=async()=>{
    try{
      const uset = await api.get("/admin/users");
      setUsers(uset.data);
      const pset = await api.get("/admin/posts");
      setPosts(pset.data); 
    }catch(err){
      setError(error.response?.data?.detail ||"Failed to load admin data");
    }
  }
  useEffect(() => {
      if (user?.role === "admin") {
        fetchdata()
      }
  }, [user]);

  const promoteuser=async(id)=>{
    try{
      await api.put(`/admin/makeadmin/${id}`)
      fetchdata()
    }catch(err){
      setError(error.response?.data?.detail ||"Failed to promote user");
    }
  }
  const blockuser=async(id)=>{
    try{
      await api.put(`/admin/block/${id}`)
      fetchdata()
    }catch(err){
      setError(err.response?.data?.detail ||"Failed to block");
    }
  }
  const activateuser=async(id)=>{
     try{
      await api.put(`/admin/activate/${id}`)
      fetchdata()
    }catch(err){
      setError(err.response?.data?.detail ||"Failed to activate user");
    }
  }
  const deletepost=async(id)=>{
    try{
      if(!window.confirm("Delete this post?"))
        return;
      await api.delete(`/admin/posts/${id}`)
      fetchdata()
    }catch(err){
      setError(err.response?.data?.detail ||"Failed to delete post");
    }
  }
  if (!user || user.role !== "admin") {
    return (
      <div className="auth-container">
        <p>You can not access this page</p>
        <button onClick={() => navigate("/posts")} className="btn btn-primary">
          Go to posts
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <section className="admin-section">
        <h2>USERS</h2>
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
              {users.map((u)=>(
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active?"Active":"Blocked"}</td>
                  <td>{u.role!=="admin" &&(
                    <button onClick={()=>promoteuser(u.id)} className="btn btn-primary">Make Admin</button>
                  )}
                  {u.is_active?(<button onClick={()=>blockuser(u.id)} className="btn btn-danger">Block</button>
                  ):(<button onClick={()=>activateuser(u.id)} className="btn btn-success">Activate</button>
                )}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <h2>POSTS</h2>
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
                {posts.map(post=>(
                  <tr key={post.id}>
                    <td>
                      {post.title}
                    </td>
                    <td>
                      {post.description}
                    </td>
                    <td>
                      {post.status}
                    </td>
                    <td>
                      {post.username||"unknown"}
                    </td>
                    <td>
                      <button onClick={()=>deletepost(post.id)} className="btn btn-danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </section>
          <button onClick={()=>navigate("/posts")} className="btn btn-primary">View Posts</button>
          {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
          </div>
  );
}
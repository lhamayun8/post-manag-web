import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function PostList() {
  const [posts, setPost] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [search]);
  const fetchPost = async () => {
    try {
      const set = await api.get("/posts", { params: { status:"published",search } });
      setPost(set.data);
    } catch (err) {
      setError(err.response?.data?.detail || "No published posts avaiable.");
    }
  };
  const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi"
    })
  }
  return (
    <div className="posts-container">
      <h2>Published Posts</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search Posts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        ></input>
        <button onClick={fetchPost} className="btn btn-primary">
          Search
        </button>
      </div>
      {err && <p style={{ color: "orange" }}>{err}</p>}
        {posts.length===0?<p>No Published Posts</p>
        :
        posts.map((post) => (
          <div key={post.id} className="post-card">
            <h2>Title:  {post.title}</h2>
            {post.image && (
          <div className="image-container">
            {" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
                <p>Posted by <b>{post.username}</b></p>
                <p>{formatDate(post.created_at)}</p>
                <p>Category:{post.category}</p>
            </div>
            ))
            }
      </div>
  )
}

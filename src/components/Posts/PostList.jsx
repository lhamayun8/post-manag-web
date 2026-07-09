import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function PostList() {
  const [posts, setPost] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchPost();
  }, [search]);
  const fetchPost = async () => {
    try {
      const set = await api.get("/posts", { params: { search } });
      setPost(set.data);
    } catch (err) {
      setError(err.response?.data?.detail || "No posts avaiable.");
    }
  };
  const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi"
    })
  }
  return (
    <div className="posts-container">
      <h2>Posts</h2>
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
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="post-item">
            <Link to={`/posts/${post.id}`}>{post.title}</Link>
            {post.status==="draft"?(
              <>
                <p><b>Draft</b></p>
                <p>Created at {formatDate(post.created_at)}</p>
              </>
            ):(
              <>
                <p>Posted by <b>{post.username}</b></p>
                <p>{formatDate(post.created_at)}</p>
              </>
            )}
            </li>
        ))} 
      </ul>
      {user && (
        <Link to="/posts/new" className="btn btn-primary">
          Create new post
        </Link>
      )}
    </div>
  );
}

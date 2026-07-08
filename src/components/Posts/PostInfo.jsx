import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";

export default function PostInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const[message,setMessage]=useState("")

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const set = await api.get(`/posts/${id}`);
        setPost(set.data);
      } catch (err) {
        setError(err.response?.data?.detail || "failed to load posts");
      }
    };
    fetchPost();
  }, [id]);

  const toggle = async () => {
    const newstatus = post.status === "published" ? "draft" : "published";
    await api.put(`/posts/${id}`, { ...post, status: newstatus });
    setPost({ ...post, status: newstatus });
  };

  const deletePost = async () => {
    await api.delete(`/posts/${id}`);
    setMessage("post is deleted")
    navigate("/posts");
  };
  if (error) return <div>{error}</div>;
  if (!post) return <div>Loading.</div>;
  const edit = user && (user.id === post.owner_id || user.role === "admin");
  return (
    <div className="auth-container">
      <h2>{post.title}</h2>
      <div className="post-details">
        <p>{post.description}</p>
        {post.image && (
          <div className="image-container">
            {" "}
            <p>Image</p>{" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
        <p>Category is {post.category}</p>
        <p>Status is {post.status}</p>
      </div>
      <div className="post-actions">
        {edit && (
          <>
            <button onClick={toggle} className="btn btn-info">
              {post.status === "published" ? "draft" : "publish"}
            </button>
            <Link to={`/posts/edit/${post.id}`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={deletePost} className="btn btn-danger">
              Delete
            </button>
          </>
        )}
        <Link to="/posts" className="btn btn-secondary">
          Back
        </Link>
      </div>
    </div>
  );
}

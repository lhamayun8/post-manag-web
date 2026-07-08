import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const[posts,setPost]=useState([])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const set = await api.get("/users/me");
        setProfile(set.data);
        const posts=await api.get("/posts/");
        setPost(posts.data);
      } catch (err) {
        setError(err.response?.data?.detail ||"failed to load profile");
      }
    };
    fetchProfile();
  }, []);
  if (!profile) {
    return <p>LOADING</p>;
  }
  const myposts=posts.filter((post)=>post.owner_id===profile.id)
  const published=myposts.filter((post)=>post.status==="published").length
  const drafts=posts.filter((post)=>post.status==="draft").length
  return (
    <div className="auth-container profile-page">
      <div className="profile-card">
        <div className="avatar">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <h2>MY PROFILE</h2>
        <div className="account-info">
          <h3>Account Details</h3>
          <p><strong>Name:</strong>{profile.name}</p>
          <p><strong>Email:</strong>{profile.email}</p>
          <p><strong>Role:</strong>{profile.role || "user"}</p>
      </div>
      <div className="posts-stats">
        <div className="stat-card">
          <h2>{myposts.length}</h2>
          <p>Total Posts</p>
        </div>
        <div className="stat-card">
          <h2>{published}</h2>
          <p>Published posts</p>
        </div>
        <div className="stat-card">
          <h2>{drafts}</h2>
          <p>Drafts</p>
        </div>
      </div>
      <div className="post-actions">
        <Link to="/profile/edit" className="btn btn-primary">
          Edit your profile
        </Link>
        <Link to="/profile/changepass" className="btn btn-info">
          Change your password
        </Link>
      </div>
    </div>
    </div>
  );
}

import React from "react";
import PostList from "../components/Posts/PostList";
import Register from "../components/Auth/Register";
import { useAuth } from "../context/Authcontext";
import { Link } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to Post Management system</h1>
        <p className="hero-description">Create and manage posts,connect with friends and interact with your community in one place.LETS START TODAY!!</p>
      {!user ? (
        <div>
          <div className="home-buttons">
            <Link to="/login" className="btn btn-primary">
              LOGIN
            </Link>
            <Link to="/register" className="btn btn-secondary">
              REGISTER
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="welcome-user">WELCOME,{user.name}</p>
          <div className="home-buttons">
            <Link to="/posts" className="btn btn-primary">
              View Posts
            </Link>
            <Link to="/posts/new" className="btn btn-success">
              Create new Post
            </Link>
            <Link to="/profile" className="btn btn-info">
              My profile
            </Link>
            {user.role === "admin" && (
              <Link to="/admin/dashboard" className="btn btn-warning">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

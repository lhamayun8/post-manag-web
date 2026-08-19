import React from "react";
import { useAuth } from "../context/Authcontext";
import { Link } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">POSTMANAGER</span>

          <h1>
            Welcome to <span>PostManager</span>
          </h1>

          <p className="hero-description">
            Create, manage, and share posts while staying connected
            with your friends and community — all in one place.
          </p>

          {!user ? (
            <div className="home-guest">
              <p className="hero-subtext">
                Join the community and start sharing today.
              </p>

              <div className="home-buttons">
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>

                <Link to="/register" className="btn btn-secondary">
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="home-user">
              <p className="welcome-user">
                Welcome back, <strong>{user.name}</strong>!
              </p>

              <p className="hero-subtext">
                What would you like to do today?
              </p>

              <div className="home-buttons">
                <Link to="/posts" className="btn btn-primary">
                  View Posts
                </Link>

                <Link to="/posts/new" className="btn btn-success">
                  Create New Post
                </Link>

                <Link to="/profile" className="btn btn-info">
                  My Profile
                </Link>

                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="btn btn-warning"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hero-decoration">
          <div className="decoration-card card-one">
            <span>💬</span>
            <div>
              <strong>Connect</strong>
              <small>with your community</small>
            </div>
          </div>

          <div className="decoration-card card-two">
            <span>📝</span>
            <div>
              <strong>Create</strong>
              <small>share your ideas</small>
            </div>
          </div>

          <div className="decoration-card card-three">
            <span>❤️</span>
            <div>
              <strong>Interact</strong>
              <small>engage with others</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
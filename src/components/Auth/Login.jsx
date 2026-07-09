import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [err, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const set = await api.post("/users/login", data);
      const token = set.data.access_token;
      const userdata = set.data.user;
      login(token, userdata);
      if (set.data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/posts");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    }
  };

  return (
    <div className="auth-container">
      <h2>LOGIN</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            name="email"
            type="email"
            placeholder="email"
            onChange={handleChange}
          ></input>
        </div>
        <div className="form-group">
          <input
            name="password"
            type="password"
            placeholder="password"
            onChange={handleChange}
          ></input>
        </div>
        <button type="submit">Login User</button>
      </form>
      {err && <p style={{ color: "orange" }}>{err}</p>}
      <p>
        Dont have an account yet?<Link to="/register">Register here</Link>
      </p>
      <p><Link to="/forgot-password">Forgot Password?</Link></p>
    </div>
  );
}

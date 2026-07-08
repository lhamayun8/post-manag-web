import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EditProfile() {
  const [data, setData] = useState({ name: "", email: "" });
  const navigate = useNavigate();
  const [err, setError] = useState("");
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const set = await api.get("/users/me");
        setData({ name: set.data.name, email: set.data.email });
      } catch (error) {
        setError("failed to load your profile");
      }
    };
    fetchProfile();
  }, []);
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const set = { name: data.name, email: data.email };
    try {
      await api.put("/users/edit", set, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate("/profile");
    } catch (error) {
      setError("can not update profile.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Edit profile </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="name"
          ></input>
          <input
            name="email"
            type="email"
            value={data.email}
            placeholder="email"
            onChange={handleChange}
          ></input>
        </div>
        <button type="submit">Save</button>
      </form>
      {err && <p style={{ color: "orange" }}>{err}</p>}
    </div>
  );
}

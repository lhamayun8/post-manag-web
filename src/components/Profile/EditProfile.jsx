import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EditProfile({setTab}) {
  const [data, setData] = useState({ name: "",email:""});
  const [err, setError] = useState("");
  const[message,setMessage]=useState("")
      const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const set = await api.get("/users/me");
        setData({ name: set.data.name,email:set.data.email});
      } catch (err) {
        setError(err.response?.data?.detail ||"Failed to load your profile");
      }
    };
    fetchProfile();
  }, []);
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("")
    setMessage("")
    const set = { name: data.name};
    try {
      await api.put("/users/edit", set, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage("Profile successfully updated!!")
      setTimeout(()=>{
        setMessage("")
        setTab("profile")
      },1000)
    } catch (err) {
      setError(err.response?.data?.detail ||"Can not update profile.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Edit profile </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
           value={data.email} disabled       
          ></input>
          <label>Name</label>
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="Your name"
          ></input>
        </div>
        <button type="submit">Save changes</button>
      </form>
                    {message && (
        <div className="message-box">
        <span>{message}</span>
        <button onClick={closemessage}>X</button>
        </div>
        )}
         {err && (
        <div className="error-box">
        <span>{err}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  );
}

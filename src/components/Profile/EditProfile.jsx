import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EditProfile() {
  const [data, setData] = useState({ name: "",email:""});
  const navigate = useNavigate();
  const [err, setError] = useState("");
  const[message,setMessage]=useState("")
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const set = await api.get("/users/me");
        setData({ name: set.data.name,email:set.data.email});
      } catch (error) {
        setError(error.response?.data?.detail ||"Failed to load your profile");
      }
    };
    fetchProfile();
  }, []);
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const set = { name: data.name};
    try {
      await api.put("/users/edit", set, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage("Profile successfully updated!!")
      setTimeout(()=>{
        navigate("/profile");
      },500)
    } catch (error) {
      setError(error.response?.data?.detail ||"Can not update profile.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Edit profile </h2>
      <p style={{color:"#d97706",fontWeight:"bold"}}>{data.email}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="name"
          ></input>
        </div>
        <button type="submit">Save</button>
      </form>
      {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
      {err && <p style={{ color: "orange" }}>{err}</p>}
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EditPassword({setTab}) {
  const [passwords, setPasswords] = useState({
    currentpass: "",
    newpass: "",
    confirmpass: "",
  });
      const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
  const [err, setError] = useState("");
  const[message,setMessage]=useState("")
  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("")
    if (passwords.newpass !== passwords.confirmpass) {
      setError("Both passwords are not the same");
      return;
    }
    try {
      const set = await api.put(
        "/users/changepass",
        { old: passwords.currentpass, new: passwords.newpass },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPasswords({ currentpass: "", newpass: "", confirmpass: "" });
      setMessage("Password updated successfully!!")
      setTimeout(()=>{
        setMessage("")
        setTab("profile")
      },500)
    } catch (err) {
      setError(err.response?.data?.detail ||"failed to update password");
    }
  };
  return (
    <div className="auth-container">
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentpass">Current password</label>
          <input
            name="currentpass"
            type="password"
            value={passwords.currentpass}
            onChange={handleChange}
          ></input>
        </div>
        <div className="form-group">
          <label htmlFor="newpass">New password</label>
          <input
            name="newpass"
            type="password"
            value={passwords.newpass}
            onChange={handleChange}
          ></input>
        </div>
        <div className="form-group">
          <label htmlFor="confirmpass">Confirm password</label>
          <input
            name="confirmpass"
            type="password"
            value={passwords.confirmpass}
            onChange={handleChange}
          ></input>
        </div>
        <button type="submit">Update Password</button>
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

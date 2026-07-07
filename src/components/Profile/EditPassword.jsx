import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function EditPassword(){
    const[passwords,setPasswords]=useState({currentpass:"",newpass:"",confirmpass:""})
    const[err,setError]=useState("")
    const navigate=useNavigate()
    const handleChange=(e)=>{
        setPasswords({...passwords,[e.target.name]:e.target.value})
    }
    const handleSubmit= async (e)=>{
        e.preventDefault();
        setError("")
        if(passwords.newpass!==passwords.confirmpass){
            setError("Both passwords are not the same")
            return;
        }
        try{
            const set=await api.put("/users/changepass",
                {old:passwords.currentpass,new:passwords.newpass},
                {headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
            setPasswords({currentpass:"",newpass:"",confirmpass:""})
            navigate("/profile")
        }catch(err){
            setError("failed to update password")
        }
    }
    return(
        <div className="auth-container">
            <h2>Change Password</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Current password</label>
                    <input name="currentpass" type="password" value={passwords.currentpass} onChange={handleChange}></input>
                </div>
                <div className="form-group">
                    <label>New password</label>
                    <input name="newpass" type="password" value={passwords.newpass} onChange={handleChange}></input>
                </div>
                <div className="form-group">
                    <label>Confirm password</label>
                    <input name="confirmpass" type="password"value={passwords.confirmpass}onChange={handleChange}></input>
                </div>
                <button type="submit">Update Password</button>
            </form>
            {err && <p style={{color:"orange"}}>{err}</p>}
        </div>
    )
    
}
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
    const[notifications,setNotifications]=useState([])
    const[error,setError]=useState("")
    const[show,setShow]=useState(false)
    const navigate=useNavigate()
    useEffect(()=>{
        loadnotif()
    },[]);
    const loadnotif=async()=>{
        try {
            const set=await api.get("/users/notifications")
            console.log(set.data)
            setNotifications(set.data)
        }
        catch(err) {
            setError(err.response?.data?.detail || "Failed to load notifications")
        }
    }
    const formatDate=(date)=>{
        return new Date(date + "Z").toLocaleString("en-PK",{timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"})
    }
    const markread=async(notif) => {
        try {
            if(!notif.is_read){
                await api.put(`/users/notifications/${notif.id}/read`)
                setNotifications(prev=>prev.map(n=>n.id===notif.id?{...n,is_read:true}:n))
            }
            if(notif.post_id){
                setShow(false)
                navigate(`/posts/${notif.post_id}`)
            }else if(notif.message.includes("friend request")){
                navigate("/friends")
            }
        }
        catch(err){
            setError(err.response?.data?.detail ||"Failed to mark notification as read")
        }
    }
    const deleteNotif = async (id,e) => {
        e.stopPropagation()
        try{
            await api.delete(`/users/notifications/${id}`);
            setNotifications(prev=>prev.filter(n=>n.id!==id))
        }catch(err ){
            setError(err.response?.data?.detail ||"Failed to delete notification");
        }
    };
    const unread=notifications.filter(n=>!n.is_read).length;
    return (
        <div className="notification-container">
            <button
                className="notification-btn"
                onClick={()=>setShow(!show)}
            >🔔{unread > 0 && (<span className="notification-badge">{unread}</span>)}
            </button>
            {show&&(
                <div className="notification-box">
                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}
                    {notifications.length === 0 ? (
                        <p className="notification-empty">
                            No notifications
                        </p>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={()=>markread(notif)}
                                className={
                                    notif.is_read
                                    ? "notification-item read"
                                    : "notification-item unread"
                                }
                            >
                                <div className="notification-content">
                                <p>
                                    {notif.message}
                                </p>
                                <small className="notification-time">
                                    {formatDate(notif.created_at)}
                                </small>
                                </div>
                                <button title="Delete notification" className="delete-notification" onClick={(e)=>deleteNotif(notif.id,e)}>🗑️</button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
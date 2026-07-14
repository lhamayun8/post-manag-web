import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function SentRequests() {
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const[requests,setRequests]=useState([])
    const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const getsentRequests=async()=>{
        try{
            const set=await api.get("/friends/sent")
            setRequests(set.data)
        }catch(err){
            setError(error.response?.data?.detail ||"failed to load sent requests");
        }
    }
    useEffect(()=>{
        getsentRequests()
    },[])
  return (
    <div className='friends-section'>
        <h2>Sent Requests</h2>
        {requests.length===0?(<p>No pending requests!!</p>):
        (<div className='users-list'>{requests.map((request)=>(
            <div className='user-card'key={request.id}>
                <div>
                    <h4>{request.name}</h4>
                    <p>{request.email}</p>
                </div>
                <button className='pending-btn' disabled>Pending</button>
            </div>
        ))}
        </div>
        )}  
              {message && (
        <div className="message-box">
        <span>{message}</span>
        <button onClick={closemessage}>X</button>
        </div>
        )}
         {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  )
}

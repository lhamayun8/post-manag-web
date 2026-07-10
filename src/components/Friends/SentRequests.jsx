import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function SentRequests() {
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const[requests,setRequests]=useState([])
    const getsentRequests=async()=>{
        try{
            const set=await api.get("/friends/sent")
            setRequests(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"failed to load sent requests");
        }
    }
    useEffect(()=>{
        getsentRequests()
    },[])
  return (
    <div className='friends-section'>
        <h2>Sent Requests</h2>
        {requests.length===0?(<p>No pending requests</p>):
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
        {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
      {error && <p style={{ color: "orange" }}>{error}</p>}    
    </div>
  )
}

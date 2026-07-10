import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function FriendRequests() {
    const[requests,setRequests]=useState([])
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const getRequests=async()=>{
        try{
            const set=await api.get("/friends/requests")
            setRequests(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"failed to load requests");
        }
    }
    useEffect(()=>{
        getRequests()
    },[])
    const acceptRequest=async(id)=>{
        try{
            await api.put(`/friends/accept/${id}`)
            setMessage("Friend request accepted!!")
            getRequests()
        }catch(err){
            setError(err.response?.data?.detail ||"failed to accept request");
        }
    }
    const rejectRequest=async(id)=>{
        try{
            await api.put(`/friends/reject/${id}`)
            setMessage("Friend request rejected ")
            getRequests()
        }catch(err){
            setError(err.response?.data?.detail ||"failed to reject request");
        }
    }
  return (
    <div className='friends-section'>
        <h2>Friend Requests</h2>
        {requests.length===0?(<p>No friend requests yet.</p>):(
            <div className='users-list'>{requests.map((request)=>(
                <div className='user-card'key={request.id}>
                    <div>
                        <h4>{request.from}</h4>
                    </div>
                    <div className='request-buttons'>
                        <button className='accept-btn' onClick={()=>acceptRequest(request.id)}>Accept</button>
                        <button className='reject-btn' onClick={()=>rejectRequest(request.id)}>Reject</button>
                    </div>
                </div>
            ))}
            </div>
        )}
      {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
      {error && <p style={{ color: "orange" }}>{error}</p>}
    </div>
  )
}

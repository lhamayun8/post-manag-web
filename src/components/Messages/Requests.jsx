import React, { useState,useEffect } from 'react'
import axios from 'axios'
export default function Requests({setTab,setconvoid,setReceiver,setreceivername,selectedconvo}) {
    const[requests,setRequests]=useState([])
    const[error,setError]=useState("")
    const closeerror=()=>{
    setError("")
    }
    async function loadRequests(){
        try{
            const set=await axios.get("http://localhost:8000/messages/requests",{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`
        }})
        setRequests(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"Failed to load requests")
        }
    }
    async function acceptrequest(id){
        try{
         await axios.put(`http://localhost:8000/messages/${id}/accept`,{},{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`   
    }})
    setRequests(prev=>prev.filter(rqst=>rqst.conversation_id!==id))
    }catch(err){
        setError(err.response?.data?.detail ||"Failed to accept request.Try again later!")
    }
}
    async function declinerequest(id){
        try{
        axios.put(`http://localhost:8000/messages/${id}/decline`,{},{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`
    }})
    setRequests(prev=>prev.filter(rqst=>rqst.conversation_id!==id))
    }catch(err){
        setError(err.response?.data?.detail ||"Failed to decline request")
    }
}
function openrequest(req){
    setconvoid(req.conversation_id)
    setReceiver(req.sender_id)
    setreceivername(req.from)
    setTab("chat")
}
useEffect(()=>{
    loadRequests()
},[])
  return (
    <div className='requests-container'>
        <h2>Message Requests</h2>
        {requests.length===0 &&<p>No message requests yet</p>}
        {requests.map(req=>(<div className='request-card' key={req.conversation_id} onClick={()=>openrequest(req)}>
            <div className='avatar'>{req.from[0].toUpperCase()}</div>
            <div className='request-info'>
                <h4>{req.from}</h4>
                <p>{req.message}</p>
            </div>
            <div className='request-buttons'>
            <button onClick={()=>acceptrequest(req.conversation_id)}>Accept</button>
            <button onClick={(e)=>{e.stopPropagation();declinerequest(req.conversation_id)}}>Decline</button>
        </div>
        </div>
        ))}
        {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  )
}

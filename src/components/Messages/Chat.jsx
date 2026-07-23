import React, { useEffect, useState,useRef} from 'react'
import axios from 'axios'
import socket from '../../socket'
export default function Chat({convoid,setconvoid,receiver,receivername,currentuserid}) {
    const[messages,setMessages]=useState([])
    const[text,setText]=useState("")
    const[error,setError]=useState("")
    const[status,setStatus]=useState(null)
    const messageend=useRef(null)
    const[deletemessage,setdeletemessage]=useState(null)
    const[showdelete,setshowdelete]=useState(false)
    const[convostatus,setconvostatus]=useState("")
      const closeerror=()=>{
    setError("")
  }
    useEffect(()=>{
      if(!convoid)
        return;
      async function loadmessages(){
        try{
          const set=await axios.get(`http://localhost:8000/messages/${convoid}`,{
            headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
          console.log(set.data)
          setMessages(set.data.messages||[])
          setStatus(set.data.user_status)
          setconvostatus(set.data.conversation_status)
          await axios.put(`http://localhost:8000/messages/${convoid}/read`,{},{
            headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
        }catch(err){
          setError(err.response?.data?.detail ||"Failed to load messages")
        }
      }
      loadmessages()
      socket.emit("joinconvo",{conversation_id:convoid});
      return()=>socket.emit("leaveconvo",{conversation_id:convoid})
},[convoid])
    useEffect(()=>{
      function handleMessage(data){
        setMessages((prev)=>{const exist=prev.find(msg=>msg.id===data.id)
          if(exist){
            return prev
          }
          return[...prev,data]
        })
      }
      socket.on("new_message",handleMessage)
      return()=>socket.off("new_message",handleMessage)
    },[])
    useEffect(()=>{
      messageend.current?.scrollIntoView({behavior:"smooth"})
    },[messages])
     const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"
    })
  }
  function ticks(m){
    if(m.sender_id!==currentuserid) 
      return null
    if(m.is_read) 
      return <span className="ticks tick-read" title="Read">✓✓</span>
    if(m.is_delivered) 
      return <span className="ticks tick-delivered" title="Delivered">✓✓</span>
    return <span className="ticks tick-sent" title="Sent">✓</span>
  }
  useEffect(()=>{
      function handleDelivered(data){
        if(data.conversation_id!==convoid) 
          return
        setMessages(prev=>prev.map(
          m=>data.message_ids.includes(m.id)?{...m,is_delivered:true}:m))
      }
      function handleRead(data){
        if(data.conversation_id!==convoid) 
          return
        setMessages(prev=>prev.map
          (m=>data.message_ids.includes(m.id)?{...m,is_read:true,is_delivered:true}:m))
      }
      socket.on("messages_delivered",handleDelivered)
      socket.on("messages_read",handleRead)
      return()=>
        {socket.off("messages_delivered",handleDelivered);socket.off("messages_read",handleRead)}
    },[convoid])
  useEffect(()=>{
    function handlestatus(data){
      if(data.user_id===receiver){
        setStatus(prev=>({...prev,is_online:data.is_online,last_seen:data.last_seen}))
      }
    }
    socket.on("status",handlestatus)
    return()=>{socket.off("status",handlestatus)}
  },[receiver])
async function send() {
    if(!text.trim())
        return;
      if(!receiver){
        setError("No receiver found")
        return;
      }
    try{
      const set=await axios.post("http://localhost:8000/messages/",{receiver_id:receiver,content:text},{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
      if(!convoid){
        setconvoid(set.data.conversation_id)
      }
      setMessages(prev=>{const exist=prev.find(m=>m.id===set.data.id)
    if(exist){
      return prev
    }
  return[...prev,set.data]
    })
      if(set.data.status==="pending"){
        setconvostatus("pending")
      }
      setText("")
    }catch(err){
      setError(err.response?.data?.detail ||"Failed to send messages")
    }
}
async  function deleteforme(){
  try{
    await axios.put(`http://localhost:8000/messages/message/${deletemessage.id}/deleteforme`,{},{headers:
    {Authorization:`Bearer ${localStorage.getItem("token")}`}})
    setMessages(prev=>prev.filter(msg=>msg.id!=deletemessage.id))
    setshowdelete(false)
    setdeletemessage(null)
  }catch(err){
    setError(err.response?.data?.detail ||"Failed to delete message for me")
  }
}
async function deleteforeveryone() {
  try{
    await axios.delete(`http://localhost:8000/messages/message/${deletemessage.id}/everyone`,{headers:
    {Authorization:`Bearer ${localStorage.getItem("token")}`}})
    setshowdelete(false)
    setdeletemessage(null)
  }catch(err){
    setError(err.response?.data?.detail ||"Failed to delete message for everyone")
  }
}
useEffect(()=>{
  function handleDelete(data){
    setMessages(prev=>prev.filter(msg=>msg.id!==data.message_id))}
    socket.on("message_deleted",handleDelete)
    return()=>socket.off("message_deleted",handleDelete)
},[])
  return (
    <div className='chat-container'>
      <div className='chat-header'>
        <div className='chat-avatar'>
          {receivername?receivername[0].toUpperCase():"?"}</div>
          <div className="chat-user">
            <h3>{status?.name ||receivername}</h3>
            {status?.is_online?<p className="online">Online</p>:<p className="offline">{status?.last_seen?`Last seen ${formatDate(status.last_seen)}`:"Offline"}</p>}
        </div>
      </div>
      <div className='chat-box'>
        {convostatus==="pending" &&(<div className='request-message'>Message request is sent.Waiting for {receivername} to accept.</div>)}
        {messages.length===0 &&(<p className='empty-chat'>No messages yet</p>)}
        {messages.map((m)=>(<div key={m.id} className={`chat-message ${m.sender_id===currentuserid ?"sent":"received"}`}>
          <div className='message-bubble'>
            <p>{m.content}</p>
            <small>{formatDate(m.created_at)} {ticks(m)}</small>
            <button title="Delete message"className='delete-notification' onClick={()=>{setdeletemessage(m);setshowdelete(true)}}>🗑️</button>
          </div>
          </div>
          ))}
          <div ref={messageend}></div>
      </div>
      <div className="chat-input">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="type a message" onKeyDown={e=>{if(e.key==="Enter") send()}}></input>
        <button onClick={send}>Send</button>
        </div>
        {showdelete &&(
          <div className='delete-popup-overlay'>
            <div className='delete-popup'>
              <button onClick={deleteforme}>Delete for me</button>
              {deletemessage?.sender_id===currentuserid&&(<button onClick={deleteforeveryone}>Delete for everyone</button>)}
              <button className='cancel-btn' onClick={()=>{setshowdelete(false);setdeletemessage(null)}}>Cancel</button>
            </div>
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

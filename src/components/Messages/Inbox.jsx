import React, { useState,useEffect} from 'react'
import axios from 'axios'
import socket from '../../socket'
export default function Inbox({setTab,setconvoid,setreceivername,setReceiver}) {
    const[messages,setMessages]=useState([])
    const[error,setError]=useState("")
    const[confirm,setconfirm]=useState(null)
    const closeerror=()=>{
    setError("")
    }
    useEffect(()=>{
      async function loadInbox(){
        try{
          const set= await axios.get(
            "http://localhost:8000/messages/inbox",{headers:{
              Authorization:`Bearer ${localStorage.getItem("token")}`,
          }});
          const chats=Array.isArray(set.data)?set.data:[]
          chats.sort((a,b)=>new Date(b.time)-new Date(a.time))
          setMessages(chats)
        }catch(err){
          setError(err.response?.data?.detail ||"Failed to load inbox")
        }
      }
      loadInbox()
    },[]);
    useEffect(()=>{
      socket.on("inbox_update",(data)=>{
      setMessages(prev=>{
        let exist=prev.find(chat=>chat.conversation_id===data.conversation_id)
        if(exist){
          return prev.map(chat=>chat.conversation_id===data.conversation_id?{
            ...chat,last_message:data.content,time:data.created_at,unread:true}:chat).sort((a,b)=>new Date(b.time)-new Date(a.time))
          }
          return[{conversation_id:data.conversation_id,user_id:data.user_id,user_name:data.user_name,last_message:data.content,time:data.created_at,unread:true},...prev]
          })
        })
        socket.on("new_conversation",(data)=>{
          setMessages(prev=>{
            let exist=prev.find(chat=>chat.conversation_id===data.conversation_id)
            if (exist){
              return prev.map(chat=>chat.conversation_id===data.conversation_id?{
            ...chat,last_message:data.content,time:data.created_at,unread:true}:chat).sort((a,b)=>new Date(b.time)-new Date(a.time))
          }
          return[{conversation_id:data.conversation_id,user_id:data.user_id,user_name:data.user_name,last_message:data.content,time:data.created_at,unread:true},...prev]
          })
        })
    return()=>{socket.off("inbox_update");socket.off("new_conversation")}
  },[])
    const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"
    })
  }
  function textshort(text){
    return text.split(" ").slice(0,4).join(" ")+"..."
  }
  async function deleteinbox(conversation_id){
    try{
      await axios.delete(`http://localhost:8000/messages/inbox/${conversation_id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}
      })
      setMessages(prev=>prev.filter(chat=>chat.conversation_id!==conversation_id))
      setconfirm(null)
    }catch(err){
      setError(err.response?.data?.detail ||"Failed to delete conversation")
    }
  }
  return (
    <div className='inbox'>
      <h2>Inbox</h2>
      {messages.length===0 &&<p>No conversation yet!!</p>}
      {messages.map((chat)=>(
        <div key={chat.conversation_id} className='conversation' onClick={()=>{setconvoid(chat.conversation_id);setReceiver(chat.user_id);setreceivername(chat.user_name);setTab("chat")}}>
            <div className="avatar">{chat.user_name?chat.user_name[0].toUpperCase():"?"}</div>
            <div className='conversation-content'>
            <div className='conversation-info'>
              <h4>Username: {chat.user_name}</h4>
              <p>{textshort(chat.last_message)}</p>
              <small>{chat.unread && <span className='unread-dot'></span>}{formatDate(chat.time)}</small>
            </div>
            </div>
            <button title="Delete chat permanently" className='delete-notification' onClick={(e)=>{e.stopPropagation();setconfirm(chat.conversation_id)}}>🗑️</button>
            </div>
      ))}
      {confirm!==null && (
          <div className='delete-popup-overlay'>
            <div className='delete-popup'>
              <p>Delete this chat?</p>
              <button onClick={()=>deleteinbox(confirm)}>Delete chat</button>
              <button className='cancel-btn' onClick={()=>setconfirm(null)}>Cancel</button>
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
  );
}

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'
export default function MyDrafts({setTab,setEditId}) {
    const[drafts,setDrafts]=useState([])
    const[error,setError]=useState("")
    const navigate=useNavigate()
    const[message,setMessage]=useState("")
          const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const getdrafts=async()=>{
        try{
            const set=await api.get("/posts/me/drafts")
            setDrafts(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"Failed to load drafts");
        }
    }

    useEffect(()=>{
        getdrafts()
    },[])
    const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi"
    })
  }
   const deletePost = async (id) => {
    const confirm=window.confirm("Are you sure you want to delete this post?")
    if(!confirm)
      return;
    try{
      await api.delete(`/posts/${id}`);
      setMessage("Post is deleted successfully!!")
      getdrafts()
        setTimeout(()=>{
            setMessage("")
        },1000)
      }catch(err){
         setError(err.response?.data?.detail ||"Failed to delete post");
      }
  };
  return (
    <div className='posts-section'>
        <h2>My Drafts</h2>
        {drafts.length===0?(
            <p>You do not have any drafts yet.</p>
        ):(
            <div className='posts-list'>{drafts.map((post)=>(
                <div className='post-card' key={post.id}>
                    <h3>Title:  {post.title}</h3>
                    {post.image && (
                        <div className="image-container">
                        {" "}
                        <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
                        </div>
                    )}
                    <div className='post-body'>
                    <p>
                        Category:{post.category}
                    </p>
                    <p>Created at:{formatDate(post.created_at)}</p>
                    <p>Status:<b>Draft</b></p>
                    <div className='post-actions'>
                        <button className='btn btn-primary' onClick={()=>{setEditId(post.id); setTab("edit")}}>Edit Draft</button>
                        <button type="button" className="btn btn-danger" onClick={()=>deletePost(post.id)}>Delete Draft</button>
                </div>
                </div>
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

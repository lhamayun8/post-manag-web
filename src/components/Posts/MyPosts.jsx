import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Link } from 'react-router-dom'
export default function MyPosts({setTab,setEditId}) {
    const[posts,setPosts]=useState([])
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
              const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const getmyposts=async()=>{
        try{
            const set=await api.get("/posts/me")
            setPosts(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"Failed to load your posts")
        }
    }
    useEffect(()=>{
        getmyposts()
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
      getmyposts()
      setTimeout(()=>{
          setTab("myposts");
        },800)
        setTimeout(()=>{
            setMessage("")
        },1000)
      }catch(err){
         setError(err.response?.data?.detail ||"Failed to delete post");
      }
  };
  return (
    <div className='posts-section'>
      <h2>My Posts</h2>
      {posts.length===0?(
        <p>You have not created any posts yet.</p>
      ):(
        <div className='posts-list'>
            {posts.map((post)=>(
                <div className='post-card' key={post.id}>
                    <h3>Title:  {post.title}</h3>
                    {post.image && (
                        <div className="image-container">
                        {" "}
                        <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
                        </div>
                    )}
                    <div className='post-body'>
                        <p>Category:{post.category}</p>
                        <p>Status:<b>{post.status}</b></p>
                        <p className='post-data'>{post.status==="published"?`Published: ${formatDate(post.published_at)}`
                        :`Created at: ${formatDate(post.created_at)}`}</p>
                        <div className='post-actions'>
                            <button className='btn btn-primary' onClick={()=>{
                                setEditId(post.id);setTab("edit")
                            }}>Edit</button>
                            <button type="button" className="btn btn-danger" onClick={()=>deletePost(post.id)}>Delete</button>
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

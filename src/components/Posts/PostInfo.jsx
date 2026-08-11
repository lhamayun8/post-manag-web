import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";

export default function PostInfo() {
  const{id}=useParams()
  const navigate=useNavigate();
  const[post,setPost]=useState(null);
  const[err,setError]=useState("")
  const{user}=useAuth()
  const[message,setMessage]=useState("")
  const[newcomment,setNewcomment]=useState("");
  const[showlikeusers,setshowlikeusers]=useState(false)
  const[comments,setComments]=useState({items:[],total:0})
  const[commentLoading,setCommentLoading]=useState(false)
  const closeerror=()=>{
    setError("")
  }
  const closemessage=()=>{
      setMessage("")
  }
  useEffect(()=>{
    const fetchPost=async()=>{
      try {
        const set=await api.get(`/posts/${id}`);
        setPost(set.data);
        setComments({items:set.data.comments||[],total:set.data.comments_total??(set.data.comments?.length||0)})
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load posts");
      }
    }
    fetchPost()
  }, [id])

  const refreshlikes=async()=>{
    try{
      const set=await api.get(`/posts/${id}`)
      setPost(prev=>prev?{...prev,likes:set.data.likes}:prev)
    }catch(err){
      setError(err.response?.data?.detail || "Failed to refresh post")
    }
  }

  const liked=!!(user && post?.likes?.users?.some(person=>person.id===user.id))

  const likepost=async()=>{
    try{
      await api.post(`/posts/${id}/like`)
      refreshlikes()
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not like post.");
    }
  }
  const togglelikes=()=>{
    if(!user){
      navigate("/login")
      return;
    }
    setshowlikeusers(prev=>!prev)
  }
  const unlikepost=async()=>{
    try{
      await api.delete(`/posts/${id}/like`)
      refreshlikes()
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not unlike post.");
    }
  }
  const addcomment=async()=>{
    if(!newcomment.trim())
      return;
    try{
      const set=await api.post(`/posts/${id}/comments`,{content:newcomment})
      const newc={
        id:set.data.id,
        content:set.data.content,
        user_id:set.data.user_id,
        username:user?.name||"You",
        created_at:new Date().toISOString(),
      }
      setComments(prev=>({items:[newc,...prev.items],total:prev.total+1}))
      setNewcomment("")
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not add comment.");
    }
  }
  const deletecomment=async(commentid)=>{
    try{
      await api.delete(`/posts/${id}/comments/${commentid}`)
      setComments(prev=>({items:prev.items.filter(c=>c.id!==commentid),total:Math.max(0,prev.total-1)}))
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not delete comment.");
    }
  }
  const loadmorecomments=async()=>{
    setCommentLoading(true)
    try{
      const set=await api.get(`/posts/${id}/comments`,{params:{skip:comments.items.length,limit:5}})
      setComments(prev=>{
        const existingIds=new Set(prev.items.map(c=>c.id))
        const newones=set.data.comments.filter(c=>!existingIds.has(c.id))
        return {items:[...prev.items,...newones],total:set.data.total}
      })
    }catch(err){
      setError(err.response?.data?.detail || "Can not load more comments.");
    }finally{
      setCommentLoading(false)
    }
  }
  const deletePost=async()=>{
    try{
      await api.delete(`/posts/${id}`);
      setMessage("Post is deleted successfully!!")
      setTimeout(()=>{
          navigate("/posts");
        },800)
      }catch(err){
        setError(err.response?.data?.detail ||"Failed to delete post")
      }
  };
      const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"
    })
  }
  if (err) return <div>{err}</div>;
  if (!post) return <div>Loading.</div>;
  const edit = user && (user.id === post.owner_id || user.role === "admin");
  return (
    <div className="auth-container">
      <h2>Title: {post.title}</h2>
      <div className="post-details">
        <p>{post.description}</p>
        {post.image && (
          <div className="image-container">
            {" "}
            <p>Image</p>{" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
        {post.category &&(<p>Category is {post.category}</p>)}
        <p><strong>Status:</strong>{post.status}</p>
        <div className="likes-section">
            <p className="likes-count" onClick={togglelikes}>{post.likes?.count||0} Likes</p>
            {showlikeusers && (<div className="likes-popup">
            {
            (post.likes?.users?.length||0)===0 ?
            <p>No likes yet</p>:
            post.likes.users.map(person=>(
              <div className="likes-user" key={person.id}>
            <div className="avatar-small">{person.username?.charAt(0).toUpperCase()}</div>
            <span>{person.username}</span>
            </div>
            ))}
          </div>
        )}
            <button className="btn btn-primary" onClick={liked ? unlikepost : likepost}>{liked ? "Unlike" : "Like"}</button>
            </div>
              <div className="comments-box">
              <h3>Comments</h3>
              {comments.items.length===0 ?<p>No comments yet</p>:
              comments.items.map(comment=>(
              <div className="comment-card" key={comment.id}>
                 <div className="comment-avatar">
                  {comment.username?.charAt(0).toUpperCase()}
                  </div>
              <div className="comment-body">
                <div className="comment-header">
              <strong>{comment.username}</strong>
              <span>{formatDate(comment.created_at)}</span>
              </div>
              <p>{comment.content}</p>{
              user && (user.id===comment.user_id || user.role==="admin")&&
              <button className="comment-delete" onClick={()=>deletecomment(comment.id)}>Delete Comment</button>}
            </div>
            </div>
            ))
          }
              {comments.items.length<comments.total && (
                <div className="see-more-container">
                  <button
                    type="button"
                    className="see-more-btn"
                    onClick={loadmorecomments}
                    disabled={commentLoading}
                  >
                    {commentLoading?"Loading...":`See more comments (${comments.total-comments.items.length})`}
                  </button>
                </div>
              )}
              <textarea placeholder="Comment..." value={newcomment} onChange={(e)=>setNewcomment(e.target.value)}/>
              <button className="btn btn-primary" onClick={addcomment}>
              Post Comment</button>
        </div>
      </div>
      <div className="post-actions">
        <Link to="/posts" className="btn btn-secondary">
          Back
        </Link>
      </div>
        {message && (
        <div className="message-box">
        <span>{message}</span>
        <button onClick={closemessage}>X</button>
        </div>
        )}
         {err && (
        <div className="error-box">
        <span>{err}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  );
}

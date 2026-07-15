import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";

export default function PostInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const[message,setMessage]=useState("")
  const[comments,setComments]=useState([])
  const[likes,setLikes]=useState(0)
  const [likeusers,setLikeusers]=useState([]);
  const [liked,setLiked]=useState(false);
  const [newcomment,setNewcomment]=useState("");
  const[showlikeusers,setshowlikeusers]=useState({})
  const closeerror=()=>{
    setError("")
  }
  const closemessage=()=>{
      setMessage("")
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const set = await api.get(`/posts/${id}`);
        setPost(set.data);
        const comset=await api.get(`/posts/${id}/comments`)
        setComments(comset.data)
        const likeset=await api.get(`/posts/${id}/likes`)
        setLikes(likeset.data.Likes)
        setLikeusers(likeset.data.users)
        if(user){setLiked(likeset.data.users.some(person=>person.id===user.id)
        )
      }
      } catch (err) {
        setError(error.response?.data?.detail || "failed to load posts");
      }
    };
    fetchPost();
  }, [id,user]);
  const likepost=async()=>{
    try{
      await api.post(`/posts/${id}/like`)
      setLiked(true)
      const set=await api.get(`/posts/${id}/likes`)
      setLikes(set.data.Likes)
      setLikeusers(set.data.users)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(error.response?.data?.detail || "Can not like post.");
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
      setLiked(false)
      const set=await api.get(`/posts/${id}/likes`)
      setLikes(set.data.Likes)
      setLikeusers(set.data.users)
    }catch(err){
      if(error.response?.status===401){
        navigate("/login")
        return;
      }
      setError(error.response?.data?.detail || "Can not unlike post.");
    }
  }
  const addcomment=async()=>{
    if(!newcomment.trim())
      return;
    try{
      await api.post(`/posts/${id}/comments`,{content:newcomment})
      const set=await api.get(`/posts/${id}/comments`)
      setComments(set.data)
      setNewcomment("")
    }catch(err){
      if(error.response?.status===401){
        navigate("/login")
        return;
      }
      setError(error.response?.data?.detail || "Can not add comment.");
    }
  }
  const deletecomment=async(commentid)=>{
    try{
      await api.delete(`/posts/${id}/comments/${commentid}`)
      setComments(comments.filter(c=>c.id!==commentid))
    }catch(err){
      if(error.response?.status===401){
        navigate("/login")
        return;
      }
      setError(error.response?.data?.detail || "Can not delete comment.");
    }
  }
    const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"
    })
  }
  const deletePost = async () => {
    await api.delete(`/posts/${id}`);
    setMessage("Post is deleted successfully!!")
    setTimeout(()=>{
        navigate("/posts");
      },800)
  };
  if (error) return <div>{error}</div>;
  if (!post) return <div>Loading.</div>;
  const edit = user && (user.id === post.owner_id || user.role === "admin");
  return (
    <div className="auth-container">
      <h2>{post.title}</h2>
      <div className="post-details">
        <p>{post.description}</p>
        {post.image && (
          <div className="image-container">
            {" "}
            <p>Image</p>{" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
        <p>Category is {post.category}</p>
        <p>Status is {post.status}</p>
        <div className="likes-section">
            <p className="likes-count" onClick={togglelikes}>{likes} Likes</p>
            {showlikeusers && (<div className="likes-popup">
            {
            likeusers.length===0 ?
            <p>No likes yet</p>:
            likeusers.map(person=>(
              <div className="likes-user" key={person.id}>
            <div className="avatar-small">{person.username.charAt(0).toUpperCase()}</div>
            <span>{person.username}</span>
            </div>
            ))}
          </div>
        )}
            <button className="btn btn-primary" onClick={liked ? unlikepost : likepost}>{liked ? "Unlike" : "Like"}</button>
            </div>
              <div className="comments-box">
              <h3>Comments</h3>
              {comments.length===0 ?<p>No comments yet</p>:
              comments.map(comment=>(
              <div className="comment-card" key={comment.id}>
              <strong>{comment.username}</strong>
              <p>{comment.content}</p>{
              user && (user.id===comment.user_id || user.role==="admin")&&
              <button onClick={()=>deletecomment(comment.id)}>Delete</button>}
            </div>
            ))
          }
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
         {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function PostList() {
  const{user}=useAuth()
  const [posts, setPost] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setError] = useState("");
  const[likes,setLikes]=useState({})
  const[comments,setComments]=useState({})
  const[newcomment,setnewComment]=useState({})
  const[showcomment,setshowcoomment]=useState({})
  const[likeusers,setlikeusers]=useState({})
  const[showlikeusers,setshowlikeusers]=useState({})
  const navigate=useNavigate()

  const closeerror=()=>{
    setError("")
  }
  useEffect(() => {
    fetchPost();
  }, [search]);
  const fetchPost = async () => {
    try {
      const set = await api.get("/posts", { params: { status:"published",search } });
      setPost(set.data);
      set.data.forEach(post => {
        alllikes(post.id)
        getcomments(post.id)
      });
    } catch (err) {
      setError(err.response?.data?.detail || "No published posts avaiable.");
    }
  };
  const alllikes=async(postid)=>{
    try{
      const set=await api.get(`/posts/${postid}/likes`)
      setLikes((prev)=>({...prev,[postid]:set.data.Likes}))
      setlikeusers((prev)=>({...prev,[postid]:set.data.users}))
    }catch(err){
       setError(err.response?.data?.detail || "Can not load likes.");
    }
  }
  const likepost=async(postid)=>{
    try{
      await api.post(`/posts/${postid}/like`)
      alllikes(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not like post.");
    }
  }
  const unlikepost=async(postid)=>{
    try{
      await api.delete(`/posts/${postid}/like`)
      alllikes(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not unlike post.");
    }
  }
  const getcomments=async(postid)=>{
    try{
      const set=await api.get(`/posts/${postid}/comments`)
      setComments(prev=>({...prev,[postid]:set.data}))
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not get comments.");
    }
  }
  const addcomment=async(postid)=>{
    if(!newcomment[postid])
      return;
    try{
      await api.post(`/posts/${postid}/comments`,{content:newcomment[postid]})
      setnewComment(prev=>({...prev,[postid]:""}))
      getcomments(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not add comment.");
    }
  }
  const deletecomment=async(postid,commentid)=>{
    try{
      await api.delete(`/posts/${postid}/comments/${commentid}`)
      getcomments(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not delete comment.");
    }
  }
  const togglecomments=(postid)=>{
    setshowcoomment(prev=>({...prev,[postid]:!prev[postid]}))
    if(!comments[postid]){
      getcomments(postid)
    }
  }
    const formatDate=(date)=>{
    return new Date(date+"Z").toLocaleString("en-PK",{
      timeZone:"Asia/Karachi",dateStyle:"medium",timeStyle:"short"
    })
  }
  const togglelikes=(postid)=>{
    if(!user){
      navigate("/login")
      return;
    }
    setshowlikeusers(prev=>({...prev,[postid]:!prev[postid]}))
  }
  return (
    <div className="posts-container">
      <h2>Published Posts</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search Posts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        ></input>
        <button onClick={fetchPost} className="btn btn-primary">
          Search
        </button>
      </div>
        {posts.length===0?<p>No Published Posts</p>
        :
        posts.map((post) => (
          <div key={post.id} className="post-card">
            <h2>Title:  {post.title}</h2>
            {post.image && (
          <div className="image-container">
            {" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
                <p>Posted by <b>{post.username}</b></p>
                <p>Published:{formatDate(post.published_at||post.created_at)}</p>
                <p>Category:{post.category}</p>
                <div className="likes-section">
                  <p className="likes-count" onClick={()=>togglelikes(post.id)}>{likes[post.id]||0} Likes</p>
                  {showlikeusers[post.id]&&(
                    <div className="likes-popup">{
                      !likeusers[post.id] ||likeusers[post.id].length===0?<p>No likes yet</p>
                        :
                        likeusers[post.id].map(person=>(
                          <div className="likes-user" key={person.id}>
                            <div className="avatar-small">{
                              person.username.charAt(0).toUpperCase()}
                              </div>
                              <span>{person.username}</span>
                              </div>
                        ))
                    }
                    </div>
                  )}
                  </div>
                <div className="post-actions">
                <button className="btn btn-primary" onClick={()=>likepost(post.id)}>Like</button>
                <button className="btn btn-danger" onClick={()=>unlikepost(post.id)}>Unlike</button>
                <button className="btn btn-secondary"onClick={()=>togglecomments(post.id)}>Comments</button>
                </div>
                {showcomment[post.id] &&(
                  <div className="comments-box">
                    <h3>Comments</h3>
                {comments[post.id]?.length===0?
                <p>No comments yet</p>:
                comments[post.id]?.map(comment=>(
                <div className="comment-card" key={comment.id}>
                  <div className="comment-avatar">
                  {comment.username.charAt(0).toUpperCase()}
                  </div>
                <div className="comment-body">
                  <div className="comment-header">
                  <strong>{comment.username}</strong>
                  <span>{formatDate(comment.created_at)}</span>
                  </div>
                  <p>{comment.content}</p>
                  {user && (user.id===comment.user_id ||user.role==="admin") && (<button className="comment-delete" onClick={()=>deletecomment(post.id,comment.id)}>Delete Comment</button>)}
                </div>
                </div>
                ))}
                <div className="write-comment"><textarea placeholder="Comment..." value={newcomment[post.id]||""} onChange={(e)=>setnewComment(prev=>({...prev,[post.id]:e.target.value}))}></textarea>
                <button className="btn btn-primary" onClick={()=>addcomment(post.id)}>Post Comment</button>
                </div>
            </div>
            )} 
    </div> 
  ))}
        {err && (
        <div className="error-box">
        <span>{err}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
  </div>
  )
}

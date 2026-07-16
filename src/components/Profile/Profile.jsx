import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link, useParams } from "react-router-dom";
import EditProfile from "./EditProfile";
import EditPassword from "./EditPassword";
import { useAuth } from "../../context/Authcontext";
import { useNavigate } from "react-router-dom";
export default function Profile() {
  const{id}=useParams()
  const{user}=useAuth()
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const[posts,setPost]=useState([])
  const[likes,setLikes]=useState({})
  const[comments,setComments]=useState({})
  const[newcomment,setnewComment]=useState({})
  const[showcomment,setshowcoomment]=useState({})
  const[likeusers,setlikeusers]=useState({})
  const[showlikeusers,setshowlikeusers]=useState({})
  const[tab,setTab]=useState("profile")
  const navigate=useNavigate()
      const closeerror=()=>{
    setError("")
    }
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
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if(id){
          const set = await api.get(`/friends/user/${id}`);
          setProfile(set.data);
          const posts=await api.get(`/posts/user/${id}/posts`);
          setPost(posts.data);
          posts.data.forEach(post=>{alllikes(post.id);getcomments(post.id)})
        }else{
          const set = await api.get("/users/me");
          setProfile(set.data);
          const posts=await api.get("/posts/me");
          setPost(posts.data);
          posts.data.forEach(post=>{alllikes(post.id);getcomments(post.id)})
        }
      } catch (err) {
        setError(err.response?.data?.detail ||"failed to load profile");
      }
    };
    fetchProfile();
  }, [id]);
  if (!profile) {
    return <p>LOADING</p>;
  }
  const myposts=posts
  const published=myposts.filter((post)=>post.status==="published").length
  const drafts=posts.filter((post)=>post.status==="draft").length
  
  return (
    <div className="posts-page">
      {!id &&(
      <div className="posts-sidebar">
        <button onClick={()=>setTab("profile")}>My Profile</button>
        <button onClick={()=>setTab("edit")}>Edit Profile</button>
        <button onClick={()=>setTab("password")}>Change Password</button>
      </div>
      )}
        <div className="posts-content">
          {tab==="profile"&&(
            <div className="profile-card">
              {id &&(<button className="btn btn-secondary back-btn" onClick={()=>window.history.back()}>Back</button>)}
              <div className="avatar">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h2>{id? `${profile.name}'s Profile`: "MY PROFILE"}</h2>
              <div className="account-info">
                <p><strong>Name:</strong>{profile.name}</p>
                {!id &&(
                  <p><strong>Email:</strong>{profile.email}</p>
                )}
                <p><strong>Role:</strong>{profile.role || "user"}</p>
              </div>
              <div className="profile-layout">
              <div className="profile-posts">
                <h3>{id ?"Posts":"My Posts"}</h3>
                {posts.length===0?(
                  <p>No posts yet</p>
                ):
                (posts.filter(post=>post.status==="published").map(post=>(
                  <div className="post-card" key={post.id}>
                    <h2>Title:{post.title}</h2>
                    {post.image &&(
                    <div className="image-container">
                      <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
                    </div>
                    )}
                    <p>Published:{formatDate(post.published_at ||post.created_at)}</p>
                    {post.category &&(<p>Category:{post.category}</p>)}
                    <div className="likes-section">
                      <p className="likes-count" onClick={()=>togglelikes(post.id)}>{likes[post.id]||0} Likes</p>
                      {showlikeusers[post.id] &&(
                        <div className="likes-popup">
                          {!likeusers[post.id]||likeusers[post.id].length===0?(
                            <p>No likes yet</p>):
                            (likeusers[post.id]?.map(person=>(
                              <div className="likes-user" key={person.id}>
                                <div className="avatar-small">
                                  {person.username.charAt(0).toUpperCase()}
                                </div>
                              <span>{person.username}</span>
                              </div>
                            ))
                            )
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
                        {comments[post.id]?.length===0?(
                          <p>No comments yet</p>):(
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
                                  {user && user.id===comment.user_id && (
                                  <button className="comment-delete" onClick={()=>deletecomment(post.id,comment.id)}>Delete Comment</button>
                                  )}
                                </div>
                              </div>
                            ))
                          )
                        }
                        <div className="write-comment"><textarea placeholder="Comment..." value={newcomment[post.id]||""} onChange={(e)=>setnewComment(prev=>({...prev,[post.id]:e.target.value}))}></textarea>
                          <button className="btn btn-primary" onClick={()=>addcomment(post.id)}>Post Comment</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
                )}
                {!id &&(
                  <div className="stat-card">
                    <h2>{posts.length}</h2>
                    <p>Total Posts</p>
                  </div>
                )}
                  <div className="stat-card">
                    <h2>{published}</h2>
                    <p>Published posts</p>
                  </div>
                {!id &&(
                  <div className="stat-card">
                    <h2>{drafts}</h2>
                    <p>Drafts</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
          {tab==="edit" &&(
            <EditProfile setTab={setTab}></EditProfile>
          )}
          {tab==="password"&&(
            <EditPassword setTab={setTab}></EditPassword>
          )}
          {error && (
            <div className="error-box">
              <span>{error}</span>
              <button onClick={closeerror}>X</button>
            </div>
          )}
        </div>
    </div>
  );
  }

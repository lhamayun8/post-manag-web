import React, { useContext, useEffect, useState } from "react";
import api from "../../services/api";
export default function MakePost({setTab}) {
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    image: "",
    tagged_users:[]
  });
  const closeerror=()=>{
    setError("")
  }
  const closemessage=()=>{
    setMessage("")
  }
  const[friends,setFriends]=useState([])
  const [error, setError] = useState("");
  const[message,setMessage]=useState("")
  useEffect(()=>{
    const fecthfriends=async()=>{
      try{
        const set=await api.get("/posts/friends")
        setFriends(set.data)
      }catch(err){
        setError(err.response?.data?.detail ||"Failed to load your friends")
      }
    }
    fecthfriends()
  },[])
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleimagechange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const read = new FileReader();
      read.onloadend = () => {
        setData({ ...data, image: read.result });
      };
      read.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("please login first");
      return;
    }
    try {
      await api.post("/posts/", data);
      setMessage("Post created successfully!!")
      setTimeout(()=>{
        setMessage("")
        setTab("myposts")
      },800)
    } catch (err) {
      if(err.response?.status===422){
        setError("Post can not be made or updated without a post title")
      }else{
      setError(err.response?.data?.detail ||"Failed to create new post.Try again");
    }
  }
  };
  return (
    <div className="auth-container create-post-form">
      <h2>Create new post</h2>
      <form onSubmit={handleSubmit}>
        <div className="create-post-fields">
          <input
            name="title"
            placeholder="title"
            onChange={handleChange}
          ></input>
          <textarea
            name="description"
            placeholder="description"
            value={data.description}
            onChange={handleChange}
          ></textarea>
          <input
            name="category"
            placeholder="category"
            value={data.category}
            onChange={handleChange}
          ></input>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleimagechange}
          ></input>
          <select name="status" onChange={handleChange} value={data.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <label>Tag Friends</label>
          <select multiple value={data.tagged_users} onChange={(e)=>setData({...data,tagged_users:[...e.target.selectedOptions].map(option=>Number(option.value))})}
          >{friends.map(friend=>(
          <option key={friend.id} value={friend.id}>
            {friend.name}</option>
          ))}</select>
        </div>
        <button type="submit">Create Post</button>
      </form>
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

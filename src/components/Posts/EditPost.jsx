import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

export default function EditPost({id,setTab}) {
  const [err, setError] = useState("");
  const[message,setMessage]=useState("")
  const[friends,setFriends]=useState([])
      const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    image: "",
    tagged_users:[]
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first");
      return;
    }
    try {
      await api.put(`/posts/${id}`, data);
      setMessage("Post is updated successfully!!")
      setTimeout(()=>{
         setTab("myposts")
      },1000)
    } catch (err) {
      setError("Can not update post.Try again later");
      console.error(err);
    }
  };
  const handleimagechange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setError("Image size exceed. It must be less than 500Kb");
        return;
      }
      const read = new FileReader();
      read.onloadend = () => {
        setData({ ...data, image: read.result });
      };
      read.readAsDataURL(file);
    }
  };
  const handleChange = (e) => {
    if (e.target.name === "image") {
      setData({ ...data, image: e.target.files[0] });
    } else {
      setData({ ...data, [e.target.name]: e.target.value });
    }
  };
  useEffect(() => {
    const fecthfriends=async()=>{
      try{
        const set=await api.get("/posts/friends")
        setFriends(set.data)
      }catch(err){
        setError("Failed to fetch tagged users")
      }
    }
    fecthfriends()
    const fetchpost = async () => {
      try {
        const set = await api.get(`/posts/${id}`);
        setData({
          title: set.data.title,
          description: set.data.description,
          category: set.data.category,
          status: set.data.status,
          image: set.data.image || "",
          tagged_users:set.data.tagged_users.map(tag=>tag.id)
        });
      } catch (error) {
        setError("failed to load post");
      }
    };
    fetchpost();
  }, [id]);
  return (
    <div className="auth-container">
      <h2>Edit Post</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Post Title</label>
          <input
            id="title"
            name="title"
            value={data.title}
            onChange={handleChange}
            placeholder="Enter title here"
          ></input>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={data.description}
            onChange={handleChange}
            placeholder="Description"
          ></textarea>
          <label htmlFor="category">Category</label>
          <input
            name="category"
            value={data.category}
            onChange={handleChange}
            placeholder="Example:Technology,etc"
          ></input>
          <label htmlFor="status">Post Status</label>
          <select id="status" name="status" value={data.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <label>Tag Friends</label>
          <select multiple value={data.tagged_users} onChange={(e)=>setData({...data,tagged_users:[...e.target.selectedOptions].map(option=>Number(option.value))})}
          >{friends.map(friend=>(
          <option key={friend.id} value={friend.id}>
            {friend.name}</option>
          ))}</select>
          {data.image && (
            <div className="image-preview">
              <p>New Image</p>
              <div className="image-box">
                <img src={data.image} alt="Post Preview" />
              </div>
            </div>
          )}
          <label htmlFor="image">Upload new image</label>
          <input
            id="image"
            type="file"
            name="image"
            accept="image/*"
            onChange={handleimagechange}
          ></input>
        </div>
        <button type="submit" className="btn btn-primary">Update</button>
      </form>
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

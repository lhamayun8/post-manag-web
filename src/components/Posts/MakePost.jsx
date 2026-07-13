import React, { useContext, useState } from "react";
import api from "../../services/api";
export default function MakePost({setTab}) {
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    image: "",
  });
        const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
  const [error, setError] = useState("");
  const[message,setMessage]=useState("")
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const handleimagechange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setError("image size exceed. it must be less than 500Kb");
        return;
      }
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
      setError(err.response?.data?.detail ||"failed to create new post.try again");
      console.error(err);
    }
  };
  return (
    <div className="auth-container">
      <h2>Create new post</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
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

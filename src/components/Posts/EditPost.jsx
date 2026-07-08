import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [err, setError] = useState("");
  const[message,setMessage]=useState("")
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    image: "",
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
         navigate(`/posts/${id}`);
      },2500)
    } catch (err) {
      setError("can not update post.try again later");
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
        setMessage("Image updated successfully!!")
      };
      read.readAsDataURL(file);
    }
  };
  const handleChange = (e) => {
    if(e.target.name==="status"){
      setMessage("Post status is updated!!")
    }
    if (e.target.name === "image") {
      setData({ ...data, image: e.target.files[0] });
    } else {
      setData({ ...data, [e.target.name]: e.target.value });
    }
  };
  useEffect(() => {
    const fetchpost = async () => {
      try {
        const set = await api.get(`/posts/${id}`);
        setData({
          title: set.data.title,
          description: set.data.description,
          category: set.data.category,
          status: set.data.status,
          image: set.data.image || "",
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
          <input
            name="title"
            value={data.title}
            onChange={handleChange}
          ></input>
          <textarea
            name="description"
            value={data.description}
            onChange={handleChange}
          ></textarea>
          <input
            name="category"
            value={data.category}
            onChange={handleChange}
          ></input>
          <select name="status" value={data.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {data.image && (
            <div className="image-preview">
              <p>New Image</p>
              <div className="image-box">
                <img src={data.image} alt="Post Preview" />
              </div>
            </div>
          )}
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleimagechange}
          ></input>
        </div>
        <button type="submit">Update</button>
      </form>
      {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
      {err && <p style={{color:"red",fontWeight:"bold"}}>{err}</p>}
    </div>
  );
}

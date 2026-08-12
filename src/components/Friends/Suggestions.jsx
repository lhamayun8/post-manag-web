import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function Suggestions() {
  const [users, setUsers] = useState([]);
  const [err, setError] = useState();
  const [message, setMessage] = useState("");
  useEffect(() => {
    loadsuggestions();
  }, []);
  const closeerror = () => {
    setError("");
  };
  const closemessage = () => {
    setMessage("");
  };
  async function loadsuggestions() {
    try {
      const set = await api.get("/suggestions/");
      setUsers(set.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Can not load suggestions.");
    }
  }
  async function sendRequest(id) {
    try {
      await api.post(`/friends/request/${id}`);
      loadsuggestions();
      setMessage("Friend request sent");
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot send request");
    }
  }
  return (
    <div className="friends-section">
      <h2>People You May Know</h2>
      {users.length === 0 ? (
        <p>No friend suggestions</p>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div className="user-card" key={user.id}>
              <div className="user-info">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h4>{user.name}</h4>
                  <p>{user.mutual_friends} mutual friends</p>
                </div>
              </div>
              <div className="friend-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => sendRequest(user.id)}
                >
                  Add Friend
                </button>
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
      {err && (
        <div className="error-box">
          <span>{err}</span>
          <button onClick={closeerror}>X</button>
        </div>
      )}
    </div>
  );
}

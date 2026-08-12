import React, { useEffect, useState } from "react";
import axios from "axios";
import socket from "../../socket";

export default function Messages({
  setTab,
  setconvoid,
  setreceivername,
  setReceiver,
}) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const loadInbox = async () => {
    try {
      const set = await axios.get("http://localhost:8000/messages/inbox", {
        headers,
      });
      const chats = Array.isArray(set.data) ? set.data : [];
      chats.sort((a, b) => new Date(b.time) - new Date(a.time));
      setMessages(chats);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load inbox");
    }
  };
  useEffect(() => {
    loadInbox();
  }, []);
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.trim() === "") {
        setUsers([]);
        return;
      }
      try {
        setLoadingSearch(true);
        const set = await axios.get("http://localhost:8000/messages/search", {
          params: { find: search.trim() },
          headers,
        });
        setUsers(set.data);
      } catch (err) {
        setUsers([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);
  const startChat = async (user) => {
    try {
      const set = await axios.get("http://localhost:8000/messages/inbox", {
        headers,
      });
      const existingChat = set.data.find((chat) => chat.user_id === user.id);
      setReceiver(user.id);
      setreceivername(user.name);
      if (existingChat) {
        setconvoid(existingChat.conversation_id);
      } else {
        setconvoid(null);
      }
      setTab("chat");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load old chats");
    }
  };
  const openConversation = (chat) => {
    setconvoid(chat.conversation_id);
    setReceiver(chat.user_id);
    setreceivername(chat.user_name);
    setTab("chat");
  };

  const deleteInbox = async (conversationId) => {
    try {
      await axios.delete(
        `http://localhost:8000/messages/inbox/${conversationId}`,
        { headers },
      );
      setMessages((prev) =>
        prev.filter((chat) => chat.conversation_id !== conversationId),
      );
      setConfirm(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete conversation");
    }
  };

  useEffect(() => {
    socket.on("inbox_update", (data) => {
      setMessages((prev) => {
        const exists = prev.find(
          (chat) => chat.conversation_id === data.conversation_id,
        );
        if (exists) {
          return prev
            .map((chat) =>
              chat.conversation_id === data.conversation_id
                ? {
                    ...chat,
                    last_message: data.content,
                    time: data.created_at,
                    unread: true,
                  }
                : chat,
            )
            .sort((a, b) => new Date(b.time) - new Date(a.time));
        }
        return [
          {
            conversation_id: data.conversation_id,
            user_id: data.user_id,
            user_name: data.user_name,
            last_message: data.content,
            time: data.created_at,
            unread: true,
          },
          ...prev,
        ];
      });
    });
    socket.on("new_conversation", (data) => {
      setMessages((prev) => {
        const exists = prev.find(
          (chat) => chat.conversation_id === data.conversation_id,
        );
        if (exists) {
          return prev
            .map((chat) =>
              chat.conversation_id === data.conversation_id
                ? {
                    ...chat,
                    last_message: data.content,
                    time: data.created_at,
                    unread: true,
                  }
                : chat,
            )
            .sort((a, b) => new Date(b.time) - new Date(a.time));
        }
        return [
          {
            conversation_id: data.conversation_id,
            user_id: data.user_id,
            user_name: data.user_name,
            last_message: data.content,
            time: data.created_at,
            unread: true,
          },
          ...prev,
        ];
      });
    });
    return () => {
      socket.off("inbox_update");
      socket.off("new_conversation");
    };
  }, []);
  const formatDate = (date) => {
    return new Date(date + "Z").toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
  const textShort = (text) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= 4) {
      return text;
    }
    return words.slice(0, 4).join(" ") + "...";
  };
  const closeError = () => {
    setError("");
  };
  return (
    <div className="new-message-container">
      <h2>Inbox</h2>
      <input
        placeholder="search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loadingSearch && <p>Searching...</p>}
      {users.map((user) => (
        <div
          key={user.id}
          className="user-card"
          onClick={() => startChat(user)}
        >
          <div className="user-avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <h4>{user.name}</h4>
            <p>{user.email}</p>
          </div>
        </div>
      ))}
      {search.trim() === "" && (
        <>
          {messages.length === 0 && <p>No conversation yet!</p>}

          {messages.map((chat) => (
            <div
              key={chat.conversation_id}
              className="conversation"
              onClick={() => openConversation(chat)}
            >
              <div className="avatar-small">
                {chat.user_name ? chat.user_name[0].toUpperCase() : "?"}
              </div>
              <div className="conversation-content">
                <div className="conversation-info">
                  <h4>{chat.user_name}</h4>
                  <p>{textShort(chat.last_message)} </p>
                  <small>
                    {chat.unread && <span className="unread-dot"></span>}

                    {formatDate(chat.time)}
                  </small>
                </div>
              </div>
              <button
                title="Delete chat permanently"
                className="delete-notification"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirm(chat.conversation_id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </>
      )}
      {confirm !== null && (
        <div className="delete-popup-overlay">
          <div className="delete-popup">
            <p>Delete this chat?</p>
            <button onClick={() => deleteInbox(confirm)}>Delete chat</button>
            <button className="cancel-btn" onClick={() => setConfirm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="error-box">
          <span>{error}</span>
          <button onClick={closeError}>X</button>
        </div>
      )}
    </div>
  );
}

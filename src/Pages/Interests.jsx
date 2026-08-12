import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Interests() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [interest, setInterest] = useState([]);
  const [err, setError] = useState("");
  const navigate = useNavigate();
  const closeerror = () => {
    setError("");
  };
  const closemessage = () => {
    setMessage("");
    navigate("/posts");
  };

  const fetchcategory = async () => {
    try {
      const set = await api.get("/posts/categories");
      setCategories(set.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to fetch categories");
    }
  };

  const fetchinterest = async () => {
    try {
      const set = await api.get("/users/interests");
      setInterest(set.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to fetch user interest");
    }
  };
  useEffect(() => {
    const loaddata = async () => {
      const categories = await api.get("/posts/categories");
      const normalizedCategories = [
        ...new Set(
          categories.data
            .filter((category) => category && category.trim() !== "")
            .map((category) => category.trim().toLowerCase())
            .filter((category) => category !== "2"),
        ),
      ];
      setCategories(normalizedCategories);
      const interests = await api.get("/users/interests");
      const normalizedInterests = [
        ...new Set(
          interests.data
            .filter((item) => item && item.trim() !== "")
            .map((item) => item.trim().toLowerCase()),
        ),
      ];
      if (normalizedInterests.length > 0) {
        navigate("/posts");
        return;
      }
      setInterest(normalizedInterests);
    };
    loaddata();
  }, [navigate]);
  const toggleinterest = (category) => {
    const normalizedCategory = category.trim().toLowerCase();
    if (interest.includes(normalizedCategory)) {
      setInterest(interest.filter((item) => item !== normalizedCategory));
    } else {
      setInterest([...interest, normalizedCategory]);
    }
  };
  const saveinterest = async () => {
    try {
      setLoading(true);
      const set = await api.post("/users/interests", { interests: interest });
      setMessage("Your interest is saved!!");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save user interest");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="interest-overlay">
      <div className="interest-container">
        <h2>Select Your Interests</h2>
        <p>Choose categories you like so we can recommend posts for you.</p>
        <div className="interest-grid">
          {categories
            .filter((c) => c && c.trim() !== "")
            .map((category) => (
              <label key={category} className="interest-card">
                <input
                  type="checkbox"
                  checked={interest.includes(category)}
                  onChange={() => toggleinterest(category)}
                />
                <span>{category}</span>
              </label>
            ))}
        </div>

        <button
          onClick={saveinterest}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Saving..." : "Save Interests"}
        </button>
        {message && (
          <div className="message-box">
            <span>{message}</span>
            <button onClick={closemessage}>✕</button>
          </div>
        )}

        {err && (
          <div className="error-box">
            <span>{err}</span>
            <button onClick={closeerror}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

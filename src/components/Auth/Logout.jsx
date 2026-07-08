import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  useEffect(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);
  return (
    <div className="loading-container">
      <p>Logging you out. Please wait</p>
    </div>
  );
}

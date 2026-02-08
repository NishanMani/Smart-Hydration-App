import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import profile from "../assets/profile.png";

const Dropdown = () => {
  const [open, setOpen] = useState(false);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dropdown">
      <img src={profile} className="profile-icon" onClick={() => setOpen(!open)}/>

      {open && (
        <div className="dropdown-menu">
          <div onClick={() => navigate("/profile")} style={{ color: "red", cursor: "pointer" }}>Profile</div>

          <div onClick={logout} style={{ color: "red", cursor: "pointer" }}>Logout</div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
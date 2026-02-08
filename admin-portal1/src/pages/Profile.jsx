import { useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/common.css";

const Profile = () => {
  const { state } = useLocation();
  const { user, dispatch } = useContext(AuthContext);

  const profileData = state || user;

  const [form, setForm] = useState({
    name: profileData.name,
    email: profileData.email,
    role: profileData.role,
  });

  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "UPDATE_USER", payload: form });
    setSuccess(true);
  };

  return (
    <div className="profile">
      <div className="content">
        <h2>Profile</h2>

        {success && <p className="success">Profile updated successfully</p>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <select name="role" value={form.role} onChange={handleChange}>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
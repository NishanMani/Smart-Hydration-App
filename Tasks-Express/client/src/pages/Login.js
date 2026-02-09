import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    setError("All fields are required");
    return;
  }

  try {
    const res = await API.post("/users/login", {
      email,
      password,
    });

    const { accessToken, user } = res.data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user)); //loc store cant store objects, so we convert to string

    if (user.role === "user") {
      navigate("/profile");
    } else {
      navigate("/users");
    }

  } catch (err) {
    setError(err.response?.data?.message || "Login failed");
  }
};
  const movetoRegister = () => {
      navigate("/register");
  };

  return (
    <div className="auth-container">
        <div className="auth-box">
          <h2>Login</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Login</button>
          </form>
        </div>
        <button className="register-btn" onClick={movetoRegister} >Register</button>

    </div>
  );
}

export default Login;
  
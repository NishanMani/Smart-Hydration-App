import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fakeLogin } from "../services/authService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    const user = fakeLogin(email, password);

    if (user) {
      dispatch({ type: "LOGIN", payload: user });
      navigate("/");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
  <div className="login-page">
    <div className="login-box">
      <h2>Login</h2>

      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
    </div>
  </div>
);
};

export default Login;
import { useState } from "react";
import API from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const registerUser = async () => {
    try {
      await API.post("/auth/register", { name, email, password });
      alert("Registered successfully");
    } catch (err) {
      setError(err.response.data.message);
    }
  };

  return (
    <div className="auth-container">
        <div className="auth-box">
            <h2>Register</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
            <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={registerUser}>Register</button>
        </div>
    </div>
  );
}

export default Register;

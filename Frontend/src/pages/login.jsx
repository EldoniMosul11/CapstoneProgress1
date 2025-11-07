import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png"; // pastikan kamu punya file ini di src/assets/logo.png
import ceklis from "../assets/ceklis.svg"; // ikon tombol login

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Login gagal!");
      console.error(err.response?.data || err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(#FFF825, #FFB10A)",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div style={{ width: "60%", justifySelf: "center", alignItems: "center" }}>
        <div
          style={{
            backgroundColor: "#FEF8C1",
            borderRadius: "100%",
            width: "100px",
            margin: "0 auto",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.15)",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ display: "block", margin: "0 auto", marginBottom: "-40px", width: "100px" }}
          />
        </div>

        <div
          style={{
            background: "#FEF8C1",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.15)",
            width: "100%",
            maxWidth: "400px",
            justifySelf: "center",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "25px",
                fontWeight: "900",
                color: "#000",
                textShadow:
                  "2px 2px 0 #fff, -2px 2px 0 #fff, 2px -2px 0 #fff, -2px -2px 0 #fff, 0 0 15px #3f3a09",
              }}
            >
              KEMBAR BAROKAH
            </h1>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="username" style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#000000",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <img src={ceklis} alt="ceklis" style={{ width: "18px" }} />
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

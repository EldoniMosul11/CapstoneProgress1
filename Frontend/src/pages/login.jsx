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
    <div className="flex justify-center items-center bg-gradient-radial from-yellow-400 to-orange-400 w-screen h-screen">
      <div className="w-3/5">
        <div className="bg-yellow-100 rounded-full w-24 mx-auto shadow-2xl">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto -mb-10 w-24"
          />
        </div>

        <div className="bg-yellow-100 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0_white,-2px_2px_0_white,2px_-2px_0_white,-2px_-2px_0_white,0_0_15px_#3f3a09]">
              KEMBAR BAROKAH
            </h1>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2 text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-base"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-black text-white rounded text-base cursor-pointer flex justify-center items-center gap-2.5"
            >
              <img src={ceklis} alt="ceklis" className="w-4.5" />
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; 

export default function Navbar({ username }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
  <nav className="fixed top-0 left-0 w-full flex items-center justify-between bg-[#FFC63C] px-6 py-3 shadow-md rounded-md font-[Poppins] z-50">
    <a href="/">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-12 h-12 rounded-md bg-transparent" />
        <span className="font-semibold text-[#3b2f00] leading-tight">
          Kembar<br />Barokah
        </span>
      </div>
    </a>

    <ul className="hidden md:flex gap-8 list-none">
      <li><a href="/dashboard" className="text-[#222] font-semibold hover:text-black hover:underline">Beranda</a></li>
      <li><a href="/menu-produk" className="text-[#222] font-medium hover:text-black hover:underline">Produk</a></li>
      <li><a href="/auditdata" className="text-[#222] font-medium hover:text-black hover:underline">Audit Data</a></li>
      <li><a href="/dashboardPrediksi" className="text-[#222] font-medium hover:text-black hover:underline">Dashboard Prediksi</a></li>
    </ul>

    <button onClick={handleLogout} className="flex items-center gap-2 bg-[#FFB300] text-[#222] border border-white rounded-lg px-4 py-1.5 font-medium hover:bg-[#ffce4d] transition-all">
      <i className="fa fa-user"></i> {username}
    </button>
  </nav>
  );
}

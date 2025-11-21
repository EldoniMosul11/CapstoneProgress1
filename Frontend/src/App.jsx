import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import MenuProduk from "./pages/menuProduk";
import AuditData from "./pages/auditData";
import Navbar from "./layout/navbar";
import api from "./api";

// testing
import DetailProduk from "./pages/detailProduk";
import EditProduk from "./pages/editProduk";
import InputProduk from "./pages/tambahProduk";
import InputPemasukan from "./pages/inputPemasukan";
import InputPengeluaran from "./pages/inputPengeluaran";
import EditPemasukan from "./pages/editPemasukan";
import EditPengeluaran from "./pages/editPengeluaran";
import DashboardPrediksi from "./pages/dashboardPrediksi";

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  return (
    <>
      {user && <Navbar username={user.username} />}
      <div style={{ paddingTop: user ? '70px' : '0' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu-produk" element={<MenuProduk />} /> 
          <Route path="/auditdata" element={<AuditData />} />
          <Route path="/detailProduk/:id" element={<DetailProduk />} />
          <Route path="/produk/edit/:id" element={<EditProduk />} />
          <Route path="/produk/input" element={<InputProduk />} />
          <Route path="/auditdata/tambah-pemasukan" element={<InputPemasukan />} />
          <Route path="/auditdata/tambah-pengeluaran" element={<InputPengeluaran />} />
          <Route path="/audit/edit/:id" element={<EditPemasukan />} />
          <Route path="/audit/edit-pengeluaran/:id" element={<EditPengeluaran />} />
          <Route path="/dashboardprediksi" element={<DashboardPrediksi />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

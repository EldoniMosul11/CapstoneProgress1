 // AuditData.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import searchIcon from "../assets/search.svg";
import garis from "../assets/garis.svg";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";
import pemasukan from "../assets/pemasukan.svg";
import pengeluaran from "../assets/pengeluaran.svg";
import profit from "../assets/profit.svg";

// Function to check if date is in current month (any year)
const isInCurrentMonth = (dateInput) => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based

  let date;
  if (typeof dateInput === 'string') {
    // Handle ISO date strings like "2025-11-15T17:00:00.000Z"
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return false;
  }

  // Check if month matches current month (ignore year)
  return date.getMonth() === currentMonth;
};

export default function AuditData() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pemasukan");
  const [searchTerm, setSearchTerm] = useState("");
  const [auditData, setAuditData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState({
    totalPendapatan: 0,
    totalPengeluaran: 0,
    totalPenjualan: 0
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    fetchAuditData();
    // Set up interval to refresh data every day at midnight (or when month changes)
    const checkMonthChange = () => {
      const now = new Date().getMonth();
      if (now !== currentMonth) {
        setCurrentMonth(now);
        fetchAuditData(); // Refresh data when month changes
      }
    };

    // Check every hour for month change
    const interval = setInterval(checkMonthChange, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [currentMonth]);

  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditData(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching audit data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = auditData.filter(item => {
      const sumber = item.produk ? item.produk.nama_produk : (item.sumber_pengeluaran || '');
      const matchesSearch = sumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "pemasukan" ? item.jenis_transaksi === "penjualan" : item.jenis_transaksi === "pengeluaran";
      const matchesMonth = isInCurrentMonth(item.tanggal);
      return matchesSearch && matchesTab && matchesMonth;
    });
    setFilteredData(filtered);
  }, [searchTerm, activeTab, auditData, currentMonth]);

  useEffect(() => {
    // Calculate monthly summary from all audit data (current month only, regardless of tab)
    const monthlyData = auditData.filter(item => isInCurrentMonth(item.tanggal));
    const monthlyPemasukan = monthlyData.filter(item => item.jenis_transaksi === 'penjualan');
    const monthlyPengeluaran = monthlyData.filter(item => item.jenis_transaksi === 'pengeluaran');

    const totalPendapatan = monthlyPemasukan.reduce((sum, item) => sum + (Number(item.total_pendapatan) || 0), 0);
    const totalPengeluaran = monthlyPengeluaran.reduce((sum, item) => sum + (Number(item.total_pendapatan) || 0), 0);
    const totalPenjualan = totalPendapatan - totalPengeluaran;

    setMonthlySummary({
      totalPendapatan,
      totalPengeluaran,
      totalPenjualan
    });
  }, [auditData, currentMonth]);

  const handleDeleteAudit = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data audit ini?")) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/audit/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAuditData(); // Refresh data after deletion
      } catch (error) {
        console.error("Error deleting audit data:", error);
        alert("Gagal menghapus data audit");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditAudit = (id) => {
    // Navigate to edit audit page based on transaction type
    const auditItem = auditData.find(item => item.id === id);
    if (auditItem) {
      const path = auditItem.jenis_transaksi === 'penjualan' ? `/audit/edit/${id}` : `/audit/edit-pengeluaran/${id}`;
      navigate(path);
    }
  };

  const handleAdd = () => {
    const path = activeTab === "pemasukan" ? "/auditdata/tambah-pemasukan" : "/auditdata/tambah-pengeluaran";
    navigate(path);
  };



  return (
    <div className="min-h-screen bg-gray-100 font-poppins">


      {/* Welcome Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
          <h1 className="text-2xl font-bold text-red-900 ml-10 mr-10">
            Audit Data
          </h1>
        <img src={garis} alt="" className="w-[40%]" />
       </div>

      {/* Monthly Summary Cards */}
      <div className="mt-5 flex justify-center gap-8 flex-wrap">
        {[
          { title: "Total Pendapatan (Bulan)", color: "text-green-600", value: formatCurrency(monthlySummary.totalPendapatan), icon: pemasukan },
          { title: "Total Pengeluaran (Bulan)", color: "text-red-600", value: formatCurrency(monthlySummary.totalPengeluaran), icon: pengeluaran },
          { title: "Total Penghasilan (Bulan)", color: "text-blue-500", value: formatCurrency(monthlySummary.totalPenjualan), icon: profit },
        ].map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white shadow-md hover:shadow-lg transition rounded-xl p-4 w-72"
          >
            <img src={card.icon} alt="" className="w-10" />
            <div>
              <p className={`text-sm font-semibold ${card.color}`}>{card.title}</p>
              <h2 className="text-lg font-bold text-gray-800">{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mt-8">
        <div className="bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setActiveTab("pemasukan")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "pemasukan"
                ? "bg-green-500 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setActiveTab("pengeluaran")}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "pengeluaran"
                ? "bg-red-500 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex justify-center mt-6">
        <div className="relative w-full max-w-2xl mx-4">
          <input
            type="text"
            placeholder="Cari data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-full px-4 py-2 pr-12 w-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="absolute right-0 top-0 h-full w-12 px-3 bg-black rounded-full flex items-center justify-center">
            <img
              src={searchIcon}
              alt="Search"
              className="w-5 h-5"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-6 mx-auto w-[95%] md:w-[90%] max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {activeTab === "pemasukan" ? "Data Pemasukan" : "Data Pengeluaran"}
          </h2>
          <button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            +
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Pcs</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Sumber</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Harga</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Satuan</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Jumlah</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">DateTime</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Total</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {item.produk ? item.produk.nama_produk : item.sumber_pengeluaran}
                  </td>
                  <td className="py-3 px-4">{formatCurrency(item.harga_satuan)}</td>
                  <td className="py-3 px-4">{item.produk ? item.produk.unit : item.satuan}</td>
                  <td className="py-3 px-4">{item.jumlah}</td>
                  <td className="py-3 px-4">{formatDate(item.tanggal)}</td>
                  <td className={`py-3 px-4 font-semibold ${
                    item.jenis_transaksi === 'penjualan' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.jenis_transaksi === 'penjualan' ? '+' : '-'}{formatCurrency(item.total_pendapatan)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleEditAudit(item.id)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      <img src={editIcon} alt="Edit" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAudit(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data yang ditemukan
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
  
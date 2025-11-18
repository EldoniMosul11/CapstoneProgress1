// AuditData.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import searchIcon from "../assets/search.svg";
import garis from "../assets/garis.svg";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";
// import pemasukan from "../assets/pemasukan.svg";
// import pengeluaran from "../assets/pengeluaran.svg";
// import profit from "../assets/profit.svg";

export default function AuditData() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pemasukan");
  const [searchTerm, setSearchTerm] = useState("");
  const [auditData, setAuditData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

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
      return matchesSearch && matchesTab;
    });
    setFilteredData(filtered);
  }, [searchTerm, activeTab, auditData]);

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
      <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-6 mx-auto w-[95%] md:w-[90%] max-w-6xl mb-8">
        {/* Header Tabel & Tombol Tambah */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold text-gray-800 border-l-4 pl-3 ${
            activeTab === "pemasukan" ? "border-green-500" : "border-red-500"
          }`}>
            {activeTab === "pemasukan" ? "Data Pemasukan" : "Data Pengeluaran"}
          </h2>
          <button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
          >
            +
          </button>
        </div>

        {/* --- AREA SCROLLABLE TABEL --- */}
        <div className="overflow-x-auto overflow-y-auto max-h-[700px] border rounded-lg relative">
          <table className="w-full text-sm text-center border-collapse relative">
            
            {/* Header Sticky */}
            <thead className="sticky top-0 z-10 bg-gray-100 text-gray-600 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold border-b">No</th>
                <th className="py-3 px-4 font-semibold border-b">Sumber</th>
                <th className="py-3 px-4 font-semibold border-b">Harga</th>
                <th className="py-3 px-4 font-semibold border-b">Satuan</th>
                <th className="py-3 px-4 font-semibold border-b">Jumlah</th>
                <th className="py-3 px-4 font-semibold border-b">DateTime</th>
                <th className="py-3 px-4 font-semibold border-b">Total</th>
                <th className="py-3 px-4 font-semibold border-b">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {item.produk ? item.produk.nama_produk : item.sumber_pengeluaran}
                  </td>
                  <td className="py-3 px-4">{formatCurrency(item.harga_satuan)}</td>
                  <td className="py-3 px-4">{item.produk ? item.produk.unit : (item.satuan || "Pcs")}</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{item.jumlah}</td> {/* Bold jumlah biar jelas */}
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.tanggal)}</td> {/* No Wrap tanggal */}
                  <td className={`py-3 px-4 font-semibold whitespace-nowrap ${
                    item.jenis_transaksi === 'penjualan' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.jenis_transaksi === 'penjualan' ? '+' : '-'}{formatCurrency(item.total_pendapatan)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleEditAudit(item.id)}
                      className="text-blue-500 hover:text-blue-700 mr-3 transition-transform hover:scale-110"
                    >
                      <img src={editIcon} alt="Edit" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAudit(item.id)}
                      className="text-red-500 hover:text-red-700 transition-transform hover:scale-110"
                    >
                      <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-gray-50">
              <p className="text-lg">Tidak ada data yang ditemukan</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
  
// DashboardPrediksi.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/navbar";
import api from "../api";
import searchIcon from "../assets/search.svg";
import pemasukan from "../assets/pemasukan.svg";
import pengeluaran from "../assets/pengeluaran.svg";
import profit from "../assets/profit.svg";

// Data dummy untuk grafik prediksi
const prediksiData = {
  labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 1", "Minggu 2"],
  values: [15000000, 25000000, 18000000, 32000000, 28000000, 35000000]
};

// Data dummy untuk grafik penjualan
const penjualanData = {
  labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 1", "Minggu 2"],
  values: [12000000, 18000000, 15000000, 22000000, 19000000, 25000000]
};

// Data dummy untuk tabel produk
const produkData = [
  {
    id: 1,
    produk: "Kerupuk Kulit Pedas",
    harga: "Rp 7.500",
    satuan: "Pcs",
    jumlah: 500,
    datetime: "28 Jan, 12.30 AM",
    pendapatan: "Rp 3.750.000",
    perubahan: "-Rp 800.000",
    trend: "down"
  },
  {
    id: 2,
    produk: "Pangsit Bawang Asin",
    harga: "Rp 6.000",
    satuan: "Pcs",
    jumlah: 400,
    datetime: "25 Jan, 10.40 PM",
    pendapatan: "Rp 2.400.000",
    perubahan: "+Rp 800.000",
    trend: "up"
  },
  {
    id: 3,
    produk: "Stick Bawang Pedas",
    harga: "Rp 6.500",
    satuan: "Pcs",
    jumlah: 270,
    datetime: "20 Jan, 10.40 PM",
    pendapatan: "Rp 1.755.000",
    perubahan: "+Rp 800.000",
    trend: "up"
  },
  {
    id: 4,
    produk: "Kerupuk Kulit Asin",
    harga: "Rp 7.000",
    satuan: "Pcs",
    jumlah: 700,
    datetime: "15 Jan, 03.29 PM",
    pendapatan: "Rp 4.900.000",
    perubahan: "-Rp 800.000",
    trend: "down"
  },
  {
    id: 5,
    produk: "Pangsit Bawang Pedas",
    harga: "Rp 7.500",
    satuan: "Pcs",
    jumlah: 300,
    datetime: "14 Jan, 10.40 PM",
    pendapatan: "Rp 2.250.000",
    perubahan: "+Rp 800.000",
    trend: "up"
  }
];

export default function DashboardPrediksi() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(produkData);
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
    const filtered = produkData.filter(item =>
      item.produk.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm]);

  const handleSearch = () => {
    const filtered = produkData.filter(item =>
      item.produk.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  // Fungsi untuk render grafik bar
  const renderBarChart = (data, maxValue, color) => {
    const chartHeight = 120;
    return (
      <div className="relative h-32">
        <div className="flex items-end justify-between h-full px-2">
          {data.values.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ 
                  height: `${(value / maxValue) * chartHeight}px`,
                  backgroundColor: color
                }}
              ></div>
              <span className="text-xs text-gray-600 mt-1">{data.labels[index]}</span>
            </div>
          ))}
        </div>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent, index) => (
          <div
            key={index}
            className="absolute left-0 right-0 border-t border-gray-200"
            style={{ bottom: `${percent}%` }}
          ></div>
        ))}
      </div>
    );
  };

  const maxPrediksiValue = Math.max(...prediksiData.values);
  const maxPenjualanValue = Math.max(...penjualanData.values);

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Navbar */}
      <Navbar username={user ? user.username : "User"} />

      {/* Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src="/asset/garis.svg" alt="" className="w-20" />
        <h1 className="text-2xl font-bold text-red-900">
          DASHBOARD PREDIKSI
        </h1>
        <img src="/asset/garis.svg" alt="" className="w-20" />
      </div>

      {/* Card Section */}
      <div className="mt-5 flex justify-center gap-8 flex-wrap">
        {[
          { title: "Total Pendapatan", color: "text-green-600", value: "Rp 15.000.000", change: "+Rp 2.000.000", changeColor: "text-green-600", icon: pemasukan },
          { title: "Total Pengeluaran", color: "text-red-600", value: "Rp 5.000.000", change: "+Rp 4.000.000", changeColor: "text-green-600", icon: pengeluaran },
          { title: "Profit Penjualan", color: "text-blue-500", value: "Rp 10.000.000", change: "-Rp 800.000", changeColor: "text-red-600", icon: profit },
        ].map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white shadow-md hover:shadow-lg transition rounded-xl p-4 w-72"
          >
            <img src={card.icon} alt="" className="w-10" />
            <div>
              <p className={`text-sm font-semibold ${card.color}`}>{card.title}</p>
              <h2 className="text-lg font-bold text-gray-800">{card.value}</h2>
              <div className={`flex items-center gap-1 text-sm font-medium ${card.changeColor}`}>
                <span>{card.change}</span>
                <i className={`fas fa-arrow-${card.change.startsWith('+') ? 'up' : 'down'} text-xs`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-8 flex justify-center gap-6 flex-wrap px-4">
        {/* Prediksi Pendapatan Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 w-full md:w-[48%]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Prediksi Pendapatan</h3>
          {renderBarChart(prediksiData, maxPrediksiValue, '#4CAF50')}
          <div className="text-center mt-4 text-sm text-gray-600 font-medium">
            Bulan Oktober
          </div>
        </div>

        {/* Total Penjualan Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 w-full md:w-[48%]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Penjualan</h3>
          {renderBarChart(penjualanData, maxPenjualanValue, '#2196F3')}
          <div className="text-center mt-4 text-sm text-gray-600 font-medium">
            Bulan Oktober
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-8 mx-auto w-[95%] md:w-[90%] max-w-6xl mb-8">
        {/* Search Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Mencari Produk Terjual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 pr-12 w-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full w-12 px-3 bg-black rounded-full flex items-center justify-center"
            >
              <img
                src={searchIcon}
                alt="Search"
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">No</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Produk</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Harga</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Satuan</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Jumlah</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">DateTime</th>
                <th className="py-3 px-4 font-semibold text-gray-700 border-b">Jumlah Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-800 text-left">{item.produk}</td>
                  <td className="py-3 px-4">{item.harga}</td>
                  <td className="py-3 px-4">{item.satuan}</td>
                  <td className="py-3 px-4">{item.jumlah}</td>
                  <td className="py-3 px-4">{item.datetime}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{item.pendapatan}</span>
                      <div className={`flex items-center gap-1 text-xs ${
                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span>{item.perubahan}</span>
                        <i className={`fas fa-arrow-${item.trend}`}></i>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data produk yang ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
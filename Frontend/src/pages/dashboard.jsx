import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import pemasukan from "../assets/pemasukan.svg";
import pengeluaran from "../assets/pengeluaran.svg";
import profit from "../assets/profit.svg";
import searchIcon from "../assets/search.svg";
import garis from "../assets/garis.svg";

// Function to get week from date
const getWeek = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  if (day >= 1 && day <= 7) return 0; // Week 1
  if (day >= 8 && day <= 14) return 1; // Week 2
  if (day >= 15 && day <= 21) return 2; // Week 3
  if (day >= 22 && day <= 31) return 3; // Week 4
  return -1;
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [produkData, setProdukData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState({
    totalPendapatan: 0,
    totalPengeluaran: 0,
    totalPenjualan: 0
  });
  const [chartData, setChartData] = useState({
    weeklyData: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
    maxQuantity: 100,
    yAxisLabels: [0, 100],
    totalQuantity: 0,
    percentages: [0, 0, 0],
    gradient: 'conic-gradient(#4CAF50 0% 33%, #2196F3 33% 66%, #FF9800 66% 100%)',
    legendItems: [
      { label: 'Kerupuk', color: 'bg-green-500', value: '0%' },
      { label: 'Pangsit', color: 'bg-blue-500', value: '0%' },
      { label: 'Stick', color: 'bg-orange-500', value: '0%' }
    ]
  });
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
    fetchProdukData();
  }, []);

  useEffect(() => {
    filterData();
  }, [auditData, searchTerm]);

  useEffect(() => {
    if (auditData.length > 0) {
      const penjualanData = auditData.filter(item => item.jenis_transaksi === 'penjualan');

      // Process weekly data for bar chart (jumlah terjual per produk per minggu)
      const weeks = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // [kerupuk, pangsit, stick] per minggu
      penjualanData.forEach(item => {
        const week = getWeek(item.tanggal);
        if (week !== -1) {
          if (item.produk?.nama_produk?.toLowerCase().includes("kerupuk")) {
            weeks[week][0] += item.jumlah;
          } else if (item.produk?.nama_produk?.toLowerCase().includes("pangsit")) {
            weeks[week][1] += item.jumlah;
          } else if (item.produk?.nama_produk?.toLowerCase().includes("stik")) {
            weeks[week][2] += item.jumlah;
          }
        }
      });

      // Calculate max total per week for stacked bars
      const weekTotals = weeks.map(week => week.reduce((sum, q) => sum + q, 0));
      const rawMax = Math.max(...weekTotals) + 5;
      const maxQuantity = Math.ceil(rawMax / 10) * 10; // Sesuaikan skala untuk jumlah (kelipatan 10)
      const yAxisLabels = [];
      for (let i = 0; i <= maxQuantity; i += Math.max(1, Math.floor(maxQuantity / 5))) {
        yAxisLabels.push(i);
      }
      if (yAxisLabels[yAxisLabels.length - 1] !== maxQuantity) {
        yAxisLabels.push(maxQuantity);
      }

      // Calculate total quantity and percentages for pie chart (tetap berdasarkan jumlah produk)
      const totalQuantity = penjualanData.reduce((sum, item) => sum + item.jumlah, 0);
      const kerupukTotal = penjualanData.filter(item => item.produk?.nama_produk?.toLowerCase().includes("kerupuk")).reduce((sum, item) => sum + item.jumlah, 0);
      const pangsitTotal = penjualanData.filter(item => item.produk?.nama_produk?.toLowerCase().includes("pangsit")).reduce((sum, item) => sum + item.jumlah, 0);
      const stickTotal = penjualanData.filter(item => item.produk?.nama_produk?.toLowerCase().includes("stik")).reduce((sum, item) => sum + item.jumlah, 0);

      const percentages = totalQuantity > 0 ? [
        (kerupukTotal / totalQuantity) * 100,
        (pangsitTotal / totalQuantity) * 100,
        (stickTotal / totalQuantity) * 100
      ] : [0, 0, 0];

      // Build conic gradient string
      const gradient = `conic-gradient(#4CAF50 0% ${percentages[0]}%, #2196F3 ${percentages[0]}% ${percentages[0] + percentages[1]}%, #FF9800 ${percentages[0] + percentages[1]}% 100%)`;

      // Legend items with dynamic percentages
      const legendItems = [
        { label: 'Kerupuk', color: 'bg-green-500', value: `${percentages[0].toFixed(1)}%` },
        { label: 'Pangsit', color: 'bg-blue-500', value: `${percentages[1].toFixed(1)}%` },
        { label: 'Stick', color: 'bg-orange-500', value: `${percentages[2].toFixed(1)}%` }
      ];

      setChartData({
        weeklyData: weeks,
        maxQuantity,
        yAxisLabels,
        totalQuantity,
        percentages,
        gradient,
        legendItems
      });
    }
  }, [auditData]);

  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.data;
      setAuditData(data);

      // Calculate summary
      const pemasukan = data.filter(item => item.jenis_transaksi === 'penjualan');
      const pengeluaran = data.filter(item => item.jenis_transaksi === 'pengeluaran');

      const totalPendapatan = pemasukan.reduce((sum, item) => sum + (Number(item.total_pendapatan) || 0), 0);
      const totalPengeluaran = pengeluaran.reduce((sum, item) => sum + (Number(item.total_pendapatan) || 0), 0);
      const totalPenjualan = totalPendapatan - totalPengeluaran;

      setSummary({
        totalPendapatan,
        totalPengeluaran,
        totalPenjualan
      });
    } catch (error) {
      console.error("Error fetching audit data:", error);
    }
  };

  const fetchProdukData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/produk", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProdukData(res.data);
    } catch (error) {
      console.error("Error fetching produk data:", error);
    }
  };

  const filterData = () => {
    let filtered = auditData; // Tampilkan semua data audit (penjualan dan pengeluaran)

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.produk?.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_transaksi?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins pb-20">
      {/* Welcome Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <h1 className="text-2xl font-bold text-red-900 m-2">
          Selamat Datang, {user ? user.username.toUpperCase() : "KEMBAR BAROKAH"}
        </h1>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      {/* Card Section */}
      <div className="mt-5 flex justify-center gap-8 flex-wrap">
        {[
          { title: "Total Pendapatan", color: "text-green-600", value: formatCurrency(summary.totalPendapatan), icon: pemasukan },
          { title: "Total Pengeluaran", color: "text-red-600", value: formatCurrency(summary.totalPengeluaran), icon: pengeluaran },
          { title: "Total Penjualan", color: "text-blue-500", value: formatCurrency(summary.totalPenjualan), icon: profit },
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

      {/* Grafik Section */}
      <div className="mt-5 bg-white p-6 rounded-2xl flex flex-col md:flex-row justify-center items-start gap-6 px-4 w-[90%] md:w-[70%] mx-auto">
        {/* Pie Chart */}
        <div className="bg-gray-100 p-6 rounded-2xl shadow-md w-full md:w-[40%] flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Persentase Penjualan</h3>
          <div
            className="w-48 h-48 rounded-full shadow-inner border border-gray-200"
            style={{ background: chartData.gradient }}
          ></div>
          <p className="mt-3 text-gray-600 font-medium">Total 100%</p>
          <div className="mt-5 space-y-2">
            {chartData.legendItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between w-44 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${item.color}`}></span>
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-100 p-6 rounded-2xl shadow-md w-full md:w-[55%]">
          <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">
            Grafik Penjualan per Minggu
          </h3>
          <div className="relative h-64">
            <div className="relative h-64 flex items-end px-8">
              {/* Sumbu Y */}
              <div className="flex flex-col justify-between text-xs text-gray-500 h-full w-8 text-right">
                {chartData.yAxisLabels
                  .slice()
                  .reverse()
                  .map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
              </div>

              {/* Area Grafik */}
              <div className="flex justify-around items-end flex-1 h-full ml-4 relative">
                {/* Garis horizontal bantu (gridlines) */}
                {chartData.yAxisLabels.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-200"
                    style={{ bottom: `${(i / (chartData.yAxisLabels.length - 1)) * 100}%` }}
                  ></div>
                ))}

                {/* Batang-batang per minggu */}
                {chartData.weeklyData.map((weekData, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col items-center z-10">
                    <div className="flex items-end">
                      {weekData.map((quantity, productIndex) => (
                        <div
                          key={productIndex}
                          style={{ height: `${(quantity / chartData.maxQuantity) * 256}px` }}
                          className={`w-6 rounded-t-lg ${
                            productIndex === 0 ? 'bg-green-500' : productIndex === 1 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 font-medium">
                      Minggu {weekIndex + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Garis dasar X */}
            <div className="absolute bottom-6 left-8 right-8 h-[1px] bg-gray-300"></div>
          </div>
          {/* Legend */}
          <div className="flex justify-center mt-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              <span className="text-sm text-gray-700">Kerupuk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded"></span>
              <span className="text-sm text-gray-700">Pangsit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded"></span>
              <span className="text-sm text-gray-700">Stick</span>
            </div>
          </div>
        </div>
      </div>


      {/* Table Section */}
      <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-8 mx-auto w-[90%] md:w-[70%]">
        <div className="flex justify-between items-center mb-8 w-[100%]">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cari produk, jenis transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 pr-10 w-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              className="absolute right-0 top-0 h-full w-16 px-3 bg-black rounded-full flex items-center justify-center"
            >
              <img
                src={searchIcon}
                alt="Search"
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <table className="w-full text-sm text-center border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {["No", "Jenis", "Sumber", "Harga", "Jumlah", "DateTime", "Total"].map((h, i) => (
                <th key={i} className="py-2 px-3 font-semibold text-gray-700 border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 border-b">
                <td className="py-2 px-3">{i + 1}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.jenis_transaksi === 'penjualan'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.jenis_transaksi === 'penjualan' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td className="py-2 px-3">{item.jenis_transaksi === 'penjualan' ? (item.produk?.nama_produk || 'N/A') : (item.keterangan || 'N/A')}</td>
                <td className="py-2 px-3">{formatCurrency(item.harga_satuan || 0)}</td>
                {/* <td className="py-2 px-3">{item.produk?.unit || 'N/A'}</td> */}
                <td className="py-2 px-3">{item.jumlah}</td>
                <td className="py-2 px-3">{formatDate(item.tanggal)}</td>
                <td className="py-2 px-3">{formatCurrency(item.total_pendapatan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

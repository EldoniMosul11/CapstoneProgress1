// File: src/pages/DashboardPrediksi.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../layout/navbar";
import api from "../api"; 

// Import Assets
import searchIcon from "../assets/search.svg";
import pemasukanIcon from "../assets/pemasukan.svg";
import pengeluaranIcon from "../assets/pengeluaran.svg";
import profitIcon from "../assets/profit.svg";
import garis from "../assets/garis.svg";

// Import Komponen Chart Baru
import PredictionChart from "../components/PredictionChart"; 

export default function DashboardPrediksi() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  
  // State Summary
  const [summary, setSummary] = useState({
    totalPendapatan: 0,
    diffPendapatan: 0,
    totalPengeluaran: 0,
    diffPengeluaran: 0,
    totalProfit: 0,
    diffProfit: 0,
    mingguData: "" // Ini yang akan kita isi
  });
  
  // State Prediksi
  const [productName, setProductName] = useState('Kerupuk Kulit');
  const [forecastSteps, setForecastSteps] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  
  const navigate = useNavigate();

  // --- HELPER FUNCTIONS ---
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const hour = date.getHours();
    const min = date.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${day} ${month}, ${hour12}.${min.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // --- EFFECTS ---
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

  useEffect(() => {
    if (auditData.length > 0) {
      processData();
      filterData();
    }
  }, [auditData]);

  useEffect(() => {
    filterData();
  }, [searchTerm]);

  // --- DATA FETCHING ---
  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditData(res.data.data);
    } catch (error) {
      console.error("Error fetching audit data:", error);
    }
  };

  // --- LOGIKA SCORE CARD (UPDATE FORMAT TANGGAL) ---
  const processData = () => {
    if (auditData.length === 0) return;

    const sortedData = [...auditData].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const latestDate = new Date(sortedData[0].tanggal);

    // 1. Tentukan Range Minggu Ini
    const startOfWeek = new Date(latestDate);
    const day = startOfWeek.getDay() || 7; 
    if (day !== 1) startOfWeek.setDate(startOfWeek.getDate() - (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 2. Tentukan Range Minggu Lalu
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    const endOfPrevWeek = new Date(endOfWeek);
    endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 7);

    // 3. Format Label Minggu (UPDATE: Pakai Format Panjang Indonesia)
    const formatHeaderDate = (date) => {
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };
    const weekLabel = `${formatHeaderDate(startOfWeek)} - ${formatHeaderDate(endOfWeek)}`;

    // 4. Filter Data
    const thisWeekData = auditData.filter(item => {
        const d = new Date(item.tanggal);
        return d >= startOfWeek && d <= endOfWeek;
    });

    const prevWeekData = auditData.filter(item => {
        const d = new Date(item.tanggal);
        return d >= startOfPrevWeek && d <= endOfPrevWeek;
    });

    // 5. Hitung Total
    const calcTotal = (data, type) => {
        return data.filter(item => {
            const t = item.jenis_transaksi ? item.jenis_transaksi.toLowerCase() : '';
            if (type === 'pemasukan') return t === 'pemasukan' || t === 'penjualan';
            if (type === 'pengeluaran') return t === 'pengeluaran' || item.produk_id === null;
            return false;
        }).reduce((sum, item) => sum + (Number(item.total_pendapatan) || 0), 0);
    };

    const currPendapatan = calcTotal(thisWeekData, 'pemasukan');
    const currPengeluaran = calcTotal(thisWeekData, 'pengeluaran');
    const currProfit = currPendapatan - currPengeluaran;

    const prevPendapatan = calcTotal(prevWeekData, 'pemasukan');
    const prevPengeluaran = calcTotal(prevWeekData, 'pengeluaran');
    const prevProfit = prevPendapatan - prevPengeluaran;

    setSummary({
        totalPendapatan: currPendapatan,
        diffPendapatan: currPendapatan - prevPendapatan,
        totalPengeluaran: currPengeluaran,
        diffPengeluaran: currPengeluaran - prevPengeluaran,
        totalProfit: currProfit,
        diffProfit: currProfit - prevProfit,
        mingguData: weekLabel // Simpan label format baru
    });
  };

  const filterData = () => {
    const rawData = auditData.filter(item => 
      item.jenis_transaksi === 'penjualan' || item.jenis_transaksi === 'Pemasukan'
    );

    const groupedByProduct = {};
    rawData.forEach(item => {
      const pName = item.produk?.nama_produk || 'N/A';
      if (!groupedByProduct[pName]) groupedByProduct[pName] = [];
      groupedByProduct[pName].push(item);
    });

    let processedData = [];

    Object.keys(groupedByProduct).forEach(productName => {
      const items = groupedByProduct[productName];
      items.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
      
      const uniqueItems = items.filter((item, index, self) => 
        index === self.findIndex((t) => (
          new Date(t.tanggal).toDateString() === new Date(item.tanggal).toDateString()
        ))
      );

      const itemsWithTrend = uniqueItems.map((item, index) => {
        const currentRevenue = Number(item.total_pendapatan) || 0;
        let trend = 'neutral';
        let changeText = 'Data Awal';
        let isFirstData = true;

        if (index > 0) {
          isFirstData = false;
          const prevRevenue = Number(uniqueItems[index - 1].total_pendapatan) || 0;
          const diff = currentRevenue - prevRevenue;

          if (diff > 0) { trend = 'up'; changeText = `+${formatCurrency(diff)}`; } 
          else if (diff < 0) { trend = 'down'; changeText = `-${formatCurrency(Math.abs(diff))}`; } 
          else { trend = 'neutral'; changeText = 'Stabil'; }
        }

        return {
          id: item.id,
          produk: productName,
          harga: `Rp ${Number(item.harga_satuan).toLocaleString('id-ID')}`,
          satuan: item.produk?.unit || 'Pcs',
          jumlah: item.jumlah,
          datetime: formatDateTime(item.tanggal),
          pendapatan: `Rp ${currentRevenue.toLocaleString('id-ID')}`,
          perubahan: changeText,
          trend: trend,
          isFirstData: isFirstData,
          rawDate: new Date(item.tanggal)
        };
      });
      processedData = [...processedData, ...itemsWithTrend];
    });

    processedData.sort((a, b) => b.rawDate - a.rawDate);
    const filtered = processedData.filter(item =>
      item.produk.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleSearch = () => { filterData(); };

  const handlePredict = async () => {
    setError('');
    setApiResponse(null);
    const steps = parseInt(forecastSteps, 10);
    if (!forecastSteps || isNaN(steps)) { setError('Mohon masukkan angka mingguan yang valid.'); return; }
    if (steps <= 0) { setError('Jumlah minggu harus lebih besar dari 0.'); return; }
    if (steps > 12) { setError('Batas maksimal prediksi adalah 12 minggu.'); return; }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/predict', {
        product_name: productName,
        forecast_steps: steps
      });
      setApiResponse(response.data);
    } catch (err) {
      console.error("Error fetching prediction:", err);
      if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
      } else {
          setError('Gagal mengambil data prediksi. Pastikan server Python (Port 5001) berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- KOMPONEN SUMMARY CARD ---
  const SummaryCard = ({ title, value, diff, icon, baseColor, borderColor, forceRed }) => {
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const isNeutral = diff === 0;

    let badgeClass = "text-gray-500 bg-gray-100";
    if (isPositive) badgeClass = "text-green-700 bg-green-100";
    else if (isNegative) badgeClass = "text-red-700 bg-red-100";
    if (forceRed && !isNeutral) badgeClass = "text-red-700 bg-red-100"; 

    let sign = "";
    let iconTrend = null;
    if (isPositive) {
        sign = "+";
        iconTrend = <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
    } else if (isNegative) {
        sign = "-";
        iconTrend = <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
    }

    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${borderColor} flex items-center justify-between hover:shadow-md transition w-full md:w-[30%]`}>
         <div>
            <p className={`text-sm font-semibold ${baseColor}`}>{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(value)}</h3>
            <div className={`inline-flex items-center gap-1 text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full ${badgeClass}`}>
                <span>{sign}{formatCurrency(Math.abs(diff))}</span>
                {iconTrend}
                {isNeutral && <span>Stabil</span>}
            </div>
         </div>
         <div className={`${baseColor.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} p-3 rounded-full`}>
            <img src={icon} alt="Icon" className="w-6 h-6" />
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins pb-20">
      <Navbar username={user ? user.username : "User"} />

      {/* --- Header (UPDATE TAMPILAN) --- */}
      <div className="pt-6 pb-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <div className="text-center">
            <h1 className="text-2xl font-bold text-red-900 tracking-wide">DASHBOARD PREDIKSI</h1>
            
            {/* MENAMPILKAN DATA MINGGU DI SINI */}
            {summary.mingguData && (
                <p className="text-xs text-gray-500 mt-1 font-medium bg-white px-3 py-1 rounded-full shadow-sm inline-block">
                    Data Audit Minggu: {summary.mingguData}
                </p>
            )}
        </div>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* --- Score Cards --- */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mt-4">
            <SummaryCard 
                title="Total Pendapatan" 
                value={summary.totalPendapatan} 
                diff={summary.diffPendapatan}
                icon={pemasukanIcon} 
                baseColor="text-green-600" 
                borderColor="border-green-500"
            />
            <SummaryCard 
                title="Total Pengeluaran" 
                value={summary.totalPengeluaran} 
                diff={summary.diffPengeluaran}
                icon={pengeluaranIcon} 
                baseColor="text-red-600" 
                borderColor="border-red-500"
                forceRed={true}
            />
            <SummaryCard 
                title="Profit Penjualan" 
                value={summary.totalProfit} 
                diff={summary.diffProfit}
                icon={profitIcon} 
                baseColor="text-blue-600" 
                borderColor="border-blue-500"
            />
        </div>

        {/* --- BAGIAN PREDIKSI --- */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-end border-b pb-6">
            <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk</label>
                <select 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="Kerupuk Kulit">Kerupuk Kulit</option>
                <option value="Stik Bawang">Stik Bawang</option>
                <option value="Keripik Bawang">Keripik Bawang</option>
                </select>
            </div>
            <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prediksi (Minggu)</label>
                <input 
                type="number" 
                min="1" 
                max="12" 
                value={forecastSteps}
                onChange={(e) => setForecastSteps(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <button 
                onClick={handlePredict}
                disabled={loading}
                className={`px-6 py-2 rounded-md text-white font-semibold transition-colors h-10 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {loading ? 'Memproses...' : 'Analisis'}
            </button>
            </div>

            {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg text-center">{error}</div>}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="h-[400px] p-4 border rounded-lg bg-gray-50 relative">
                <PredictionChart title="Prediksi Penjualan (Pcs)" dataType="jumlah" chartData={apiResponse} />
            </div>
            <div className="h-[400px] p-4 border rounded-lg bg-gray-50 relative">
                <PredictionChart title="Prediksi Pendapatan (Rp)" dataType="pendapatan" chartData={apiResponse} />
            </div>
            </div>

            {apiResponse && apiResponse.forecast_data && apiResponse.forecast_data.length > 0 && (
            <div className="overflow-x-auto mt-8">
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-l-4 border-blue-600 pl-3">Rincian Hasil Prediksi</h3>
                <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Tanggal</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Prediksi Jumlah</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Estimasi Pendapatan</th>
                    </tr>
                </thead>
                <tbody>
                    {apiResponse.forecast_data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b last:border-0">
                        <td className="py-3 px-4 text-sm text-gray-700">{item.tanggal_audit}</td>
                        <td className="py-3 px-4 text-sm font-bold text-blue-600">{item.prediksi_jumlah_terjual} pcs</td>
                        <td className="py-3 px-4 text-sm font-medium text-green-600">{formatCurrency(item.prediksi_pendapatan)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Table Section */}
        <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-8 w-full">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Audit Penjualan Terakhir</h3>
            <div className="relative w-full max-w-md">
                <input type="text" placeholder="Cari Produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-gray-300 rounded-full px-4 py-2 pr-12 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleSearch} className="absolute right-0 top-0 h-full w-12 bg-gray-800 rounded-r-full flex items-center justify-center hover:bg-gray-700 transition">
                <img src={searchIcon} alt="Search" className="w-4 h-4 invert brightness-0 invert" />
                </button>
            </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[500px] border rounded-lg">
            <table className="w-full text-sm text-center border-collapse relative">
                <thead className="sticky top-0 z-10 bg-gray-100 text-gray-600 uppercase text-xs tracking-wide shadow-sm">
                <tr>
                    <th className="py-3 px-4 font-semibold border-b">No</th>
                    <th className="py-3 px-4 font-semibold border-b text-left">Produk</th>
                    <th className="py-3 px-4 font-semibold border-b">Harga</th>
                    <th className="py-3 px-4 font-semibold border-b">Satuan</th>
                    <th className="py-3 px-4 font-semibold border-b">Jumlah</th>
                    <th className="py-3 px-4 font-semibold border-b">Tanggal</th>
                    <th className="py-3 px-4 font-semibold border-b text-right">Total & Tren</th>
                </tr>
                </thead>
                <tbody className="text-gray-700">
                {filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 text-left">{item.produk}</td>
                    <td className="py-3 px-4">{item.harga}</td>
                    <td className="py-3 px-4">{item.satuan}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{item.jumlah}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.datetime}</td>
                    <td className="py-3 px-4">
                        <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-800 whitespace-nowrap mb-1">{item.pendapatan}</span>
                        {item.isFirstData ? (
                            <span className="text-[10px] font-medium text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">- Data Awal -</span>
                        ) : (
                            <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap ${item.trend === 'up' ? 'text-green-700 bg-green-50 border border-green-100' : item.trend === 'down' ? 'text-red-700 bg-red-50 border border-red-100' : 'text-blue-600 bg-blue-50 border border-blue-100'}`}>
                                <span>{item.perubahan}</span>
                                {item.trend === 'up' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                                {item.trend === 'down' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                                {item.trend === 'neutral' && <span className="text-lg leading-none">=</span>}
                            </div>
                        )}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {filteredData.length === 0 && (
                <div className="text-center py-10 text-gray-400 bg-gray-50">
                <p className="text-lg">Tidak ada data penjualan ditemukan</p>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
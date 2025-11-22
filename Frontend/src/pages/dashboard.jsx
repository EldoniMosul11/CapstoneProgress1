// File: src/pages/Beranda.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/navbar";
import api from "../api";

// Import Assets
import searchIcon from "../assets/search.svg";
import pemasukanIcon from "../assets/pemasukan.svg";
import pengeluaranIcon from "../assets/pengeluaran.svg";
import profitIcon from "../assets/profit.svg";
import garis from "../assets/garis.svg";

// Import Charts
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";

export default function Beranda() {
  const [user, setUser] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk Scorecard (Ditambah properti Diff)
  const [summary, setSummary] = useState({
    totalPendapatan: 0,
    diffPendapatan: 0,
    totalPengeluaran: 0,
    diffPengeluaran: 0,
    totalProfit: 0,
    diffProfit: 0,
    mingguData: ""
  });

  // State untuk Charts
  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [filteredTableData, setFilteredTableData] = useState([]);

  const navigate = useNavigate();

  // --- FORMATTERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 1. Get User
        const userRes = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data);

        // 2. Get Audit Data
        const auditRes = await api.get("/audit", { headers: { Authorization: `Bearer ${token}` } });
        setAuditData(auditRes.data.data);

      } catch (err) {
        console.error("Error fetching data:", err);
        localStorage.removeItem("token");
        navigate("/"); 
      }
    };
    fetchData();
  }, [navigate]);

  // --- PROCESS DATA ---
  useEffect(() => {
    if (auditData.length > 0) {
      processDashboardData();
      filterTableData();
    }
  }, [auditData]);

  useEffect(() => {
    filterTableData();
  }, [searchTerm]);


  // --- LOGIKA UTAMA ---
  const processDashboardData = () => {
    if (!auditData || auditData.length === 0) return;

    // 1. Sorting Data
    const sortedData = [...auditData].sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime() || 0;
        const dateB = new Date(b.tanggal).getTime() || 0;
        return dateB - dateA;
    });

    // Ambil tanggal data paling baru (Misal: 18 Nov 2025)
    const latestDate = new Date(sortedData[0].tanggal);

    // 2. Cari Hari Senin dari minggu data tersebut (Misal: Senin, 17 Nov 2025)
    const currentWeekMonday = new Date(latestDate);
    const day = currentWeekMonday.getDay() || 7; 
    if (day !== 1) currentWeekMonday.setDate(currentWeekMonday.getDate() - (day - 1));
    currentWeekMonday.setHours(0, 0, 0, 0);

    // --- PERUBAHAN LOGIKA DI SINI ---
    // Kita ingin menampilkan MINGGU LALU (Minggu Audit), bukan minggu berjalan.
    // Jadi kita mundurkan startOfWeek sebanyak 7 hari ke belakang.
    
    const startOfWeek = new Date(currentWeekMonday);
    startOfWeek.setDate(startOfWeek.getDate() - 7); // Mundur ke 10 Nov
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);   // Sampai 16 Nov
    endOfWeek.setHours(23, 59, 59, 999);

    // 3. Tentukan Range Minggu Sebelumnya Lagi (Untuk perbandingan Tren)
    // (Misal: 3 Nov - 9 Nov)
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    
    const endOfPrevWeek = new Date(endOfWeek);
    endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 7);

    // Helper: Cek Range
    const isInRange = (dateStr, start, end) => {
        const d = new Date(dateStr).getTime();
        return d >= start.getTime() && d <= end.getTime();
    };

    // Filter Data
    // "thisWeekData" sekarang berisi data 10-16 Nov (Minggu Audit)
    const thisWeekData = auditData.filter(item => isInRange(item.tanggal, startOfWeek, endOfWeek));
    const prevWeekData = auditData.filter(item => isInRange(item.tanggal, startOfPrevWeek, endOfPrevWeek));

    // --- FUNGSI HITUNG TOTAL ---
    const calcTotal = (data, type) => {
        return data.filter(item => {
            const t = (item.jenis_transaksi || '').toLowerCase(); 
            if (type === 'pemasukan') return t === 'pemasukan' || t === 'penjualan';
            if (type === 'pengeluaran') return t === 'pengeluaran' || item.produk_id === null;
            return false;
        }).reduce((sum, item) => {
            const val = Number(item.total_pendapatan) || 0;
            return sum + Math.abs(val);
        }, 0);
    };

    // Hitung Nilai
    const currPendapatan = calcTotal(thisWeekData, 'pemasukan');
    const currPengeluaran = calcTotal(thisWeekData, 'pengeluaran');
    const currProfit = currPendapatan - currPengeluaran;

    const prevPendapatan = calcTotal(prevWeekData, 'pemasukan');
    const prevPengeluaran = calcTotal(prevWeekData, 'pengeluaran');
    const prevProfit = prevPendapatan - prevPengeluaran;

    // Format Header
    const formatHeaderDate = (date) => {
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });
    };
    const startStr = formatHeaderDate(startOfWeek);
    const endStr = formatHeaderDate(endOfWeek);

    setSummary({
      totalPendapatan: currPendapatan,
      diffPendapatan: currPendapatan - prevPendapatan,
      totalPengeluaran: currPengeluaran,
      diffPengeluaran: currPengeluaran - prevPengeluaran,
      totalProfit: currProfit,
      diffProfit: currProfit - prevProfit,
      mingguData: `${startStr} - ${endStr}`
    });

    // --- B. PIE CHART (4 MINGGU TERAKHIR - PERSENTASE PRODUK) ---
    
    // Tentukan tanggal mulai 4 minggu yang lalu (sama seperti Bar Chart)
    const startOf4Weeks = new Date(startOfWeek);
    startOf4Weeks.setDate(startOf4Weeks.getDate() - (3 * 7)); // Mundur 3 minggu + minggu ini = 4 minggu
    startOf4Weeks.setHours(0, 0, 0, 0);

    // Filter data penjualan selama 4 minggu terakhir
    const sales4Weeks = auditData.filter(item => {
      const d = new Date(item.tanggal);
      return d >= startOf4Weeks && d <= endOfWeek && 
             (item.jenis_transaksi.toLowerCase() === 'pemasukan' || item.jenis_transaksi.toLowerCase() === 'penjualan');
    });

    const productStats = {};
    sales4Weeks.forEach(item => {
      const pName = item.produk?.nama_produk || 'Lainnya';
      productStats[pName] = (productStats[pName] || 0) + item.jumlah;
    });

    // Siapkan warna
    const bgColors = {
        'Kerupuk Kulit': '#4CAF50', 
        'Stik Bawang': '#FF9800',   
        'Keripik Bawang': '#2196F3',
        'Lainnya': '#9E9E9E'
    };

    const labels = Object.keys(productStats);
    const dataPie = Object.values(productStats);
    const colors = labels.map(label => bgColors[label] || '#607D8B');

    setPieData({
      labels: labels,
      datasets: [{
        data: dataPie,
        backgroundColor: colors,
        borderWidth: 1,
      }]
    });

    // --- C. BAR CHART (4 MINGGU TERAKHIR) ---
    const weeksLabels = [];
    const productList = ['Kerupuk Kulit', 'Stik Bawang', 'Keripik Bawang'];
    const weeklyData = {};
    productList.forEach(p => weeklyData[p] = [0, 0, 0, 0]);

    // Loop 4 minggu ke belakang (i=3 -> 0)
    // i=0: Audit Minggu Ini (Data Paling Baru)
    // i=3: Audit 4 Minggu Lalu
    for (let i = 3; i >= 0; i--) {
       
       // 1. TENTUKAN RENTANG PENCARIAN DATA (Berdasarkan Tanggal Audit)
       const searchStart = new Date(startOfWeek);
       searchStart.setDate(startOfWeek.getDate() - (i * 7)); // Mundur i minggu
       
       const searchEnd = new Date(searchStart);
       searchEnd.setDate(searchStart.getDate() + 6);
       searchEnd.setHours(23, 59, 59);

       // 2. TENTUKAN LABEL TAMPILAN (Berdasarkan Periode Penjualan Asli)
       // Data yang diaudit tanggal 17 Nov adalah penjualan tanggal 10-16 Nov.
       // Jadi labelnya harus mundur 7 hari dari tanggal audit.
       const labelStart = new Date(searchStart);
       labelStart.setDate(labelStart.getDate() - 7); // Mundur 1 minggu
       
       const labelEnd = new Date(labelStart);
       labelEnd.setDate(labelEnd.getDate() + 6); // Sampai minggu depannya

       // --- Format Tanggal (dd/mm/yy) ---
       const formatShort = (date) => {
           const d = date.getDate().toString().padStart(2, '0');
           const m = (date.getMonth() + 1).toString().padStart(2, '0');
           const y = date.getFullYear().toString().slice(-2); 
           return `${d}/${m}/${y}`;
       };

       const startStr = formatShort(labelStart);
       const endStr = formatShort(labelEnd);
       
       // Push Label (Minggu 4 = Minggu Audit Terakhir)
       weeksLabels.push([`Minggu ${4-i}`, `(${startStr} - ${endStr})`]);

       // 3. FILTER DATA (Gunakan searchStart & searchEnd)
       const weekData = auditData.filter(item => {
          const d = new Date(item.tanggal);
          return d >= searchStart && d <= searchEnd && 
             (item.jenis_transaksi.toLowerCase() === 'pemasukan' || item.jenis_transaksi.toLowerCase() === 'penjualan');
       });

       // Sum per produk
       weekData.forEach(item => {
          const pName = item.produk?.nama_produk;
          if (weeklyData[pName]) {
             weeklyData[pName][3 - i] += item.jumlah; 
          }
       });
    }

    setBarData({
      labels: weeksLabels,
      datasets: [
        { label: 'Kerupuk Kulit', data: weeklyData['Kerupuk Kulit'], backgroundColor: '#4CAF50' },
        { label: 'Stik Bawang', data: weeklyData['Stik Bawang'], backgroundColor: '#FF9800' },
        { label: 'Keripik Bawang', data: weeklyData['Keripik Bawang'], backgroundColor: '#2196F3' },
      ]
    });
  };

  // --- FILTER DATA TABEL ---
  const filterTableData = () => {
      const filtered = auditData.filter(item => {
          const pName = item.produk?.nama_produk || '';
          const sumber = item.sumber_pengeluaran || '';
          const combinedSearch = (pName + sumber + item.jenis_transaksi).toLowerCase();
          return combinedSearch.includes(searchTerm.toLowerCase());
      });
      filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setFilteredTableData(filtered);
  };

  // --- KOMPONEN SUMMARY CARD (DENGAN TREN) ---
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

    // GUNAKAN borderColor DI SINI
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
         
         {/* Background Icon juga kita hardcode atau perbaiki agar aman */}
         <div className={`p-3 rounded-full ${
            baseColor.includes('green') ? 'bg-green-100' : 
            baseColor.includes('red') ? 'bg-red-100' : 'bg-blue-100'
         }`}>
            <img src={icon} alt="Icon" className="w-6 h-6" />
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins pb-20">
      <Navbar username={user ? user.username : "User"} />

      {/* --- Header --- */}
      <div className="pt-6 pb-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <div className="text-center">
            <h1 className="text-2xl font-bold text-red-900 tracking-wide">SELAMAT DATANG</h1>
            <h2 className="text-lg font-bold text-[#D8A400] mt-1">UMKM KEMBAR BAROKAH</h2>
            {summary.mingguData && (
                <p className="text-xs text-gray-500 mt-1 font-medium bg-white px-3 py-1 rounded-full shadow-sm inline-block">
                    Data Audit Minggu: {summary.mingguData}
                </p>
            )}
        </div>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        
        {/* --- Score Cards (DENGAN TREN) --- */}
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
                forceRed={true} // Pengeluaran selalu merah
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

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6 text-center border-b pb-2">Persentase Penjualan</h3>
                <div className="flex-1 relative min-h-[250px]">
                    {pieData ? <PieChart data={pieData} /> : <p className="text-center text-gray-400 mt-10">Loading...</p>}
                </div>
                <div className="mt-6 flex items-start justify-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                        Proporsi produk terjual dalam akumulasi <span className="font-bold text-blue-600">4 minggu terakhir</span>.
                    </p>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Grafik Penjualan (4 Minggu Terakhir)</h3>
                <div className="flex-1 relative min-h-[300px]">
                    {barData ? <BarChart data={barData} /> : <p className="text-center text-gray-400 mt-10">Loading...</p>}
                </div>
            </div>

        </div>

        {/* --- Table Section --- */}
        <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-8 w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi Terakhir</h3>
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Cari Data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-full px-4 py-2 pr-12 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-0 top-0 h-full w-10 bg-gray-800 rounded-r-full flex items-center justify-center hover:bg-gray-700 transition">
                  <img src={searchIcon} alt="Search" className="w-4 h-4 invert brightness-0 invert" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[400px] border rounded-lg">
              <table className="w-full text-sm text-center border-collapse relative">
                <thead className="sticky top-0 z-10 bg-gray-100 text-gray-600 uppercase text-xs tracking-wide shadow-sm">
                  <tr>
                    {["No", "Jenis", "Sumber/Produk", "Harga", "Jml", "Tanggal", "Total"].map((h, i) => (
                        <th key={i} className="py-3 px-4 font-semibold border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {filteredTableData.slice(0, 20).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                      <td className="py-3 px-4">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.jenis_transaksi.toLowerCase() === 'penjualan' || item.jenis_transaksi.toLowerCase() === 'pemasukan'
                            ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {item.jenis_transaksi.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 text-left">
                        {item.produk ? item.produk.nama_produk : (item.sumber_pengeluaran || '-')}
                      </td>
                      <td className="py-3 px-4">{formatCurrency(item.harga_satuan || 0)}</td>
                      <td className="py-3 px-4 font-bold">{item.jumlah}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs">{formatDate(item.tanggal)}</td>
                      <td className={`py-3 px-4 font-semibold ${
                          item.jenis_transaksi.toLowerCase() === 'penjualan' || item.jenis_transaksi.toLowerCase() === 'pemasukan'
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(item.total_pendapatan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTableData.length === 0 && (
                <div className="text-center py-8 text-gray-500">Data tidak ditemukan</div>
              )}
            </div>
        </div>

      </div>
    </div>
  );
}
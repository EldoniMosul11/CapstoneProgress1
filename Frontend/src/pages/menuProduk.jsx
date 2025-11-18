// MenuProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";
import tambah from "../assets/tambah.svg";

// Data produk dari database
export default function MenuProduk() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await api.get("/produk", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Transform API data to match frontend format
        const transformedProducts = res.data.map(product => ({
          id: product.id,
          name: product.nama_produk,
          stock: product.stok_tersedia,
          image: product.gambar || kosong // Use kosong.png for empty images
        }));
        setProducts(transformedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Gagal memuat data produk");
        // No fallback to dummy data - show error instead
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    fetchProducts();
  }, [navigate]);

  const handleDetail = (product) => {
    // Navigasi ke halaman detail produk dengan ID
    navigate(`/detailProduk/${product.id}`);
  };

  const handleTambahStok = (product) => {
    // Navigasi ke halaman edit produk dengan ID
    navigate(`/produk/edit/${product.id}`);
  };

  const handleTambahProduk = () => {
    alert('Fitur Tambah Produk akan dibuka (demo)');
    // Navigasi ke halaman tambah produk
    // navigate("/produk/input");
  };

  const handleDeleteProduk = async (product) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/produk/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Remove product from state
        setProducts(products.filter(p => p.id !== product.id));
        alert("Produk berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Gagal menghapus produk. Silakan coba lagi.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">


      {/* Welcome Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">
          MENU PRODUK
        </h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      {/* Product Grid Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
            <p className="mt-2 text-gray-600">Memuat produk...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Product Cards */}
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#FEF8C1] rounded-xl shadow-lg p-3 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-amber-200/50"
            >
              <div className="flex justify-center mb-4">
                <div className="w-full h-60 overflow-hidden rounded-lg">
                  <img
                    src={product.image ? `http://localhost:5000${product.image}` : pangsit}
                    alt={product.name}
                    className="w-contain h-full object-cover"
                  />
                </div>
              </div>
                <h3 className="text-xl font-semibold text-gray-800 ">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  {/* <i className="fas fa-box text-red-500"></i> */}
                  <span>Sisa Stok: {product.stock}</span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleDetail(product)}
                    className="flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg flex-1 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Detail</span>
                  </button>
                  <button
                    onClick={() => handleTambahStok(product)}
                    className="flex items-center justify-center gap-2 bg-[#004A1C] text-white py-2 px-4 rounded-lg flex-1 hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduk(product)}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:from-rose-400 hover:to-rose-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Tambah Produk Card */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
              <button
                onClick={handleTambahProduk}
                className="flex flex-col items-center justify-center h-full text-gray-700 hover:bg-gray-100 rounded-lg py-8 transition-colors"
              >
                <img
                  src={tambah}
                  alt="Tambah Produk"
                  className="w-32 h-32 mb-4"
                />
                <p className="text-lg font-medium">Tambah Produk</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
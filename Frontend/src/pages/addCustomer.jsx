// AddCustomer.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import garis from "../assets/garis.svg";

export default function AddCustomer() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { produk_id } = useParams(); // Product ID from URL

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await api.post("/customer", {
        nama: formData.nama,
        produk_id: produk_id,
        alamat: formData.alamat
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert("Customer berhasil ditambahkan!");
      navigate(`/detailProduk/${produk_id}`);
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Gagal menambahkan customer. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan? Data tidak akan disimpan.")) {
      navigate(`/detailProduk/${produk_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">
          TAMBAH CUSTOMER
        </h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {/* Form Fields */}
            <div className="space-y-6">
              {/* Nama Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Customer
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="masukkan nama customer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Alamat Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Customer
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  placeholder="masukkan alamat customer"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Tambah Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

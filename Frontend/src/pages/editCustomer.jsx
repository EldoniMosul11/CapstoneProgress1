  // EditCustomer.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import garis from "../assets/garis.svg";
import { showSuccessToast, showErrorToast } from "../components/Toast";

export default function EditCustomer() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams(); // Customer ID

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

    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          nama: res.data.nama,
          alamat: res.data.alamat,
          produk_id: res.data.produk_id
        });
      } catch (err) {
        console.error("Error fetching customer:", err);
        showErrorToast("Gagal memuat data customer.");
        navigate("/menu-produk");
      } finally {
        setIsFetching(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [navigate, id]);

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
      await api.put(`/customer/${id}`, {
        nama: formData.nama,
        produk_id: formData.produk_id,
        alamat: formData.alamat
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showSuccessToast("Customer berhasil diupdate!");
      setTimeout(() => {
        navigate(`/detailProduk/${formData.produk_id}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating customer:", error);
      showErrorToast("Gagal mengupdate customer. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/menu-produk");
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-100 font-poppins flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-500"></i>
          <p className="mt-4 text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">
          EDIT CUSTOMER
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
                    Update Customer
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

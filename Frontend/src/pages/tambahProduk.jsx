// InputProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/navbar";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";

export default function InputProduk() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    namaProduk: "",
    detailProduk: "",
    tanggalProduksi: "",
    jumlahProduksi: "",
    hargaSatuan: "",
    gambar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [fileName, setFileName] = useState("Tidak Ada Gambar");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (500KB limit)
      if (file.size > 500 * 1024) {
        alert("Ukuran gambar melebihi 500KB. Silakan pilih gambar yang lebih kecil.");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("File harus berupa gambar.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        gambar: file
      }));

      setFileName(file.name);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      gambar: null
    }));
    setPreviewImage(null);
    setFileName("Tidak Ada Gambar");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('namaProduk', formData.namaProduk);
      submitData.append('detailProduk', formData.detailProduk);
      submitData.append('tanggalProduksi', formData.tanggalProduksi);
      submitData.append('jumlahProduksi', formData.jumlahProduksi);
      submitData.append('hargaSatuan', formData.hargaSatuan);
      if (formData.gambar) {
        submitData.append('gambar', formData.gambar);
      }

      // Submit to API
      const token = localStorage.getItem("token");
      await api.post("/produk", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("Produk berhasil ditambahkan!");
      navigate("/menuProduk");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Gagal menambahkan produk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan? Data yang sudah diisi akan hilang.")) {
      navigate("/menuProduk");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">
          INPUT PRODUK
        </h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {/* Image Upload Section */}
            <div className="mb-8 flex items-center gap-6 justify-center">
              <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden">
                <img
                  src={previewImage || kosong}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border border-gray-300"
                />
              </div>
              <div >
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Unggah gambar produk, maks 500kb
                </label>
                <div className="flex gap-3 items-center w-full max-w-xs p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Buttons */}
                    <label className="cursor-pointer flex-shrink-0">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <div className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                        Unggah
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="max-w-[70%] px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex-1 min-w-0 truncate"
                      title={fileName}
                    >
                      {fileName}
                    </button>
                  </div>
                </div>
              </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Nama Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk
                </label>
                <input
                  type="text"
                  name="namaProduk"
                  value={formData.namaProduk}
                  onChange={handleInputChange}
                  placeholder="masukkan nama produk"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Detail Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detail Produk
                </label>
                <textarea
                  name="detailProduk"
                  value={formData.detailProduk}
                  onChange={handleInputChange}
                  placeholder="masukkan detail produk"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Tanggal Produksi & Jumlah Produksi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Produksi
                  </label>
                  <input
                    type="date"
                    name="tanggalProduksi"
                    value={formData.tanggalProduksi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Produksi/Stok
                  </label>
                  <input
                    type="number"
                    name="jumlahProduksi"
                    value={formData.jumlahProduksi}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Harga Satuan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Satuan
                </label>
                <input
                  type="text"
                  name="hargaSatuan"
                  value={formData.hargaSatuan ? formData.hargaSatuan.toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      hargaSatuan: value
                    }));
                  }}
                  placeholder="Masukkan harga satuan"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    Simpan Produk
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

// EditProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import garis from "../assets/garis.svg";
import api from "../api";
import kosong from "../assets/kosong.png";
import pangsit from "../assets/pangsit.png";

// Data dummy untuk produk
const initialProdukData = {
  id: 1,
  name: "Pangsti",
  description: "Pangsti",
  image: pangsit,
  productionDate: "",
  productionQuantity: "",
  stock: 330,
  price: "Rp 6.000",
  unit: "Pcs"
};

export default function EditProduk() {
  const [user, setUser] = useState(null);
  const [produk, setProduk] = useState(initialProdukData);
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

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

    // Fetch produk data based on ID
    const fetchProduk = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/produk/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Transform API data to match frontend format
        const transformedProduk = {
          id: res.data.id,
          name: res.data.nama_produk,
          description: res.data.detail_produk,
          image: res.data.gambar || kosong,
          productionDate: "",
          productionQuantity: "",
          stock: res.data.stok_tersedia,
          price: res.data.harga_satuan ? res.data.harga_satuan.toString() : "",
          unit: res.data.unit || "Pcs"
        };
        setProduk(transformedProduk);
        setPreviewImage(transformedProduk.image);
      } catch (err) {
        console.error("Error fetching produk:", err);
        // Fallback to dummy data if API fails
        setProduk(initialProdukData);
        setPreviewImage(initialProdukData.image);
      }
    };

    if (id) {
      fetchProduk();
    }
  }, [navigate, id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduk(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Prepare data for API
      formData.append("namaProduk", produk.name);
      formData.append("detailProduk", produk.description);
      formData.append("hargaSatuan", produk.price);
      formData.append("stokTersedia", produk.stock);

      // If there's a new image file, append it
      const imageInput = document.querySelector('input[type="file"]');
      if (imageInput && imageInput.files[0]) {
        formData.append("gambar", imageInput.files[0]);
      }

      const response = await api.put(`/produk/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message
      alert("Produk berhasil diperbarui!");
      navigate(`/detailProduk/${id}`);
    } catch (error) {
      console.error("Error updating produk:", error);
      alert("Terjadi kesalahan saat memperbarui produk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/produk/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Header Section */}
        <div className="pt-4 flex justify-center items-center text-center gap-3">
            <img src={garis} alt="" className="w-[40%]" />
            <h1 className="text-2xl font-bold text-red-900">
            DETAIL PRODUK
            </h1>
            <img src={garis} alt="" className="w-[40%]" />
        </div>

      {/* Main Content */}
      <div className="max-w-xl  mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 border border-2 border-gray-400">
          <div className="flex flex-col gap-4 ">
            {/* Left Column - Image Upload */}
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div className="text-center">
                {/* <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubah Gambar</h3> */}
                <div className="relative inline-block">
                <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  {previewImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewImage.startsWith('http') ? previewImage : `http://localhost:5000${previewImage}`}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <span className="text-white font-medium text-sm">Ubah Gambar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-700 font-medium">Pilih Gambar</span>
                      </div>
                    </div>
                  )}
                </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Format: JPG, PNG, JPEG. Maksimal 2MB
                </p>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              {/* Nama Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk
                </label>
                <input
                  type="text"
                  name="name"
                  value={produk.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              {/* Detail Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detail Produk
                </label>
                <textarea
                  name="description"
                  value={produk.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Masukkan detail produk"
                  required
                />
              </div>

              <div className="flex">
                <div className="w-1/2 mr-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Produksi
                  </label>
                  <input
                    type="date"
                    name="productionDate"
                    value={produk.productionDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Produksi/Stok
                  </label>
                  <input
                    type="number"
                    name="productionQuantity"
                    value={produk.productionQuantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan jumlah produksi"
                  />
                </div>
              </div>

              {/* Additional Info (Editable) */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={produk.stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan stok"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Satuan
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={produk.price ? produk.price.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setProduk(prev => ({
                        ...prev,
                        price: value
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan harga"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-4 pt-1 border-t border-gray-200 justify-center">
            {/* <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isLoading}
            >
              Batal
            </button> */}
            <button
              type="submit"
              className="px-6 py-2 bg-[#FFB10A] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
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
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
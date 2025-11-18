// EditProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import garis from "../assets/garis.svg";
import api from "../api";
import kosong from "../assets/kosong.png";

// Kosongkan data produk awal
const initialProdukData = {
  id: 0,
  name: "",
  description: "", 
  image: null,
  productionDate: "",
  productionQuantity: "",
  stock: 0,
  price: "",
  unit: "Pcs"
};

// 1. HELPER FORMATTER (Di luar komponen)
const formatRibuan = (angka) => {
  if (!angka) return "";
  const raw = angka.toString().replace(/\D/g, "");
  return new Intl.NumberFormat("id-ID").format(raw);
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

    const fetchProduk = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/produk/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const transformedProduk = {
          id: res.data.id,
          name: res.data.nama_produk,
          description: res.data.detail_produk,
          image: res.data.gambar || kosong,
          productionDate: "",
          productionQuantity: "",
          stock: res.data.stok_tersedia,
          // 2. FORMAT SAAT LOAD DATA (DB -> UI)
          price: res.data.harga_satuan ? formatRibuan(res.data.harga_satuan) : "",
          unit: res.data.unit || "Pcs"
        };
        setProduk(transformedProduk);
        setPreviewImage(transformedProduk.image);
      } catch (err) {
        console.error("Error fetching produk:", err);
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
      reader.onloadend = () => setPreviewImage(reader.result);
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
    
    if (!produk.name) {
        alert("Nama Produk wajib diisi!");
        return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      const currentStock = parseInt(produk.stock) || 0;
      const additionalStock = parseInt(produk.productionQuantity) || 0;
      const newTotalStock = currentStock + additionalStock;

      formData.append("namaProduk", produk.name);
      formData.append("detailProduk", produk.description || "");
      
      // 3. BERSIHKAN FORMAT SEBELUM KIRIM (UI -> DB)
      // Ubah "7.500" jadi "7500"
      const cleanPrice = produk.price.toString().replace(/\D/g, '');
      formData.append("hargaSatuan", cleanPrice);
      
      formData.append("stokTersedia", newTotalStock); 
      formData.append("unit", produk.unit); 

      const imageInput = document.querySelector('input[type="file"]');
      if (imageInput && imageInput.files[0]) {
        formData.append("gambar", imageInput.files[0]);
      }

      await api.put(`/produk/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      let successMsg = "Produk berhasil diperbarui!";
      if (additionalStock > 0) {
          successMsg += `\nStok bertambah: +${additionalStock}\nTotal Stok: ${newTotalStock}`;
      }
      alert(successMsg);
      navigate(`/detailProduk/${id}`);
      
    } catch (error) {
      console.error("Error updating produk:", error);
      const msg = error.response?.data?.message || "Terjadi kesalahan saat memperbarui produk";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
        <div className="pt-4 flex justify-center items-center text-center gap-3">
            <img src={garis} alt="" className="w-[40%]" />
            <h1 className="text-2xl font-bold text-red-900">DETAIL PRODUK</h1>
            <img src={garis} alt="" className="w-[40%]" />
        </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 border border-2 border-gray-400">
          <div className="flex flex-col gap-4 ">
            <div className="space-y-6">
              {/* Image Upload (Kode Sama) */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden">
                    {previewImage ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={previewImage.startsWith("data:image") ? previewImage : previewImage.startsWith("http") ? previewImage : `http://localhost:5000${previewImage}`}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => { e.target.onerror = null; e.target.src = kosong; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <span className="text-white font-medium text-sm">Ganti</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                         <span className="text-gray-500 text-xs font-medium">Upload</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Max 2MB (JPG/PNG)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk</label>
                <input type="text" name="name" value={produk.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detail Produk <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <textarea name="description" value={produk.description} onChange={handleInputChange} rows="4" className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Masukkan detail produk (jika ada)" />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Produksi</label>
                  <input type="date" name="productionDate" value={produk.productionDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Produksi/Stok</label>
                  <input type="number" name="productionQuantity" value={produk.productionQuantity} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" placeholder="Tambah Stok (+)" min="0" />
                  <p className="text-xs text-green-600 mt-1">*Isi untuk menambah stok</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok Saat Ini</label>
                  <input type="number" name="stock" value={produk.stock} readOnly className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed" />
                </div>

                {/* --- 4. INPUT HARGA DENGAN FORMATTER --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Satuan</label>
                  <input
                    type="text" // Tipe Text agar bisa menerima titik
                    name="price"
                    value={produk.price}
                    onChange={(e) => {
                      // Ambil input mentah
                      const rawVal = e.target.value;
                      // Format jadi ribuan (misal "7500" -> "7.500")
                      const formatted = formatRibuan(rawVal);
                      
                      setProduk(prev => ({ ...prev, price: formatted }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 7.500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4 pt-1 border-t border-gray-200 justify-center">
            <button type="submit" className="px-6 py-2 bg-[#FFB10A] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2" disabled={isLoading}>
              {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</> : <><i className="fas fa-save"></i> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
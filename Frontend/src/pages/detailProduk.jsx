import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";

// Data dummy untuk detail produk
const produkData = {
  id: 1,
  name: "Kerupuk Kulit Original",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean suscipit tincidunt mauris, eget congue tortor mattis a. Praesent tincidunt mi orci, eu sagittis justo vehicula eu. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In varius est massa, non placerat est cursus non.",
  image: "/kerupuk-kulit.png",
  stock: 350,
  price: "Rp 7.500",
  unit: "Pcs"
};

// Data dummy untuk customers (fallback jika API gagal)
const customersData = [
  {
    id: 1,
    nama: "Pak Iwan",
    produk: "Kerupuk Kulit",
    alamat: "https://maps.app.goo.gl/EtqdHzBSMXAvcqM9"
  },
  {
    id: 2,
    nama: "Bu Darsih",
    produk: "Kerupuk Kulit",
    alamat: "https://maps.app.goo.gl/EtqdHzBSMXAvcqM9"
  },
  {
    id: 3,
    nama: "Pak Nono",
    produk: "Kerupuk Kulit",
    alamat: "https://maps.app.goo.gl/EtqdHzBSMXAvcqM9"
  },
  {
    id: 4,
    nama: "Pak Bagas",
    produk: "Kerupuk Kulit",
    alamat: "https://maps.app.goo.gl/EtqdHzBSMXAvcqM9"
  },
  {
    id: 5,
    nama: "Bu Desi",
    produk: "Kerupuk Kulit",
    alamat: "https://maps.app.goo.gl/EtqdHzBSMXAvcqM9"
  }
];

export default function DetailProduk() {
  const [user, setUser] = useState(null);
  const [produk, setProduk] = useState(produkData);
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
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
          image: res.data.gambar ? `http://localhost:5000${res.data.gambar}` : kosong,
          stock: res.data.stok_tersedia,
          price: res.data.harga_satuan ? `Rp ${parseInt(res.data.harga_satuan).toLocaleString('id-ID')}` : "Rp 0",
          unit: res.data.unit || "Pcs"
        };
        setProduk(transformedProduk);
      } catch (err) {
        console.error("Error fetching produk:", err);
        // Fallback to dummy data if API fails
        setProduk(produkData);
      }
    };

    if (id) {
      fetchProduk();
    }

    // Fetch customers data
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        const token = localStorage.getItem("token");
        const res = await api.get(`/produk/${id}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        // Fallback to dummy data if API fails
        setCustomers(customersData);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    if (id) {
      fetchCustomers();
    }
  }, [navigate, id]);

  const handleEdit = () => {
    // Navigate to edit page with product ID
    navigate(`/produk/edit/${id}`);
  };

  const handleAddCostumer = () => {
    // Navigate to edit page
    // navigate(`/produk/${id}/add-costumer`);
    navigate(`/produk/add-costumer`);
  };

  const handleMapsClick = (url) => {
    window.open(url, '_blank');
  };

  const handleEditCustomer = (customerId) => {
    // Navigate to edit customer page
    navigate(`/produk/customer/edit/${customerId}`);
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus customer ini?")) {
      setCustomers(customers.filter(customer => customer.id !== customerId));
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Product Detail Card */}
        <div className="bg-[#FEF8C1] rounded-xl shadow-md p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <img
                src={produk.image}
                alt={produk.name}
                className="w-72 h-72 object-cover rounded-full"
                style={{ boxShadow: '0 0 40px rgba(255, 177, 10, 0.8)' }}
              />
            </div>

            {/* Product Info */}
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-800">{produk.name}</h2>
              </div>

              {/* Stock and Price Info */}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Deskripsi Produk</h3>
                <p className="text-gray-600 leading-relaxed">
                  {produk.description}
                </p>
              </div>
              <div className="flex gap-8 mb-6 mt-4">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Stok Tersedia</p>
                    <p className="text-lg font-semibold text-gray-800">{produk.stock} {produk.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Harga Satuan</p>
                    <p className="text-lg font-semibold text-gray-800">{produk.price}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEdit}
                className="bg-black hover:bg-grey-600 text-white px-10 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">DETAIL CUSTOMERS</h2>
            <button
                onClick={handleAddCostumer}
                className="bg-gray-400 hover:bg-gray-600 text-white py-0.5 rounded-lg transition-colors flex items-center px-4 text-lg font-bold"
              >
                +
              </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 font-semibold text-gray-700 border-b">No</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 border-b">Nama Pelanggan</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 border-b">Jenis Produk</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 border-b">Alamat Pelanggan</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 border-b">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{customer.nama}</td>
                    <td className="py-3 px-4">{customer.produk}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleMapsClick(customer.alamat)}
                        className="text-blue-500 ml-10  hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
                      >
                        {customer.alamat}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEditCustomer(customer.id)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        <img src={editIcon} alt="Edit" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data customers untuk produk ini
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={() => navigate("/menu-produk")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Ke Menu Produk
          </button>
        </div>
      </div>
    </div>
  );
}
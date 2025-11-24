import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import ceklis from "../assets/ceklis.svg";

const EyeIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.05 10.05 0 012.656-4.484M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

export default function GantiPassword() {
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const toggleShowOldPassword = () => setShowOldPassword(!showOldPassword);
  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Password baru dan konfirmasi password tidak sama!");
      return;
    }
    try {
      await api.post("/auth/change-password", {
        username,
        oldPassword,
        newPassword,
        confirmPassword,
      });
      alert("Password berhasil diubah!");
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert("Gagal mengganti password: " + err.response.data.message);
      } else {
        alert("Gagal mengganti password!");
      }
    }
  };

  const inputClass = "flex-grow p-3 border border-gray-300 rounded-l text-base";
  const toggleButtonClass = "flex items-center bg-white border border-l-0 border-gray-300 rounded-r px-3 cursor-pointer text-gray-600";

  return (
    <div className="flex justify-center items-center bg-gradient-radial from-yellow-400 to-orange-400 w-screen min-h-screen p-6">
      <div className="max-w-md w-full">
        <div className="bg-yellow-100 rounded-full w-24 mx-auto shadow-2xl">
          <img src={logo} alt="Logo" className="block mx-auto -mb-10 w-24" />
        </div>

        <div className="bg-yellow-100 p-10 rounded-xl shadow-2xl w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0_white,-2px_2px_0_white,2px_-2px_0_white,-2px_-2px_0_white,0_0_15px_#3f3a09]">
              KEMBAR BAROKAH
            </h1>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-gray-700 font-semibold text-left"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-base"
              />
            </div>

            <div>
              <label
                htmlFor="oldPassword"
                className="block mb-2 text-gray-700 font-semibold text-left"
              >
                Password Lama
              </label>
              <div className="flex">
                <input
                  type={showOldPassword ? "text" : "password"}
                  id="oldPassword"
                  placeholder="Enter your old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <span
                  className={toggleButtonClass}
                  onClick={toggleShowOldPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showOldPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block mb-2 text-gray-700 font-semibold text-left"
              >
                Password Baru
              </label>
              <div className="flex">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <span
                  className={toggleButtonClass}
                  onClick={toggleShowNewPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-gray-700 font-semibold text-left"
              >
                Konfirmasi Password Baru
              </label>
              <div className="flex">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <span
                  className={toggleButtonClass}
                  onClick={toggleShowConfirmPassword}
                  role="button"
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-black text-white rounded text-base cursor-pointer flex justify-center items-center gap-2.5"
            >
              <img src={ceklis} alt="ceklis" className="w-4.5" />
              Ganti Password
            </button>

            <div className="text-center mt-6">
              <Link to="/" className="text-blue-600 hover:underline">
                Kembali ke Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

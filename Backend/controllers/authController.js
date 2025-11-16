import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = (req, res) => {
  const { username, password } = req.body;

  // Validasi input
  const validationErrors = User.validateRegister({ username, password });
  if (validationErrors.length > 0) {
    return res.status(400).json({ message: "Data tidak valid", errors: validationErrors });
  }

  // Cek apakah username sudah ada
  const checkSql = "SELECT id FROM users WHERE username = ?";
  db.query(checkSql, [username], (err, data) => {
    if (err) return res.status(500).json({ message: "Error memeriksa username", error: err });

    if (data.length > 0) {
      return res.status(409).json({ message: "Username sudah digunakan" });
    }

    // Hash password dan insert user baru
    const hashedPassword = bcrypt.hashSync(password, 10);
    const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(insertSql, [username, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ message: "Error mendaftarkan user", error: err });

      res.json({
        message: "User berhasil didaftarkan",
        user: {
          id: result.insertId,
          username: username
        }
      });
    });
  });
};

export const login = (req, res) => {
  const { username, password } = req.body;

  // Validasi input
  const validationErrors = User.validateLogin({ username, password });
  if (validationErrors.length > 0) {
    return res.status(400).json({ message: "Data tidak valid", errors: validationErrors });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, data) => {
    if (err) return res.status(500).json({ message: "Error mencari user", error: err });
    if (data.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    const validPass = bcrypt.compareSync(password, data[0].password);
    if (!validPass) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign({ id: data[0].id }, "secretkey", { expiresIn: "24h" });
    const user = new User(data[0]);

    res.json({
      message: "Login berhasil",
      token: token,
      user: user.toJSON()
    });
  });
};

export const getUser = (req, res) => {
  const userId = req.userId;
  const sql = "SELECT id, username FROM users WHERE id = ?";
  db.query(sql, [userId], (err, data) => {
    if (err) return res.status(500).json({ message: "Error mengambil data user", error: err });
    if (data.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    const user = new User(data[0]);
    res.json(user.toJSON());
  });
};

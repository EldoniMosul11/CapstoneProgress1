import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, hashedPassword], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User registered" });
  });
};

export const login = (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json({ message: "User not found" });

    const validPass = bcrypt.compareSync(password, data[0].password);
    if (!validPass) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign({ id: data[0].id }, "secretkey", { expiresIn: "1h" });
    res.json({ token });
  });
};

export const getUser = (req, res) => {
  const userId = req.userId;
  const sql = "SELECT id, username FROM users WHERE id = ?";
  db.query(sql, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data[0]);
  });
};

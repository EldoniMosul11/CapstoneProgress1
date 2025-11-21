import db from './config/db.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  produk_id INT NOT NULL,
  alamat TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
);
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table customers created successfully');
  }
  process.exit();
});

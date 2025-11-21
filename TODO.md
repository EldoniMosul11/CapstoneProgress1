# TODO: Implement Customer Management System

## Backend Tasks
- [ ] Create Customer model (Backend/models/Customer.js)
- [ ] Create DB table 'customers' with columns: id (AUTO_INCREMENT), nama (VARCHAR), produk_id (INT), alamat (TEXT), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- [ ] Create customerController.js (Backend/controllers/customerController.js) with CRUD methods
- [ ] Create customer routes (Backend/routes/customer.js)
- [ ] Update server.js to include customer routes

## Frontend Tasks
- [ ] Create tambahCustomer.jsx page (Frontend/src/pages/tambahCustomer.jsx) matching tambahProduk style
- [ ] Create editCustomer.jsx page (Frontend/src/pages/editCustomer.jsx)
- [ ] Update detailProduk.jsx to fetch customers from API (filter by produk_id)
- [ ] Update App.jsx to add routes for tambahCustomer and editCustomer
- [ ] Update api.js if needed for customer endpoints

## Testing
- [ ] Test adding customer
- [ ] Test editing customer
- [ ] Test deleting customer
- [ ] Test displaying customers in detailProduk

import pandas as pd
import numpy as np
import joblib
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from pandas.tseries.offsets import DateOffset
from sqlalchemy import create_engine

# --- 0. Inisialisasi Aplikasi Flask ---
app = Flask(__name__)
CORS(app)  # Mengizinkan CORS untuk semua domain (untuk pengujian lokal)

# --- 1. DEKLARASI KONEKSI DB & VARIABEL GLOBAL ---
# =================================================
# SESUAIKAN INI DENGAN PENGATURAN DATABASE ANDA
DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "kembarbarokahdb"

# Buat koneksi engine
DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
g_db_engine = create_engine(DATABASE_URI)

# Variabel ini akan dimuat SEKALI saat server start
g_models = {}
g_scalers = {}
g_scalers_features_only = {} # Scaler HANYA untuk fitur masa depan
g_holiday_set = None
g_window_size = 4

g_product_prices = {
    "Kerupuk Kulit": 7500,
    "Stik Bawang": 6000,
    "Keripik Bawang": 5000
}
g_product_list = ["Kerupuk Kulit", "Stik Bawang", "Keripik Bawang"]


# --- 2. FUNGSI HELPER (Sama seperti sebelumnya) ---
# =================================================

def load_holidays(holiday_csv_path):
    print(f"Memuat data hari libur dari: {holiday_csv_path}")
    try:
        df_holidays = pd.read_csv(holiday_csv_path)
        date_column_name = 'Tanggal'
        df_holidays['Tanggal_Penuh'] = df_holidays[date_column_name] + ' 2025'
        df_holidays['Tanggal_Datetime'] = pd.to_datetime(df_holidays['Tanggal_Penuh'], format='%d %B %Y')
        holiday_set = set(df_holidays['Tanggal_Datetime'].dt.normalize())
        print("Data hari libur berhasil dimuat.")
        return holiday_set
    except Exception as e:
        print(f"Error memuat data hari libur: {e}")
        return None

def inverse_transform_helper(scaled_values, scaler, n_features):
    scaled_values = np.array(scaled_values).flatten()
    dummy = np.zeros((len(scaled_values), n_features))
    dummy[:, 0] = scaled_values
    inv = scaler.inverse_transform(dummy)[:, 0]
    return inv

def get_future_calendar_features(date_range, holiday_set):
    features = []
    for date in date_range:
        start_week = (date - DateOffset(days=6)).normalize()
        end_week = date.normalize()
        week_range = pd.date_range(start_week, end_week)
        is_gajian = any(d.day >= 25 or d.day <= 3 for d in week_range)
        is_libur = any(d in holiday_set for d in week_range)
        features.append({
            'Tanggal_Audit': date,
            'is_minggu_gajian': 1 if is_gajian else 0,
            'is_libur_nasional': 1 if is_libur else 0
        })
    return pd.DataFrame(features)

# --- FUNGSI QUERY UPDATE (Sesuai Tabel 'audit_data' & 'produk') ---
def get_historical_data_from_db(product_name, n_weeks):
    """
    Mengambil data dari tabel PRODUKSI ('audit_data' dan 'produk').
    """
    print(f"Mengambil {n_weeks} data terakhir dari DB untuk {product_name}...")
    
    # Query dengan JOIN yang benar sesuai screenshot
    query = f"""
        SELECT 
            t1.tanggal as Tanggal_Audit, 
            t1.jumlah as Jumlah_Produk_Terjual
        FROM audit_data t1
        JOIN produk t2 ON t1.produk_id = t2.id
        WHERE 
            t2.nama_produk = '{product_name}'
            AND t1.jenis_transaksi = 'penjualan' 
        ORDER BY t1.tanggal DESC 
        LIMIT {n_weeks + 1}
    """
    
    with g_db_engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    # Cek jika data kosong (Penyebab Error 500 Anda)
    if df.empty or len(df) < (n_weeks + 1):
        print(f"ERROR: Data tidak ditemukan di tabel 'audit_data' untuk {product_name}.")
        print("Saran: Pastikan Anda sudah menjalankan 'seed_production.py' untuk mengisi tabel ini.")
        raise Exception(f"Data DB Kurang. Ditemukan: {len(df)}, Butuh: {n_weeks+1}")
        
    # Sorting & Formatting
    df = df.sort_values(by='Tanggal_Audit', ascending=True)
    df['Tanggal_Audit'] = pd.to_datetime(df['Tanggal_Audit'])

    # Feature Engineering
    df['Nama_Produk'] = product_name 
    df['Jumlah_Terjual_Minggu_Lalu'] = df['Jumlah_Produk_Terjual'].shift(1)
    
    # Fitur Kalender
    df_calendar_features = get_future_calendar_features(df['Tanggal_Audit'], g_holiday_set)
    df = pd.merge(df, df_calendar_features, on='Tanggal_Audit', how='left')

    df = df.dropna()
    df_final = df.tail(n_weeks)
    
    return df_final.set_index('Tanggal_Audit')

# --- 3. FUNGSI STARTUP (Memuat model & scaler) ---
# =================================================
def load_all_artifacts():
    """
    Memuat SEMUA model, scaler, dan data libur ke memori.
    TIDAK memuat data historis.
    """
    global g_holiday_set, g_models, g_scalers, g_scalers_features_only
    
    print("Memuat semua artefak (Model, Scaler, Hari Libur)...")
    
    # 1. Muat data hari libur
    holiday_csv_path = 'Tanggal Libur Nasional 2025.csv' # SESUAIKAN NAMA FILE
    g_holiday_set = load_holidays(holiday_csv_path)
    if g_holiday_set is None:
        raise Exception("Gagal memuat data hari libur. Server berhenti.")

    # 2. Muat model & scaler per produk
    for product in g_product_list:
        product_key = product.replace(' ', '_')
        model_path = os.path.join('models', f'model_{product_key}.h5')
        scaler_path = os.path.join('models', f'scaler_{product_key}.save')
        scaler_features_path = os.path.join('models', f'scaler_features_{product_key}.save')
        
        print(f"Memuat artefak untuk: {product}")
        
        if not all(os.path.exists(p) for p in [model_path, scaler_path, scaler_features_path]):
            print(f"WARNING: File (model/scaler/scaler_features) untuk {product} tidak ditemukan!")
            continue

        g_models[product] = load_model(model_path, compile=False)
        g_scalers[product] = joblib.load(scaler_path)
        g_scalers_features_only[product] = joblib.load(scaler_features_path) # MEMUAT SCALER FITUR

    print("--- Semua artefak berhasil dimuat. Server siap. ---")


# --- 4. ENDPOINT API (Fungsi Prediksi Dimodifikasi) ---
# =================================================

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint utama yang akan dipanggil oleh Node.js (atau frontend dummy).
    Sekarang mengembalikan data historis DAN prediksi.
    """
    try:
        data = request.get_json()
        product_name = data.get('product_name')
        forecast_steps = data.get('forecast_steps', 1)
        forecast_steps = int(forecast_steps)
        
        # Berapa banyak data historis yang ingin Anda tampilkan di chart
        n_history_weeks = 5 

        if product_name not in g_models:
            return jsonify({"error": f"Produk tidak valid: {product_name}"}), 400

        # --- Bagian Prediksi (Sama seperti sebelumnya) ---
        
        # 1. Ambil artefak
        model = g_models[product_name]
        scaler = g_scalers[product_name]
        scaler_features_only = g_scalers_features_only[product_name]
        
        # 2. Ambil data historis TERBARU dari DB (untuk window prediksi)
        df_hist_window = get_historical_data_from_db(product_name, n_weeks=g_window_size)
        df_hist_features = df_hist_window[[
            'Jumlah_Produk_Terjual', 'Jumlah_Terjual_Minggu_Lalu', 
            'is_minggu_gajian', 'is_libur_nasional'
        ]]
        n_features = df_hist_features.shape[1]

        # 3. Scale data historis
        scaled_data = scaler.transform(df_hist_features)
        current_window = scaled_data.copy()
        
        # 4. Buat fitur kalender masa depan
        last_hist_date = df_hist_window.index[-1]
        future_dates = pd.date_range(start=last_hist_date + DateOffset(weeks=1), periods=forecast_steps, freq='W-MON')
        df_future_features_raw = get_future_calendar_features(future_dates, g_holiday_set)
        
        # 5. Scale fitur masa depan
        future_features_scaled = scaler_features_only.transform(df_future_features_raw[['is_minggu_gajian', 'is_libur_nasional']])
        
        # 6. Loop prediksi rekursif
        forecast_scaled = []
        for i in range(forecast_steps):
            pred_scaled = model.predict(np.expand_dims(current_window, axis=0))[0]
            forecast_scaled.append(pred_scaled[0])
            new_row = np.array([
                pred_scaled[0], current_window[-1, 0],
                future_features_scaled[i, 0], future_features_scaled[i, 1]
            ])
            current_window = np.append(current_window[1:], [new_row], axis=0)

        # 7. Invers transform hasil akhir
        forecast_values = inverse_transform_helper(forecast_scaled, scaler, n_features)
        forecast_values = np.ceil(forecast_values)
        
        # --- Bagian Data Historis (BARU) ---
        
        # 8. Ambil N data historis terakhir dari DB (untuk plot)
        # Kita panggil fungsi helper lagi, tapi kali ini untuk N minggu
        df_hist_chart = get_historical_data_from_db(product_name, n_weeks=n_history_weeks)
        
        # Format data historis untuk JSON
        historical_json = []
        for date, row in df_hist_chart.iterrows():
            historical_json.append({
                "tanggal": date.strftime('%Y-%m-%d'),
                "jumlah": int(row['Jumlah_Produk_Terjual'])
            })
            
        # 9. Siapkan respons JSON
        forecast_json = []
        product_price = g_product_prices.get(product_name, 0)
        for date, value in zip(future_dates, forecast_values):
            revenue = float(value) * product_price
            forecast_json.append({
                "tanggal_audit": date.strftime('%Y-%m-%d'),
                "produk": product_name,
                "prediksi_jumlah_terjual": int(value),
                "prediksi_pendapatan": int(revenue)
            })

        # 10. Kembalikan JSON gabungan
        return jsonify({
            "historical_data": historical_json,
            "forecast_data": forecast_json
        }), 200

    except Exception as e:
        print(f"Error pada endpoint /predict: {e}")
        return jsonify({"error": f"Terjadi kesalahan internal: {str(e)}"}), 500
    
# --- 5. Jalankan Server ---
# =================================================
if __name__ == '__main__':
    # Panggil fungsi startup SEKALI
    load_all_artifacts()
    app.run(host='0.0.0.0', port=5001, debug=False)
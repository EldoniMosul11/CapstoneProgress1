// src/components/PieChart.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrasi Plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = ({ data }) => {
  if (!data || data.datasets[0].data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Belum ada data minggu ini</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, padding: 20, font: { size: 13 } }
      },
      // Konfigurasi Data Labels (Persentase)
      datalabels: {
        color: '#fff', // Warna teks putih
        font: {
          weight: 'bold',
          size: 16
        },
        formatter: (value, ctx) => {
          // Hitung total data
          const datasets = ctx.chart.data.datasets;
          if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
            const sum = datasets[0].data.reduce((a, b) => a + b, 0);
            // Hitung persentase
            const percentage = Math.round((value / sum) * 100) + '%';
            
            // Hanya tampilkan jika persentase > 5% (biar tidak numpuk)
            return (value / sum) > 0.05 ? percentage : '';
          } else {
            return '';
          }
        }
      }
    }
  };

  return <Pie data={data} options={options} />;
};

export default PieChart;
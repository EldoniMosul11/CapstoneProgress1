// src/components/BarChart.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data }) => {
  if (!data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Memuat data...</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      datalabels: {
        display: false 
      }
    },
    scales: {
        y: { beginAtZero: true, title: {display: true, text: 'Jumlah Terjual (Pcs)'} }
    }
  };

  return <Bar options={options} data={data} />;
};

export default BarChart;
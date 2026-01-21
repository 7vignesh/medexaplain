'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getParameterTrend } from '@/lib/api';
import { TrendData } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  parameterName: string;
}

export default function TrendChart({ parameterName }: TrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [parameterName]);

  const fetchTrendData = async () => {
    try {
      const response = await getParameterTrend(parameterName);
      setTrendData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (trendData.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{parameterName}</h4>
        <p className="text-xs text-gray-500">Not enough data to show trend</p>
      </div>
    );
  }

  const chartData = {
    labels: trendData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: parameterName,
        data: trendData.map(d => d.value),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} ${trendData[0].unit || ''}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h4 className="text-sm font-medium text-gray-900 mb-4">{parameterName} Trend</h4>
      <div style={{ height: '200px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

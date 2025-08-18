import React from 'react';
import { Paper, Typography } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const SubscriptionChart = () => {
  const data = {
    labels: ['Básica', 'Estándar', 'Premium', 'Empresarial'],
    datasets: [
      {
        data: [15, 22, 8, 5],
        backgroundColor: [
          '#1976d2', // azul
          '#2196f3', // azul claro
          '#ff9800', // naranja
          '#4caf50', // verde
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Distribución de Suscripciones
      </Typography>
      <Box sx={{ height: 300 }}>
        <Pie data={data} options={options} />
      </Box>
    </Paper>
  );
};

export default SubscriptionChart;
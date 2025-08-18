import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, LinearProgress } from '@mui/material';
import { AccessTime, CheckCircle, Warning, Error } from '@mui/icons-material';

const lockerStatus = {
  available: { text: 'Disponible', color: 'success', icon: <CheckCircle /> },
  occupied: { text: 'Ocupado', color: 'primary', icon: <AccessTime /> },
  maintenance: { text: 'Mantenimiento', color: 'warning', icon: <Warning /> },
  outOfService: { text: 'Fuera de servicio', color: 'error', icon: <Error /> },
};

const RealTimeStatus = () => {
  const [statusData, setStatusData] = useState({
    totalLockers: 50,
    available: 32,
    occupied: 15,
    maintenance: 2,
    outOfService: 1,
    recentActivity: [
      { id: 1, locker: 'A12', user: 'Juan Pérez', time: '2 min ago', action: 'check-in' },
      { id: 2, locker: 'B05', user: 'María García', time: '5 min ago', action: 'check-out' },
      { id: 3, locker: 'C08', user: 'Carlos López', time: '12 min ago', action: 'reservation' },
    ],
  });

  // Simular actualización en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusData(prev => ({
        ...prev,
        recentActivity: [
          {
            id: Date.now(),
            locker: `A${Math.floor(Math.random() * 20) + 1}`,
            user: ['Juan Pérez', 'María García', 'Carlos López'][Math.floor(Math.random() * 3)],
            time: 'justo ahora',
            action: ['check-in', 'check-out', 'reservation'][Math.floor(Math.random() * 3)],
          },
          ...prev.recentActivity.slice(0, 2),
        ],
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Estado en Tiempo Real
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        {Object.entries(lockerStatus).map(([key, { text, color, icon }]) => (
          <Grid item xs={6} sm={3} key={key}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <Box mr={1} color={`${color}.main`}>{icon}</Box>
                <Typography variant="subtitle1">{text}</Typography>
              </Box>
              <Typography variant="h4">{statusData[key] || 0}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(statusData[key] / statusData.totalLockers) * 100} 
                color={color}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" gutterBottom>
        Actividad Reciente
      </Typography>
      <Box>
        {statusData.recentActivity.map((activity) => (
          <Box 
            key={activity.id} 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            py={1.5}
            borderBottom="1px solid rgba(0, 0, 0, 0.12)"
          >
            <Box>
              <Typography fontWeight="bold">{activity.locker}</Typography>
              <Typography variant="body2" color="textSecondary">{activity.user}</Typography>
            </Box>
            <Box>
              <Chip
                label={activity.action === 'check-in' ? 'Entrada' : 
                      activity.action === 'check-out' ? 'Salida' : 'Reserva'}
                color={activity.action === 'check-in' ? 'primary' : 
                      activity.action === 'check-out' ? 'secondary' : 'info'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {activity.time}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default RealTimeStatus;
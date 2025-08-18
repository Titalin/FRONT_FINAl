import React from 'react';
import { Box } from '@mui/material';
import logo from '../../assets/logo4.PNG'; // Asegúrate de mover la imagen aquí

const Logo = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" p={2}>
      <img
        src={logo}
        alt="Bodegix Logo"
        style={{ height: 40, objectFit: 'contain' }}
      />
    </Box>
  );
};

export default Logo;

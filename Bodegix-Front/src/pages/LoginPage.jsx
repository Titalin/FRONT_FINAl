// src/pages/LoginPage.jsx

import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import Logo from '../components/common/Logo';

const LoginPage = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(to bottom right, #0d1b2a, #1b263b)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 5,
            borderRadius: 5,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#0d1b2a', // Fondo oscuro para el logo
              p: 2,
              borderRadius: 2,
              mb: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Logo />
          </Box>
          <LoginForm />
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;

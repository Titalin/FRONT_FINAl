import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul para botones y elementos primarios
    },
    secondary: {
      main: '#ff9800', // Naranja
    },
    background: {
      default: '#22314e', // Azul más oscuro para fondo principal
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;

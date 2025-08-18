import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import Sidebar from '../../components/Layout/Sidebar';
import api from '../../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const arr = (v) => (Array.isArray(v) ? v : v?.data ?? []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/usuarios');
        setUsers(arr(data));
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    (user.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.correo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box display="flex">
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Box display="flex" justifyContent="space-between" mb={3} mt={2}>
          <TextField
            variant="outlined"
            placeholder="Buscar usuarios..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white' }}>Correo</TableCell>
                <TableCell sx={{ color: 'white' }}>Empresa</TableCell>
                <TableCell sx={{ color: 'white' }}>Rol</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id || 'N/A'}</TableCell>
                  <TableCell>{user.nombre || 'N/A'}</TableCell>
                  <TableCell>{user.correo || 'N/A'}</TableCell>
                  <TableCell>{user.empresa?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    {String(user.rol_id) === '1' ? 'SuperAdmin' : String(user.rol_id) === '2' ? 'Admin Empresa' : 'Empleado'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default UsersPage;

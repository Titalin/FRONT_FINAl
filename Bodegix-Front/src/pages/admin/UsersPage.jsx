import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Typography, Stack, Chip, ToggleButtonGroup,
  ToggleButton, IconButton, Skeleton, Tooltip,
} from '@mui/material';
import { Search as SearchIcon, Cached as CachedIcon, People as PeopleIcon, Business as BusinessIcon } from '@mui/icons-material';
import Sidebar from '../../components/Layout/Sidebar';
import api from '../../services/api';

const roleLabel = (r) => (r === 1 ? 'SuperAdmin' : r === 2 ? 'Admin Empresa' : 'Empleado');
const roleColor = (r) => (r === 1 ? 'secondary' : r === 2 ? 'info' : 'success');

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/usuarios/admin'); // SIN /api
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const url = (err?.config?.baseURL || '') + (err?.config?.url || '');
      console.error('Error al obtener usuarios:', {
        url, status: err?.response?.status,
        ctype: err?.response?.headers?.['content-type'],
        body: typeof err?.response?.data === 'string' ? err.response.data.slice(0,200) : err?.response?.data,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const sortedUsers = useMemo(() => {
    const arr = [...users];
    arr.sort((a, b) => {
      const empresaA = (a?.empresa?.nombre || '').toLowerCase();
      const empresaB = (b?.empresa?.nombre || '').toLowerCase();
      if (empresaA !== empresaB) return empresaA.localeCompare(empresaB);
      return (a?.nombre || '').toLowerCase().localeCompare((b?.nombre || '').toLowerCase());
    });
    return arr;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedUsers.filter((u) => {
      const matchesText =
        !q ||
        String(u?.nombre || '').toLowerCase().includes(q) ||
        String(u?.correo || '').toLowerCase().includes(q) ||
        String(u?.empresa?.nombre || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'todos' ? true : String(u?.rol_id) === String(roleFilter);
      return matchesText && matchesRole;
    });
  }, [sortedUsers, search, roleFilter]);

  const kpis = useMemo(() => {
    const total = users.length;
    const sadmin = users.filter((u) => Number(u.rol_id) === 1).length;
    const admin = users.filter((u) => Number(u.rol_id) === 2).length;
    const emp = users.filter((u) => Number(u.rol_id) === 3).length;
    return { total, sadmin, admin, emp };
  }, [users]);

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)' }}>
      <Sidebar />
      <Box flexGrow={1} p={0}>
        <Box sx={{ background: 'linear-gradient(135deg, #1976d2 60%, #00c6fb 100%)', px: 3, py: 2, borderRadius: '0 0 18px 18px', color: '#fff', mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
              <TextField
                size="small"
                placeholder="Buscar por nombre, correo o empresa…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#fff' }} /></InputAdornment>) }}
                sx={{ minWidth: 250, '& .MuiInputBase-root': { color: '#fff', height: 36 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' } }}
              />
              <ToggleButtonGroup
                exclusive size="small" value={roleFilter}
                onChange={(_e, v) => v && setRoleFilter(v)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, height: 36,
                  '& .MuiToggleButton-root': { color: '#fff', border: 'none', px: 1 },
                  '& .Mui-selected': { bgcolor: 'rgba(255,255,255,0.28) !important', fontWeight: 700 },
                }}
              >
                <ToggleButton value="todos">Todos</ToggleButton>
                <ToggleButton value="1">SuperAdmin</ToggleButton>
                <ToggleButton value="2">Admin</ToggleButton>
                <ToggleButton value="3">Empleado</ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Refrescar">
                <span><IconButton onClick={fetchUsers} sx={{ color: '#fff', p: 0.5 }}><CachedIcon fontSize="small" /></IconButton></span>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={1}>
              {[
                { label: 'Usuarios', value: kpis.total, icon: <PeopleIcon fontSize="small" /> },
                { label: 'SA', value: kpis.sadmin, color: 'secondary' },
                { label: 'AD', value: kpis.admin, color: 'info' },
                { label: 'EMP', value: kpis.emp, color: 'success' },
              ].map((k) => (
                <Paper key={k.label} elevation={4}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', minWidth: 70, textAlign: 'center' }}>
                  <Typography variant="subtitle2" fontWeight={700}>{k.value}</Typography>
                  <Typography variant="caption">{k.label}</Typography>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Box>

        <Box px={2} pb={3}>
          <TableContainer component={Paper}
            sx={{ borderRadius: 2, boxShadow: '0 6px 20px rgba(0,0,0,0.18)', overflow: 'hidden', bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#13203b', color: '#e6e9ef', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.12)', py: 1 } }}>
                  <TableCell>Usuario</TableCell><TableCell>Correo</TableCell><TableCell>Empresa</TableCell><TableCell width={120}>Rol</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? [...Array(8)].map((_, i) => (
                      <TableRow key={`sk-${i}`}><TableCell colSpan={4} sx={{ py: 0.5 }}>
                        <Skeleton variant="text" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} /></TableCell></TableRow>
                    ))
                  : filteredUsers.map((user, index) => (
                      <TableRow key={user.id} hover
                        sx={{ bgcolor: index % 2 ? 'rgba(255,255,255,0.02)' : 'transparent', '& td': { color: '#e6e9ef', py: 0.8 } }}>
                        <TableCell>{user?.nombre || 'N/A'}</TableCell>
                        <TableCell>{user?.correo || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip icon={<BusinessIcon sx={{ color: '#fff !important' }} />} label={user?.empresa?.nombre || 'N/A'} size="small"
                            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)', '& .MuiChip-icon': { color: '#fff' } }} />
                        </TableCell>
                        <TableCell><Chip label={roleLabel(user?.rol_id)} color={roleColor(user?.rol_id)} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                      </TableRow>
                    ))}
                {!loading && filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 2, color: '#b7c2d9' }}>No se encontraron usuarios.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

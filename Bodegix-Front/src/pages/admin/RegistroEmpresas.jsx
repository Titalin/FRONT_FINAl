// src/pages/admin/RegistroEmpresas.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Skeleton,
} from '@mui/material';
import Sidebar from '..//components/Layout/Sidebar';

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import api from '../services/api';

// ---------- Helpers de normalización ----------
const toKey = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const normalizeEmpresa = (e) => {
  const key =
    toKey(e?.id) ??
    toKey(e?.empresa_id) ??
    toKey(e?.id_empresa) ??
    toKey(e?.company_id) ??
    toKey(e?.empresaId) ??
    toKey(e?.empresa?.id);

  return {
    ...e,
    __key: key,
    id: e?.id ?? e?.empresa_id ?? e?.id_empresa ?? e?.empresa?.id ?? key,
    nombre: e?.nombre ?? e?.name ?? e?.razon_social ?? e?.razonSocial ?? '',
    telefono: e?.telefono ?? e?.phone ?? '',
    direccion: e?.direccion ?? e?.address ?? '',
  };
};

const normalizeUsuario = (u) => {
  const empKey =
    toKey(u?.empresa_id) ??
    toKey(u?.empresaId) ??
    toKey(u?.company_id) ??
    toKey(u?.id_empresa) ??
    toKey(u?.empresa?.id) ??
    toKey(u?.company?.id);

  let rol_id =
    u?.rol_id ?? u?.role_id ?? u?.rol ?? u?.role ?? u?.rol?.id ?? u?.role?.id;

  if (rol_id === undefined || rol_id === null || rol_id === '') {
    const roleName = String(
      u?.rol_nombre ??
      u?.role_name ??
      u?.rol?.nombre ??
      u?.role?.name ??
      u?.roleName ??
      u?.rolName ??
      ''
    ).toLowerCase();
    if (roleName.includes('admin')) rol_id = 2;
    if (roleName.includes('emple')) rol_id = 3;
  }

  const nRol = Number(rol_id);
  const rol = Number.isNaN(nRol) ? rol_id : nRol;

  return { ...u, __empKey: empKey, rol_id: rol };
};

const RegistroEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [formEmpresa, setFormEmpresa] = useState({ nombre: '', telefono: '', direccion: '' });
  const [formAdmin, setFormAdmin] = useState({ nombre: '', correo: '', contraseña: '' });

  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchEmpresasYUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const [empRes, usrRes] = await Promise.all([
        fetch('/empresas', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/usuarios/admin', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const empresasDataRaw = await empRes.json().catch(() => []);
      const usuariosDataRaw = await usrRes.json().catch(() => []);

      const empresasFuente = Array.isArray(empresasDataRaw)
        ? empresasDataRaw
        : empresasDataRaw?.data ?? empresasDataRaw?.empresas ?? empresasDataRaw?.items ?? [];

      const usuariosFuente = Array.isArray(usuariosDataRaw)
        ? usuariosDataRaw
        : usuariosDataRaw?.data ?? usuariosDataRaw?.usuarios ?? usuariosDataRaw?.items ?? [];

      const empresasNormalizadas = empresasFuente.map(normalizeEmpresa);
      const usuariosNormalizados = usuariosFuente.map(normalizeUsuario);

      setEmpresas(empresasNormalizadas);
      setUsuarios(usuariosNormalizados);
    } catch (err) {
      console.error('Error al obtener empresas o usuarios:', err);
      setError('No se pudieron cargar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresasYUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Conteos por empresa (empleados y admins)
  const conteosPorKey = useMemo(() => {
    const map = new Map();
    for (const u of usuarios) {
      const key = u?.__empKey;
      if (!key) continue;

      const nRol = Number(u?.rol_id);
      const rol = Number.isNaN(nRol) ? u?.rol_id : nRol;

      if (!map.has(key)) map.set(key, { empleados: 0, admins: 0 });
      if (rol === 3 || String(rol) === '3') map.get(key).empleados++;
      if (rol === 2 || String(rol) === '2') map.get(key).admins++;
    }
    return map;
  }, [usuarios]);

  // Búsqueda
  const empresasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(
      (e) =>
        String(e?.nombre || '').toLowerCase().includes(q) ||
        String(e?.telefono || '').toLowerCase().includes(q) ||
        String(e?.direccion || '').toLowerCase().includes(q)
    );
  }, [empresas, busqueda]);

  // Handlers form empresa
  const handleEmpresaChange = (e) => {
    setFormEmpresa({ ...formEmpresa, [e.target.name]: e.target.value });
  };

  const handleEmpresaSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const res = await fetch('/empresas', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formEmpresa),
      });

      if (!res.ok) throw new Error('Error al registrar empresa');
      await fetchEmpresasYUsuarios();
      setFormEmpresa({ nombre: '', telefono: '', direccion: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo registrar la empresa.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSeleccionEmpresa = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setFormEmpresa({
      nombre: empresa?.nombre || '',
      telefono: empresa?.telefono || '',
      direccion: empresa?.direccion || '',
    });
    setFormAdmin({ nombre: '', correo: '', contraseña: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActualizarEmpresa = async (e) => {
    e.preventDefault();
    if (!empresaSeleccionada) return;

    try {
      setLoadingAction(true);
      const res = await fetch(`/empresas/${empresaSeleccionada.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formEmpresa),
      });

      if (!res.ok) throw new Error('Error al actualizar empresa');
      await fetchEmpresasYUsuarios();
      setEmpresaSeleccionada(null);
      setFormEmpresa({ nombre: '', telefono: '', direccion: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo actualizar la empresa.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handlers form admin
  const handleAdminChange = (e) => {
    setFormAdmin({ ...formAdmin, [e.target.name]: e.target.value });
  };

  const handleAgregarAdmin = async (e) => {
    e.preventDefault();
    if (!empresaSeleccionada) return;

    try {
      setLoadingAction(true);
      const res = await fetch('/usuarios', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formAdmin,
          rol_id: 2, // Admin Empresa
          empresa_id: empresaSeleccionada.id,
        }),
      });

      if (!res.ok) throw new Error('Error al crear usuario admin empresa');
      await fetchEmpresasYUsuarios();
      setFormAdmin({ nombre: '', correo: '', contraseña: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo crear el admin de empresa.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)', color: '#e6e9ef' }}>
      <Sidebar />

      <Box flexGrow={1} p={3}>
        {/* Hero */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1976d2 60%, #00c6fb 100%)',
            color: '#fff',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Registro y Administración de Empresas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.92 }}>
                Crea empresas, edítalas y agrega administradores de empresa (rol 2).
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<BusinessIcon sx={{ color: '#fff !important' }} />} label={`${empresas.length} empresas`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
              <IconButton color="inherit" onClick={fetchEmpresasYUsuarios} title="Refrescar">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {!!error && (
          <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form Empresa */}
        <Paper
          elevation={6}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            {empresaSeleccionada ? 'Editar Empresa Seleccionada' : 'Registrar Nueva Empresa'}
          </Typography>

          <Box component="form" onSubmit={empresaSeleccionada ? handleActualizarEmpresa : handleEmpresaSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formEmpresa.nombre}
                  onChange={handleEmpresaChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    input: { color: '#e6e9ef' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={formEmpresa.telefono}
                  onChange={handleEmpresaChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    input: { color: '#e6e9ef' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Dirección"
                  name="direccion"
                  value={formEmpresa.direccion}
                  onChange={handleEmpresaChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlaceIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    input: { color: '#e6e9ef' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                  }}
                />
              </Grid>

              <Grid item xs={12} md="auto">
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loadingAction} sx={{ height: '100%' }}>
                  {empresaSeleccionada ? 'Actualizar Empresa' : 'Registrar Empresa'}
                </Button>
              </Grid>

              {empresaSeleccionada && (
                <Grid item xs={12} md="auto">
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setEmpresaSeleccionada(null);
                      setFormEmpresa({ nombre: '', telefono: '', direccion: '' });
                      setFormAdmin({ nombre: '', correo: '', contraseña: '' });
                    }}
                    sx={{ height: '100%' }}
                  >
                    Cancelar edición
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>

        {/* Form Admin Empresa (solo al seleccionar una empresa) */}
        {empresaSeleccionada && (
          <Paper
            elevation={6}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              Agregar Admin Empresa a <b>{empresaSeleccionada.nombre}</b>
            </Typography>

            <Box component="form" onSubmit={handleAgregarAdmin} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={formAdmin.nombre}
                    onChange={handleAdminChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AdminPanelSettingsIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      input: { color: '#e6e9ef' },
                      '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Correo"
                    name="correo"
                    value={formAdmin.correo}
                    onChange={handleAdminChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      input: { color: '#e6e9ef' },
                      '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Contraseña"
                    name="contraseña"
                    type="password"
                    value={formAdmin.contraseña}
                    onChange={handleAdminChange}
                    fullWidth
                    required
                    sx={{
                      input: { color: '#e6e9ef' },
                      '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7ba7ff' } },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loadingAction}>
                    Agregar Admin Empresa
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}

        {/* Barra de búsqueda + Tabla */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Empresas Registradas
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Buscar por nombre, teléfono o dirección…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 320,
                  input: { color: '#e6e9ef' },
                }}
              />
              <IconButton color="primary" onClick={fetchEmpresasYUsuarios} title="Refrescar">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

          <TableContainer sx={{ borderRadius: 2, maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      bgcolor: '#13203b',
                      color: '#dfe6f5',
                      fontWeight: 700,
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Empleados</TableCell>
                  <TableCell>Admins</TableCell>
                  <TableCell width={120}>Acción</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton variant="rectangular" height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  : empresasFiltradas.map((empresa, idx) => {
                      const key = empresa.__key ?? toKey(empresa?.id);
                      const counts = (key && conteosPorKey.get(key)) || { empleados: 0, admins: 0 };

                      return (
                        <TableRow
                          key={empresa.id ?? `${empresa.nombre}-${key}`}
                          hover
                          sx={{
                            bgcolor: idx % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                            '& td': { borderColor: 'rgba(255,255,255,0.06)', color: '#e6e9ef' },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={`#${empresa.id}`}
                                variant="outlined"
                                sx={{ color: '#9bb6ff', borderColor: '#274690' }}
                              />
                              <Typography>{empresa.nombre}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{empresa.telefono || 'N/A'}</TableCell>
                          <TableCell>{empresa.direccion || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip icon={<GroupIcon />} size="small" label={counts.empleados} sx={{ bgcolor: 'rgba(99, 179, 237, 0.18)', color: '#9bd3ff' }} />
                          </TableCell>
                          <TableCell>
                            <Chip icon={<AdminPanelSettingsIcon />} size="small" label={counts.admins} sx={{ bgcolor: 'rgba(255, 184, 107, 0.18)', color: '#ffd4a6' }} />
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="contained" onClick={() => handleSeleccionEmpresa(empresa)}>
                              Seleccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                {!loading && empresasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#b7c2d9' }}>
                      No hay empresas que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegistroEmpresas;

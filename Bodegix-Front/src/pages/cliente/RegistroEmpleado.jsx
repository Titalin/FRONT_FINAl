import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Typography, Paper, Card, CardContent, TextField, Button, Stack,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment, Tooltip
} from '@mui/material';
import Sidebar from '../../components/Layout/Sidebar';
import { jwtDecode } from 'jwt-decode';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import api from '../../services/api';

const RegistroEmpleado = () => {
  const [formData, setFormData] = useState({ nombre: '', correo: '', contraseña: '' });
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [token, setToken] = useState('');
  const [empresaId, setEmpresaId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [empleadoParaEliminar, setEmpleadoParaEliminar] = useState(null);

  const inputStyles = {
    input: { color: '#E9EEF7' },
    '& .MuiInputLabel-root': { color: 'rgba(233,238,247,0.70)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#A7C7FF' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(167,199,255,0.45)' },
      '&:hover fieldset': { borderColor: '#A7C7FF' },
      '&.Mui-focused fieldset': { borderColor: '#7FB0FF', boxShadow: '0 0 0 2px rgba(127,176,255,0.25)' },
    },
    '& .MuiSvgIcon-root': { color: '#A7C7FF' },
  };

  const arr = (v) => (Array.isArray(v) ? v : v?.data ?? []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setEmpresaId(Number(decoded.empresa_id));
        setToken(storedToken);
        fetchEmpleados(Number(decoded.empresa_id));
      } catch {
        setError('Sesión inválida. Inicia sesión nuevamente.');
      }
    }
  }, []);

  const fetchEmpleados = async (empId) => {
    try {
      setLoading(true);
      const { data } = await api.get('/usuarios', { params: { empresa_id: empId, rol_id: 3 } });
      const empleadosEmpresa = arr(data).filter(
        (emp) => Number(emp.rol_id) === 3 && Number(emp.empresa_id) === Number(empId)
      );
      setEmpleados(empleadosEmpresa);
    } catch (err) {
      console.error('Error al obtener empleados:', err);
      setError('No se pudo cargar la lista de empleados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    try {
      if (!token || !empresaId) {
        setError('Sesión inválida. Vuelve a iniciar sesión.');
        return;
      }

      const body = { nombre: formData.nombre, correo: formData.correo, contraseña: formData.contraseña, rol_id: 3, empresa_id: empresaId };
      if (empleadoSeleccionado) {
        const { data } = await api.put(`/usuarios/${empleadoSeleccionado.id}`, body);
        if (data?.error) throw new Error(data.error);
        setSuccess('Empleado actualizado.');
      } else {
        const { data } = await api.post('/usuarios', body);
        if (data?.error) throw new Error(data.error);
        setSuccess('Empleado registrado.');
      }

      setFormData({ nombre: '', correo: '', contraseña: '' });
      setEmpleadoSeleccionado(null);
      fetchEmpleados(empresaId);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al guardar empleado.');
    }
  };

  const handleEditar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData({ nombre: empleado.nombre, correo: empleado.correo, contraseña: '' });
  };

  const solicitarEliminar = (emp) => {
    setEmpleadoParaEliminar(emp);
    setConfirmOpen(true);
  };

  const handleEliminarConfirmado = async () => {
    const id = empleadoParaEliminar?.id;
    setConfirmOpen(false);
    if (!id) return;

    try {
      const { data: lockersData } = await api.get('/lockers');
      const asignados = arr(lockersData).filter((l) => Number(l.usuario_id) === Number(id));
      if (asignados.length > 0) {
        setDialogMessage('No puedes eliminar este empleado porque tiene lockers asignados.');
        setDialogOpen(true);
        return;
      }
      const resp = await api.delete(`/usuarios/${id}`);
      if (resp?.data?.error) throw new Error(resp.data.error);

      setSuccess('Empleado eliminado correctamente.');
      fetchEmpleados(empresaId);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'No se pudo eliminar el empleado.');
    } finally {
      setEmpleadoParaEliminar(null);
    }
  };

  const empleadosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter(
      (e) => String(e.nombre || '').toLowerCase().includes(q) || String(e.correo || '').toLowerCase().includes(q)
    );
  }, [empleados, busqueda]);

  return (
    <Box display="flex">
      <Sidebar />
      <Box flexGrow={1} p={3} sx={{ color: '#e6e9ef' }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #bd6739ff, #2a5298)', color: '#fff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>Registrar Empleados</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Crea y administra a los trabajadores de tu empresa (rol 3).</Typography>
            </Box>
            <Chip icon={<GroupIcon sx={{ color: '#fff !important' }} />} label={`${empleados.length} empleados`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
          </Stack>
        </Paper>

        <Card elevation={6} sx={{ mb: 4, borderRadius: 3, backgroundColor: '#111a2b', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5, color: '#fff' }}>{empleadoSeleccionado ? 'Editar empleado' : 'Nuevo empleado'}</Typography>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: (<InputAdornment position="start"><PersonAddAlt1Icon sx={{ color: '#A7C7FF' }} /></InputAdornment>) }}
                    sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Correo electrónico" name="correo" type="email" value={formData.correo} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon sx={{ color: '#A7C7FF' }} /></InputAdornment>) }}
                    sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Contraseña" name="contraseña" type="password" value={formData.contraseña} onChange={handleChange} fullWidth required={!empleadoSeleccionado}
                    placeholder={empleadoSeleccionado ? 'Deja vacío para no cambiar' : ''}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon sx={{ color: '#A7C7FF' }} /></InputAdornment>) }}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={12} md="auto">
                  <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} sx={{ height: '100%' }}>
                    {empleadoSeleccionado ? 'Actualizar' : 'Registrar'}
                  </Button>
                </Grid>

                {empleadoSeleccionado && (
                  <Grid item xs={12} md="auto">
                    <Button variant="outlined" color="inherit" startIcon={<ClearIcon />} sx={{ height: '100%' }}
                      onClick={() => { setEmpleadoSeleccionado(null); setFormData({ nombre: '', correo: '', contraseña: '' }); }}>
                      Cancelar edición
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          </CardContent>
        </Card>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>Empleados registrados</Typography>
            <Stack direction="row" spacing={1}>
              <TextField size="small" placeholder="Buscar por nombre o correo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#A7C7FF' }} /></InputAdornment>) }}
                sx={{ minWidth: 280, ...inputStyles }}
              />
              <Tooltip title="Refrescar"><span><IconButton onClick={() => empresaId && fetchEmpleados(empresaId)} disabled={loading} color="primary"><RefreshIcon sx={{ color: '#A7C7FF' }} /></IconButton></span></Tooltip>
            </Stack>
          </Stack>

          <TableContainer sx={{ borderRadius: 2, maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#13203b', color: '#dfe6f5', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell width={160}>Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {empleadosFiltrados.map((emp, idx) => (
                  <TableRow key={emp.id} hover sx={{ bgcolor: idx % 2 ? 'rgba(255,255,255,0.02)' : 'transparent', '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#E9EEF7' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={`#${emp.id}`} variant="outlined" sx={{ color: '#9bb6ff', borderColor: '#274690' }} />
                        <Typography>{emp.nombre}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{emp.correo}</TableCell>
                    <TableCell>{emp?.empresa?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" color="info" startIcon={<EditIcon />} onClick={() => handleEditar(emp)}>Editar</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => solicitarEliminar(emp)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {empleadosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#b7c2d9' }}>
                      {loading ? 'Cargando…' : 'No hay empleados que coincidan con la búsqueda.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Acción no permitida</DialogTitle>
          <DialogContent><Typography>{dialogMessage}</Typography></DialogContent>
          <DialogActions><Button onClick={() => setDialogOpen(false)} color="primary">Cerrar</Button></DialogActions>
        </Dialog>

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent><Typography>¿Seguro que deseas eliminar a <b>{empleadoParaEliminar?.nombre}</b>? Esta acción no se puede deshacer.</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} color="inherit">Cancelar</Button>
            <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleEliminarConfirmado}>Eliminar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RegistroEmpleado;

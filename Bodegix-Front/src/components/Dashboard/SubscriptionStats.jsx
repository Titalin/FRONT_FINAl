import React from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const UserFormModal = ({ open, handleClose, userData }) => {
  const isEdit = Boolean(userData);

  const formik = useFormik({
    initialValues: {
      name: userData?.name || '',
      email: userData?.email || '',
      role: userData?.role || 'user',
      status: userData?.status || 'active',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Nombre es requerido'),
      email: Yup.string().email('Email inválido').required('Email es requerido'),
      role: Yup.string().required('Rol es requerido'),
      status: Yup.string().required('Estado es requerido'),
    }),
    onSubmit: (values) => {
      console.log(values);
      handleClose();
    },
  });

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={3}>
          {isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="Nombre completo"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              name="role"
              value={formik.values.role}
              label="Rol"
              onChange={formik.handleChange}
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="user">Usuario regular</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              name="status"
              value={formik.values.status}
              label="Estado"
              onChange={formik.handleChange}
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
            </Select>
          </FormControl>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="contained" color="secondary" type="submit">
              {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default UserFormModal;
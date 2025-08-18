import React from 'react';
import {
  Modal,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const LockerAssignmentModal = ({ open, handleClose, lockerId, users }) => {
  const [selectedUser, setSelectedUser] = React.useState('');

  const handleAssign = () => {
    console.log(`Asignando locker ${lockerId} al usuario ${selectedUser}`);
    handleClose();
  };

  // Datos simulados de usuarios
  const mockUsers = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, name: 'María García', email: 'maria@example.com' },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com' },
  ];

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={3}>
          Asignar Locker {lockerId}
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Seleccionar Usuario</InputLabel>
          <Select
            value={selectedUser}
            label="Seleccionar Usuario"
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {mockUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name} - {user.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="subtitle1" mb={2}>
          Usuarios sin locker asignado:
        </Typography>
        <List sx={{ maxHeight: 200, overflow: 'auto', mb: 3 }}>
          {mockUsers.filter(u => !u.locker).map((user) => (
            <ListItem key={user.id} button onClick={() => setSelectedUser(user.id)}>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.name} secondary={user.email} />
            </ListItem>
          ))}
        </List>
        
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleAssign}
            disabled={!selectedUser}
          >
            Asignar Locker
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LockerAssignmentModal;
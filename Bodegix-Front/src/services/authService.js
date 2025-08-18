import api from './api';

export const login = async (correo, contraseña) => {
    const response = await api.post('/usuarios/login', { correo, contraseña });
    return response.data;
};

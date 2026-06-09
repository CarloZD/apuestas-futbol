import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://13.219.203.13:3000';

export const api = axios.create({
    baseURL: API_URL,
});

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/usuarios/perfil');
                    setUser(response.data);
                } catch (error) {
                    console.error('Error al recuperar perfil del token:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (correo, password) => {
        try {
            const response = await api.post('/auth/login', { correo, password });
            const { token, usuario } = response.data;
            localStorage.setItem('token', token);
            setUser(usuario);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al iniciar sesión'
            };
        }
    };

    const register = async (nombre, correo, password) => {
        try {
            await api.post('/auth/register', { nombre, correo, password });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al registrarse'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshProfile = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/usuarios/perfil');
                setUser(response.data);
            } catch (error) {
                console.error('Error al actualizar perfil:', error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, api, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

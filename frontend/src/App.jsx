import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Importar Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SalaDetails from './pages/SalaDetails';
import AdminPanel from './pages/AdminPanel';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center">
                <span className="w-10 h-10 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mb-4"></span>
                <p className="text-neutral-400 text-sm">Verificando sesión...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Componente para proteger rutas de administrador
const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center">
                <span className="w-10 h-10 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mb-4"></span>
            </div>
        );
    }

    if (!user || user.rol !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Rutas Protegidas de Usuario */}
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/sala/:id" 
                        element={
                            <ProtectedRoute>
                                <SalaDetails />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Rutas Protegidas de Administrador */}
                    <Route 
                        path="/admin" 
                        element={
                            <AdminRoute>
                                <AdminPanel />
                            </AdminRoute>
                        } 
                    />

                    {/* Ruta por defecto redirecciona al Dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                
                {/* Notificaciones flotantes */}
                <Toaster 
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#171717',
                            color: '#f5f5f5',
                            border: '1px solid #262626',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#ffffff',
                                secondary: '#000000',
                            },
                        },
                    }}
                />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Trophy, User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Register() {
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nombre || !correo || !password) {
            toast.error('Por favor, completa todos los campos.');
            return;
        }

        setLoading(true);
        const res = await register(nombre, correo, password);
        setLoading(false);

        if (res.success) {
            toast.success('¡Registro exitoso! Por favor inicia sesión.');
            navigate('/login');
        } else {
            toast.error(res.mensaje);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-neutral-800 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neutral-700 rounded-full blur-3xl opacity-20"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-neutral-800 border border-neutral-700 rounded-xl mb-4 text-neutral-200">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">APUESTAPP</h1>
                    <p className="text-neutral-400 text-sm">Crea tu cuenta gratis para empezar a competir</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">
                            Nombre de Usuario
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Carlos ZD"
                                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                placeholder="tu@correo.com"
                                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-400 font-bold rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Registrarse
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-neutral-500 relative z-10">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="text-neutral-300 hover:text-white font-semibold underline transition-colors">
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}

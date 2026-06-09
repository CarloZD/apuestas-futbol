import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Trophy, Users, Calendar, Plus, DoorOpen, LogOut, ShieldAlert,
    CheckSquare, Square, X, CalendarDays, KeyRound, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
    const { user, logout, api } = useAuth();
    const [salas, setSalas] = useState([]);
    const [partidosGlobales, setPartidosGlobales] = useState([]);
    const [codigoJoin, setCodigoJoin] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [nombreSala, setNombreSala] = useState('');
    const [codigoSala, setCodigoSala] = useState('');
    const [partidosSeleccionados, setPartidosSeleccionados] = useState([]);
    const [loadingSalas, setLoadingSalas] = useState(true);
    const [loadingPartidos, setLoadingPartidos] = useState(false);
    const [submittingRoom, setSubmittingRoom] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSalas();
    }, []);

    const fetchSalas = async () => {
        setLoadingSalas(true);
        try {
            const response = await api.get('/salas');
            setSalas(response.data);
        } catch (error) {
            toast.error('Error al cargar tus salas.');
        } finally {
            setLoadingSalas(false);
        }
    };

    const fetchPartidosGlobales = async () => {
        setLoadingPartidos(true);
        try {
            const response = await api.get('/partidos');
            setPartidosGlobales(response.data);
            // Pre-select all by default to make it easy
            setPartidosSeleccionados(response.data.map(p => p.id));
        } catch (error) {
            toast.error('Error al cargar partidos del Mundial.');
        } finally {
            setLoadingPartidos(false);
        }
    };

    const handleOpenCreateModal = () => {
        setNombreSala('');
        // Generate random invitation code
        const randCode = 'TEC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setCodigoSala(randCode);
        fetchPartidosGlobales();
        setShowCreateModal(true);
    };

    const handleJoinSala = async (e) => {
        e.preventDefault();
        if (!codigoJoin.trim()) return;

        try {
            const response = await api.post('/salas/unirse', { codigo_invitacion: codigoJoin });
            toast.success(response.data.mensaje);
            setCodigoJoin('');
            fetchSalas();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Error al unirse a la sala.');
        }
    };

    const handleTogglePartido = (id) => {
        if (partidosSeleccionados.includes(id)) {
            setPartidosSeleccionados([]);
        } else {
            setPartidosSeleccionados([id]); // Solo permitir uno
        }
    };

    const handleCreateSala = async (e) => {
        e.preventDefault();
        if (!nombreSala.trim() || !codigoSala.trim() || partidosSeleccionados.length === 0) {
            toast.error('Completa los campos requeridos y selecciona un partido.');
            return;
        }

        setSubmittingRoom(true);
        try {
            await api.post('/salas', {
                nombre: nombreSala,
                codigo_invitacion: codigoSala,
                partido_id: partidosSeleccionados[0]
            });
            toast.success('Sala creada con éxito.');
            setShowCreateModal(false);
            fetchSalas();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Error al crear la sala.');
        } finally {
            setSubmittingRoom(false);
        }
    };

    const handleSelectAllPartidos = () => {
        if (partidosSeleccionados.length === partidosGlobales.length) {
            setPartidosSeleccionados([]);
        } else {
            setPartidosSeleccionados(partidosGlobales.map(p => p.id));
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
            {/* Navbar */}
            <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-white" />
                    <span className="text-xl font-black tracking-wider text-white">APUESTAPP</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-neutral-200">{user?.nombre}</p>
                        <p className="text-xs text-neutral-500 capitalize">{user?.rol.toLowerCase()}</p>
                    </div>
                    {user?.rol === 'ADMIN' && (
                        <Link 
                            to="/admin" 
                            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}
                    <button 
                        onClick={logout}
                        className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-xl border border-neutral-800 hover:border-red-950 transition-all cursor-pointer"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Welcome */}
                <div className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-800 rounded-full blur-3xl opacity-10"></div>
                    <h2 className="text-3xl font-black mb-2 text-white">Hola, {user?.nombre} 👋</h2>
                    <p className="text-neutral-400 text-sm max-w-xl">
                        Crea una sala de apuestas con tus amigos o únete a una existente usando un código de invitación. Pronostica los partidos antes del inicio para acumular puntos.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Joined Rooms */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-neutral-400" />
                                Mis Salas Activas
                            </h3>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Crear Sala
                            </button>
                        </div>

                        {loadingSalas ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 border border-neutral-800 rounded-2xl">
                                <span className="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mb-4"></span>
                                <p className="text-neutral-400 text-sm">Cargando salas...</p>
                            </div>
                        ) : salas.length === 0 ? (
                            <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                                <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-neutral-300 mb-1">Aún no estás en ninguna sala</h4>
                                <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
                                    Crea una sala para jugar con amigos o únete ingresando un código en el panel lateral.
                                </p>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    Crear mi Primera Sala
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {salas.map((sala) => (
                                    <div 
                                        key={sala.id} 
                                        onClick={() => navigate(`/sala/${sala.id}`)}
                                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 shadow-md cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-800 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-md font-mono">
                                                CÓDIGO: {sala.codigo_invitacion}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-neutral-200 transition-colors">
                                            {sala.nombre}
                                        </h4>
                                        <div className="flex items-center gap-4 text-xs text-neutral-400 mt-4 pt-4 border-t border-neutral-800">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {sala.total_miembros} {sala.total_miembros === 1 ? 'miembro' : 'miembros'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {sala.total_partidos} partidos
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar (Join Room) */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-neutral-400" />
                                Unirse a una Sala
                            </h3>
                            <p className="text-neutral-400 text-xs mb-4">
                                Ingresa el código de invitación proporcionado por el creador de la sala para unirte al evento y empezar a pronosticar.
                            </p>
                            <form onSubmit={handleJoinSala} className="space-y-3">
                                <input
                                    type="text"
                                    value={codigoJoin}
                                    onChange={(e) => setCodigoJoin(e.target.value)}
                                    placeholder="Ej: TEC2026"
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-bold uppercase transition-colors"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                                >
                                    <DoorOpen className="w-4 h-4" />
                                    Unirse
                                </button>
                            </form>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md text-neutral-400 text-xs space-y-3">
                            <h4 className="font-bold text-white text-sm">Resumen de Reglas de Juego</h4>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>Marcador exacto: <b className="text-white">5 puntos</b></li>
                                <li>Ganador correcto: <b className="text-white">3 puntos</b></li>
                                <li>Diferencia de goles: <b className="text-white">2 puntos</b></li>
                                <li>Racha consecutiva (3+ aciertos): <b className="text-white">+2 puntos</b> extras por partido acertado.</li>
                                <li>Predicción anticipada (&gt; 24h antes): <b className="text-white">+1 punto</b> extra.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative">
                        <button 
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 border-b border-neutral-800">
                            <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                <Plus className="w-6 h-6" />
                                Crear Nueva Sala
                            </h3>
                            <p className="text-neutral-400 text-xs mt-1">
                                Configura el nombre del grupo y selecciona los partidos del Mundial sobre los cuales se jugará.
                            </p>
                        </div>

                        <form onSubmit={handleCreateSala} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                                        Nombre de la Sala
                                    </label>
                                    <input
                                        type="text"
                                        value={nombreSala}
                                        onChange={(e) => setNombreSala(e.target.value)}
                                        placeholder="Ej: Amigos Tecsup"
                                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                                        Código de Invitación
                                    </label>
                                    <input
                                        type="text"
                                        value={codigoSala}
                                        onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                                        placeholder="Ej: TEC2026"
                                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 font-mono font-bold focus:outline-none focus:border-neutral-500 uppercase transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                                        Selecciona el Partido del Mundial
                                    </label>
                                </div>

                                {loadingPartidos ? (
                                    <div className="flex justify-center items-center py-8">
                                        <span className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></span>
                                    </div>
                                ) : partidosGlobales.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                                        No hay partidos disponibles. Sincroniza la API en el panel de administrador primero.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                                        {partidosGlobales.map((p) => {
                                            const isSelected = partidosSeleccionados.includes(p.id);
                                            const matchDate = new Date(p.fecha_partido).toLocaleString();

                                            return (
                                                <div
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => handleTogglePartido(p.id)}
                                                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                                                        isSelected 
                                                            ? 'bg-neutral-800 border-neutral-500 text-white' 
                                                            : 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 text-neutral-400'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1">
                                                            <CalendarDays className="w-3 h-3" />
                                                            <span>{matchDate}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                                                            <img src={p.bandera_local} className="w-4 h-3.5 object-cover rounded-sm shadow-sm" alt="" />
                                                            <span className="truncate">{p.equipo_local}</span>
                                                            <span className="text-neutral-500 font-light">vs</span>
                                                            <img src={p.bandera_visitante} className="w-4 h-3.5 object-cover rounded-sm shadow-sm" alt="" />
                                                            <span className="truncate">{p.equipo_visitante}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-white" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-neutral-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRoom || partidosSeleccionados.length === 0}
                                    className="flex-1 py-3 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-800 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                                >
                                    {submittingRoom ? (
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        'Crear Sala'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

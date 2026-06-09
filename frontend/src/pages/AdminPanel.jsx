import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Trophy, ArrowLeft, RefreshCw, Save, Sparkles, CheckCircle2, 
    Calendar, ShieldAlert, Edit2, Play, Info
} from 'lucide-react';

export default function AdminPanel() {
    const { user, api } = useAuth();
    const [partidos, setPartidos] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [loadingPartidos, setLoadingPartidos] = useState(true);
    const [savingScore, setSavingScore] = useState({});
    const [editingScores, setEditingScores] = useState({}); // { partidoId: { golesLocal, golesVisitante } }
    const navigate = useNavigate();

    useEffect(() => {
        // Redirigir si no es ADMIN
        if (user && user.rol !== 'ADMIN') {
            toast.error('Acceso denegado. Solo administradores.');
            navigate('/');
            return;
        }
        fetchPartidos();
    }, [user]);

    const fetchPartidos = async () => {
        setLoadingPartidos(true);
        try {
            const response = await api.get('/partidos');
            setPartidos(response.data);

            // Inicializar inputs de edición
            const scores = {};
            response.data.forEach(p => {
                scores[p.id] = {
                    golesLocal: p.goles_local !== null ? p.goles_local.toString() : '',
                    golesVisitante: p.goles_visitante !== null ? p.goles_visitante.toString() : ''
                };
            });
            setEditingScores(scores);
        } catch (error) {
            toast.error('Error al cargar partidos.');
        } finally {
            setLoadingPartidos(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        toast.loading('Sincronizando con Zafronix API...', { id: 'sync' });
        try {
            const response = await api.post('/partidos/sync');
            toast.success(`Sincronización exitosa: ${response.data.partidos_sincronizados} partidos sincronizados.`, { id: 'sync' });
            fetchPartidos();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Error durante la sincronización.', { id: 'sync' });
        } finally {
            setSyncing(false);
        }
    };

    const handleScoreChange = (partidoId, team, val) => {
        if (val !== '' && !/^\d+$/.test(val)) return;

        setEditingScores(prev => ({
            ...prev,
            [partidoId]: {
                ...prev[partidoId],
                [team]: val
            }
        }));
    };

    const handleSaveScore = async (partidoId) => {
        const score = editingScores[partidoId];
        if (!score || score.golesLocal === '' || score.golesVisitante === '') {
            toast.error('Completa los goles de ambos equipos.');
            return;
        }

        setSavingScore(prev => ({ ...prev, [partidoId]: true }));
        try {
            await api.put(`/partidos/${partidoId}/resultado`, {
                goles_local: parseInt(score.golesLocal),
                goles_visitante: parseInt(score.golesVisitante)
            });
            toast.success('Resultado registrado y puntajes recalculados.');
            fetchPartidos();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Error al guardar el resultado.');
        } finally {
            setSavingScore(prev => ({ ...prev, [partidoId]: false }));
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-12">
            {/* Header */}
            <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-white flex items-center gap-2">
                            <ShieldAlert className="w-8 h-8 text-neutral-400" />
                            Panel de Administración
                        </h1>
                    </div>
                    <div>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-5 py-3 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sincronizar Zafronix API
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Info Box */}
                <div className="mb-8 bg-neutral-900 border border-neutral-850 p-4 rounded-xl flex items-start gap-3 text-xs text-neutral-400">
                    <Info className="w-5 h-5 text-neutral-500 shrink-0" />
                    <div>
                        <p className="font-bold text-white mb-1">Información de Sincronización y Simulación</p>
                        <p className="mb-2">
                            El botón <b>Sincronizar Zafronix API</b> descarga automáticamente los 104 partidos del Mundial 2026 y actualiza los equipos y sus banderas correspondientes en la base de datos de PostgreSQL.
                        </p>
                        <p>
                            Para realizar simulaciones de juego y pruebas, puedes ingresar marcadores manuales en el listado a continuación y hacer clic en <b>Registrar y Recalcular</b>. Esto cerrará el partido y computará los puntos base, anticipaciones y rachas en las salas automáticamente.
                        </p>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-neutral-800">
                        <h3 className="font-bold text-white text-lg">Listado de Partidos Globales</h3>
                    </div>

                    {loadingPartidos ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <span className="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mb-4"></span>
                            <p className="text-neutral-400 text-sm">Cargando partidos...</p>
                        </div>
                    ) : partidos.length === 0 ? (
                        <div className="text-center py-16 text-neutral-500 text-sm">
                            No hay partidos registrados. Haz clic en el botón de Sincronizar en la parte superior derecha.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-850 text-xs text-neutral-400 uppercase font-bold tracking-wide">
                                        <th className="py-4 px-6">Código / Fecha</th>
                                        <th className="py-4 px-6 text-right w-1/4">Local</th>
                                        <th className="py-4 px-6 text-center w-48">Resultado / Simulación</th>
                                        <th className="py-4 px-6 w-1/4">Visitante</th>
                                        <th className="py-4 px-6 text-center">Estado</th>
                                        <th className="py-4 px-6 text-center w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-850 text-sm">
                                    {partidos.map((p) => {
                                        const score = editingScores[p.id] || { golesLocal: '', golesVisitante: '' };
                                        const matchDate = new Date(p.fecha_partido).toLocaleString();

                                        return (
                                            <tr key={p.id} className="hover:bg-neutral-850/10 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-mono text-xs font-bold text-neutral-300">{p.codigo_api || `MANUAL-${p.id}`}</p>
                                                    <p className="text-xs text-neutral-500 font-light mt-0.5">{matchDate}</p>
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-white">
                                                    <span className="mr-2">{p.equipo_local}</span>
                                                    <img src={p.bandera_local} className="w-5 h-4 object-cover inline rounded shadow-sm" alt="" />
                                                </td>
                                                <td className="py-4 px-6 flex justify-center items-center gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={score.golesLocal}
                                                        onChange={(e) => handleScoreChange(p.id, 'golesLocal', e.target.value)}
                                                        placeholder="-"
                                                        className="w-10 h-9 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono font-bold text-white focus:outline-none focus:border-neutral-500"
                                                    />
                                                    <span className="text-neutral-600">:</span>
                                                    <input
                                                        type="text"
                                                        value={score.golesVisitante}
                                                        onChange={(e) => handleScoreChange(p.id, 'golesVisitante', e.target.value)}
                                                        placeholder="-"
                                                        className="w-10 h-9 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono font-bold text-white focus:outline-none focus:border-neutral-500"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 font-bold text-white">
                                                    <img src={p.bandera_visitante} className="w-5 h-4 object-cover inline rounded shadow-sm mr-2" alt="" />
                                                    <span>{p.equipo_visitante}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        p.estado === 'FINALIZADO' 
                                                            ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' 
                                                            : 'bg-green-950 text-green-400 border border-green-900'
                                                    }`}>
                                                        {p.estado}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button
                                                        onClick={() => handleSaveScore(p.id)}
                                                        disabled={savingScore[p.id]}
                                                        className="p-2 bg-neutral-800 hover:bg-white text-neutral-300 hover:text-black rounded-lg border border-neutral-750 transition-all cursor-pointer shadow-sm"
                                                        title="Guardar y Recalcular"
                                                    >
                                                        {savingScore[p.id] ? (
                                                            <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin block"></span>
                                                        ) : (
                                                            <Save className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

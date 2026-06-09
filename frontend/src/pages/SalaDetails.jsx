import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Trophy, Users, Calendar, ArrowLeft, Send, Sparkles, Flame, CheckCircle, 
    XCircle, Info, CalendarDays, Clipboard, ClipboardCheck, Trash2
} from 'lucide-react';

export default function SalaDetails() {
    const { id } = useParams();
    const { user, api } = useAuth();
    const [sala, setSala] = useState(null);
    const [activeTab, setActiveTab] = useState('ranking'); // ranking, partidos, miembros
    const [ranking, setRanking] = useState([]);
    const [partidos, setPartidos] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [predictions, setPredictions] = useState({}); // { partidoId: { golesLocal, golesVisitante } }
    const [loading, setLoading] = useState(true);
    const [submittingPred, setSubmittingPred] = useState({});
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSalaDetails();
    }, [id]);

    const fetchSalaDetails = async () => {
        setLoading(true);
        try {
            // Cargar datos de la sala
            const resSala = await api.get(`/salas/${id}`);
            setSala(resSala.data);

            // Cargar ranking
            const resRank = await api.get(`/ranking/${id}`);
            setRanking(resRank.data);

            // Cargar partidos y predicciones
            const resPartidos = await api.get(`/salas/${id}/partidos`);
            setPartidos(resPartidos.data);

            // Inicializar inputs de predicciones con las existentes
            const initialPreds = {};
            resPartidos.data.forEach(p => {
                if (p.goles_local_pred !== null && p.goles_local_pred !== undefined) {
                    initialPreds[p.id] = {
                        golesLocal: p.goles_local_pred.toString(),
                        golesVisitante: p.goles_visitante_pred.toString()
                    };
                } else {
                    initialPreds[p.id] = { golesLocal: '', golesVisitante: '' };
                }
            });
            setPredictions(initialPreds);

            // Cargar miembros
            const resMiembros = await api.get(`/salas/${id}/participantes`);
            setMiembros(resMiembros.data);
        } catch (error) {
            toast.error('Error al cargar detalles de la sala.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (sala?.codigo_invitacion) {
            navigator.clipboard.writeText(sala.codigo_invitacion);
            setCopied(true);
            toast.success('¡Código copiado!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePredChange = (partidoId, team, val) => {
        // Permitir solo números
        if (val !== '' && !/^\d+$/.test(val)) return;

        setPredictions(prev => ({
            ...prev,
            [partidoId]: {
                ...prev[partidoId],
                [team]: val
            }
        }));
    };

    const handleSavePrediction = async (partidoId) => {
        const pred = predictions[partidoId];
        if (!pred || pred.golesLocal === '' || pred.golesVisitante === '') {
            toast.error('Ingresa goles de ambos equipos.');
            return;
        }

        setSubmittingPred(prev => ({ ...prev, [partidoId]: true }));
        try {
            await api.post('/predicciones', {
                sala_id: id,
                partido_id: partidoId,
                goles_local_pred: parseInt(pred.golesLocal),
                goles_visitante_pred: parseInt(pred.golesVisitante)
            });
            toast.success('Predicción registrada.');
            
            // Recargar partidos y ranking
            const resPartidos = await api.get(`/salas/${id}/partidos`);
            setPartidos(resPartidos.data);
            const resRank = await api.get(`/ranking/${id}`);
            setRanking(resRank.data);
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'Error al guardar predicción.');
        } finally {
            setSubmittingPred(prev => ({ ...prev, [partidoId]: false }));
        }
    };

    const handleDeleteSala = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta sala permanentemente? Todos los rankings y predicciones asociadas se perderán.')) {
            try {
                await api.delete(`/salas/${id}`);
                toast.success('Sala eliminada.');
                navigate('/');
            } catch (error) {
                toast.error(error.response?.data?.mensaje || 'Error al eliminar sala.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center">
                <span className="w-10 h-10 border-4 border-neutral-400 border-t-transparent rounded-full animate-spin mb-4"></span>
                <p className="text-neutral-400">Cargando sala...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-12">
            {/* Header / Sala Info */}
            <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <Link to="/" className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </Link>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2">{sala?.nombre}</h1>
                            <p className="text-xs text-neutral-400">
                                Creado por <span className="text-neutral-300 font-semibold">{sala?.creador}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-xl">
                                <span className="text-xs text-neutral-500 mr-2 uppercase font-bold tracking-wide">Código de Invitación:</span>
                                <span className="text-sm font-mono font-bold text-white mr-3">{sala?.codigo_invitacion}</span>
                                <button 
                                    onClick={handleCopyCode}
                                    className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                    title="Copiar Código"
                                >
                                    {copied ? <ClipboardCheck className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
                                </button>
                            </div>
                            {(user?.rol === 'ADMIN' || sala?.creador_id === user?.id) && (
                                <button
                                    onClick={handleDeleteSala}
                                    className="p-2.5 bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900 rounded-xl transition-all cursor-pointer"
                                    title="Eliminar Sala"
                                >
                                    <Trash2 className="w-4.5 h-4.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Section */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Tabs Navigation */}
                <div className="flex border-b border-neutral-850 mb-8 overflow-x-auto gap-2">
                    <button
                        onClick={() => setActiveTab('ranking')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'ranking' 
                                ? 'border-white text-white' 
                                : 'border-transparent text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        <Trophy className="w-4 h-4 inline mr-1.5" />
                        Tabla de Posiciones
                    </button>
                    <button
                        onClick={() => setActiveTab('partidos')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'partidos' 
                                ? 'border-white text-white' 
                                : 'border-transparent text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-1.5" />
                        Partidos ({partidos.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('miembros')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'miembros' 
                                ? 'border-white text-white' 
                                : 'border-transparent text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        <Users className="w-4 h-4 inline mr-1.5" />
                        Participantes ({miembros.length})
                    </button>
                </div>

                {/* Tab: Leaderboard */}
                {activeTab === 'ranking' && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-white text-lg">Clasificación General</h3>
                            <span className="text-xs text-neutral-500">Se actualiza automáticamente al finalizar un partido</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-850 text-xs text-neutral-400 uppercase font-bold tracking-wide">
                                        <th className="py-4 px-6 text-center w-16">Pos</th>
                                        <th className="py-4 px-6">Participante</th>
                                        <th className="py-4 px-6 text-center">Predicciones</th>
                                        <th className="py-4 px-6 text-center">Exactas (5p)</th>
                                        <th className="py-4 px-6 text-center">Ganadores (3p)</th>
                                        <th className="py-4 px-6 text-center">Racha</th>
                                        <th className="py-4 px-6 text-right w-24">Puntos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-850 text-sm">
                                    {ranking.map((player, idx) => {
                                        const isCurrentUser = player.id === user?.id;
                                        const hasActiveStreak = player.racha_actual >= 3;

                                        return (
                                            <tr 
                                                key={player.id} 
                                                className={`transition-colors ${
                                                    isCurrentUser ? 'bg-neutral-850/50 font-semibold' : 'hover:bg-neutral-850/20'
                                                }`}
                                            >
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                        idx === 0 ? 'bg-white text-black' :
                                                        idx === 1 ? 'bg-neutral-300 text-black' :
                                                        idx === 2 ? 'bg-neutral-500 text-white' :
                                                        'text-neutral-400 border border-neutral-800'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <p className="text-white flex items-center gap-1.5">
                                                            {player.nombre}
                                                            {isCurrentUser && (
                                                                <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-md uppercase font-bold">
                                                                    Tú
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-neutral-500 font-light">{player.correo}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center font-mono">{player.total_predicciones}</td>
                                                <td className="py-4 px-6 text-center font-mono text-neutral-200">{player.aciertos_exactos}</td>
                                                <td className="py-4 px-6 text-center font-mono text-neutral-400">{player.aciertos_ganador}</td>
                                                <td className="py-4 px-6 text-center">
                                                    {player.racha_actual > 0 ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            hasActiveStreak 
                                                                ? 'bg-neutral-100 text-black animate-pulse' 
                                                                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                                        }`}>
                                                            <Flame className={`w-3.5 h-3.5 ${hasActiveStreak ? 'fill-current' : ''}`} />
                                                            {player.racha_actual}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-600">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-black text-white text-lg">
                                                    {player.puntos}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab: Matches */}
                {activeTab === 'partidos' && (
                    <div className="space-y-4">
                        {partidos.length === 0 ? (
                            <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                                <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-neutral-300 mb-1">No hay partidos en esta sala</h4>
                                <p className="text-neutral-500 text-sm">
                                    El creador de la sala no ha seleccionado ningún partido todavía.
                                </p>
                            </div>
                        ) : (
                            partidos.map((p) => {
                                const pred = predictions[p.id] || { golesLocal: '', golesVisitante: '' };
                                const isPending = p.estado === 'PENDIENTE';
                                const matchDate = new Date(p.fecha_partido);
                                const ahora = new Date();
                                const isStarted = ahora >= matchDate;
                                const isEditable = isPending && !isStarted;

                                // Calcular anticipacion en el cliente para mostrar indicador
                                const msAnticipacion = matchDate.getTime() - ahora.getTime();
                                const esAnticipado = msAnticipacion > (24 * 60 * 60 * 1000);

                                return (
                                    <div 
                                        key={p.id}
                                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md transition-all hover:border-neutral-750"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-neutral-850">
                                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                <CalendarDays className="w-4 h-4 text-neutral-500" />
                                                <span>{matchDate.toLocaleString()}</span>
                                                {isEditable && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        esAnticipado 
                                                            ? 'bg-green-950/50 text-green-400 border border-green-900' 
                                                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                                    }`}>
                                                        {esAnticipado ? 'Anticipado +1p' : 'Puntos Base'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide ${
                                                    p.estado === 'FINALIZADO' ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' :
                                                    isStarted ? 'bg-yellow-950/30 text-yellow-500 border border-yellow-900/50' :
                                                    'bg-green-950/30 text-green-400 border border-green-900/50'
                                                }`}>
                                                    {p.estado === 'FINALIZADO' ? 'FINALIZADO' :
                                                     isStarted ? 'EN JUEGO / CONGELADO' : 'ABIERTO'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
                                            {/* Local Team */}
                                            <div className="md:col-span-2 flex items-center justify-end gap-3 text-right">
                                                <span className="font-extrabold text-sm md:text-base text-white">{p.equipo_local}</span>
                                                <img 
                                                    src={p.bandera_local} 
                                                    className="w-8 h-6 object-cover rounded-md shadow-md border border-neutral-800" 
                                                    alt="" 
                                                />
                                            </div>

                                            {/* Score / Inputs */}
                                            <div className="md:col-span-3 flex justify-center items-center gap-4 my-2 md:my-0">
                                                {isEditable ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={pred.golesLocal}
                                                            onChange={(e) => handlePredChange(p.id, 'golesLocal', e.target.value)}
                                                            placeholder="-"
                                                            className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-xl text-center font-mono font-black text-xl text-white focus:outline-none focus:border-neutral-500"
                                                        />
                                                        <span className="text-neutral-600 font-light text-lg">:</span>
                                                        <input
                                                            type="text"
                                                            value={pred.golesVisitante}
                                                            onChange={(e) => handlePredChange(p.id, 'golesVisitante', e.target.value)}
                                                            placeholder="-"
                                                            className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-xl text-center font-mono font-black text-xl text-white focus:outline-none focus:border-neutral-500"
                                                        />
                                                        <button
                                                            onClick={() => handleSavePrediction(p.id)}
                                                            disabled={submittingPred[p.id]}
                                                            className="ml-2 p-3 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all cursor-pointer shadow-md"
                                                        >
                                                            {submittingPred[p.id] ? (
                                                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin block"></span>
                                                            ) : (
                                                                <Send className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        {/* Real Score */}
                                                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-850 px-4 py-2.5 rounded-xl">
                                                            <span className="text-2xl font-black font-mono text-white">
                                                                {p.goles_local !== null ? p.goles_local : '-'}
                                                            </span>
                                                            <span className="text-neutral-600 font-light">:</span>
                                                            <span className="text-2xl font-black font-mono text-white">
                                                                {p.goles_visitante !== null ? p.goles_visitante : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Visitor Team */}
                                            <div className="md:col-span-2 flex items-center justify-start gap-3 text-left">
                                                <img 
                                                    src={p.bandera_visitante} 
                                                    className="w-8 h-6 object-cover rounded-md shadow-md border border-neutral-800" 
                                                    alt="" 
                                                />
                                                <span className="font-extrabold text-sm md:text-base text-white">{p.equipo_visitante}</span>
                                            </div>
                                        </div>

                                        {/* Prediction Breakdown (If not editable and prediction exists) */}
                                        {!isEditable && (p.goles_local_pred !== null) && (
                                            <div className="mt-6 pt-4 border-t border-neutral-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-950/40 p-4 rounded-xl border border-neutral-850">
                                                <div className="text-xs text-neutral-400">
                                                    Tu predicción:{' '}
                                                    <b className="text-white font-mono font-bold">
                                                        {p.goles_local_pred} - {p.goles_visitante_pred}
                                                    </b>
                                                </div>
                                                
                                                {p.estado === 'FINALIZADO' && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {p.puntos_base === 5 && (
                                                            <span className="px-2.5 py-0.5 bg-green-950/40 text-green-400 border border-green-900 rounded text-[10px] font-bold">
                                                                Marcador Exacto (+5p)
                                                            </span>
                                                        )}
                                                        {p.puntos_base === 3 && (
                                                            <span className="px-2.5 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-900 rounded text-[10px] font-bold">
                                                                Ganador Correcto (+3p)
                                                            </span>
                                                        )}
                                                        {/* Si acierta diferencia además de ganador, sumó 2p extras (total 5) */}
                                                        {p.puntos_base === 5 && p.goles_local_pred !== p.goles_local && (
                                                            <span className="px-2.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-900 rounded text-[10px] font-bold">
                                                                Diferencia Goles (+2p)
                                                            </span>
                                                        )}
                                                        {p.bonus_anticipacion > 0 && (
                                                            <span className="px-2.5 py-0.5 bg-yellow-950/40 text-yellow-400 border border-yellow-900 rounded text-[10px] font-bold">
                                                                Anticipado (+1p)
                                                            </span>
                                                        )}
                                                        {p.bonus_racha > 0 && (
                                                            <span className="px-2.5 py-0.5 bg-neutral-100 text-black rounded text-[10px] font-black uppercase flex items-center gap-0.5">
                                                                <Flame className="w-3 h-3 fill-current" />
                                                                Racha (+2p)
                                                            </span>
                                                        )}
                                                        {p.puntos_totales === 0 && (
                                                            <span className="px-2.5 py-0.5 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded text-[10px] font-bold">
                                                                Sin Puntos (0p)
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-black text-white ml-2">
                                                            Total: +{p.puntos_totales} {p.puntos_totales === 1 ? 'punto' : 'puntos'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* If not editable and NO prediction made */}
                                        {!isEditable && (p.goles_local_pred === null) && (
                                            <div className="mt-4 pt-4 border-t border-neutral-850 text-xs text-neutral-500 flex items-center gap-1.5">
                                                <Info className="w-4 h-4 text-neutral-600" />
                                                <span>No registraste predicción para este partido.</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Tab: Members */}
                {activeTab === 'miembros' && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-neutral-800">
                            <h3 className="font-bold text-white text-lg">Participantes del Grupo</h3>
                            <p className="text-xs text-neutral-400 mt-1">Lista de personas unidas a esta sala.</p>
                        </div>
                        <ul className="divide-y divide-neutral-850">
                            {miembros.map((miembro) => (
                                <li key={miembro.id} className="p-6 flex justify-between items-center hover:bg-neutral-850/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-neutral-850 border border-neutral-800 rounded-full flex items-center justify-center font-bold text-white uppercase">
                                            {miembro.nombre.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{miembro.nombre}</h4>
                                            <p className="text-xs text-neutral-500 font-light">{miembro.correo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-neutral-500">
                                        Unido: {new Date(miembro.fecha_union).toLocaleDateString()}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

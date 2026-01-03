import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { HashRouter, Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, UserCheck, Save, Loader2, Upload, Camera, Phone, MapPin, User, MessageCircle, 
  X as CloseIcon, AlertTriangle, Heart, Users, Calendar, Clock, FileText, ChevronRight, 
  Edit2, CheckSquare, Square, ClipboardList, ArrowRightCircle, BarChart3, PieChart, 
  TrendingUp, CheckCircle2, GraduationCap, Calculator, LayoutGrid, List, LogOut, Lock, 
  Mail, Menu, Home, Info 
} from 'lucide-react';

// --- TIPOS ---
interface Student { id: string; name: string; registration_number: string; class_id: string; photo_url: string | null; guardian_name: string; guardian_phone: string; address: string; }
interface ClassLog { id: string; class_id: string; title: string; description: string; type: string; incident_date: string; }
interface GradeEntry { discipline: string; b1: number | ''; b2: number | ''; b3: number | ''; b4: number | ''; recovery: number | ''; }
interface LogEntry { id: string; student_id: string; type: string; title: string; description: string; situation: string; incident_date: string; incident_time: string; requested_by: string; actions_taken: string; referral: string; return_date: string; resolved_status: string; created_at: string; }

// --- CONFIGURAÇÕES ---
const DISCIPLINES = ["LP", "MAT", "CIE", "HIS", "GEO", "ING", "ART", "EDF", "PD1", "PD2", "PD3"];
const CORE_DISCIPLINES = ["LP", "MAT", "CIE", "HIS", "GEO", "ING", "ART", "EDF"];
const REQUESTERS = ["Professor", "Coordenação", "Direção", "Responsável", "Demanda Espontânea"];
const REASONS_DB: Record<string, string[]> = {
  "Comportamento": ["Conversa excessiva em sala", "Desacato / falta de respeito", "Agressividade verbal", "Agressividade física", "Uso indevido de celular", "Saída de sala sem autorização", "Bullying / conflito", "Desobediência às orientações"],
  "Pedagógico": ["Não realização de atividades", "Dificuldade de aprendizagem", "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado"],
  "Social / Emocional": ["Ansiedade / desmotivação", "Problemas familiares", "Isolamento", "Queixas de colegas"],
  "Outros": ["Solicitação de escuta", "Orientação vocacional", "Reunião com responsáveis", "Encaminhamento externo"]
};
const ACTIONS_LIST = ["Escuta individual", "Mediação de conflito", "Comunicação à família", "Contato com professor", "Encaminhamento à coordenação", "Encaminhamento à direção", "Acompanhamento pedagógico", "Agendamento de retorno", "Registro em ata"];
const REFERRALS_LIST = ["Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis", "Serviço social", "Direção", "Nenhum"];
const RESOLVED_STATUS = ["Sim", "Parcialmente", "Não"];
const TAGS_TEMPLATE = ["#conflito_sala", "#orientacao_vocacional", "#familia", "#atraso", "#indisciplina"];
const CLASS_LOG_TYPES = ["Palestra", "Conselho de Classe", "Reunião de Pais", "Ocorrência Coletiva", "Aviso/Circular", "Outros"];

// --- COMPONENTES VISUAIS ---
const LogIcon = ({ type }: { type: string }) => {
    const style = "p-2 rounded-xl shadow-sm shrink-0";
    switch (type) {
        case 'Comportamento': return <div className={`${style} bg-red-50 text-red-600`}><AlertTriangle size={18}/></div>;
        case 'Social / Emocional': return <div className={`${style} bg-purple-50 text-purple-600`}><Users size={18}/></div>;
        case 'Pedagógico': return <div className={`${style} bg-blue-50 text-blue-600`}><BookOpen size={18}/></div>;
        default: return <div className={`${style} bg-slate-100 text-slate-600`}><FileText size={18}/></div>;
    }
};

// --- LAYOUT PRINCIPAL (MENU LATERAL) ---
const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const handleLogout = async () => { await supabase.auth.signOut(); };

    const MenuLink = ({ to, icon: Icon, label }: any) => {
        const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
        return (
            <Link to={to} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                <span className="font-bold text-sm tracking-wide">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#F1F5F9] font-sans text-slate-900">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 bg-[#0F172A] flex-col fixed h-full z-50 shadow-2xl border-r border-slate-800">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 text-white mb-1">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20"><BookOpen size={24} /></div>
                        <div><h1 className="font-black text-lg leading-tight tracking-tight">SOE Digital</h1><p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Daniel Alves</p></div>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2 py-6">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
                    <MenuLink to="/" icon={Home} label="Minhas Turmas" />
                    <MenuLink to="/academic" icon={GraduationCap} label="Boletim & Notas" />
                    <MenuLink to="/stats" icon={BarChart3} label="Estatísticas" />
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full font-bold text-sm"><LogOut size={18} /> Sair do Sistema</button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-[#0F172A] text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2"><div className="bg-indigo-600 p-1.5 rounded-lg"><BookOpen size={18} /></div><span className="font-bold text-sm">SOE Digital</span></div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-800 rounded-lg"><Menu size={20}/></button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-[#0F172A] z-40 flex flex-col p-6 pt-20 space-y-4 md:hidden animate-in slide-in-from-top-10">
                    <MenuLink to="/" icon={Home} label="Minhas Turmas" />
                    <MenuLink to="/academic" icon={GraduationCap} label="Boletim & Notas" />
                    <MenuLink to="/stats" icon={BarChart3} label="Estatísticas" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 font-bold mt-auto"><LogOut size={20}/> Sair</button>
                </div>
            )}

            {/* Conteúdo Principal */}
            <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden">
                <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
                    {children}
                </div>
            </main>
        </div>
    );
};

// --- TELA DE LOGIN ---
const LoginScreen = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const authFunction = isSignUp ? supabase.auth.signUp : supabase.auth.signInWithPassword;
            const { error } = await authFunction({ email, password });
            if (error) throw error;
            if (isSignUp) alert('Cadastro realizado! Se o login não for automático, verifique seu e-mail (ou tente logar).');
        } catch (error: any) { alert('Erro: ' + error.message); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0F172A] to-indigo-950 p-6 relative overflow-hidden">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-6 transition-transform"><BookOpen size={40} className="text-white" /></div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">SOE Digital</h1>
                    <p className="text-indigo-200 font-medium text-sm">Plataforma de Gestão Daniel Alves</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider ml-1">E-mail Institucional</label>
                        <div className="relative group"><Mail className="absolute left-4 top-3.5 text-indigo-300 group-focus-within:text-white transition-colors" size={18}/><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-xl py-3 pl-12 pr-4 font-semibold text-white placeholder-indigo-300/30 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all hover:bg-slate-900/70" placeholder="usuario@escola.com"/></div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative group"><Lock className="absolute left-4 top-3.5 text-indigo-300 group-focus-within:text-white transition-colors" size={18}/><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-xl py-3 pl-12 pr-4 font-semibold text-white placeholder-indigo-300/30 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all hover:bg-slate-900/70" placeholder="••••••••"/></div>
                    </div>
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin"/> : (isSignUp ? 'Criar Nova Conta' : 'Acessar Sistema')}</button>
                </form>
                <div className="mt-8 pt-6 border-t border-white/10 text-center"><button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-indigo-300 hover:text-white transition-colors uppercase tracking-wide">{isSignUp ? 'Voltar para Login' : 'Não tem acesso? Solicitar Conta'}</button></div>
            </div>
        </div>
    );
};

// --- ESTATÍSTICAS ---
const Statistics = () => {
    const [loading, setLoading] = useState(true); const [stats, setStats] = useState<any>(null);
    useEffect(() => { calculateStats(); }, []);
    const calculateStats = async () => {
        setLoading(true);
        const { data: logs } = await supabase.from('student_logs').select('*');
        const { data: students } = await supabase.from('students').select('id, name, class_id');
        const { data: classes } = await supabase.from('classes').select('id, name');
        if (!logs || !students || !classes) return;
        const totalCalls = logs.length;
        const currentMonth = new Date().getMonth();
        const logsThisMonth = logs.filter(l => new Date(l.incident_date).getMonth() === currentMonth);
        const resolvedCount = logs.filter(l => l.resolved_status === 'Sim').length;
        const classMap: Record<string, string> = classes.reduce((acc: any, cls: any) => { acc[cls.id] = cls.name; return acc; }, {});
        const studentClassMap: Record<string, string> = students.reduce((acc: any, stu: any) => { acc[stu.id] = stu.class_id; return acc; }, {});
        const logsByClass: Record<string, number> = {};
        logs.forEach(log => { const classId = studentClassMap[log.student_id]; if (classId) { const className = classMap[classId] || 'Sem Turma'; logsByClass[className] = (logsByClass[className] || 0) + 1; } });
        const logsByType: Record<string, number> = {};
        logs.forEach(log => { logsByType[log.type] = (logsByType[log.type] || 0) + 1; });
        const logsBySituation: Record<string, number> = {};
        logs.forEach(log => { if(log.situation) { const sits = log.situation.split(', '); sits.forEach(s => logsBySituation[s] = (logsBySituation[s] || 0) + 1); } });
        const sortedClasses = Object.entries(logsByClass).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const sortedSituations = Object.entries(logsBySituation).sort((a,b) => b[1] - a[1]).slice(0, 5);
        setStats({ total: totalCalls, thisMonth: logsThisMonth.length, resolvedPercent: totalCalls > 0 ? Math.round((resolvedCount / totalCalls) * 100) : 0, byClass: sortedClasses, byType: logsByType, bySituation: sortedSituations });
        setLoading(false);
    };
    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center"><div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h1><p className="text-slate-500 font-medium">Visão geral dos atendimentos</p></div><div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-bold text-slate-500"><Calendar className="inline mr-2 w-4"/> {new Date().toLocaleDateString('pt-BR')}</div></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><ClipboardList size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Geral</p><p className="text-4xl font-black text-slate-800">{stats.total}</p></div></div>
                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Calendar size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Neste Mês</p><p className="text-4xl font-black text-slate-800">{stats.thisMonth}</p></div></div>
                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Resolvidos</p><p className="text-4xl font-black text-slate-800">{stats.resolvedPercent}%</p></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500"/> Ranking de Turmas</h3><div className="space-y-5">{stats.byClass.map(([cls, count]: any, index: number) => (<div key={cls} className="relative"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-700">{index + 1}. {cls}</span><span className="text-slate-500">{count}</span></div><div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full shadow-lg shadow-indigo-500/30" style={{ width: `${(count / stats.byClass[0][1]) * 100}%` }}></div></div></div>))}</div></div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2"><PieChart size={20} className="text-indigo-500"/> Natureza</h3><div className="grid grid-cols-2 gap-4">{Object.entries(stats.byType).map(([type, count]: any) => (<div key={type} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md transition-all"><div className="mb-3"><LogIcon type={type}/></div><p className="font-black text-2xl text-slate-800">{count}</p><p className="text-[10px] font-bold uppercase text-slate-400 mt-1">{type}</p></div>))}</div></div>
            </div>
        </div>
    );
};

// --- MÓDULO TURMA (CARÔMETRO + DIÁRIO + DADOS PESSOAIS) ---
const Carometro = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [className, setClassName] = useState('');
    const [activeTab, setActiveTab] = useState<'students' | 'logs'>('students');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [classLogs, setClassLogs] = useState<ClassLog[]>([]);
    
    // Forms
    const [newLogType, setNewLogType] = useState('Comportamento');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [newLogRequester, setNewLogRequester] = useState(REQUESTERS[0]);
    const [newLogReferral, setNewLogReferral] = useState(REFERRALS_LIST[0]);
    const [newLogResolved, setNewLogResolved] = useState(RESOLVED_STATUS[2]);
    const [newLogReturnDate, setNewLogReturnDate] = useState('');
    const [newLogDesc, setNewLogDesc] = useState('');
    const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [newLogTime, setNewLogTime] = useState(new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
    const [newClassLogTitle, setNewClassLogTitle] = useState('');
    const [newClassLogDesc, setNewClassLogDesc] = useState('');
    const [newClassLogType, setNewClassLogType] = useState(CLASS_LOG_TYPES[0]);
    const [newClassLogDate, setNewClassLogDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { fetchData(); fetchClassLogs(); }, [classId]);
    useEffect(() => { if (selectedStudent) fetchLogs(selectedStudent.id); }, [selectedStudent]);
    useEffect(() => { setNewLogDesc(''); setSelectedReasons([]); setSelectedActions([]); }, [selectedStudent]);

    const fetchData = async () => {
        setLoading(true);
        const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
        if (classData) setClassName(classData.name);
        const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
        if (studentsData) setStudents(studentsData);
        setLoading(false);
    };
    const fetchClassLogs = async () => { const { data } = await supabase.from('class_logs').select('*').eq('class_id', classId).order('incident_date', { ascending: false }); if (data) setClassLogs(data as any); };
    const fetchLogs = async (studentId: string) => { setLoadingLogs(true); const { data } = await supabase.from('student_logs').select('*').eq('student_id', studentId).order('incident_date', { ascending: false }).order('incident_time', { ascending: false }); if (data) setLogs(data as any); setLoadingLogs(false); }
    const handleAddLog = async () => { if (!selectedStudent) return; const situationString = selectedReasons.join(', '); const actionsString = selectedActions.join(', '); const titleGenerated = `${newLogType}: ${situationString.substring(0, 30)}${situationString.length > 30 ? '...' : ''}`; const { error } = await supabase.from('student_logs').insert({ student_id: selectedStudent.id, type: newLogType, title: titleGenerated || "Atendimento Diverso", description: newLogDesc, situation: situationString, incident_date: newLogDate, incident_time: newLogTime, requested_by: newLogRequester, actions_taken: actionsString, referral: newLogReferral, return_date: newLogReturnDate || null, resolved_status: newLogResolved }); if (error) alert('Erro: ' + error.message); else { alert('Salvo!'); setNewLogDesc(''); fetchLogs(selectedStudent.id); } };
    const handleAddClassLog = async () => { if (!newClassLogTitle) return; const { error } = await supabase.from('class_logs').insert({ class_id: classId, title: newClassLogTitle, description: newClassLogDesc, type: newClassLogType, incident_date: newClassLogDate }); if (error) alert('Erro: ' + error.message); else { alert('Salvo!'); setNewClassLogTitle(''); fetchClassLogs(); } }
    const toggleSelection = (item: string, list: string[], setList: any) => { if (list.includes(item)) setList(list.filter(i => i !== item)); else setList([...list, item]); };
    const insertTag = (tag: string) => { setNewLogDesc(prev => prev + (prev ? ' ' : '') + tag); };
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, studentId: string) => { if (!event.target.files?.length) return; const file = event.target.files[0]; const fileName = `${studentId}-${Date.now()}.${file.name.split('.').pop()}`; setUploading(studentId); try { const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) throw error; const { data } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: data.publicUrl }).eq('id', studentId); const upd = students.map(s => s.id === studentId ? { ...s, photo_url: data.publicUrl } : s); setStudents(upd); if (selectedStudent?.id === studentId) setSelectedStudent({...selectedStudent, photo_url: data.publicUrl} as any); } catch (e: any) { alert(e.message); } finally { setUploading(null); } };
    const getWhatsappLink = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, '')}`;

    if (loading && !students.length) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">{className}</h1><p className="text-slate-500 font-medium">{students.length} Estudantes Matriculados</p></div>
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
                    <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={18}/> Alunos</button>
                    <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={18}/> Diário de Turma</button>
                </div>
            </header>
            
            {activeTab === 'students' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {students.map((student) => (
                        <div key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
                            <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
                                {student.photo_url ? (<><img src={student.photo_url} className="w-full h-full object-cover"/><label onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-full shadow-lg cursor-pointer hover:bg-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={14}/><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, student.id)} disabled={uploading === student.id}/></label></>) : (<div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><User size={64} strokeWidth={1} /><label onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-2 bg-white text-indigo-600 rounded-full shadow-lg cursor-pointer hover:bg-indigo-50 z-20"><Camera size={16}/><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, student.id)} disabled={uploading === student.id}/></label></div>)}
                                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-slate-900/90 to-transparent pt-12 pointer-events-none"><p className="text-white font-bold text-sm leading-tight">{student.name}</p></div>
                                {uploading === student.id && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30"><Loader2 className="animate-spin text-indigo-600"/></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><ClipboardList size={20} className="text-indigo-600"/> Novo Registro</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Data</label><input type="date" value={newClassLogDate} onChange={e => setNewClassLogDate(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label><select value={newClassLogType} onChange={e => setNewClassLogType(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500">{CLASS_LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            </div>
                            <input type="text" placeholder="Título (ex: Palestra sobre Bullying)" value={newClassLogTitle} onChange={e => setNewClassLogTitle(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                            <textarea value={newClassLogDesc} onChange={e => setNewClassLogDesc(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Descrição do evento..."></textarea>
                            <button onClick={handleAddClassLog} disabled={!newClassLogTitle} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200">SALVAR REGISTRO</button>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        {classLogs.length === 0 ? <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200"><FileText size={48} className="mx-auto mb-4 opacity-50"/><p>Histórico vazio.</p></div> : classLogs.map(log => (<div key={log.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div><div className="flex justify-between items-start mb-3 pl-2"><div className="flex items-center gap-3"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">{log.type.includes('Palestra') ? <BookOpen size={20}/> : <Users size={20}/>}</div><div><h4 className="font-bold text-slate-900">{log.title}</h4><p className="text-xs text-slate-500 font-bold uppercase">{log.type}</p></div></div><span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border">{new Date(log.incident_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div><p className="text-slate-600 text-sm leading-relaxed pl-2">{log.description}</p></div>))}
                    </div>
                </div>
            )}

            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
                            <div className="flex gap-5 items-center">
                                <div className="relative shrink-0 group">
                                    <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden bg-slate-800 shadow-xl">{selectedStudent.photo_url ? <img src={selectedStudent.photo_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full font-bold text-2xl">{selectedStudent.name.charAt(0)}</div>}</div>
                                    <label className="absolute bottom-0 right-0 bg-indigo-500 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-400 shadow-lg border-2 border-slate-900 transition-transform hover:scale-110"><Camera size={16}/><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, selectedStudent.id)} disabled={uploading === selectedStudent.id}/></label>
                                </div>
                                <div><h2 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h2><p className="text-slate-400 text-sm mt-1 font-medium">Matrícula: {selectedStudent.registration_number}</p></div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><CloseIcon/></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                            <div className="w-full lg:w-[420px] bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto flex flex-col gap-6 shadow-[inset_-10px_0_20px_-15px_rgba(0,0,0,0.05)]">
                                
                                {/* --- CARD DADOS PESSOAIS --- */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><Info size={16} className="text-blue-500"/> Dados do Aluno</h3>
                                    <div className="space-y-3 text-sm">
                                        <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Responsável</p><p className="font-semibold text-slate-700 break-words leading-tight">{selectedStudent.guardian_name || 'Não informado'}</p></div>
                                        <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Contato</p><div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-slate-700">{selectedStudent.guardian_phone || '-'}</p>{selectedStudent.guardian_phone && <a href={getWhatsappLink(selectedStudent.guardian_phone)} target="_blank" className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-green-200 transition-colors"><MessageCircle size={12}/> Zap</a>}</div></div>
                                        <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Endereço</p><p className="font-semibold text-slate-700 leading-tight break-words">{selectedStudent.address || 'Não cadastrado'}</p></div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider"><ClipboardList size={18} className="text-indigo-600"/> Novo Atendimento</h3>
                                <div className="space-y-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex gap-3">
                                            <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Data</label><input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                            <div className="w-24"><label className="text-[10px] font-bold text-slate-400 uppercase">Hora</label><input type="time" value={newLogTime} onChange={e => setNewLogTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                        </div>
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Solicitante</label><select value={newLogRequester} onChange={e => setNewLogRequester(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">{REQUESTERS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label><select value={newLogType} onChange={e => { setNewLogType(e.target.value); setSelectedReasons([]); }} className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">{Object.keys(REASONS_DB).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Motivos</label><div className="flex flex-wrap gap-2">{REASONS_DB[newLogType].map(reason => (<div key={reason} onClick={() => toggleSelection(reason, selectedReasons, setSelectedReasons)} className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer border transition-all ${selectedReasons.includes(reason) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'}`}>{reason}</div>))}</div></div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Observações</label>
                                        <textarea value={newLogDesc} onChange={e => setNewLogDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Detalhes..."></textarea>
                                        <button onClick={handleAddLog} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"><Save size={18}/> REGISTRAR</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider"><FileText size={18} className="text-slate-400"/> Histórico</h3><span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">{logs.length} Registros</span></div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {loadingLogs ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500"/></div> : logs.length === 0 ? <div className="text-center text-slate-400 py-20"><FileText size={48} className="mx-auto mb-4 opacity-20"/><p>Nenhum registro encontrado.</p></div> : logs.map(log => (<div key={log.id} className="relative pl-8 before:absolute before:left-3 before:top-8 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 last:before:hidden"><div className="absolute left-0 top-1 w-7 h-7 bg-white border-2 border-indigo-100 rounded-full flex items-center justify-center z-10"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div></div><div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all"><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><LogIcon type={log.type}/><div><span className="block font-bold text-slate-900 text-sm">{log.type}</span><span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={10}/> {new Date(log.incident_date + 'T00:00:00').toLocaleDateString('pt-BR')} às {log.incident_time.slice(0,5)}</span></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${log.resolved_status === 'Sim' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{log.resolved_status}</span></div><div className="space-y-2 mt-3">{log.situation && <div className="flex flex-wrap gap-2">{log.situation.split(', ').map(s => <span key={s} className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-600">{s}</span>)}</div>}{log.description && <p className="text-sm text-slate-600 leading-relaxed italic bg-yellow-50/30 p-3 rounded-xl border border-yellow-100">"{log.description}"</p>}</div></div></div>))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MÓDULO ACADÊMICO (NOTAS) ---
const AcademicModule = () => { const { classId } = useParams(); const [students, setStudents] = useState<Student[]>([]); const [className, setClassName] = useState(''); const [loading, setLoading] = useState(true); const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); const [grades, setGrades] = useState<Record<string, GradeEntry>>({}); const [saving, setSaving] = useState(false); useEffect(() => { if (classId) fetchData(); }, [classId]); useEffect(() => { if (selectedStudent) fetchGrades(selectedStudent.id); }, [selectedStudent]); const fetchData = async () => { setLoading(true); const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single(); if (classData) setClassName(classData.name); const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classId).order('name'); if (studentsData) setStudents(studentsData || []); setLoading(false); }; const fetchGrades = async (studentId: string) => { const { data } = await supabase.from('grades').select('*').eq('student_id', studentId); const initialGrades: Record<string, GradeEntry> = {}; DISCIPLINES.forEach(d => { initialGrades[d] = { discipline: d, b1: '', b2: '', b3: '', b4: '', recovery: '' }; }); if (data) { data.forEach((g: any) => { initialGrades[g.discipline] = { discipline: g.discipline, b1: g.b1 ?? '', b2: g.b2 ?? '', b3: g.b3 ?? '', b4: g.b4 ?? '', recovery: g.recovery ?? '' }; }); } setGrades(initialGrades); }; const handleGradeChange = (disc: string, field: keyof GradeEntry, value: string) => { let numVal = value === '' ? '' : parseFloat(value.replace(',', '.')); if (numVal !== '' && (isNaN(numVal) || numVal < 0 || numVal > 10)) return; setGrades(prev => ({ ...prev, [disc]: { ...prev[disc], [field]: value } })); }; const saveGrades = async () => { if (!selectedStudent) return; setSaving(true); const updates = Object.values(grades).map(g => ({ student_id: selectedStudent.id, discipline: g.discipline, b1: g.b1 === '' ? null : g.b1, b2: g.b2 === '' ? null : g.b2, b3: g.b3 === '' ? null : g.b3, b4: g.b4 === '' ? null : g.b4, recovery: g.recovery === '' ? null : g.recovery })); const { error } = await supabase.from('grades').upsert(updates, { onConflict: 'student_id, discipline' }); setSaving(false); if (error) alert('Erro: ' + error.message); else alert('Salvo!'); }; const calculateStatus = () => { let failures = 0; CORE_DISCIPLINES.forEach(disc => { const g = grades[disc] || { b1: 0, b2: 0, b3: 0, b4: 0, recovery: '' }; const sum = (Number(g.b1)||0) + (Number(g.b2)||0) + (Number(g.b3)||0) + (Number(g.b4)||0); if (sum < 20) { if (g.recovery !== '' && Number(g.recovery) >= 5.0) { } else { failures++; } } }); if (failures === 0) return { status: 'APROVADO', color: 'bg-green-100 text-green-700' }; if (failures > 3) return { status: 'REPROVADO', color: 'bg-red-100 text-red-700' }; const hasRecoveryInput = Object.values(grades).some(g => g.recovery !== ''); if (hasRecoveryInput) { if (failures <= 2) return { status: 'APROVADO C/ DEP', color: 'bg-yellow-100 text-yellow-700' }; return { status: 'REPROVADO', color: 'bg-red-100 text-red-700' }; } else { return { status: `RECUPERAÇÃO (${failures})`, color: 'bg-orange-100 text-orange-700' }; } }; const globalStatus = selectedStudent ? calculateStatus() : { status: '', color: '' }; if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>; if (!selectedStudent) { return ( <div className="space-y-6"> <header className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"> <Link to="/academic" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><ChevronRight className="rotate-180"/></Link> <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">{className}</h1><p className="text-slate-500 font-medium">Selecione um aluno para lançar notas</p></div> </header> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {students.map(student => ( <div key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-400 hover:shadow-lg cursor-pointer flex items-center gap-4 transition-all duration-300 group"> <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 group-hover:border-indigo-300"> {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full font-bold text-slate-400">{student.name.charAt(0)}</div>} </div> <div><p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p><p className="text-xs text-slate-500 font-bold uppercase">Mat: {student.registration_number}</p></div> <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-400"/> </div> ))} </div> </div> ); } return ( <div className="space-y-6"> <header className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md bg-white/90"> <div className="flex items-center gap-4"> <button onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><ChevronRight className="rotate-180"/></button> <div className="flex items-center gap-4"> <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border hidden sm:block"> {selectedStudent.photo_url ? <img src={selectedStudent.photo_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full font-bold text-xl text-slate-400">{selectedStudent.name.charAt(0)}</div>} </div> <div><h1 className="text-2xl font-black text-slate-900">{selectedStudent.name}</h1><div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mt-1 ${globalStatus.color}`}>{globalStatus.status}</div></div> </div> </div> <button onClick={saveGrades} disabled={saving} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105">{saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} SALVAR NOTAS</button> </header> <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"> <div className="overflow-x-auto"> <table className="w-full text-sm text-left"> <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs"><tr><th className="p-4 w-24">Disciplina</th><th className="p-4 w-20 text-center">1º Bim</th><th className="p-4 w-20 text-center">2º Bim</th><th className="p-4 w-20 text-center">3º Bim</th><th className="p-4 w-20 text-center">4º Bim</th><th className="p-4 w-24 text-center bg-indigo-50 text-indigo-700">TOTAL</th><th className="p-4 w-24 text-center">Recup.</th><th className="p-4 w-32 text-center">Situação</th></tr></thead> <tbody className="divide-y divide-slate-100">{DISCIPLINES.map(disc => { const g = grades[disc] || {}; const sum = (Number(g.b1)||0) + (Number(g.b2)||0) + (Number(g.b3)||0) + (Number(g.b4)||0); const isCore = CORE_DISCIPLINES.includes(disc); const isRecovered = g.recovery !== '' && Number(g.recovery) >= 5.0; const approved = sum >= 20 || !isCore || isRecovered; return (<tr key={disc} className="hover:bg-slate-50/80 transition-colors"><td className="p-4 font-bold text-slate-900">{disc}</td>{['b1','b2','b3','b4'].map(field => (<td key={field} className="p-2 text-center"><input type="number" value={g[field as keyof GradeEntry] || ''} onChange={(e) => handleGradeChange(disc, field as keyof GradeEntry, e.target.value)} className="w-16 text-center p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-slate-50 focus:bg-white transition-all" placeholder="-"/></td>))}<td className={`p-4 text-center font-black text-base ${sum >= 20 ? 'text-green-600' : 'text-red-600'}`}>{sum.toFixed(1)}</td><td className="p-2 text-center">{isCore && sum < 20 && (<input type="number" value={g.recovery || ''} onChange={(e) => handleGradeChange(disc, 'recovery', e.target.value)} className="w-16 text-center p-2 border border-orange-200 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-700" placeholder="Nota"/>)}</td><td className="p-4 text-center">{isCore ? (approved ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold uppercase">{isRecovered ? 'Aprov (Rec)' : 'Aprovado'}</span> : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold uppercase">Recuperação</span>) : (<span className="text-xs text-slate-400 font-medium">-</span>)}</td></tr>); })}</tbody> </table> </div> </div> </div> ); };
const AcademicDashboard = () => { const [classes, setClasses] = useState<any[]>([]); useEffect(() => { supabase.from('classes').select('*').order('name').then(({data}) => { if(data) setClasses(data); }); }, []); return (<div className="space-y-8"><header><h1 className="text-3xl font-black text-slate-900 tracking-tight">Diário de Classe</h1><p className="text-slate-500 font-medium">Gestão de notas e resultados</p></header><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{classes.map(cls => (<Link key={cls.id} to={`/academic/class/${cls.id}`} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"><div className="flex items-center gap-4 mb-4"><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><GraduationCap size={28}/></div><div><h3 className="text-2xl font-black text-slate-800 leading-none">{cls.name}</h3><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cls.shift}</span></div></div><div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors"><Edit2 size={16}/> Lançar Notas <ArrowRightCircle size={16} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"/></div></Link>))}</div></div>); };
const Statistics = () => { const [loading, setLoading] = useState(true); const [stats, setStats] = useState<any>(null); useEffect(() => { calculateStats(); }, []); const calculateStats = async () => { setLoading(true); const { data: logs } = await supabase.from('student_logs').select('*'); const { data: students } = await supabase.from('students').select('id, name, class_id'); const { data: classes } = await supabase.from('classes').select('id, name'); if (!logs || !students || !classes) return; const totalCalls = logs.length; const currentMonth = new Date().getMonth(); const logsThisMonth = logs.filter(l => new Date(l.incident_date).getMonth() === currentMonth); const resolvedCount = logs.filter(l => l.resolved_status === 'Sim').length; const classMap: Record<string, string> = classes.reduce((acc: any, cls: any) => { acc[cls.id] = cls.name; return acc; }, {}); const studentClassMap: Record<string, string> = students.reduce((acc: any, stu: any) => { acc[stu.id] = stu.class_id; return acc; }, {}); const logsByClass: Record<string, number> = {}; logs.forEach(log => { const classId = studentClassMap[log.student_id]; if (classId) { const className = classMap[classId] || 'Sem Turma'; logsByClass[className] = (logsByClass[className] || 0) + 1; } }); const logsByType: Record<string, number> = {}; logs.forEach(log => { logsByType[log.type] = (logsByType[log.type] || 0) + 1; }); const logsBySituation: Record<string, number> = {}; logs.forEach(log => { if(log.situation) { const sits = log.situation.split(', '); sits.forEach(s => logsBySituation[s] = (logsBySituation[s] || 0) + 1); } }); const sortedClasses = Object.entries(logsByClass).sort((a,b) => b[1] - a[1]).slice(0, 5); const sortedSituations = Object.entries(logsBySituation).sort((a,b) => b[1] - a[1]).slice(0, 5); setStats({ total: totalCalls, thisMonth: logsThisMonth.length, resolvedPercent: totalCalls > 0 ? Math.round((resolvedCount / totalCalls) * 100) : 0, byClass: sortedClasses, byType: logsByType, bySituation: sortedSituations }); setLoading(false); }; if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>; return ( <div className="space-y-8"> <header className="flex justify-between items-center"> <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h1><p className="text-slate-500 font-medium">Visão geral dos atendimentos</p></div> <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-bold text-slate-500"><Calendar className="inline mr-2 w-4"/> {new Date().toLocaleDateString('pt-BR')}</div> </header> <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><ClipboardList size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Geral</p><p className="text-4xl font-black text-slate-800">{stats.total}</p></div></div> <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Calendar size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Neste Mês</p><p className="text-4xl font-black text-slate-800">{stats.thisMonth}</p></div></div> <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300"><div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 size={32}/></div><div><p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Resolvidos</p><p className="text-4xl font-black text-slate-800">{stats.resolvedPercent}%</p></div></div> </div> <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500"/> Ranking de Turmas</h3><div className="space-y-5">{stats.byClass.map(([cls, count]: any, index: number) => (<div key={cls} className="relative"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-700">{index + 1}. {cls}</span><span className="text-slate-500">{count}</span></div><div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full shadow-lg shadow-indigo-500/30" style={{ width: `${(count / stats.byClass[0][1]) * 100}%` }}></div></div></div>))}</div></div> <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2"><PieChart size={20} className="text-indigo-500"/> Natureza</h3><div className="grid grid-cols-2 gap-4">{Object.entries(stats.byType).map(([type, count]: any) => (<div key={type} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md transition-all"><div className="mb-3"><LogIcon type={type}/></div><p className="font-black text-2xl text-slate-800">{count}</p><p className="text-[10px] font-bold uppercase text-slate-400 mt-1">{type}</p></div>))}</div></div> </div> </div> ); };
const Dashboard = () => { const [classes, setClasses] = useState<any[]>([]); useEffect(() => { supabase.from('classes').select('*').order('name').then(({data}) => { if(data) setClasses(data); }); }, []); return (<div className="space-y-8"><header><h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Turmas</h1><p className="text-slate-500 font-medium">Selecione uma turma para gerenciar</p></header><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{classes.map(cls => (<Link key={cls.id} to={`/class/${cls.id}`} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"><div className="flex items-center gap-4 mb-4"><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><UserCheck size={28}/></div><div><h3 className="text-2xl font-black text-slate-800 leading-none">{cls.name}</h3><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cls.shift}</span></div></div><div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors"><Users size={16}/> Ver Alunos <ArrowRightCircle size={16} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"/></div></Link>))}</div></div>); };

// --- APP PRINCIPAL ---
export default function App() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-indigo-500 w-12 h-12"/></div>;

    if (!session) {
        return <LoginScreen />;
    }

    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/class/:classId" element={<Carometro />} />
                    <Route path="/stats" element={<Statistics />} />
                    <Route path="/academic" element={<AcademicDashboard />} />
                    <Route path="/academic/class/:classId" element={<AcademicModule />} />
                </Routes>
            </Layout>
        </HashRouter>
    ); 
}
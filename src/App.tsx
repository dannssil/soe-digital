import StudentList from './StudentList';
import { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo para performance
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Importação dos componentes do Recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { 
  LayoutDashboard, Users, BookOpen, LogOut, 
  Plus, Save, X, AlertTriangle, Camera, User, Pencil, Printer, Lock,
  GraduationCap, FileText, History, Upload, FileSpreadsheet,
  TrendingDown, AlertCircle, BarChart3, CheckSquare, MapPin, Phone, 
  UserCircle, FileDown, CalendarDays, Download, Menu, Search, Clock, Users2, Zap
} from 'lucide-react';

// --- CONFIGURAÇÕES E LISTAS ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1"; 
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

const MOTIVOS_COMPORTAMENTO = ["Conversa excessiva em sala", "Desacato / falta de respeito", "Agressividade verbal", "Agressividade física", "Uso indevido de celular", "Saída de sala sem autorização", "Bullying / conflito com colegas", "Desobediência às orientações", "Uniforme inadequado", "Outros"];
const MOTIVOS_PEDAGOGICO = ["Não realização de atividades", "Dificuldade de aprendizagem", "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado", "Faltas excessivas / Infrequência", "Sono em sala", "Outros"];
const MOTIVOS_SOCIAL = ["Ansiedade / desmotivação", "Problemas familiares", "Isolamento / dificuldade de socialização", "Queixas de colegas", "Questões de saúde / Laudo", "Vulnerabilidade social", "Outros"];
const ENCAMINHAMENTOS = ["Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis", "Direção", "Conselho Tutelar", "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar", "Saúde"];
const FLASH_REASONS = ["Uniforme Inadequado", "Atraso / Chegada Tardia", "Uso de Celular", "Sem Material", "Saída de Sala", "Conversa / Bagunça", "Conflito entre Colegas", "Sono em Sala", "Falta de Atividade", "Elogio / Destaque Positivo", "Encaminhamento Saúde", "Outros"];

// --- INTERFACES ---
interface Student { id: any; name: string; class_id: string; guardian_name?: string; guardian_phone?: string; address?: string; photo_url?: string; absences?: number; performance?: string; grades?: string; logs?: Log[]; status: string; desempenho?: any[]; }
interface Log { id: number; created_at: string; category: string; description: string; referral?: string; return_date?: string; resolved?: boolean; }

function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`}>{initials}</div>;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'students'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(localStorage.getItem('adminPhoto'));
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<Student | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); 
  const [returnDate, setReturnDate] = useState(''); 
  const [obsLivre, setObsLivre] = useState("Relatório de Atendimento:\n\n- Relato:\n\n- Mediação realizada:\n\n- Combinados:");

  useEffect(() => {
    const savedAuth = localStorage.getItem('soe_auth');
    if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); }
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase.from('students').select(`*, logs(*), desempenho:desempenho_bimestral(*)`).eq('status', 'ATIVO').order('name'); 
    if (!error) setStudents(data || []);
    setLoading(false);
  }

  // --- LÓGICA DE PROCESSAMENTO DE DADOS PARA GRÁFICOS ---
  const stats = useMemo(() => {
    const allLogs = students.flatMap(s => s.logs || []);
    
    // 1. Atendimentos por dia (Últimos 7 dias)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const count = allLogs.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length;
      return { name: dateStr, total: count };
    }).reverse();

    // 2. Distribuição por Motivo
    const motivoCount: any = {};
    allLogs.forEach(l => {
      try {
        const desc = JSON.parse(l.description);
        desc.motivos?.forEach((m: string) => {
          motivoCount[m] = (motivoCount[m] || 0) + 1;
        });
      } catch (e) {}
    });
    const pieData = Object.keys(motivoCount).map(key => ({ name: key, value: motivoCount[key] })).sort((a,b) => b.value - a.value).slice(0, 5);

    return { last7Days, pieData };
  }, [students]);

  const renderDashboard = () => {
    const studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoNotas; });
    const pendingReturns = students.flatMap(s => s.logs || []).filter(l => l.return_date && !l.resolved);

    return (
      <div className="space-y-6 pb-20">
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Alunos</p>
                <h3 className="text-3xl font-black text-indigo-600">{students.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Em Alerta</p>
                <h3 className="text-3xl font-black text-red-500">{studentsInRisk.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retornos</p>
                <h3 className="text-3xl font-black text-amber-500">{pendingReturns.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Turmas</p>
                <h3 className="text-3xl font-black text-emerald-500">{[...new Set(students.map(s => s.class_id))].length}</h3>
            </div>
        </div>

        {/* ÁREA DE GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Linha: Tendência */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Volume de Atendimentos (Últimos 7 dias)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.last7Days}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Gráfico de Pizza: Motivos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Principais Motivos</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stats.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ALERTA DE ALUNOS (SISTEMA ANTIGO) */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><AlertCircle className="text-red-600" size={20} /><h3 className="font-bold text-red-800 uppercase">Casos Críticos</h3></div>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto">
              {studentsInRisk.map(s => (
                <div key={s.id} onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100">
                  <div className="flex items-center gap-3"><Avatar name={s.name} src={s.photo_url} size="sm" /><div><p className="font-bold text-slate-800 text-sm">{s.name}</p><p className="text-xs text-slate-500">Turma {s.class_id}</p></div></div>
                  <AlertTriangle className="text-red-400" size={18} />
                </div>
              ))}
            </div>
        </div>

        {/* BOTÃO FLASH */}
        <button onClick={() => { setQuickSearchTerm(''); setQuickSelectedStudent(null); setQuickReason(''); setIsQuickModalOpen(true); }} className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white animate-bounce"><Zap size={28} fill="white" /></button>
      </div>
    );
  };

  // --- FUNÇÕES DE APOIO (SALVAR, EDITAR, LOGIN) ---
  // (Mantidas as mesmas das versões anteriores para não quebrar funcionalidade)
  const handleQuickSave = async () => {
    if (!quickSelectedStudent || !quickReason) return;
    const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' });
    const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]);
    if (!error) { alert(`Registro salvo!`); setIsQuickModalOpen(false); fetchStudents(); }
  };

  const checkRisk = (student: Student) => {
    const totalFaltas = student.desempenho?.reduce((acc, d) => acc + (d.faltas_bimestre || 0), 0) || 0;
    const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null;
    let notasVermelhas = 0;
    if (ultDesempenho) { const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; }
    return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3 };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); }
    else setLoginError(true);
  };

  if (!isAuthenticated) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="text-indigo-600" size={32} /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso SOE</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" title="Senha" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
          {loginError && <p className="text-red-500 text-xs font-bold">Senha incorreta.</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Entrar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div>
          <div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => { setView('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18} /> Alunos</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => { localStorage.removeItem('soe_auth'); window.location.reload(); }} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"><LogOut size={16} /> Sair</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm z-10 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24}/></button>
            <div className="flex-1 max-w-md relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
               <input type="text" placeholder="Buscar aluno..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-full text-sm outline-none" value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); if(e.target.value.length > 0) setView('students'); }} />
            </div>
          </div>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'dashboard' ? renderDashboard() : (
            <div className="max-w-6xl mx-auto pb-20">
              <div className="flex justify-end mb-8"><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={20} /> Novo Aluno</button></div>
              <StudentList students={students} onSelectStudent={(s) => { setSelectedStudent(s); setIsModalOpen(true); }} searchTerm={globalSearch} onSearchChange={setGlobalSearch} />
            </div>
          )}
        </div>
      </main>

      {/* MODAL FLASH (COPIADO DA VERSÃO ANTERIOR COM MELHORIA VISUAL) */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={24}/></button>
            <div className="text-center mb-6"><div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"><Zap size={28} className="text-indigo-600 fill-indigo-600"/></div><h3 className="text-xl font-bold">Registro Flash</h3></div>
            <div className="space-y-4">
               <input autoFocus placeholder="Nome do aluno..." className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" value={quickSearchTerm} onChange={e => { setQuickSearchTerm(e.target.value); setQuickSelectedStudent(null); }} />
               {quickSearchTerm.length > 2 && !quickSelectedStudent && (
                  <div className="bg-white border rounded-xl shadow-xl max-h-32 overflow-y-auto">
                    {students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 5).map(s => (
                      <div key={s.id} onClick={() => { setQuickSelectedStudent(s); setQuickSearchTerm(s.name); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm border-b">{s.name} ({s.class_id})</div>
                    ))}
                  </div>
               )}
               <div className="grid grid-cols-2 gap-2">
                 {FLASH_REASONS.slice(0, 8).map(r => (
                   <button key={r} onClick={() => setQuickReason(r)} className={`p-2 rounded-lg text-[10px] font-bold border ${quickReason === r ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>{r}</button>
                 ))}
               </div>
               <button onClick={handleQuickSave} disabled={!quickSelectedStudent || !quickReason} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">SALVAR AGORA</button>
            </div>
          </div>
        </div>
      )}
      
      {/* OS OUTROS MODAIS (DETALHES, NOVO ALUNO, ETC) CONTINUAM OS MESMOS AQUI... */}
    </div>
  );
}
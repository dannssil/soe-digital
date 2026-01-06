import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LayoutDashboard, Users, BookOpen, LogOut,
  Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock,
  FileText, CheckSquare, Phone,
  UserCircle, FileDown, CalendarDays, Zap, Menu, Search, Users2, MoreHorizontal, Folder, BarChart3
} from 'lucide-react';

// ==============================================================================
// 🚨 ÁREA DE CONEXÃO - COLE SEUS DADOS AQUI 🚨
// ==============================================================================

const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co"; 
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";

// ==============================================================================

const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

// --- LISTAS ---
const MOTIVOS_COMPORTAMENTO = ["Conversa excessiva em sala", "Desacato / falta de respeito", "Agressividade verbal", "Agressividade física", "Uso indevido de celular", "Saída de sala sem autorização", "Bullying / conflito com colegas", "Desobediência às orientações", "Uniforme inadequado", "Outros"];
const MOTIVOS_PEDAGOGICO = ["Não realização de atividades", "Dificuldade de aprendizagem", "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado", "Faltas excessivas / Infrequência", "Sono em sala", "Outros"];
const MOTIVOS_SOCIAL = ["Ansiedade / desmotivação", "Problemas familiares", "Isolamento / dificuldade de socialização", "Queixas de colegas", "Questões de saúde / Laudo", "Vulnerabilidade social", "Outros"];
const ENCAMINHAMENTOS = ["Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis", "Direção", "Conselho Tutelar", "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar", "Saúde"];
const FLASH_REASONS = ["Uniforme Inadequado", "Atraso / Chegada Tardia", "Uso de Celular", "Sem Material", "Saída de Sala", "Conversa / Bagunça", "Conflito entre Colegas", "Sono em Sala"];

// --- COMPONENTES AUXILIARES ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses: any = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-2xl" };
  const pxSize: any = { sm: 32, md: 40, lg: 64, xl: 96 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

// COMPONENTE LISTA DE ESTUDANTES (INTEGRADO PARA EVITAR TELA BRANCA)
const StudentList = ({ students, onSelectStudent, searchTerm }: any) => {
  const filtered = students.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
            <tr><th className="px-6 py-4">Estudante</th><th className="px-6 py-4">Turma</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s: any) => (
              <tr key={s.id} onClick={() => onSelectStudent(s)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4"><Avatar name={s.name} src={s.photo_url} size="md"/><div className="font-bold text-slate-700 text-base">{s.name}</div></td>
                <td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-indigo-600 p-2"><MoreHorizontal size={20}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [view, setView] = useState<'dashboard' | 'students'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  
  // Tabs & Forms
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [listClassFilter, setListClassFilter] = useState<string | null>(null); 

  // Campos
  const [editName, setEditName] = useState(''); const [editClass, setEditClass] = useState(''); const [editGuardian, setEditGuardian] = useState(''); const [editPhone, setEditPhone] = useState(''); const [editAddress, setEditAddress] = useState('');
  const [newName, setNewName] = useState(''); const [newClass, setNewClass] = useState(''); 
  
  // Atendimento
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [obsLivre, setObsLivre] = useState("Relatório de Atendimento:\n\n- Relato:\n\n- Mediação realizada:\n\n- Combinados:");
  
  // Flash & Saída
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');

  useEffect(() => {
    const savedAuth = localStorage.getItem('soe_auth');
    const savedPhoto = localStorage.getItem('adminPhoto');
    if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); }
    if (savedPhoto) setAdminPhoto(savedPhoto);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase.from('students')
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date), desempenho:desempenho_bimestral(*)`)
      .eq('status', 'ATIVO').order('name');
    if (!error && data) {
       const sortedData = data.map((student: any) => ({
        ...student,
        logs: student.logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }));
      setStudents(sortedData);
    }
    setLoading(false);
  }

  const toggleItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter((i: string) => i !== item));
    else setList([...list, item]);
  };

  const checkRisk = (student: any) => {
    const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0;
    const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null;
    let notasVermelhas = 0;
    if (ultDesempenho) { 
        const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; 
        notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; 
    }
    return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3, totalFaltas, notasVermelhas };
  };

  const stats = useMemo(() => {
    const allLogs = students.flatMap(s => s.logs || []);
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const count = allLogs.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length;
      return { name: dateStr, total: count };
    }).reverse();
    const motivoCount: any = {};
    allLogs.forEach(l => { 
        try { 
            const desc = JSON.parse(l.description); 
            if(desc.motivos) desc.motivos.forEach((m: string) => { motivoCount[m] = (motivoCount[m] || 0) + 1; });
        } catch (e) {} 
    });
    const pieData = Object.keys(motivoCount).map(key => ({ name: key, value: motivoCount[key] })).sort((a,b) => b.value - a.value).slice(0, 5);
    return { last7Days, pieData };
  }, [students]);

  // --- AÇÕES ---
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); } else setLoginError(true); };
  
  const startEditing = () => { if(selectedStudent) { setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); setIsEditing(true); } };
  
  const saveEdits = async () => { if(!selectedStudent) return; const { error } = await supabase.from('students').update({ name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress }).eq('id', selectedStudent.id); if(!error) { alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); } else alert(error.message); };
  
  const handleSaveLog = async () => { 
      if(!selectedStudent) return; 
      const currentCategory = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; 
      const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); 
      const { error } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: currentCategory, description: desc, referral: encaminhamento, resolved: resolvido, created_at: new Date(attendanceDate).toISOString(), return_date: returnDate || null }]); 
      if(!error) { 
          alert('Salvo com sucesso!'); setMotivosSelecionados([]); setIsModalOpen(false); fetchStudents(); 
      } else alert(error.message); 
  };
  
  const handleQuickSave = async () => { if (!quickSelectedStudent || !quickReason) return; const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' }); const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]); if (!error) { alert(`Salvo!`); setIsQuickModalOpen(false); fetchStudents(); } };
  
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if(!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  
  const handleRegisterExit = async () => { 
      if(!selectedStudent) return; 
      const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id); 
      if(!error) { alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); } else alert(error.message); 
  };
  
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return;
    const file = event.target.files[0];
    const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('photos').upload(fileName, file);
    if (error) { alert('Erro upload: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
    await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id);
    setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents();
  }

  const generatePDF = () => { 
    if(!selectedStudent) return; 
    const doc = new jsPDF(); 
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("FICHA INDIVIDUAL DE ACOMPANHAMENTO", 105, 15, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${selectedStudent.name}`, 14, 25);
    doc.text(`Turma: ${selectedStudent.class_id}`, 14, 30);
    doc.text(`Responsável: ${selectedStudent.guardian_name || '-'}`, 14, 35);
    
    doc.setFont("helvetica", "bold"); doc.text("Desempenho Acadêmico", 14, 45);
    const acadData = selectedStudent.desempenho?.map((d:any) => [d.bimestre, d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf, d.pd1, d.faltas_bimestre]) || [];
    autoTable(doc, { startY: 50, head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'Faltas']], body: acadData, theme: 'grid', styles: { fontSize: 8, halign: 'center' } });
    
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 60;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Histórico de Atendimentos", 14, finalY);
    const logsData = selectedStudent.logs?.map((l:any) => {
        let desc = { motivos: [], obs: '' };
        try { desc = JSON.parse(l.description); } catch(e) {}
        return [new Date(l.created_at).toLocaleDateString('pt-BR'), l.category, (desc.motivos?.join(', ') || '') + '\n' + desc.obs, l.resolved ? 'Sim' : 'Não'];
    }) || [];
    autoTable(doc, { startY: finalY + 5, head: [['Data', 'Categoria', 'Descrição / Motivos', 'Resolvido']], body: logsData, theme: 'grid', styles: { fontSize: 8 }, columnStyles: { 2: { cellWidth: 80 } } });
    doc.save(`Ficha_${selectedStudent.name}.pdf`); 
  }; 

  const renderDashboard = () => {
    let studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    if (selectedClassFilter) studentsInRisk = studentsInRisk.filter(s => s.class_id === selectedClassFilter);
    const turmas = [...new Set(students.map(s => s.class_id))].sort();
    
    return (
      <div className="space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Alunos</p><h3 className="text-3xl font-black text-indigo-600">{students.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Em Alerta</p><h3 className="text-3xl font-black text-red-500">{studentsInRisk.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Turmas</p><h3 className="text-3xl font-black text-emerald-500">{turmas.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Atendimentos</p><h3 className="text-3xl font-black text-amber-500">{students.flatMap(s=>s.logs||[]).length}</h3></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Volume de Atendimentos</h4>
                <ResponsiveContainer width="100%" height="100%"><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{r:6, fill:'#6366f1'}} /></LineChart></ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                {/* CORREÇÃO DO ÍCONE AQUI */}
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2"><BarChart3 size={16}/> Motivos Recorrentes</h4>
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-1 bg-white rounded-2xl border border-red-100 shadow-sm flex flex-col overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100"><h3 className="font-bold text-red-800 uppercase text-sm">Alunos em Risco {selectedClassFilter && `(${selectedClassFilter})`}</h3></div>
                <div className="flex-1 overflow-y-auto p-2">
                    {studentsInRisk.length > 0 ? studentsInRisk.map(s => (
                        <div key={s.id} onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="p-3 hover:bg-red-50 rounded-xl cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100 group transition-colors">
                            <div className="flex items-center gap-3"><Avatar name={s.name} src={s.photo_url} size="sm" /><div><p className="font-bold text-slate-800 text-sm group-hover:text-red-700">{s.name}</p><p className="text-xs text-slate-500 font-bold">Turma {s.class_id}</p></div></div>
                        </div>
                    )) : <p className="p-4 text-center text-slate-400 text-sm">Nenhum aluno em risco.</p>}
                </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col overflow-hidden">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100"><h3 className="font-bold text-indigo-800 uppercase">Pastas de Turmas (Filtro)</h3></div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {turmas.map(t => {
                            const count = students.filter(s => s.class_id === t).length;
                            return (<div key={t} onClick={() => setSelectedClassFilter(selectedClassFilter === t ? null : t)} className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedClassFilter === t ? 'bg-indigo-600 text-white transform scale-105' : 'bg-slate-50 hover:bg-white hover:border-indigo-300'}`}><h4 className="font-bold text-xl mb-1">{t}</h4><span className={`text-xs font-bold uppercase ${selectedClassFilter === t ? 'text-indigo-200' : 'text-slate-400'}`}>{count} Alunos</span></div>)
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="text-indigo-600" size={32} /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso SOE</h1>
        <form onSubmit={handleLogin} className="space-y-4"><input type="password" className="w-full p-3 border rounded-xl text-center" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} /><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Entrar</button></form>
      </div>
    </div>
  );

  const turmasList = [...new Set(students.map(s => s.class_id))].sort();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800"><div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div><div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div></div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
            <button onClick={() => { setView('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'students' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><Users size={18} /> Alunos</button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm z-10 gap-4">
          <div className="flex items-center gap-3 flex-1"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24}/></button><div className="flex-1 max-w-md relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Buscar aluno..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none" value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); if(e.target.value.length > 0) setView('students'); }} /></div></div>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'dashboard' ? renderDashboard() : (
            <div className="max-w-6xl mx-auto pb-20">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Estudantes</h2>
                  <button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={20} /> Novo Aluno</button>
              </div>
              
              {/* PASTAS DE TURMA (FILTRO DE ALUNOS) */}
              <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
                  <button onClick={() => setListClassFilter(null)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border ${!listClassFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>Todos</button>
                  {turmasList.map(t => (
                      <button key={t} onClick={() => setListClassFilter(t)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border flex items-center gap-2 ${listClassFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                          <Folder size={14} /> {t}
                      </button>
                  ))}
              </div>

              {/* LISTA DE ESTUDANTES */}
              <StudentList students={students.filter(s => !listClassFilter || s.class_id === listClassFilter)} onSelectStudent={(s: any) => { setSelectedStudent(s); setIsModalOpen(true); }} searchTerm={globalSearch} />
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES COMPLETO */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
               <div className="flex items-center gap-6">
                 <div className="relative group">
                    <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/></label>
                 </div>
                 <div><h2 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h2><p className="text-lg text-slate-500 font-bold uppercase mt-1">Turma {selectedStudent.class_id}</p></div>
               </div>
               <div className="flex gap-2">
                 <button onClick={generatePDF} className="p-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors" title="Gerar PDF"><FileDown size={20} /></button>
                 <button onClick={startEditing} className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors" title="Editar Dados"><Pencil size={20} /></button>
                 <button onClick={() => setIsExitModalOpen(true)} className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="Registrar Saída"><LogOut size={20} /></button>
                 <button onClick={() => setIsModalOpen(false)} className="ml-4 hover:bg-slate-200 p-2 rounded-full"><X className="text-slate-400 hover:text-red-500" size={32}/></button>
               </div>
            </div>

            {/* Abas */}
            <div className="flex border-b px-8 bg-white overflow-x-auto flex-shrink-0 gap-8">
               {['perfil', 'academico', 'historico', 'familia'].map((tab) => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 font-bold text-sm border-b-4 uppercase tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                       {tab === 'familia' ? 'Família & Responsáveis' : tab}
                   </button>
               ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
               {activeTab === 'perfil' && (
                 <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-3xl mx-auto">
                    <h3 className="font-bold text-indigo-900 uppercase mb-6 flex items-center gap-2 border-b pb-4"><UserCircle className="text-indigo-600"/> Informações de Contato</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Responsável Legal</span>{isEditing ? <input value={editGuardian} onChange={e=>setEditGuardian(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50"/> : <p className="font-medium text-lg">{selectedStudent.guardian_name || "Não informado"}</p>}</div>
                            <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Telefone de Contato</span>{isEditing ? <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50"/> : <p className="font-medium text-lg">{selectedStudent.guardian_phone || "Não informado"}</p>}</div>
                        </div>
                        <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Endereço Residencial</span>{isEditing ? <input value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50"/> : <p className="font-medium text-lg leading-relaxed">{selectedStudent.address || "Não informado"}</p>}</div>
                        {isEditing && <button onClick={saveEdits} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold mt-4 shadow-lg hover:bg-green-700 transition-all">Salvar Alterações</button>}
                    </div>
                 </div>
               )}

               {activeTab === 'academico' && (
                 <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b">
                        <tr>
                            <th className="px-4 py-4">Bimestre</th>
                            <th className="px-2">Português</th><th className="px-2">Matemática</th><th className="px-2">Ciências</th><th className="px-2">História</th><th className="px-2">Geografia</th>
                            <th className="px-2">Inglês</th><th className="px-2">Arte</th><th className="px-2">Ed. Física</th>
                            <th className="px-2 bg-slate-200">PD1</th><th className="px-2 bg-slate-200">PD2</th><th className="px-2 bg-slate-200">PD3</th>
                            <th className="px-4 text-red-600 bg-red-50 text-center">FALTAS</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {selectedStudent.desempenho?.map((d: any, i: number) => (
                         <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-5 font-bold text-slate-700">{d.bimestre}</td>
                            <td className={`px-2 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td>
                            <td className={`px-2 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td>
                            <td className="px-2">{d.cie}</td><td className="px-2">{d.his}</td><td className="px-2">{d.geo}</td>
                            <td className="px-2">{d.ing}</td><td className="px-2">{d.art}</td><td className="px-2">{d.edf}</td>
                            <td className="px-2 bg-slate-50">{d.pd1}</td><td className="px-2 bg-slate-50">{d.pd2}</td><td className="px-2 bg-slate-50">{d.pd3}</td>
                            <td className="px-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               {(activeTab === 'historico' || activeTab === 'familia') && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* FORMULÁRIO COMPLETO */}
                      <div className={`lg:col-span-5 p-6 rounded-2xl border shadow-sm h-fit ${activeTab === 'familia' ? 'bg-orange-50 border-orange-200' : 'bg-white border-indigo-100'}`}>
                          <h3 className="font-bold mb-6 uppercase text-sm flex items-center gap-2 pb-4 border-b border-black/5">{activeTab === 'familia' ? <><Users2/> Novo Contato Família</> : <><FileText/> Novo Atendimento</>}</h3>
                          <div className="space-y-4">
                              <div><label className="text-xs font-bold text-slate-400 uppercase">Solicitante</label><select className="w-full mt-1 p-3 border rounded-xl bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option></select></div>
                              <div><label className="text-xs font-bold text-slate-400 uppercase">Encaminhar</label><select className="w-full mt-1 p-3 border rounded-xl bg-white" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Selecione --</option>{ENCAMINHAMENTOS.map(e=><option key={e}>{e}</option>)}</select></div>
                              <div className="flex gap-4">
                                  <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Data</label><input type="date" className="w-full mt-1 p-3 border rounded-xl bg-white" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></div>
                                  <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Retorno</label><input type="date" className="w-full mt-1 p-3 border rounded-xl bg-white" placeholder="Retorno" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
                              </div>
                              <div className="border p-3 rounded-xl bg-white/50 space-y-3 h-64 overflow-y-auto">
                                  <div><p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Comportamental</p><div className="grid grid-cols-1 gap-1">{MOTIVOS_COMPORTAMENTO.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                                  <div><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Pedagógico</p><div className="grid grid-cols-1 gap-1">{MOTIVOS_PEDAGOGICO.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                                  <div><p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Social/Outros</p><div className="grid grid-cols-1 gap-1">{MOTIVOS_SOCIAL.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                              </div>
                              <textarea className="w-full p-4 border rounded-xl h-32 text-sm bg-white" value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                              <div className="flex justify-between items-center pt-2"><label className="text-sm font-bold text-green-700 flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 rounded" checked={resolvido} onChange={e => setResolvido(e.target.checked)}/> Resolvido</label><button onClick={handleSaveLog} className={`text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${activeTab === 'familia' ? 'bg-orange-600' : 'bg-indigo-600'}`}><Save size={18}/> Salvar</button></div>
                          </div>
                      </div>
                      <div className="lg:col-span-7 space-y-4 max-h-[600px] overflow-y-auto pr-2">
                         {selectedStudent.logs?.filter((l: any) => activeTab === 'familia' ? l.category === 'Família' : l.category !== 'Família').map((log: any) => {
                             let p = { obs: log.description, motivos: [], solicitante: '' }; try { p = JSON.parse(log.description); } catch(e) {}
                             return (
                                 <div key={log.id} className={`p-6 rounded-2xl border shadow-sm bg-white hover:shadow-md transition-shadow relative ${log.category === 'Família' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-indigo-400'}`}>
                                     <div className="flex justify-between items-start mb-3 border-b pb-3"><div><span className="font-bold text-sm block text-slate-800">{new Date(log.created_at).toLocaleDateString()}</span><span className="text-xs font-bold uppercase text-slate-400">{p.solicitante}</span></div>{log.resolved ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Resolvido</span> : <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Em Aberto</span>}</div>
                                     {p.motivos && p.motivos.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{p.motivos.map((m:any)=><span key={m} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">{m}</span>)}</div>}
                                     <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{p.obs}</p>
                                     {log.referral && <div className="mt-4 pt-3 border-t border-dashed flex items-center gap-2 text-xs font-bold text-purple-600 uppercase"><span className="bg-purple-50 px-2 py-1 rounded">➔ Encaminhado:</span> {log.referral}</div>}
                                 </div>
                             )
                         })}
                      </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO ALUNO */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                 <h3 className="font-bold text-xl mb-6 text-indigo-900">Cadastrar Novo Aluno</h3>
                 <form onSubmit={handleAddStudent} className="space-y-4">
                     <div><label className="text-xs font-bold uppercase text-slate-400">Nome Completo</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div>
                     <div><label className="text-xs font-bold uppercase text-slate-400">Turma</label><input value={newClass} onChange={e => setNewClass(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div>
                     <div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Salvar</button></div>
                 </form>
             </div>
        </div>
      )}

      {/* MODAL ZAP */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-200">
                 <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={24}/></button>
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800"><div className="bg-yellow-100 p-2 rounded-full"><Zap className="text-yellow-600" fill="currentColor"/></div> Registro Flash</h3>
                 <input autoFocus placeholder="Nome do aluno..." className="w-full p-4 border rounded-xl mb-2 bg-slate-50 font-bold text-lg" value={quickSearchTerm} onChange={e => { setQuickSearchTerm(e.target.value); setQuickSelectedStudent(null); }} />
                 {quickSearchTerm.length > 2 && !quickSelectedStudent && (
                    <div className="bg-white border rounded-xl shadow-xl max-h-40 overflow-y-auto mb-4 absolute w-[85%] z-10">
                      {students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 5).map(s => (
                        <div key={s.id} onClick={() => { setQuickSelectedStudent(s); setQuickSearchTerm(s.name); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm border-b font-bold text-slate-700">{s.name} <span className="text-slate-400 font-normal">({s.class_id})</span></div>
                      ))}
                    </div>
                 )}
                 <div className="grid grid-cols-2 gap-2 mb-6 mt-4">{FLASH_REASONS.map(r => (<button key={r} onClick={() => setQuickReason(r)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${quickReason === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{r}</button>))}</div>
                 <button onClick={handleQuickSave} disabled={!quickSelectedStudent || !quickReason} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:shadow-none transition-all hover:bg-green-700">CONFIRMAR REGISTRO</button>
             </div>
        </div>
      )}

      {/* MODAL SAÍDA */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">Registrar Saída de Aluno</h3>
            <div className="space-y-4">
              <div className="flex gap-4 bg-slate-100 p-2 rounded-lg">
                <label className="flex items-center gap-2 font-bold text-sm cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'TRANSFERIDO'} onChange={() => setExitType('TRANSFERIDO')} /> TRANSFERÊNCIA</label>
                <label className="flex items-center gap-2 font-bold text-sm text-red-600 cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'ABANDONO'} onChange={() => setExitType('ABANDONO')} /> ABANDONO</label>
              </div>
              <textarea className="w-full p-3 border rounded-xl h-24" placeholder="Motivo detalhado da saída..." value={exitReason} onChange={e => setExitReason(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">CANCELAR</button>
                <button onClick={handleRegisterExit} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700">CONFIRMAR SAÍDA</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsQuickModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95 border-4 border-white"><Zap size={32} /></button>
    </div>
  );
}
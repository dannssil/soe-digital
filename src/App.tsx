import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import {
  LayoutDashboard, Users, BookOpen, LogOut,
  Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock,
  FileText, CheckSquare, Phone,
  UserCircle, FileDown, CalendarDays, Zap, Menu, Search, Users2, MoreHorizontal, Folder, BarChart3, FileSpreadsheet, MapPin, Clock, ShieldCheck, ChevronRight, Copy, History
} from 'lucide-react';

// ==============================================================================
// 🚨 CONEXÃO 🚨
// ==============================================================================

const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co";
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves";
const SYSTEM_ROLE = "Orientador Educacional - SOE";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

// --- LISTAS ---
const MOTIVOS_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const MOTIVOS_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const MOTIVOS_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];
const FLASH_REASONS = ["Uniforme", "Atraso", "Celular", "Sem Material", "Saída de Sala", "Conversa", "Conflito", "Sono"];

// --- COMPONENTES ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses: any = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-2xl" };
  const pxSize: any = { sm: 32, md: 40, lg: 64, xl: 96 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

const StudentList = ({ students, onSelectStudent, searchTerm }: any) => {
  const filtered = students.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b sticky top-0 bg-slate-50 z-10">
            <tr><th className="px-6 py-4">Estudante</th><th className="px-6 py-4">Turma</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s: any) => (
              <tr key={s.id} onClick={() => onSelectStudent(s)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4"><Avatar name={s.name} src={s.photo_url} size="md"/><div className="font-bold text-slate-700 text-base group-hover:text-indigo-700 transition-colors">{s.name}</div></td>
                <td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-indigo-600 p-2 transform hover:scale-110 transition-transform"><ChevronRight size={20}/></button></td>
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Tabs & Forms
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [listClassFilter, setListClassFilter] = useState<string | null>(null); 
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');

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
  const [obsLivre, setObsLivre] = useState(""); 
  
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

  useEffect(() => {
    if (selectedStudent) {
        const updated = students.find(s => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
    }
  }, [students]);

  useEffect(() => {
    setObsLivre("");
    setMotivosSelecionados([]);
    setResolvido(false);
    setSolicitante('Professor');
    setEncaminhamento('');
  }, [selectedStudent]);

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
          alert('Salvo!'); 
          setMotivosSelecionados([]); 
          setObsLivre(""); 
          setResolvido(false);
          fetchStudents(); 
      } else alert(error.message); 
  };
  
  const handleQuickSave = async () => { if (!quickSelectedStudent || !quickReason) return; const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' }); const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]); if (!error) { alert(`Salvo!`); setIsQuickModalOpen(false); fetchStudents(); } };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if(!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleRegisterExit = async () => { if(!selectedStudent) return; const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id); if(!error) { alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); } else alert(error.message); };
  
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) { 
    if (!e.target.files || e.target.files.length === 0) return; 
    setImporting(true); 
    const file = e.target.files[0]; 
    const reader = new FileReader(); 
    reader.onload = async (evt) => { 
        try { 
            const bstr = evt.target?.result; 
            const workbook = XLSX.read(bstr, { type: 'binary' }); 
            const ws = workbook.Sheets[workbook.SheetNames[0]]; 
            const data = XLSX.utils.sheet_to_json(ws); 
            let count = 0; 
            for (const row of (data as any[])) { 
                const nomeExcel = row['ESTUDANTE']?.toString().toUpperCase().trim(); 
                if (!nomeExcel) continue; 
                const aluno = students.find(s => s.name.toUpperCase().trim() === nomeExcel); 
                if (aluno) { 
                    const parseNota = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; 
                    await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: parseNota(row['ART']), cie: parseNota(row['CIE']), edf: parseNota(row['EDF']), geo: parseNota(row['GEO']), his: parseNota(row['HIS']), ing: parseNota(row['ING']), lp: parseNota(row['LP']), mat: parseNota(row['MAT']), pd1: parseNota(row['PD1']), pd2: parseNota(row['PD2']), pd3: parseNota(row['PD3']), faltas_bimestre: row['FALTAS'] ? parseInt(row['FALTAS']) : 0 }]); 
                    count++; 
                } 
            } 
            alert(`Sucesso: ${count} registros.`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); 
        } catch (err) { alert('Erro: ' + err); setImporting(false); } 
    }; 
    reader.readAsBinaryString(file); 
  }

  const generatePDF = () => { 
    if(!selectedStudent) return; 
    const doc = new jsPDF(); 
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text("CENTRO EDUCACIONAL 04 DO GUARÁ - SOE", 105, 22, { align: "center" });
    doc.setLineWidth(0.5); doc.line(14, 25, 196, 25);

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Aluno(a):`, 14, 35); doc.setFont("helvetica", "bold"); doc.text(`${selectedStudent.name}`, 35, 35);
    doc.setFont("helvetica", "normal"); doc.text(`Turma: ${selectedStudent.class_id}`, 160, 35);
    
    doc.text(`Responsável:`, 14, 43); doc.text(`${selectedStudent.guardian_name || 'Não informado'}`, 40, 43);
    doc.text(`Telefone:`, 14, 50); doc.text(`${selectedStudent.guardian_phone || '-'}`, 40, 50);
    
    doc.setFont("helvetica", "bold"); doc.text("DESEMPENHO ACADÊMICO", 14, 60);
    const acadData = selectedStudent.desempenho?.map((d:any) => [d.bimestre, d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf, d.pd1, d.faltas_bimestre]) || [];
    
    autoTable(doc, { 
        startY: 65, 
        head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'Faltas']], 
        body: acadData, 
        theme: 'grid', 
        headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'center' },
        styles: { fontSize: 8, halign: 'center' } 
    });
    
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 85;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("HISTÓRICO DE ATENDIMENTOS", 14, finalY);
    
    const logsData = selectedStudent.logs?.map((l:any) => {
        let desc = { motivos: [], obs: '', solicitante: '' };
        try { desc = JSON.parse(l.description); } catch(e) {}
        const conteudo = `SOLICITANTE: ${desc.solicitante || 'SOE'}\nMOTIVOS: ${desc.motivos?.join(', ') || '-'}\nRELATO: ${desc.obs}\nENCAMINHAMENTO: ${l.referral || '-'}`;
        return [new Date(l.created_at).toLocaleDateString('pt-BR'), l.category, conteudo, l.resolved ? 'Resolvido' : 'Pendente'];
    }) || [];

    autoTable(doc, { 
        startY: finalY + 5, 
        head: [['Data', 'Tipo', 'Detalhes do Atendimento', 'Status']], 
        body: logsData, 
        theme: 'grid', 
        headStyles: { fillColor: [79, 70, 229], fontSize: 9 }, 
        styles: { fontSize: 9, cellPadding: 3 }, 
        columnStyles: { 2: { cellWidth: 100 } } 
    });

    // RODAPÉ DO PDF (ASSINATURA AUTOMÁTICA)
    const pageHeight = doc.internal.pageSize.height;
    doc.line(60, pageHeight - 30, 150, pageHeight - 30);
    doc.setFont("helvetica", "bold");
    doc.text(`${SYSTEM_USER_NAME}`, 105, pageHeight - 25, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    const timeNow = new Date().toLocaleString('pt-BR');
    doc.text(`${SYSTEM_ROLE} | ${timeNow}`, 105, pageHeight - 20, { align: "center" });

    doc.save(`Ficha_${selectedStudent.name}.pdf`); 
  }; 

  const renderDashboard = () => {
    let studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    if (selectedClassFilter) studentsInRisk = studentsInRisk.filter(s => s.class_id === selectedClassFilter);
    const turmas = [...new Set(students.map(s => s.class_id))].sort();
    
    return (
      <div className="space-y-8 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Alunos</p><h3 className="text-4xl font-black text-indigo-600">{students.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Em Alerta</p><h3 className="text-4xl font-black text-red-500">{studentsInRisk.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Turmas</p><h3 className="text-4xl font-black text-emerald-500">{turmas.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Atendimentos</p><h3 className="text-4xl font-black text-amber-500">{students.flatMap(s=>s.logs||[]).length}</h3></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 hover:shadow-lg transition-shadow duration-500"> 
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Volume de Atendimentos</h4>
                <ResponsiveContainer width="100%" height="100%"><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{r:6, fill:'#6366f1'}} /></LineChart></ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 hover:shadow-lg transition-shadow duration-500">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2"><BarChart3 size={16}/> Motivos Recorrentes</h4>
                <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                        <Pie data={stats.pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
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
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center"><h3 className="font-bold text-indigo-800 uppercase">Pastas de Turmas</h3><span className="text-[10px] text-indigo-500 bg-white px-2 py-1 rounded border border-indigo-200">Clique para filtrar</span></div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {turmas.map(t => {
                            const total = students.filter(s => s.class_id === t).length;
                            const risco = students.filter(s => s.class_id === t && (checkRisk(s).reprovadoFalta || checkRisk(s).criticoNotas)).length;
                            const percent = total > 0 ? (risco / total) * 100 : 0;
                            const isSelected = selectedClassFilter === t;
                            return (
                                <div key={t} onClick={() => setSelectedClassFilter(isSelected ? null : t)} className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between h-32 hover:-translate-y-1 duration-300 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-300'}`}>
                                    <div className="flex justify-between items-start"><h4 className="font-bold text-2xl">{t}</h4><Folder size={20} className={isSelected ? 'text-indigo-200' : 'text-slate-300'}/></div>
                                    <div>
                                        <div className="flex justify-between text-[10px] mb-1 font-bold"><span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>{total} Alunos</span><span className={isSelected ? 'text-white' : 'text-red-500'}>{Math.round(percent)}% Risco</span></div>
                                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-black/20' : 'bg-slate-100'}`}><div className={`h-full transition-all duration-500 ${percent > 30 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{width: `${percent}%`}}></div></div>
                                    </div>
                                    <p className="text-[10px] mt-1 text-right font-bold opacity-80">{risco} em risco</p>
                                </div>
                            )
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
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800"><div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div><div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div></div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
            <button onClick={() => { setView('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'students' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><Users size={18} /> Alunos</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm z-10 gap-4">
          <div className="flex items-center gap-3 flex-1"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24}/></button><div className="flex-1 max-w-md relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Buscar aluno..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none" value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); if(e.target.value.length > 0) setView('students'); }} /></div></div>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'dashboard' ? renderDashboard() : (
            <div className="max-w-[1600px] mx-auto pb-20 w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Estudantes</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-green-700 transition-transform active:scale-95"><FileSpreadsheet size={20} /> Importar</button>
                    <button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-transform active:scale-95"><Plus size={20} /> Novo Aluno</button>
                  </div>
              </div>
              <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
                  <button onClick={() => setListClassFilter(null)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border ${!listClassFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'} hover:scale-105 transition-transform`}>Todos</button>
                  {turmasList.map(t => (<button key={t} onClick={() => setListClassFilter(t)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border flex items-center gap-2 hover:scale-105 transition-transform ${listClassFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}><Folder size={14} /> {t}</button>))}
              </div>
              <div className="flex-1 min-h-0"><StudentList students={students.filter(s => !listClassFilter || s.class_id === listClassFilter)} onSelectStudent={(s: any) => { setSelectedStudent(s); setIsModalOpen(true); }} searchTerm={globalSearch} /></div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES COM NOVO LAYOUT DE REGISTRO */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
               <div className="flex items-center gap-6">
                 <div className="relative group">
                    <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/></label>
                 </div>
                 <div><h2 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h2><p className="text-lg text-slate-500 font-bold uppercase mt-1">Turma {selectedStudent.class_id}</p></div>
               </div>
               <div className="flex gap-2">
                 <button onClick={generatePDF} className="p-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 hover:scale-110 transition-transform" title="Gerar PDF"><FileDown size={20} /></button>
                 <button onClick={startEditing} className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 hover:scale-110 transition-transform" title="Editar"><Pencil size={20} /></button>
                 <button onClick={() => setIsExitModalOpen(true)} className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 hover:scale-110 transition-transform" title="Saída"><LogOut size={20} /></button>
                 <button onClick={() => setIsModalOpen(false)} className="ml-4 hover:bg-slate-200 p-2 rounded-full"><X className="text-slate-400 hover:text-red-500" size={32}/></button>
               </div>
            </div>

            <div className="flex border-b px-8 bg-white overflow-x-auto flex-shrink-0 gap-8">
               {['perfil', 'academico', 'historico', 'familia'].map((tab) => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 font-bold text-sm border-b-4 uppercase tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab === 'familia' ? 'Família & Responsáveis' : tab.toUpperCase()}</button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
               {activeTab === 'perfil' && (
                 <div className="bg-white p-8 rounded-2xl border shadow-sm w-full mx-auto">
                    <h3 className="font-bold text-indigo-900 uppercase mb-6 flex items-center gap-2 border-b pb-4"><UserCircle className="text-indigo-600"/> Informações de Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Responsável Legal</span>{isEditing ? <input value={editGuardian} onChange={e=>setEditGuardian(e.target.value)} className="w-full border p-3 rounded-lg"/> : <p className="font-medium text-lg">{selectedStudent.guardian_name || "Não informado"}</p>}</div>
                        <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Telefone</span>{isEditing ? <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full border p-3 rounded-lg"/> : <p className="font-medium text-lg">{selectedStudent.guardian_phone || "Não informado"}</p>}</div>
                        <div className="md:col-span-2"><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Endereço</span>{isEditing ? <input value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full border p-3 rounded-lg"/> : <p className="font-medium text-lg">{selectedStudent.address || "Não informado"}</p>}</div>
                    </div>
                    {isEditing && <button onClick={saveEdits} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold mt-6 shadow-lg">Salvar Alterações</button>}
                 </div>
               )}

               {activeTab === 'academico' && (
                 <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto w-full">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b">
                        <tr><th className="px-4 py-4">Bimestre</th><th className="px-2">Português</th><th className="px-2">Matemática</th><th className="px-2">Ciências</th><th className="px-2">História</th><th className="px-2">Geografia</th><th className="px-2">Inglês</th><th className="px-2">Arte</th><th className="px-2">Ed. Física</th><th className="px-2 bg-slate-200">PD1</th><th className="px-2 bg-slate-200">PD2</th><th className="px-2 bg-slate-200">PD3</th><th className="px-4 text-red-600 bg-red-50 text-center">FALTAS</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {selectedStudent.desempenho?.map((d: any, i: number) => (
                         <tr key={i} className="hover:bg-slate-50"><td className="px-4 py-5 font-bold text-slate-700">{d.bimestre}</td><td className={`px-2 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td><td className={`px-2 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td><td className="px-2">{d.cie}</td><td className="px-2">{d.his}</td><td className="px-2">{d.geo}</td><td className="px-2">{d.ing}</td><td className="px-2">{d.art}</td><td className="px-2">{d.edf}</td><td className="px-2 bg-slate-50">{d.pd1}</td><td className="px-2 bg-slate-50">{d.pd2}</td><td className="px-2 bg-slate-50">{d.pd3}</td><td className="px-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td></tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               {(activeTab === 'historico' || activeTab === 'familia') && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-full">
                      <div className={`lg:col-span-8 p-8 rounded-2xl border shadow-sm h-full flex flex-col ${activeTab === 'familia' ? 'bg-orange-50 border-orange-200' : 'bg-white border-indigo-100'}`}>
                          <h3 className="font-bold mb-6 uppercase text-sm flex items-center gap-2 pb-4 border-b border-black/5">{activeTab === 'familia' ? <><Users2/> Novo Contato Família</> : <><FileText/> Novo Atendimento</>}</h3>
                          <div className="space-y-6 flex-1 flex flex-col">
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-400 uppercase">Solicitante</label><select className="w-full mt-1 p-3 border rounded-lg bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option></select></div>
                                <div><label className="text-xs font-bold text-slate-400 uppercase">Encaminhar</label><select className="w-full mt-1 p-3 border rounded-lg bg-white" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Selecione --</option>{ENCAMINHAMENTOS.map(e=><option key={e}>{e}</option>)}</select></div>
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Data</label><input type="date" className="w-full mt-1 p-3 border rounded-lg bg-white" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></div>
                                  <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Retorno</label><input type="date" className="w-full mt-1 p-3 border rounded-lg bg-white" placeholder="Retorno" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
                              </div>
                              <div className="border p-4 rounded-xl bg-white/50 space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div><p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Comportamental</p><div className="flex flex-col gap-1">{MOTIVOS_COMPORTAMENTO.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                                    <div><p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Pedagógico</p><div className="flex flex-col gap-1">{MOTIVOS_PEDAGOGICO.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                                    <div><p className="text-[10px] font-bold text-purple-600 uppercase mb-2">Social/Outros</p><div className="flex flex-col gap-1">{MOTIVOS_SOCIAL.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div>
                                  </div>
                              </div>
                              
                              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col">
                                <label className="text-center block text-sm font-bold text-slate-600 uppercase mb-2 tracking-widest bg-slate-200 py-1 rounded">RELATÓRIO DE ATENDIMENTO</label>
                                <textarea className="w-full p-4 border rounded-xl flex-1 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows={12} value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                              </div>

                              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                <div className="text-xs text-slate-400 font-mono">
                                    <p>Registrado por: <span className="font-bold text-slate-600">{SYSTEM_USER_NAME}</span></p>
                                    <p>{SYSTEM_ROLE} | {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-bold text-green-700 flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 rounded" checked={resolvido} onChange={e => setResolvido(e.target.checked)}/> <ShieldCheck size={18}/> Caso Resolvido</label>
                                    <button onClick={handleSaveLog} className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${activeTab === 'familia' ? 'bg-orange-600' : 'bg-indigo-600'}`}><Save size={18}/> SALVAR REGISTRO</button>
                                </div>
                              </div>
                          </div>
                      </div>

                      <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 bg-slate-100 p-4 rounded-2xl h-full">
                         <h3 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-slate-100 py-2 z-10 flex items-center gap-2"><History size={14}/> Histórico Completo</h3>
                         {selectedStudent.logs?.map((log: any) => {
                             let p = { obs: log.description, motivos: [], solicitante: '' }; try { p = JSON.parse(log.description); } catch(e) {}
                             const isFamily = log.category === 'Família';
                             return (
                                 <div key={log.id} className={`p-4 rounded-xl border shadow-sm bg-white hover:shadow-md transition-shadow relative ${isFamily ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-indigo-400'}`}>
                                     <div className="flex justify-between items-center mb-2 border-b pb-2">
                                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isFamily ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{isFamily ? 'FAMÍLIA' : 'ESTUDANTE'}</span>
                                         <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
                                     </div>
                                     <div className="mb-2">
                                         <span className="text-[10px] font-bold uppercase text-slate-500 block">Solicitante: {p.solicitante}</span>
                                     </div>
                                     <p className="text-xs text-slate-600 line-clamp-3 mb-2 italic">"{p.obs}"</p>
                                     <div className="flex justify-between items-center mt-2">
                                        <button className="text-[10px] text-indigo-600 font-bold underline flex items-center gap-1" onClick={() => { setObsLivre(p.obs); setMotivosSelecionados(p.motivos || []); }}><Copy size={10}/> Copiar</button>
                                        {log.resolved && <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><ShieldCheck size={10}/> Resolvido</span>}
                                     </div>
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

      {/* MODAIS SECUNDÁRIOS (ZAP, SAÍDA, IMPORTAÇÃO, ETC) MANTIDOS */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-200">
                 <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={24}/></button>
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800"><div className="bg-yellow-100 p-2 rounded-full"><Zap className="text-yellow-600" fill="currentColor"/></div> Registro Flash</h3>
                 <input autoFocus placeholder="Nome do aluno..." className="w-full p-4 border rounded-xl mb-2 bg-slate-50 font-bold text-lg" value={quickSearchTerm} onChange={e => { setQuickSearchTerm(e.target.value); setQuickSelectedStudent(null); }} />
                 {quickSearchTerm.length > 2 && !quickSelectedStudent && (
                    <div className="bg-white border rounded-xl shadow-xl max-h-40 overflow-y-auto mb-4 absolute w-[85%] z-10">
                      {students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 5).map(s => (
                        <div key={s.id} onClick={() => { setQuickSelectedStudent(s); setQuickSearchTerm(s.name); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm border-b font-bold text-slate-700 hover:bg-indigo-50">{s.name} <span className="text-slate-400 font-normal">({s.class_id})</span></div>
                      ))}
                    </div>
                 )}
                 {quickSelectedStudent && (
                    <div className="bg-green-50 p-2 rounded-lg text-center mb-4 border border-green-200">
                        <p className="text-xs font-bold text-green-800">Aluno Selecionado:</p>
                        <p className="text-sm font-bold text-green-900">{quickSelectedStudent.name}</p>
                    </div>
                 )}
                 <div className="grid grid-cols-2 gap-2 mb-6 mt-4">{FLASH_REASONS.map(r => (<button key={r} onClick={() => setQuickReason(r)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${quickReason === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{r}</button>))}</div>
                 <button onClick={handleQuickSave} disabled={!quickSelectedStudent || !quickReason} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:shadow-none transition-all hover:bg-green-700 active:scale-95">CONFIRMAR REGISTRO</button>
             </div>
        </div>
      )}

      {/* MODAL IMPORTAÇÃO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><FileSpreadsheet size={24}/> Importar Excel</h3>
            <div className="space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1 font-bold">Bimestre de Referência</label>
                 <select className="w-full p-3 border rounded-xl" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select>
               </div>
               <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50">
                  {importing ? <p className="animate-pulse font-bold text-indigo-600">Sincronizando...</p> : <input type="file" accept=".xlsx, .xls" title="Arquivo" onChange={handleFileUpload} className="w-full text-sm"/>}
               </div>
               <div className="flex justify-end"><button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Fechar</button></div>
            </div>
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

      <button onClick={() => setIsQuickModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95 border-4 border-white"><Zap size={32} /></button>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  LayoutDashboard, Users, BookOpen, LogOut,
  Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock,
  FileText, CheckSquare, Phone,
  UserCircle, FileDown, CalendarDays, Zap, Menu, 
  Search as SearchIcon, Users2, MoreHorizontal, Folder, 
  BarChart3 as BarChartIcon, FileSpreadsheet, MapPin, Clock, ShieldCheck, 
  ChevronRight, Copy, History, GraduationCap, Printer, 
  FileBarChart2, Database, Settings, Trash2, Maximize2, MonitorPlay, 
  Eye, EyeOff, Filter, Calendar, ClipboardList, ArrowLeft, Home, 
  ChevronLeft, Star, Activity, Heart, Brain, PenTool, Copyright, Code,
  PieChart as PieChartIcon, FileOutput, ThumbsUp, Puzzle, Scale, Cake, Siren
} from 'lucide-react';

// --- CONEXÃO ---
const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co";
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves da Silva";
const SYSTEM_ROLE = "Orientador Educacional";
const SYSTEM_MATRICULA = "Mat: 212.235-9 | SEEDF";
const SYSTEM_ORG = "CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

// --- LISTAS PADRÃO ---
const DEFAULT_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const DEFAULT_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const DEFAULT_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const DEFAULT_ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];

// --- COMPONENTES AUXILIARES ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses: any = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-2xl", "2xl": "w-40 h-40 text-4xl" };
  const pxSize: any = { sm: 32, md: 40, lg: 64, xl: 96, "2xl": 160 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

const StudentList = ({ students, onSelectStudent, filterType }: any) => {
  const getAge = (dateString: string) => { if (!dateString) return '-'; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age + " anos"; };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b sticky top-0 bg-slate-50 z-10">
            <tr><th className="px-6 py-4">Estudante</th>{filterType === 'NEE' && <th className="px-6 py-4">Necessidade (NEE)</th>}{filterType === 'NEE' && <th className="px-6 py-4">Idade</th>}{filterType === 'CT' && <th className="px-6 py-4">Conselho Tutelar</th>}{filterType === 'CT' && <th className="px-6 py-4">Data Enc.</th>}{filterType === 'CT' && <th className="px-6 py-4">Motivo</th>}{filterType !== 'NEE' && filterType !== 'CT' && <th className="px-6 py-4">Turma</th>}{filterType !== 'NEE' && filterType !== 'CT' && <th className="px-6 py-4">Status / Info</th>}<th className="px-6 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s: any) => (
              <tr key={s.id} onClick={() => onSelectStudent(s)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4"><Avatar name={s.name} src={s.photo_url} size="md" /><div className="font-bold text-slate-700 text-base group-hover:text-indigo-700 transition-colors">{s.name}</div></td>
                {filterType === 'NEE' && (<><td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold text-xs">{s.nee_description || 'Não especificado'}</span></td><td className="px-6 py-4 text-slate-600 font-bold">{getAge(s.birth_date)}</td></>)}
                {filterType === 'CT' && (<><td className="px-6 py-4 text-orange-700 font-bold text-xs uppercase">{s.ct_council_name || 'Não inf.'}</td><td className="px-6 py-4 text-slate-600 text-xs">{s.ct_date ? new Date(s.ct_date).toLocaleDateString() : '-'}</td><td className="px-6 py-4 text-slate-500 text-xs italic truncate max-w-[200px]">{s.ct_referral}</td></>)}
                {filterType !== 'NEE' && filterType !== 'CT' && (<><td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td><td className="px-6 py-4"><div className="flex gap-2 flex-wrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>{s.nee_description && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700 flex items-center gap-1"><Puzzle size={10}/> NEE</span>}{s.ct_referral && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 flex items-center gap-1"><Scale size={10}/> CT</span>}</div></td></>)}
                <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-indigo-600 p-2 transform hover:scale-110 transition-transform"><ChevronRight size={20} /></button></td>
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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'students' | 'conselho'>('dashboard');
  const [dashboardFilterType, setDashboardFilterType] = useState<'ALL' | 'RISK' | 'NEE' | 'CT' | 'ACTIVE' | 'TRANSFER' | 'ABANDON' | 'RESOLVED' | 'RECURRENT' | 'WITH_LOGS'>('ALL');
  const [conselhoFilterType, setConselhoFilterType] = useState<'ALL' | 'RISK' | 'LOGS' | 'GRADES'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // MODAIS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  
  const [importing, setImporting] = useState(false);
  const [projectedStudent, setProjectedStudent] = useState<any | null>(null);
  const [isSensitiveVisible, setIsSensitiveVisible] = useState(false); 
  const [radarData, setRadarData] = useState({ assiduidade: 3, participacao: 3, relacionamento: 3, rendimento: 3, tarefas: 3 });
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [listClassFilter, setListClassFilter] = useState<string | null>(null);
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');
  const [dataConselho, setDataConselho] = useState(new Date().toISOString().split('T')[0]);
  const [conselhoTurma, setConselhoTurma] = useState<string>('');
  const [councilObs, setCouncilObs] = useState('');
  const [councilEnc, setCouncilEnc] = useState('');
  
  // States de Edição Manual (NEE/CT)
  const [editNee, setEditNee] = useState('');
  const [editCtReason, setEditCtReason] = useState('');
  const [editCtDate, setEditCtDate] = useState('');
  const [editCtCouncil, setEditCtCouncil] = useState('');

  const [listComportamento, setListComportamento] = useState<string[]>(DEFAULT_COMPORTAMENTO);
  const [listPedagogico, setListPedagogico] = useState<string[]>(DEFAULT_PEDAGOGICO);
  const [listSocial, setListSocial] = useState<string[]>(DEFAULT_SOCIAL);
  const [listEncaminhamentos, setListEncaminhamentos] = useState<string[]>(DEFAULT_ENCAMINHAMENTOS);
  const [newItem, setNewItem] = useState('');
  const [editName, setEditName] = useState(''); const [editClass, setEditClass] = useState(''); const [editGuardian, setEditGuardian] = useState(''); const [editPhone, setEditPhone] = useState(''); const [editAddress, setEditAddress] = useState('');
  const [newName, setNewName] = useState(''); const [newClass, setNewClass] = useState('');
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [obsLivre, setObsLivre] = useState("");
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');

  useEffect(() => { const savedAuth = localStorage.getItem('soe_auth'); const savedPhoto = localStorage.getItem('adminPhoto'); if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); } if (savedPhoto) setAdminPhoto(savedPhoto); setAttendanceDate(new Date().toISOString().split('T')[0]); }, []);
  useEffect(() => { if (selectedStudent) { const updated = students.find(s => s.id === selectedStudent.id); if (updated) setSelectedStudent(updated); } }, [students]);
  useEffect(() => { setObsLivre(""); setMotivosSelecionados([]); setResolvido(false); setSolicitante('Professor'); setEncaminhamento(''); setExitReason(''); setIsSensitiveVisible(false); }, [selectedStudent]);
  useEffect(() => { if (projectedStudent) { const dadosBimestre = projectedStudent.desempenho?.find((d: any) => d.bimestre === selectedBimestre); setCouncilObs(dadosBimestre?.obs_conselho || ''); setCouncilEnc(dadosBimestre?.encaminhamento_conselho || ''); } else { setCouncilObs(''); setCouncilEnc(''); } }, [projectedStudent, selectedBimestre]);
  useEffect(() => { async function fetchRadar() { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; const { data } = await supabase.from('class_radar').select('*').eq('turma', targetClass).eq('bimestre', selectedBimestre).single(); if (data) { setRadarData({ assiduidade: data.assiduidade, participacao: data.participacao, relacionamento: data.relacionamento, rendimento: data.rendimento, tarefas: data.tarefas }); } else { setRadarData({ assiduidade: 3, participacao: 3, relacionamento: 3, rendimento: 3, tarefas: 3 }); } } fetchRadar(); }, [conselhoTurma, selectedBimestre, students]);

  async function fetchStudents() { setLoading(true); const { data, error } = await supabase.from('students').select(`*, logs(id, student_id, category, description, created_at, referral, resolved, return_date), desempenho:desempenho_bimestral(*)`) .order('name'); if (!error && data) { const sortedData = data.map((student: any) => ({ ...student, logs: student.logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [], desempenho: student.desempenho || [] })); setStudents(sortedData); } setLoading(false); }
  
  // FUNÇÕES DE HELPERS
  const addListItem = (listName: string) => { if (!newItem) return; if (listName === 'comp') setListComportamento([...listComportamento, newItem]); if (listName === 'ped') setListPedagogico([...listPedagogico, newItem]); if (listName === 'soc') setListSocial([...listSocial, newItem]); if (listName === 'enc') setListEncaminhamentos([...listEncaminhamentos, newItem]); setNewItem(''); };
  const removeListItem = (listName: string, item: string) => { if (listName === 'comp') setListComportamento(listComportamento.filter(i => i !== item)); if (listName === 'ped') setListPedagogico(listPedagogico.filter(i => i !== item)); if (listName === 'soc') setListSocial(listSocial.filter(i => i !== item)); if (listName === 'enc') setListEncaminhamentos(listEncaminhamentos.filter(i => i !== item)); };
  const toggleItem = (list: string[], setList: any, item: string) => { if (list.includes(item)) setList(list.filter((i: string) => i !== item)); else setList([...list, item]); };
  
  // LOGICA DE EDIÇÃO COMPLETA
  const startEditing = () => { 
      if (selectedStudent) { 
          setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); 
          setEditNee(selectedStudent.nee_description || '');
          setEditCtReason(selectedStudent.ct_referral || '');
          setEditCtCouncil(selectedStudent.ct_council_name || '');
          setEditCtDate(selectedStudent.ct_date || '');
          setIsEditing(true); 
      } 
  };
  const saveEdits = async () => { 
      if (!selectedStudent) return; 
      const updates = { 
          name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress,
          nee_description: editNee, ct_referral: editCtReason, ct_council_name: editCtCouncil, ct_date: editCtDate || null
      };
      const { error } = await supabase.from('students').update(updates).eq('id', selectedStudent.id); 
      if (!error) { alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); } else alert(error.message); 
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); } };
  const handleSaveLog = async () => { if (!selectedStudent) return; const currentCategory = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); const { error } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: currentCategory, description: desc, referral: encaminhamento, resolved: resolvido, created_at: new Date(attendanceDate).toISOString(), return_date: returnDate || null }]); if (!error) { alert('Salvo!'); setMotivosSelecionados([]); setObsLivre(""); setResolvido(false); fetchStudents(); } else alert(error.message); };
  const handleQuickSave = async () => { if (!quickSelectedStudent || !quickReason) return; const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' }); const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]); if (!error) { alert(`Salvo!`); setIsQuickModalOpen(false); fetchStudents(); } };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if (!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleRegisterExit = async () => { if (!selectedStudent) return; const logDesc = JSON.stringify({ solicitante: 'Secretaria/SOE', motivos: [exitType], obs: `SAÍDA REGISTRADA. Motivo detalhado: ${exitReason}` }); const { error: logError } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: 'Situação Escolar', description: logDesc, resolved: true, created_at: new Date().toISOString() }]); if (logError) return alert('Erro ao salvar histórico: ' + logError.message); const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id); if (!error) { alert('Saída registrada!'); setExitReason(''); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleSaveRadar = async () => { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; const { error } = await supabase.from('class_radar').upsert({ turma: targetClass, bimestre: selectedBimestre, ...radarData }, { onConflict: 'turma, bimestre' }); if (!error) { alert('Avaliação da Turma Salva!'); setIsEvalModalOpen(false); } else { alert('Erro: ' + error.message); } };
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) { if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return; const file = event.target.files[0]; const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) { alert('Erro upload: ' + error.message); return; } const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id); setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents(); }
  const toggleHighlight = async (studentId: string, currentVal: boolean, e: React.MouseEvent) => { e.stopPropagation(); const updatedStudents = students.map(s => s.id === studentId ? { ...s, is_highlight: !currentVal } : s); setStudents(updatedStudents); await supabase.from('students').update({ is_highlight: !currentVal }).eq('id', studentId); };
  const togglePraise = async (studentId: string, currentVal: boolean, e: React.MouseEvent) => { e.stopPropagation(); const updatedStudents = students.map(s => s.id === studentId ? { ...s, is_praised: !currentVal } : s); setStudents(updatedStudents); await supabase.from('students').update({ is_praised: !currentVal }).eq('id', studentId); };

  const checkRisk = (student: any) => { const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0; const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null; let notasVermelhas = 0; if (ultDesempenho) { const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; } return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3, totalFaltas, notasVermelhas }; };
  const stats = useMemo(() => { const allLogs = students.flatMap(s => s.logs || []); const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); const count = allLogs.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length; return { name: dateStr, total: count }; }).reverse(); const motivoCount: any = {}; allLogs.forEach(l => { try { const desc = JSON.parse(l.description); if (desc.motivos) desc.motivos.forEach((m: string) => { motivoCount[m] = (motivoCount[m] || 0) + 1; }); } catch (e) { } }); const pieData = Object.keys(motivoCount).map(key => ({ name: key, value: motivoCount[key] })).sort((a, b) => b.value - a.value).slice(0, 5); return { last7Days, pieData, allLogs }; }, [students]);
  
  // --- IMPORTAÇÃO INTELIGENTE V8.0 (Trator + Mapeamento CT) ---
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
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let headerRowIndex = 0;
        for (let i = 0; i < rawData.length; i++) {
            const rowStr = rawData[i].join(' ').toUpperCase();
            if (rowStr.includes('ESTUDANTE') || rowStr.includes('NOME')) { headerRowIndex = i; break; }
        }
        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });
        const normalizeKey = (key: string) => key.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        let updatedCount = 0;
        for (const row of (data as any[])) {
          const rowMap: any = {};
          Object.keys(row).forEach(k => rowMap[normalizeKey(k)] = row[k]);
          const nomeExcel = (rowMap['ESTUDANTE'] || rowMap['NOME'] || rowMap['NOME DO ESTUDANTE'])?.toString().toUpperCase().trim(); 
          if (!nomeExcel) continue; 
          const aluno = students.find(s => s.name.toUpperCase().trim() === nomeExcel); 
          if (aluno) { 
            const updates: any = {};
            const rawDate = rowMap['DATA DE NASCIMENTO'] || rowMap['NASCIMENTO'] || rowMap['DN'];
            if (rawDate) {
               if (typeof rawDate === 'number') { const jsDate = new Date(Math.round((rawDate - 25569)*86400*1000)); jsDate.setMinutes(jsDate.getMinutes() + jsDate.getTimezoneOffset()); updates.birth_date = jsDate.toISOString(); } 
               else if (typeof rawDate === 'string') { const parts = rawDate.trim().split('/'); if(parts.length === 3) updates.birth_date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString(); }
            }
            if (rowMap['NEE'] || rowMap['DEFICIENCIA']) updates.nee_description = rowMap['NEE'] || rowMap['DEFICIENCIA'];
            
            if (rowMap['CONSELHO TUTELAR'] || rowMap['CT']) {
                updates.ct_council_name = rowMap['CONSELHO TUTELAR'] || rowMap['CT']; 
                updates.ct_referral = rowMap['MOTIVO DO ENCAMINHAMENTO'] || rowMap['MOTIVO']; 
                const rawDateCt = rowMap['DATA DO ENCAMINHAMENTO'] || rowMap['DATA'];
                if(rawDateCt) {
                    if (typeof rawDateCt === 'number') { const jsDate = new Date(Math.round((rawDateCt - 25569)*86400*1000)); jsDate.setMinutes(jsDate.getMinutes() + jsDate.getTimezoneOffset()); updates.ct_date = jsDate.toISOString(); }
                    else if (typeof rawDateCt === 'string') { const parts = rawDateCt.trim().split('/'); if(parts.length === 3) updates.ct_date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString(); }
                }
            }

            if (Object.keys(updates).length > 0) { await supabase.from('students').update(updates).eq('id', aluno.id); updatedCount++; }
            if(rowMap['LP'] || rowMap['MAT']) {
                const parseNota = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; 
                await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: parseNota(rowMap['ART']), cie: parseNota(rowMap['CIE']), edf: parseNota(rowMap['EDF']), geo: parseNota(rowMap['GEO']), his: parseNota(rowMap['HIS']), ing: parseNota(rowMap['ING']), lp: parseNota(rowMap['LP'] || rowMap['L. PORTUGUESA']), mat: parseNota(rowMap['MAT'] || rowMap['MATEMATICA']), pd1: parseNota(rowMap['PD1']), pd2: parseNota(rowMap['PD2']), pd3: parseNota(rowMap['PD3']), faltas_bimestre: rowMap['FALTAS'] ? parseInt(rowMap['FALTAS']) : 0 }]); 
            }
          } 
        } 
        alert(`Sucesso! ${updatedCount} alunos atualizados.`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); 
      } catch (err) { alert('Erro: ' + err); setImporting(false); } 
    }; 
    reader.readAsBinaryString(file); 
  }

  const handleUpdateGrade = (field: string, value: string) => { if(!projectedStudent) return; const newStudent = { ...projectedStudent }; const bimIndex = newStudent.desempenho.findIndex((d:any) => d.bimestre === selectedBimestre); if (bimIndex >= 0) { const numValue = value === '' ? null : parseFloat(value.replace(',', '.')); newStudent.desempenho[bimIndex][field] = numValue; setProjectedStudent(newStudent); } };
  const handleSaveCouncilChanges = async () => { if(!projectedStudent) return; const desempenhoAtual = projectedStudent.desempenho.find((d:any) => d.bimestre === selectedBimestre); if(!desempenhoAtual) return; const { error } = await supabase.from('desempenho_bimestral').update({ lp: desempenhoAtual.lp, mat: desempenhoAtual.mat, cie: desempenhoAtual.cie, his: desempenhoAtual.his, geo: desempenhoAtual.geo, ing: desempenhoAtual.ing, art: desempenhoAtual.art, edf: desempenhoAtual.edf, pd1: desempenhoAtual.pd1, pd2: desempenhoAtual.pd2, pd3: desempenhoAtual.pd3, faltas_bimestre: desempenhoAtual.faltas_bimestre, obs_conselho: councilObs, encaminhamento_conselho: councilEnc }).eq('id', desempenhoAtual.id); if(!error) { alert('Dados Salvos!'); fetchStudents(); } else alert('Erro: ' + error.message); };
  
  // --- A "SUPER ATA" UNIFICADA E CORRIGIDA (CORES SUAVES) ---
  const generateSuperAta = (targetClass: string) => {
    const councilStudents = students.filter(s => s.class_id === targetClass);
    if(councilStudents.length === 0) return alert('Turma vazia');
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // CABEÇALHO
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(`ATA DE CONSELHO DE CLASSE - ${targetClass}`, 148, 20, {align: "center"});
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`${selectedBimestre} | Data: ${new Date(dataConselho).toLocaleDateString('pt-BR')} | ${SYSTEM_ORG}`, 148, 26, {align: "center"});

    // RADAR
    autoTable(doc, { startY: 32, head: [['Indicador', 'Assiduidade', 'Participação', 'Relacionamento', 'Rendimento', 'Tarefas']], body: [[ 'Avaliação da Turma (0-5)', radarData.assiduidade, radarData.participacao, radarData.relacionamento, radarData.rendimento, radarData.tarefas ]], theme: 'grid', styles: { fontSize: 8, halign: 'center' }, headStyles: { fillColor: [55, 65, 81] } });

    // QUADRO GERAL
    const rows = councilStudents.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre) || {}; return [s.name, d.lp||'-', d.mat||'-', d.cie||'-', d.his||'-', d.geo||'-', d.ing||'-', d.art||'-', d.edf||'-', d.pd1||'-', d.pd2||'-', d.pd3||'-', d.faltas_bimestre||0, s.logs?.length||0]; });
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, head: [['Estudante', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'PD2', 'PD3', 'Faltas', 'Ocorr.']], body: rows, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [30, 41, 59] } });

    // SEÇÕES DE REGISTROS (COM CORES SUAVES E TÍTULOS CLAROS)
    doc.addPage();
    doc.setFontSize(14); doc.setTextColor(0); doc.text("REGISTROS ESPECÍFICOS E ENCAMINHAMENTOS", 14, 20);
    let currentY = 30;

    const createSection = (title: string, data: any[], headerColor: [number, number, number], headers: string[][]) => {
        if (data.length > 0) {
            // Desenha um box de fundo suave para o título
            doc.setFillColor(headerColor[0] + 200 > 255 ? 245 : headerColor[0] + 180, headerColor[1] + 180, headerColor[2] + 180); // Cor pastel
            doc.rect(14, currentY, 269, 8, 'F');
            doc.setFont("helvetica", "bold"); 
            doc.setFontSize(10); 
            doc.setTextColor(...headerColor); 
            doc.text(title, 16, currentY + 5.5);
            
            autoTable(doc, { 
                startY: currentY + 10, 
                head: headers, 
                body: data, 
                theme: 'grid', 
                styles: { fontSize: 8, textColor: [50, 50, 50] }, // Texto cinza escuro
                headStyles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } 
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
            
            if (currentY > 180) { doc.addPage(); currentY = 20; }
        }
    };

    const destaques = councilStudents.filter(s => s.is_highlight);
    createSection("⭐ DESTAQUES ACADÊMICOS (Certificado)", destaques.map(s => [s.name, 'Honra ao Mérito']), [202, 138, 4], [['Nome do Estudante', 'Ação Sugerida']]);

    const elogios = councilStudents.filter(s => s.is_praised);
    createSection("👏 ELOGIOS E INCENTIVOS (Superação)", elogios.map(s => [s.name, 'Elogio Verbal / Registro']), [21, 128, 61], [['Nome do Estudante', 'Ação Sugerida']]);

    const baixoRendimento = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); if (!d) return false; return [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf].filter(n => n !== null && n < 5).length > 3; });
    createSection("📉 BAIXO RENDIMENTO (> 3 Notas Vermelhas)", baixoRendimento.map(s => [s.name, 'Convocação de Responsáveis']), [180, 83, 9], [['Nome do Estudante', 'Ação Sugerida']]);

    const faltosos = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && d.faltas_bimestre > 20; });
    createSection("🚨 BUSCA ATIVA (Faltas > 20)", faltosos.map(s => [s.name, s.desempenho?.find((x:any) => x.bimestre === selectedBimestre)?.faltas_bimestre + ' faltas']), [185, 28, 28], [['Nome do Estudante', 'Situação']]);
    
    const deliberacoes = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && (d.obs_conselho || d.encaminhamento_conselho); });
    createSection("📝 DELIBERAÇÕES E OBSERVAÇÕES FINAIS", deliberacoes.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return [s.name, d.obs_conselho || '', d.encaminhamento_conselho || '']; }), [75, 85, 99], [['Estudante', 'Anotações', 'Encaminhamento']]);

    doc.save(`ATA_COMPLETA_${targetClass}.pdf`);
  };
  
  // Função exclusiva para Imprimir Lista CT
  const printCTList = () => {
      const ctStudents = students.filter(s => s.ct_referral);
      if(ctStudents.length === 0) return alert('Nenhum estudante no Conselho Tutelar.');
      const doc = new jsPDF();
      doc.setFontSize(14); doc.text("ENCAMINHAMENTOS AO CONSELHO TUTELAR", 105, 20, {align: "center"});
      const rows = ctStudents.map(s => [s.name, s.class_id, s.ct_council_name || '-', s.ct_date ? new Date(s.ct_date).toLocaleDateString() : '-', s.ct_referral]);
      autoTable(doc, { startY: 30, head: [['Nome', 'Turma', 'Conselho', 'Data', 'Motivo']], body: rows });
      doc.save("LISTA_CONSELHO_TUTELAR.pdf");
  };

  // --- FUNÇÃO DE IMPRESSÃO INDIVIDUAL DECLARADA CORRETAMENTE ---
  const printStudentData = (doc: jsPDF, student: any) => { 
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); 
      doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, { align: "center" }); 
      doc.text("CED 04 DO GUARÁ - SOE", 105, 22, { align: "center" }); 
      doc.setLineWidth(0.5); doc.line(14, 25, 196, 25); 
      
      // Dados Pessoais
      doc.setFontSize(11); doc.text(`FICHA INDIVIDUAL DO ESTUDANTE`, 14, 35);
      
      autoTable(doc, {
          startY: 40,
          head: [['Informação', 'Detalhe']],
          body: [
              ['Nome Completo', student.name],
              ['Turma', student.class_id],
              ['Data de Nascimento', student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '-'],
              ['Responsável', student.guardian_name || 'Não informado'],
              ['Telefone', student.guardian_phone || '-'],
              ['Endereço', student.address || '-']
          ],
          theme: 'grid',
          headStyles: { fillColor: [55, 65, 81] },
          columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
      });
      
      // Situação Especial (Se houver)
      if (student.nee_description || student.ct_referral) {
          let currentY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFontSize(11); doc.text("SITUAÇÃO ESCOLAR / REDE DE PROTEÇÃO", 14, currentY);
          
          const specialData = [];
          if (student.nee_description) specialData.push(['Necessidades Específicas (NEE)', student.nee_description]);
          if (student.ct_referral) specialData.push(['Conselho Tutelar', `${student.ct_council_name || ''} - ${student.ct_referral}`]);
          
          autoTable(doc, {
              startY: currentY + 5,
              body: specialData,
              theme: 'grid',
              styles: { textColor: [180, 83, 9] }, // Cor de alerta
              columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
          });
      }

      // Desempenho
      let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 80;
      doc.setFontSize(11); doc.setTextColor(0); doc.text("DESEMPENHO ACADÊMICO", 14, currentY);
      const acadData = student.desempenho?.map((d: any) => [d.bimestre, d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf, d.pd1, d.faltas_bimestre]) || []; 
      autoTable(doc, { startY: currentY + 5, head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'Faltas']], body: acadData, theme: 'grid', headStyles: { fillColor: [55, 65, 81] } });
      
      // Histórico
      currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("HISTÓRICO DE ATENDIMENTOS", 14, currentY);
      const logsData = student.logs?.filter((l: any) => l.student_id === student.id).map((l: any) => {
          let desc = { obs: '' }; try { desc = JSON.parse(l.description); } catch(e) {}
          return [new Date(l.created_at).toLocaleDateString(), l.category, desc.obs];
      }) || []; 
      autoTable(doc, { startY: currentY + 5, head: [['Data', 'Tipo', 'Detalhes']], body: logsData, theme: 'grid', headStyles: { fillColor: [55, 65, 81] } }); 
  };

  const generatePDF = () => { if (!selectedStudent) return; const doc = new jsPDF(); printStudentData(doc, selectedStudent); doc.save(`Ficha_${selectedStudent.name}.pdf`); };
  const generateBatchPDF = (classId: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); const classStudents = students.filter(s => s.class_id === classId); if (classStudents.length === 0) return alert("Turma vazia."); const doc = new jsPDF(); classStudents.forEach((student, index) => { if (index > 0) doc.addPage(); printStudentData(doc, student); }); doc.save(`PASTA_TURMA_${classId}.pdf`); };
  const handleExportReport = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Dados"); XLSX.writeFile(wb, `Relatorio_Geral.xlsx`); };
  const handleBackup = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Backup"); XLSX.writeFile(wb, `BACKUP_SOE.xlsx`); };
  const changeStudent = (direction: 'prev' | 'next') => { const turmas = [...new Set(students.map(s => s.class_id))].sort(); const currentClass = conselhoTurma || turmas[0]; const currentList = students.filter(s => s.class_id === currentClass).sort((a,b) => a.name.localeCompare(b.name)); if (!projectedStudent || currentList.length === 0) return; const currentIndex = currentList.findIndex(s => s.id === projectedStudent.id); if (direction === 'next') { if (currentIndex < currentList.length - 1) setProjectedStudent(currentList[currentIndex + 1]); else setProjectedStudent(currentList[0]); } else { if (currentIndex > 0) setProjectedStudent(currentList[currentIndex - 1]); else setProjectedStudent(currentList[currentList.length - 1]); } };

  // --- RENDER CONSELHO ---
  const renderConselho = () => {
      const turmas = [...new Set(students.map(s => s.class_id))].sort(); 
      const targetClass = conselhoTurma || turmas[0]; 
      let councilStudents = students.filter(s => s.class_id === targetClass);
      let totalFaltas = 0; let alunosRisco = 0; let totalOcorrencias = 0; let alunosBaixoRendimento = 0;
      councilStudents.forEach(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); if(d) { totalFaltas += (d.faltas_bimestre || 0); if(d.faltas_bimestre > 20) alunosRisco++; const disciplinasBase = [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf]; const notasVermelhas = disciplinasBase.filter(n => n !== null && n < 5).length; if (notasVermelhas > 3) alunosBaixoRendimento++; } totalOcorrencias += (s.logs?.length || 0); });
      if (conselhoFilterType === 'RISK') councilStudents = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && d.faltas_bimestre > 20; });
      if (conselhoFilterType === 'LOGS') councilStudents = councilStudents.filter(s => (s.logs?.length || 0) > 0);
      if (conselhoFilterType === 'GRADES') councilStudents = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); if (!d) return false; const disciplinasBase = [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf]; return disciplinasBase.filter(n => n !== null && n < 5).length > 3; });
      const radarChartData = [ { subject: 'Assiduidade', A: radarData.assiduidade, fullMark: 5 }, { subject: 'Participação', A: radarData.participacao, fullMark: 5 }, { subject: 'Relacionamento', A: radarData.relacionamento, fullMark: 5 }, { subject: 'Rendimento', A: radarData.rendimento, fullMark: 5 }, { subject: 'Tarefas', A: radarData.tarefas, fullMark: 5 } ];
      const renderNota = (val: any) => (val === undefined || val === null) ? <span className="text-slate-300">-</span> : <span className={`font-bold ${val < 5 ? 'text-red-600 bg-red-50 px-1 rounded' : 'text-slate-700'}`}>{val}</span>;

      if (!targetClass) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;
      return (
          <div className="max-w-[1800px] mx-auto pb-4 w-full h-full flex flex-col overflow-hidden bg-slate-50/50">
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm flex-shrink-0">
                  <div className="flex items-center gap-4"><div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><GraduationCap size={24}/></div><div><h2 className="text-xl font-bold text-slate-800">Conselho Digital</h2><div className="flex gap-2 mt-1"><div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md border border-slate-200"><Calendar size={14} className="text-slate-400"/><input type="date" className="text-xs font-bold outline-none bg-transparent text-slate-600" value={dataConselho} onChange={e => setDataConselho(e.target.value)}/></div><select className="px-3 py-1 border rounded-md font-bold bg-slate-100 text-xs text-slate-600" value={targetClass} onChange={e => {setConselhoTurma(e.target.value); setConselhoFilterType('ALL');}}>{turmas.map(t => <option key={t} value={t}>{t}</option>)}</select><select className="px-3 py-1 border rounded-md font-bold bg-slate-100 text-xs text-slate-600" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select></div></div></div>
                  <div className="flex gap-3"><button onClick={() => setIsEvalModalOpen(true)} className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-orange-100 text-sm transition-colors"><Activity size={16}/> Avaliar</button><button onClick={() => generateSuperAta(targetClass)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-indigo-700 text-sm transition-colors shadow-lg shadow-indigo-200"><Printer size={16}/> Gerar Ata Unificada</button></div>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-4 gap-4 flex-shrink-0">
                  <div onClick={() => setConselhoFilterType('ALL')} className={`cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${conselhoFilterType === 'ALL' ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Alunos</p><p className="text-2xl font-black text-slate-800">{students.filter(s => s.class_id === targetClass).length}</p></div><div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Users2 size={20}/></div></div>
                  <div onClick={() => setConselhoFilterType('RISK')} className={`cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${conselhoFilterType === 'RISK' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}><div><p className="text-[10px] font-bold text-slate-400 uppercase">Risco Faltas</p><p className="text-2xl font-black text-red-600">{alunosRisco}</p></div><div className="bg-red-100 p-2 rounded-lg text-red-600"><AlertTriangle size={20}/></div></div>
                  <div onClick={() => setConselhoFilterType('GRADES')} className={`cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${conselhoFilterType === 'GRADES' ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}><div><p className="text-[10px] font-bold text-slate-400 uppercase">Notas Baixas</p><p className="text-2xl font-black text-orange-600">{alunosBaixoRendimento}</p></div><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><BarChartIcon size={20}/></div></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center relative overflow-hidden"><div className="absolute top-2 left-3 text-[10px] font-bold text-slate-400 uppercase">Radar da Turma</div><div className="w-full h-20 mt-2"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}><PolarGrid stroke="#f1f5f9"/><PolarAngleAxis dataKey="subject" tick={false}/><PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false}/><Radar name="Turma" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.5}/><Tooltip/></RadarChart></ResponsiveContainer></div></div>
              </div>
              <div className="px-6 flex-1 min-h-0 flex flex-col"><div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col"><div className="overflow-x-auto flex-1"><table className="w-full text-xs text-left"><thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 z-10 border-b border-slate-200"><tr><th className="px-4 py-3 sticky left-0 bg-slate-50 z-20 shadow-sm w-16 text-center">Ações</th><th className="px-4 py-3 sticky left-16 bg-slate-50 z-20 shadow-sm">Nome do Aluno</th><th className="px-2 py-3 text-center">LP</th><th className="px-2 py-3 text-center">MAT</th><th className="px-2 py-3 text-center">CIE</th><th className="px-2 py-3 text-center">HIS</th><th className="px-2 py-3 text-center">GEO</th><th className="px-2 py-3 text-center">ING</th><th className="px-2 py-3 text-center">ART</th><th className="px-2 py-3 text-center">EDF</th><th className="px-2 py-3 text-center bg-slate-100">PD1</th><th className="px-2 py-3 text-center bg-slate-100">PD2</th><th className="px-2 py-3 text-center bg-slate-100">PD3</th><th className="px-4 py-3 text-center bg-red-50 text-red-700">FALTAS</th><th className="px-4 py-3">Atendimentos</th></tr></thead><tbody className="divide-y divide-slate-100">{councilStudents.length === 0 ? <tr><td colSpan={15} className="p-8 text-center text-slate-400 font-bold">Nenhum aluno encontrado.</td></tr> : councilStudents.map(s => { const notas = s.desempenho?.find((d: any) => d.bimestre === selectedBimestre) || {}; const isHighlighted = s.is_highlight; const isPraised = s.is_praised; return (<tr key={s.id} onClick={() => setProjectedStudent(s)} className="hover:bg-indigo-50 transition-colors cursor-pointer group"><td className="px-2 py-3 sticky left-0 bg-white group-hover:bg-indigo-50 z-10 border-r border-slate-100 flex justify-center gap-2"><button onClick={(e) => toggleHighlight(s.id, isHighlighted, e)} title="Destaque"><Star size={14} className={`transition-all hover:scale-125 ${isHighlighted ? 'fill-orange-400 text-orange-400' : 'text-slate-300 hover:text-orange-300'}`}/></button><button onClick={(e) => togglePraise(s.id, isPraised, e)} title="Elogio"><ThumbsUp size={14} className={`transition-all hover:scale-125 ${isPraised ? 'fill-green-500 text-green-500' : 'text-slate-300 hover:text-green-400'}`}/></button></td><td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-3 border-r border-slate-100 sticky left-16 bg-white group-hover:bg-indigo-50 z-10 shadow-sm"><Avatar name={s.name} src={s.photo_url} size="sm"/> <span className="truncate">{s.name}</span></td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.lp)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.mat)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.cie)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.his)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.geo)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.ing)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.art)}</td><td className="px-2 py-3 text-center border-r border-slate-50">{renderNota(notas.edf)}</td><td className="px-2 py-3 text-center border-r border-slate-50 bg-slate-50">{renderNota(notas.pd1)}</td><td className="px-2 py-3 text-center border-r border-slate-50 bg-slate-50">{renderNota(notas.pd2)}</td><td className="px-2 py-3 text-center border-r border-slate-50 bg-slate-50">{renderNota(notas.pd3)}</td><td className="px-4 py-3 text-center border-r border-slate-50 font-bold bg-red-50">{notas.faltas_bimestre > 20 ? <span className="text-red-600 animate-pulse">{notas.faltas_bimestre}</span> : <span>{notas.faltas_bimestre || 0}</span>}</td><td className="px-4 py-3"><span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{s.logs?.length || 0} Reg.</span></td></tr>); })}</tbody></table></div></div></div>
          </div>
      );
  };

  const renderDashboard = () => {
    let studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    const nees = students.filter(s => s.nee_description).length;
    const cts = students.filter(s => s.ct_referral).length;
    if (selectedClassFilter) studentsInRisk = studentsInRisk.filter(s => s.class_id === selectedClassFilter);
    const turmas = [...new Set(students.map(s => s.class_id))].sort();

    return (
      <div className="space-y-6 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div onClick={() => { setDashboardFilterType('ALL'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Alunos</p><p className="text-2xl font-black text-indigo-900">{students.length}</p></div><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors"><Users2 size={20}/></div></div>
          <div onClick={() => { setDashboardFilterType('RISK'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Em Alerta</p><p className="text-2xl font-black text-red-600">{studentsInRisk.length}</p></div><div className="bg-red-50 p-3 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors"><AlertTriangle size={20}/></div></div>
          <div onClick={() => { setDashboardFilterType('NEE'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">ANEE / Inclusão</p><p className="text-2xl font-black text-purple-600">{nees}</p></div><div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors"><Puzzle size={20}/></div></div>
          <div onClick={() => { setDashboardFilterType('CT'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
             <div><p className="text-[10px] font-bold text-slate-400 uppercase">Conselho Tutelar</p><p className="text-2xl font-black text-orange-600">{cts}</p></div>
             <div className="flex gap-2 items-center"><button onClick={(e) => { e.stopPropagation(); printCTList(); }} className="p-2 bg-white rounded-full border shadow-sm hover:bg-orange-50 text-orange-600" title="Imprimir Lista CT"><Printer size={14}/></button><div className="bg-orange-50 p-3 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors"><Scale size={20}/></div></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[350px]">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col"><h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={16} className="text-indigo-600"/> Volume de Atendimentos</h4><div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}}/><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/><Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}}/></LineChart></ResponsiveContainer></div></div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col"><h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChartIcon size={16} className="text-indigo-600"/> Motivos Recorrentes</h4><div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/><Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}}/></PieChart></ResponsiveContainer></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
          <div className="bg-white rounded-xl border border-red-100 shadow-sm flex flex-col overflow-hidden"><div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center"><h3 className="font-bold text-red-800 text-xs uppercase flex items-center gap-2"><AlertTriangle size={14}/> Alunos em Risco</h3><span className="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{studentsInRisk.length}</span></div><div className="flex-1 overflow-y-auto p-2 space-y-1">{studentsInRisk.length > 0 ? studentsInRisk.map(s => (<div key={s.id} onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="p-3 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-between border border-transparent hover:border-red-100 transition-all group"><div className="flex items-center gap-3"><Avatar name={s.name} src={s.photo_url} size="sm"/><div className="truncate w-32"><p className="font-bold text-slate-700 text-xs group-hover:text-red-700 truncate">{s.name}</p><p className="text-[10px] text-slate-400 font-bold">Turma {s.class_id}</p></div></div><ChevronRight size={14} className="text-slate-300 group-hover:text-red-400"/></div>)) : <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs"><ShieldCheck size={32} className="mb-2 opacity-50"/><p>Tudo tranquilo!</p></div>}</div></div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"><div className="bg-slate-50 px-4 py-3 border-b border-slate-200"><h3 className="font-bold text-slate-700 text-xs uppercase flex items-center gap-2"><Folder size={14}/> Visão Geral das Turmas</h3></div><div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{turmas.map(t => { const total = students.filter(s => s.class_id === t).length; const risco = students.filter(s => s.class_id === t && (checkRisk(s).reprovadoFalta || checkRisk(s).criticoNotas)).length; const percent = total > 0 ? (risco / total) * 100 : 0; return (<div key={t} onClick={() => setSelectedClassFilter(selectedClassFilter === t ? null : t)} className={`p-3 rounded-lg border cursor-pointer transition-all hover:-translate-y-1 ${selectedClassFilter === t ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}><div className="flex justify-between items-center mb-2"><span className="font-bold text-sm">{t}</span>{percent > 30 ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> : <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}</div><div className="text-[10px] opacity-80 mb-1">{total} Alunos</div><div className="w-full h-1 bg-black/10 rounded-full overflow-hidden"><div className={`h-full ${percent > 30 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{width: `${percent}%`}}></div></div></div>) })}</div></div></div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return (<div className="h-screen bg-slate-900 flex items-center justify-center p-4 animate-in fade-in duration-1000"><div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in zoom-in duration-500"><div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><Lock className="text-indigo-600" size={32} /></div><h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso SOE</h1><form onSubmit={handleLogin} className="space-y-4"><input type="password" title="Senha" className="w-full p-3 border rounded-xl text-center focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} /><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">Entrar</button></form></div></div>);
  const turmasList = [...new Set(students.map(s => s.class_id))].sort();
  const filteredStudents = students.filter(s => { 
    if (listClassFilter && s.class_id !== listClassFilter) return false; 
    if (dashboardFilterType === 'RISK') { const r = checkRisk(s); if (!r.reprovadoFalta && !r.criticoFalta && !r.criticoNotas) return false; } 
    if (dashboardFilterType === 'ACTIVE' && s.status !== 'ATIVO') return false; 
    if (dashboardFilterType === 'NEE' && !s.nee_description) return false;
    if (dashboardFilterType === 'CT' && !s.ct_referral) return false;
    if (dashboardFilterType === 'RESOLVED') return s.logs?.some((l:any) => l.resolved); 
    if (dashboardFilterType === 'RECURRENT') return (s.logs?.length || 0) >= 3; 
    if (dashboardFilterType === 'WITH_LOGS') return (s.logs?.length || 0) > 0; 
    return !globalSearch || s.name.toLowerCase().includes(globalSearch.toLowerCase()); 
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1E1E2D] text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10"><div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div><div><h1 className="font-bold text-lg tracking-tight">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400 font-bold">{SYSTEM_ORG}</p></div></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setView('dashboard'); setDashboardFilterType('ALL'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><LayoutDashboard size={18} /> <span className="font-medium text-sm">Dashboard</span></button>
          <button onClick={() => { setView('students'); setDashboardFilterType('ALL'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users size={18} /> <span className="font-medium text-sm">Alunos</span></button>
          <button onClick={() => { setView('conselho'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'conselho' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><GraduationCap size={18} /> <span className="font-medium text-sm">Conselho de Classe</span></button>
          <div className="pt-4 mt-4 border-t border-white/10"><button onClick={() => { setIsReportModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><FileBarChart2 size={18} /> <span className="font-medium text-sm">Relatórios</span></button><button onClick={handleBackup} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><Database size={18} /> <span className="font-medium text-sm">Backup</span></button><button onClick={() => { setIsSettingsModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={18} /> <span className="font-medium text-sm">Configurações</span></button></div>
        </nav>
        <div className="p-4 bg-[#151521] border-t border-white/5">
          <div className="flex items-center gap-3 mb-3"><Avatar name={SYSTEM_USER_NAME} src={adminPhoto} size="sm"/><div className="overflow-hidden"><p className="font-bold text-white text-xs truncate">{SYSTEM_USER_NAME}</p><p className="text-[10px] text-slate-400 truncate">{SYSTEM_MATRICULA}</p></div></div>
          <button onClick={() => { localStorage.removeItem('soe_auth'); window.location.reload(); }} className="flex items-center gap-2 text-[10px] text-red-400 hover:text-red-300 transition-colors w-full"><LogOut size={12} /> Sair do Sistema</button>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-slate-500"><div className="flex items-center gap-1"><Code size={10}/> <span className="text-[8px] font-bold uppercase">Dev: Daniel Alves da Silva</span></div><span className="text-[8px]">v10.1 Final</span></div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24} /></button>{view !== 'dashboard' && (<button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg"><ArrowLeft size={14} /> Voltar</button>)}<div className="flex-1 max-w-md relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Buscar aluno..." className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); if (e.target.value.length > 0) setView('students'); }} /></div></div>
          <div className="flex items-center gap-2"><div className="text-right hidden md:block"><p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><div className="h-8 w-[1px] bg-slate-200 mx-2"></div><div className="bg-indigo-100 text-indigo-700 p-2 rounded-full"><Users2 size={18}/></div></div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {view === 'dashboard' && renderDashboard()}
          {view === 'students' && (<div className="max-w-[1600px] mx-auto pb-20 w-full h-full flex flex-col"><div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4"><div><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-indigo-600"/> Gestão de Estudantes</h2><p className="text-xs text-slate-500 mt-1">Gerencie matrículas, ocorrências e dados acadêmicos.</p></div><div className="flex gap-2"><button onClick={() => setIsImportModalOpen(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 text-sm transition-all"><FileSpreadsheet size={16} /> Importar</button><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 text-sm transition-all"><Plus size={16} /> Novo Aluno</button></div></div>{dashboardFilterType !== 'ALL' && (<div className="bg-indigo-50 border-indigo-100 border p-3 rounded-xl mb-4 flex items-center justify-between"><span className="font-bold text-indigo-700 flex items-center gap-2 text-sm"><Filter size={16}/> Filtrando por: {dashboardFilterType} ({filteredStudents.length})</span><button onClick={() => setDashboardFilterType('ALL')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline">Limpar Filtros</button></div>)}<div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin"><button onClick={() => setListClassFilter(null)} className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap border transition-all ${!listClassFilter ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>Todos</button>{turmasList.map(t => (<button key={t} onClick={() => setListClassFilter(t)} className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap border flex items-center gap-2 transition-all ${listClassFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>{t}</button>))}</div><div className="flex-1 min-h-0"><StudentList students={filteredStudents} onSelectStudent={(s: any) => { setSelectedStudent(s); setIsModalOpen(true); }} filterType={dashboardFilterType} /></div></div>)}
          {view === 'conselho' && renderConselho()}
        </div>
      </main>

      {/* MODAL CONFIGURAÇÕES */}
      {isSettingsModalOpen && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col h-[80vh]"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Settings className="text-slate-600" /> Configurações de Listas</h3><button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={28} /></button></div><div className="flex-1 overflow-y-auto space-y-8 pr-2"><div><h4 className="font-bold text-lg text-orange-600 mb-2 border-b pb-2">Motivos Comportamentais</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo motivo..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('comp')} className="bg-orange-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listComportamento.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('comp', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div><div><h4 className="font-bold text-lg text-blue-600 mb-2 border-b pb-2">Motivos Pedagógicos</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo motivo..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('ped')} className="bg-blue-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listPedagogico.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('ped', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div><div><h4 className="font-bold text-lg text-purple-600 mb-2 border-b pb-2">Encaminhamentos</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo destino..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('enc')} className="bg-purple-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listEncaminhamentos.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('enc', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div></div></div></div>)}
      {/* MODAL RADAR TURMA */}
      {isEvalModalOpen && (<div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> Avaliação da Turma</h3><button onClick={() => setIsEvalModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button></div><div className="space-y-6">{[ {l: 'Assiduidade', k: 'assiduidade', i: <Clock size={18}/>}, {l: 'Participação', k: 'participacao', i: <Brain size={18}/>}, {l: 'Relacionamento', k: 'relacionamento', i: <Heart size={18}/>}, {l: 'Rendimento', k: 'rendimento', i: <BarChartIcon size={18}/>}, {l: 'Tarefas', k: 'tarefas', i: <PenTool size={18}/>} ].map((item: any, idx) => (<div key={idx}><label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">{item.i} {item.l}</label><div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">Fraco</span><input type="range" min="1" max="5" value={radarData[item.k as keyof typeof radarData] || 3} onChange={(e) => setRadarData({...radarData, [item.k]: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" /><span className="text-xs font-bold text-slate-400">Excelente</span></div></div>))}<div className="pt-4 border-t"><button onClick={handleSaveRadar} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600">Salvar Avaliação</button></div></div></div></div>)}
      {/* MODAL PROJEÇÃO */}
      {projectedStudent && (<div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 lg:p-8 backdrop-blur-md"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300"><div className="bg-indigo-900 text-white p-6 flex justify-between items-center shadow-lg"><div className="flex items-center gap-4"><MonitorPlay size={32} className="text-indigo-400"/><div><h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider">{projectedStudent.name}</h2><p className="text-indigo-300 font-bold text-sm lg:text-lg">TURMA {projectedStudent.class_id} | {selectedBimestre}</p></div></div><div className="flex items-center gap-2 lg:gap-4"><button onClick={() => changeStudent('prev')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Anterior"><ChevronLeft size={24} color="white"/></button><button onClick={() => changeStudent('next')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Próximo"><ChevronRight size={24} color="white"/></button><div className="w-[1px] h-8 bg-white/20 mx-2"></div><button onClick={() => setIsSensitiveVisible(!isSensitiveVisible)} className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-[10px] lg:text-sm transition-colors ${isSensitiveVisible ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{isSensitiveVisible ? <EyeOff size={16}/> : <Eye size={16}/>} Sigilo</button><button onClick={handleSaveCouncilChanges} className="bg-green-500 hover:bg-green-600 text-white px-4 lg:px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg text-sm lg:text-base"><Save size={18}/> SALVAR</button><button onClick={() => setProjectedStudent(null)} className="p-2 bg-white/10 rounded-full text-white"><X size={28}/></button></div></div><div className="flex-1 overflow-hidden flex flex-col lg:flex-row"><div className="lg:w-1/3 bg-slate-100 p-4 lg:p-8 flex flex-col items-center border-r border-slate-200 overflow-y-auto"><div className="mb-6"><Avatar name={projectedStudent.name} src={projectedStudent.photo_url} size="2xl"/></div><div className="w-full bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200"><h3 className="text-center font-bold text-slate-400 text-xs uppercase mb-4 tracking-widest flex items-center justify-center gap-2"><Pencil size={12}/> Notas</h3><div className="grid grid-cols-3 gap-2 lg:gap-3">{(() => { const notas = projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {}; const disciplinas = [{n:'LP', k:'lp', v: notas.lp}, {n:'MAT', k:'mat', v: notas.mat}, {n:'CIE', k:'cie', v: notas.cie}, {n:'HIS', k:'his', v: notas.his}, {n:'GEO', k:'geo', v: notas.geo}, {n:'ING', k:'ing', v: notas.ing}, {n:'ART', k:'art', v: notas.art}, {n:'EDF', k:'edf', v: notas.edf}, {n:'PD1', k:'pd1', v: notas.pd1}, {n:'PD2', k:'pd2', v: notas.pd2}, {n:'PD3', k:'pd3', v: notas.pd3}]; return disciplinas.map(d => (<div key={d.k} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors ${d.v < 5 && d.v !== null ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}><span className="text-lg font-black text-slate-700">{d.n}</span><input type="number" className={`w-full text-center bg-transparent font-black text-2xl outline-none ${d.v < 5 ? 'text-red-600' : 'text-slate-700'}`} value={d.v ?? ''} onChange={(e) => handleUpdateGrade(d.k, e.target.value)} /></div>)); })()}</div><div className="mt-4 pt-4 border-t flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Faltas</span><input type="number" title="Faltas" className="w-16 text-right font-black text-xl lg:text-2xl text-slate-700 bg-slate-50 border rounded-lg p-1" value={(projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {}).faltas_bimestre || ''} onChange={(e) => handleUpdateGrade('faltas_bimestre', e.target.value)} /></div></div></div><div className="lg:w-2/3 p-4 lg:p-8 bg-white overflow-y-auto flex flex-col gap-8"><div className="flex-1"><h3 className="font-bold text-indigo-900 text-lg uppercase mb-4 flex items-center gap-2"><FileText size={20}/> Atendimentos SOE</h3><div className="space-y-3">{projectedStudent.logs && projectedStudent.logs.length > 0 ? projectedStudent.logs.map((log: any) => { let desc = { motivos: [], obs: '' }; try { desc = JSON.parse(log.description); } catch(e) {} return (<div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">{new Date(log.created_at).toLocaleDateString()}</span><span className="text-[10px] font-bold text-slate-400">{log.category}</span></div><div className="flex flex-wrap gap-1 mb-2">{desc.motivos?.map((m:string) => <span key={m} className="text-[9px] font-bold bg-white border px-2 py-0.5 rounded text-slate-600">{m}</span>)}</div><div className={`text-sm text-slate-600 italic ${isSensitiveVisible ? '' : 'blur-sm select-none'}`}>"{desc.obs}"</div></div>) }) : <p className="text-slate-400 text-center py-8">Nenhum atendimento registrado.</p>}</div></div><div className="bg-orange-50 p-6 rounded-2xl border border-orange-100"><h3 className="font-bold text-orange-800 text-lg uppercase mb-4 flex items-center gap-2"><ClipboardList size={20}/> Deliberação do Conselho</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Anotações</label><textarea title="Anotações" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Digite as observações..." value={councilObs} onChange={(e) => setCouncilObs(e.target.value)}></textarea></div><div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Encaminhamentos</label><textarea title="Encaminhamentos" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Encaminhar para..." value={councilEnc} onChange={(e) => setCouncilEnc(e.target.value)}></textarea></div></div></div></div></div></div></div>)}
      {/* MODAL DETALHES ALUNO */}
      {isModalOpen && selectedStudent && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"><div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 flex-shrink-0"><div className="flex items-center gap-6"><div className="relative group"><Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" /><label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} /></label></div><div><h2 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h2><p className="text-lg text-slate-500 font-bold uppercase mt-1">Turma {selectedStudent.class_id}</p></div></div><div className="flex gap-2"><button onClick={generatePDF} className="p-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 flex items-center gap-2" title="Gerar Ficha Individual"><FileDown size={20} /><span className="text-xs font-bold uppercase">Ficha</span></button><button onClick={startEditing} className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200" title="Editar"><Pencil size={20} /></button><button onClick={() => setIsExitModalOpen(true)} className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Saída"><LogOut size={20} /></button><button onClick={() => setIsModalOpen(false)} className="ml-4 hover:bg-slate-200 p-2 rounded-full"><X className="text-slate-400 hover:text-red-500" size={32} /></button></div></div><div className="flex border-b px-8 bg-white overflow-x-auto gap-8">{['perfil', 'academico', 'historico', 'familia'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 font-bold text-sm border-b-4 uppercase tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab === 'familia' ? 'Família & Responsáveis' : tab.toUpperCase()}</button>))}</div><div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        {/* BANNER DE ALERTA NEE/CT NO TOPO DO MODAL */}
        {(selectedStudent.nee_description || selectedStudent.ct_referral) && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStudent.nee_description && (
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Puzzle size={24}/></div>
                        <div>
                            <h4 className="font-bold text-purple-900 text-sm uppercase">Necessidades Específicas (ANEE)</h4>
                            <p className="text-sm text-purple-700 mt-1">{selectedStudent.nee_description}</p>
                            {selectedStudent.birth_date && <p className="text-xs text-purple-500 mt-1 font-bold">Idade: {new Date().getFullYear() - new Date(selectedStudent.birth_date).getFullYear()} anos</p>}
                        </div>
                    </div>
                )}
                {selectedStudent.ct_referral && (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Siren size={24}/></div>
                        <div>
                            <h4 className="font-bold text-orange-900 text-sm uppercase">Conselho Tutelar</h4>
                            <p className="text-xs text-orange-600 font-bold mt-1 uppercase">{selectedStudent.ct_council_name} • {selectedStudent.ct_date ? new Date(selectedStudent.ct_date).toLocaleDateString() : 'Data não inf.'}</p>
                            <p className="text-sm text-orange-700 mt-1 italic">"{selectedStudent.ct_referral}"</p>
                        </div>
                    </div>
                )}
            </div>
        )}
        {activeTab === 'perfil' && (<div className="bg-white p-8 rounded-2xl border shadow-sm w-full mx-auto"><h3 className="font-bold text-indigo-900 uppercase mb-6 flex items-center gap-2 border-b pb-4"><UserCircle className="text-indigo-600" /> Informações de Contato</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Responsável Legal</span>{isEditing ? <input title="Resp" value={editGuardian} onChange={e => setEditGuardian(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.guardian_name || "Não informado"}</p>}</div><div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Telefone</span>{isEditing ? <input title="Tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.guardian_phone || "Não informado"}</p>}</div><div className="md:col-span-2"><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Endereço</span>{isEditing ? <input title="End" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.address || "Não informado"}</p>}</div></div>
        {/* CAMPOS DE EDIÇÃO MANUAL NEE/CT */}
        {isEditing && (
            <div className="mt-6 pt-6 border-t border-slate-100 bg-slate-50 p-6 rounded-xl">
                <h4 className="font-bold text-indigo-900 mb-4 uppercase text-xs tracking-wider">Informações Adicionais (Inclusão & Rede de Proteção)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">Necessidades Específicas (NEE)</label>
                        <input className="w-full border border-purple-200 p-2 rounded-lg text-sm" placeholder="Ex: TDAH, TEA, Alta Habilidade..." value={editNee} onChange={e => setEditNee(e.target.value)} />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">Conselho Tutelar (Unidade)</label>
                         <input className="w-full border border-orange-200 p-2 rounded-lg text-sm" placeholder="Ex: CT Guará, CT Estrutural..." value={editCtCouncil} onChange={e => setEditCtCouncil(e.target.value)} />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">Data Encaminhamento CT</label>
                         <input type="date" className="w-full border border-orange-200 p-2 rounded-lg text-sm" value={editCtDate} onChange={e => setEditCtDate(e.target.value)} />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">Motivo Encaminhamento</label>
                         <input className="w-full border border-orange-200 p-2 rounded-lg text-sm" placeholder="Ex: Evasão, Violação de Direitos..." value={editCtReason} onChange={e => setEditCtReason(e.target.value)} />
                    </div>
                </div>
            </div>
        )}
        {isEditing && <button onClick={saveEdits} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold mt-6 shadow-lg">Salvar Alterações</button>}</div>)}
        {activeTab === 'academico' && (<div className="bg-white rounded-2xl border shadow-sm overflow-x-auto w-full"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b"><tr><th className="px-4 py-4">Bimestre</th><th className="px-2">Português</th><th className="px-2">Matemática</th><th className="px-2">Ciências</th><th className="px-2">História</th><th className="px-2">Geografia</th><th className="px-2">Inglês</th><th className="px-2">Arte</th><th className="px-2">Ed. Física</th><th className="px-2 bg-slate-200">PD1</th><th className="px-2 bg-slate-200">PD2</th><th className="px-2 bg-slate-200">PD3</th><th className="px-4 text-red-600 bg-red-50 text-center">FALTAS</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedStudent.desempenho?.map((d: any, i: number) => (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-5 font-bold text-slate-700">{d.bimestre}</td><td className={`px-2 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td><td className={`px-2 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td><td className="px-2">{d.cie}</td><td className="px-2">{d.his}</td><td className="px-2">{d.geo}</td><td className="px-2">{d.ing}</td><td className="px-2">{d.art}</td><td className="px-2">{d.edf}</td><td className="px-2 bg-slate-50">{d.pd1}</td><td className="px-2 bg-slate-50">{d.pd2}</td><td className="px-2 bg-slate-50">{d.pd3}</td><td className="px-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td></tr>))}</tbody></table></div>)}
        {(activeTab === 'historico' || activeTab === 'familia') && (<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-full"><div className={`lg:col-span-8 p-8 rounded-2xl border shadow-sm h-full flex flex-col ${activeTab === 'familia' ? 'bg-orange-50 border-orange-200' : 'bg-white border-indigo-100'}`}><h3 className="font-bold mb-6 uppercase text-sm flex items-center gap-2 pb-4 border-b border-black/5">{activeTab === 'familia' ? <><Users2 /> Novo Atendimento Família</> : <><FileText /> Novo Atendimento Estudante</>}</h3><div className="space-y-6 flex-1 flex flex-col"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase">Solicitante</label><select title="sol" className="w-full mt-1 p-3 border rounded-lg bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option></select></div><div><label className="text-xs font-bold text-slate-400 uppercase">Encaminhar</label><select title="enc" className="w-full mt-1 p-3 border rounded-lg bg-white" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Selecione --</option>{listEncaminhamentos.map(e => <option key={e}>{e}</option>)}</select></div></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Data</label><input type="date" title="date" className="w-full mt-1 p-3 border rounded-lg bg-white" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></div><div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Retorno</label><input type="date" title="ret" className="w-full mt-1 p-3 border rounded-lg bg-white" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div></div><div className="border p-4 rounded-xl bg-white/50 space-y-4"><div className="grid grid-cols-3 gap-4"><div><p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Comportamental</p><div className="flex flex-col gap-1">{listComportamento.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div><div><p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Pedagógico</p><div className="flex flex-col gap-1">{listPedagogico.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div><div><p className="text-[10px] font-bold text-purple-600 uppercase mb-2">Social/Outros</p><div className="flex flex-col gap-1">{listSocial.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div></div></div><div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col"><label className="text-center block text-sm font-bold text-slate-600 uppercase mb-2 tracking-widest bg-slate-200 py-1 rounded">RELATÓRIO DE ATENDIMENTO</label><textarea title="rel" className="w-full p-4 border rounded-xl flex-1 text-sm bg-white" rows={12} value={obsLivre} onChange={e => setObsLivre(e.target.value)} /></div><div className="flex justify-between items-center pt-4 border-t border-slate-200"><div className="text-xs text-slate-400 font-mono"><p>Registrado por: <span className="font-bold text-slate-600">{SYSTEM_USER_NAME}</span></p><p>{SYSTEM_ROLE} | {SYSTEM_ORG} | Mat. {SYSTEM_MATRICULA} | {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p></div><div className="flex items-center gap-4"><label className="text-sm font-bold text-green-700 flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 rounded" checked={resolvido} onChange={e => setResolvido(e.target.checked)} /> <ShieldCheck size={18} /> Resolvido</label><button onClick={handleSaveLog} className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 ${activeTab === 'familia' ? 'bg-orange-600' : 'bg-indigo-600'}`}><Save size={18} /> SALVAR REGISTRO</button></div></div></div></div><div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 bg-slate-100 p-4 rounded-2xl h-full"><h3 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-slate-100 py-2 z-10 flex items-center gap-2"><History size={14} /> Histórico Completo</h3>{selectedStudent.logs?.filter((l: any) => l.student_id === selectedStudent.id).map((log: any) => { let p = { obs: log.description, motivos: [], solicitante: '' }; try { p = JSON.parse(log.description); } catch (e) { } const isFamily = log.category === 'Família'; return (<div key={log.id} className={`p-4 rounded-xl border shadow-sm bg-white hover:shadow-md transition-shadow relative ${isFamily ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-indigo-400'}`}><div className="flex justify-between items-center mb-2 border-b pb-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isFamily ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{isFamily ? 'FAMÍLIA' : 'ESTUDANTE'}</span><span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span></div><div className="mb-2"><span className="text-[10px] font-bold uppercase text-slate-500 block">Solicitante: {p.solicitante}</span></div><p className="text-xs text-slate-600 line-clamp-3 mb-2 italic">"{p.obs}"</p><div className="flex justify-between items-center mt-2"><button className="text-[10px] text-indigo-600 font-bold underline" onClick={() => { setObsLivre(p.obs); setMotivosSelecionados(p.motivos || []); }}><Copy size={10}/> Copiar</button>{log.resolved && <span className="text-[10px] font-bold text-green-600"><ShieldCheck size={10}/> Resolvido</span>}</div></div>) })}</div></div>)}</div></div></div>)}
      {/* OUTROS MODAIS */}
      {isReportModalOpen && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col h-[80vh]"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-indigo-800 flex items-center gap-3"><FileBarChart2 className="text-indigo-600" /> Relatórios Gerenciais</h3><button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={28} /></button></div><div className="flex-1 overflow-y-auto space-y-6 pr-2"><div className="grid grid-cols-3 gap-4"><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('WITH_LOGS'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-xs font-bold text-slate-400 uppercase">Total Atendimentos</p><p className="text-4xl font-black text-indigo-900">{stats.allLogs.length}</p></div><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors"><FileText size={24}/></div></div><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('RESOLVED'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-xs font-bold text-slate-400 uppercase">Casos Resolvidos</p><p className="text-4xl font-black text-emerald-600">{stats.allLogs.filter(l => l.resolved).length}</p></div><div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors"><CheckSquare size={24}/></div></div><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('RECURRENT'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"><div><p className="text-xs font-bold text-slate-400 uppercase">Alunos Recorrentes</p><p className="text-4xl font-black text-amber-600">{students.filter(s => (s.logs?.length || 0) >= 3).length}</p></div><div className="bg-amber-50 p-3 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors"><AlertTriangle size={24}/></div></div></div><div className="grid grid-cols-2 gap-6"><div className="border rounded-xl p-4 bg-white shadow-sm"><h4 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Top 5 Motivos</h4>{stats.pieData.map((d, i) => (<div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm"><span className="font-medium text-slate-700">{d.name}</span><span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{d.value}</span></div>))}</div><div className="border rounded-xl p-4 bg-white shadow-sm"><h4 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Alunos com +3 Atendimentos</h4><div className="max-h-48 overflow-y-auto scrollbar-thin">{students.map(s => ({ ...s, count: s.logs?.length || 0 })).filter(s => s.count >= 3).sort((a, b) => b.count - a.count).map(s => (<div key={s.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm"><div><p className="font-bold text-slate-700">{s.name}</p><p className="text-[10px] text-slate-400">{s.class_id}</p></div><span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{s.count}</span></div>))}</div></div></div></div><div className="pt-6 border-t mt-4 flex justify-end"><button onClick={handleExportReport} className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg transition-transform hover:scale-105"><FileSpreadsheet /> Baixar Relatório Completo</button></div></div></div>)}
      {isExitModalOpen && (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"><h3 className="text-xl font-bold mb-4 text-red-600">Registrar Saída de Aluno</h3><div className="space-y-4"><div className="flex gap-4 bg-slate-100 p-2 rounded-lg"><label className="flex items-center gap-2 font-bold text-sm cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'TRANSFERIDO'} onChange={() => setExitType('TRANSFERIDO')} /> TRANSFERÊNCIA</label><label className="flex items-center gap-2 font-bold text-sm text-red-600 cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'ABANDONO'} onChange={() => setExitType('ABANDONO')} /> ABANDONO</label></div><textarea className="w-full p-3 border rounded-xl h-24" placeholder="Motivo detalhado da saída..." value={exitReason} onChange={e => setExitReason(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">CANCELAR</button><button onClick={handleRegisterExit} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg">CONFIRMAR SAÍDA</button></div></div></div></div>)}
      {isImportModalOpen && (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"><h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><FileSpreadsheet size={24} /> Importar Excel</h3><div className="space-y-4"><div><label className="block text-sm font-bold text-slate-700 mb-1">Bimestre de Referência</label><select title="bim" className="w-full p-3 border rounded-xl" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select></div><div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50">{importing ? <p className="animate-pulse font-bold text-indigo-600">Sincronizando...</p> : <input title="file" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="w-full text-sm" />}</div><div className="flex justify-end"><button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Fechar</button></div></div></div></div>)}
      {isNewStudentModalOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"><h3 className="font-bold text-xl mb-6 text-indigo-900">Cadastrar Novo Aluno</h3><form onSubmit={handleAddStudent} className="space-y-4"><div><label className="text-xs font-bold uppercase text-slate-400">Nome Completo</label><input title="nome" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div><div><label className="text-xs font-bold uppercase text-slate-400">Turma</label><input title="turma" value={newClass} onChange={e => setNewClass(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div><div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Salvar</button></div></form></div></div>)}
      
      {/* BOTÃO FLUTUANTE ZAP (CORRIGIDO V10.1) */}
      {isQuickModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3>Registro Rápido</h3><input className="w-full border p-2" value={quickSearchTerm} onChange={e => setQuickSearchTerm(e.target.value)} placeholder="Aluno..."/><div className="max-h-40 overflow-y-auto">{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0,5).map(s => <div key={s.id} onClick={() => {setQuickSelectedStudent(s); setQuickSearchTerm(s.name);}} className="p-2 border-b cursor-pointer">{s.name}</div>)}</div><button onClick={handleQuickSave} className="bg-green-600 text-white w-full py-3 mt-4">Confirmar</button></div></div>}
      <button onClick={() => setIsQuickModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-all border-4 border-white"><Zap size={32} /></button>
    </div>
  );
}
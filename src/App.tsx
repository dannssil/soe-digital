import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { 
  LayoutDashboard, Users, BookOpen, LogOut, Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock, 
  FileText, CheckSquare, Phone, UserCircle, FileDown, CalendarDays, Zap, Menu, Search as SearchIcon, 
  Users2, MoreHorizontal, Folder, BarChart3 as BarChartIcon, FileSpreadsheet, MapPin, Clock, ShieldCheck, 
  ChevronRight, Copy, History, GraduationCap, Printer, FileBarChart2, Database, Settings, Trash2, 
  Maximize2, MonitorPlay, Eye, EyeOff, Filter, Calendar, ClipboardList, ArrowLeft, Home, ChevronLeft, 
  Star, Activity, Heart, Brain, PenTool, Copyright, Code, PieChart as PieChartIcon, FileOutput, ThumbsUp, 
  Puzzle, Scale, Cake, Siren, Bell, ListChecks, FileInput, Book, FileSignature 
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

// --- TEMPLATES ---
const TEXTO_CONVOCACAO = "O Centro Educacional 4 do Guará convoca-a para comparecer com urgência à escola no dia [DATA] às [HORA] para tratar de assuntos relacionados ao seu filho(a) [NOME_ALUNO], da turma [TURMA]. Será uma oportunidade valiosa para discutirmos questões de extrema importância para o desenvolvimento do estudante.\n\nDe acordo com a Lei da Educação Nacional (Lei nº 9.394/96), é obrigação dos pais participarem ativamente da vida escolar de seus filhos. Como parte desse compromisso, reforçamos esta convocação.\n\nSua presença é vital para garantir o sucesso e o bem-estar do estudante na escola.\nNão deixem de comparecer!";
const TEXTO_DECLARACAO = "Declaramos para os devidos fins que o(a) Senhor(a) [NOME_RESPONSAVEL], responsável pelo(a) estudante [NOME_ALUNO], da turma [TURMA], esteve nesta Unidade de Ensino no dia [DATA_HOJE], no período de ______ às ______, para tratar de assuntos relacionados ao desempenho e acompanhamento escolar do(a) referido(a) aluno(a).";

const DEFAULT_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const DEFAULT_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const DEFAULT_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const DEFAULT_ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];

function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  const safeName = name || "Aluno"; const initials = safeName.substring(0, 2).toUpperCase();
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
            <tr><th className="px-6 py-4">Estudante</th>{filterType === 'NEE' && <th className="px-6 py-4">Necessidade</th>}{filterType === 'NEE' && <th className="px-6 py-4">Idade</th>}{filterType === 'CT' && <th className="px-6 py-4">Conselho</th>}{filterType === 'CT' && <th className="px-6 py-4">Motivo</th>}{filterType !== 'NEE' && filterType !== 'CT' && <th className="px-6 py-4">Turma</th>}{filterType !== 'NEE' && filterType !== 'CT' && <th className="px-6 py-4">Status / Info</th>}<th className="px-6 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s: any) => (
              <tr key={s.id} onClick={() => onSelectStudent(s)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4"><Avatar name={s.name} src={s.photo_url} size="md" /><div className="font-bold text-slate-700 text-base group-hover:text-indigo-700">{s.name}</div></td>
                {filterType === 'NEE' && (<><td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold text-xs">{s.nee_description || 'Não especificado'}</span></td><td className="px-6 py-4 text-slate-600 font-bold">{getAge(s.birth_date)}</td></>)}
                {filterType === 'CT' && (<><td className="px-6 py-4 text-orange-700 font-bold text-xs uppercase">{s.ct_council_name || 'Não inf.'}</td><td className="px-6 py-4 text-slate-600 text-xs">{s.ct_date ? new Date(s.ct_date).toLocaleDateString() : '-'}</td><td className="px-6 py-4 text-slate-500 text-xs italic truncate max-w-[200px]">{s.ct_referral}</td></>)}
                {filterType !== 'NEE' && filterType !== 'CT' && (<><td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td><td className="px-6 py-4"><div className="flex gap-2 flex-wrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>{s.nee_description && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700 flex items-center gap-1"><Puzzle size={10}/> NEE</span>}{s.ct_referral && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 flex items-center gap-1"><Scale size={10}/> CT</span>}</div></td></>)}
                <td className="px-6 py-4 text-right"><ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600"/></td>
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
  const [view, setView] = useState<'dashboard' | 'students' | 'conselho' | 'documentos'>('dashboard');
  const [dashboardFilterType, setDashboardFilterType] = useState<'ALL' | 'RISK' | 'NEE' | 'CT'>('ALL');
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
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isTermoModalOpen, setIsTermoModalOpen] = useState(false);
  
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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const toggleLogExpansion = (id: string) => { setExpandedLogId(expandedLogId === id ? null : id); };

  // DOCS
  const [docStudent, setDocStudent] = useState<any | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [docType, setDocType] = useState(''); 
  const [docContent, setDocContent] = useState('');
  const [termoChecks, setTermoChecks] = useState<string[]>([]);

  // ESTADOS
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
  
  const addListItem = (listName: string) => { if (!newItem) return; if (listName === 'comp') setListComportamento([...listComportamento, newItem]); if (listName === 'ped') setListPedagogico([...listPedagogico, newItem]); if (listName === 'soc') setListSocial([...listSocial, newItem]); if (listName === 'enc') setListEncaminhamentos([...listEncaminhamentos, newItem]); setNewItem(''); };
  const removeListItem = (listName: string, item: string) => { if (listName === 'comp') setListComportamento(listComportamento.filter(i => i !== item)); if (listName === 'ped') setListPedagogico(listPedagogico.filter(i => i !== item)); if (listName === 'soc') setListSocial(listSocial.filter(i => i !== item)); if (listName === 'enc') setListEncaminhamentos(listEncaminhamentos.filter(i => i !== item)); };
  const toggleItem = (list: string[], setList: any, item: string) => { if (list.includes(item)) setList(list.filter((i: string) => i !== item)); else setList([...list, item]); };
  
  const startEditing = () => { if (selectedStudent) { setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); setEditNee(selectedStudent.nee_description || ''); setEditCtReason(selectedStudent.ct_referral || ''); setEditCtCouncil(selectedStudent.ct_council_name || ''); setEditCtDate(selectedStudent.ct_date || ''); setIsEditing(true); } };
  const saveEdits = async () => { if (!selectedStudent) return; const updates = { name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress, nee_description: editNee, ct_referral: editCtReason, ct_council_name: editCtCouncil, ct_date: editCtDate || null }; const { error } = await supabase.from('students').update(updates).eq('id', selectedStudent.id); if (!error) { alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); } else alert(error.message); };
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); } };
  const handleSaveLog = async () => { if (!selectedStudent) return; const currentCategory = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); const { error } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: currentCategory, description: desc, referral: encaminhamento, resolved: resolvido, created_at: new Date(attendanceDate).toISOString(), return_date: returnDate || null }]); if (!error) { alert('Salvo!'); setMotivosSelecionados([]); setObsLivre(""); setResolvido(false); fetchStudents(); } else alert(error.message); };
  const handleQuickSave = async () => { if (!quickSelectedStudent || !quickReason) return alert('Selecione aluno e motivo.'); const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: `[Registro Rápido] ${quickReason}` }); const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]); if (!error) { alert(`Registro de "${quickReason}" salvo!`); setQuickSelectedStudent(null); setQuickSearchTerm(''); setQuickReason(''); setIsQuickModalOpen(false); fetchStudents(); } };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if (!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleRegisterExit = async () => { if (!selectedStudent) return; const logDesc = JSON.stringify({ solicitante: 'Secretaria/SOE', motivos: [exitType], obs: `SAÍDA REGISTRADA. Motivo detalhado: ${exitReason}` }); const { error: logError } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: 'Situação Escolar', description: logDesc, resolved: true, created_at: new Date().toISOString() }]); if (logError) return alert('Erro ao salvar histórico: ' + logError.message); const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id); if (!error) { alert('Saída registrada!'); setExitReason(''); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleSaveRadar = async () => { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; const { error } = await supabase.from('class_radar').upsert({ turma: targetClass, bimestre: selectedBimestre, ...radarData }, { onConflict: 'turma, bimestre' }); if (!error) { alert('Avaliação da Turma Salva!'); setIsEvalModalOpen(false); } else { alert('Erro: ' + error.message); } };
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) { if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return; const file = event.target.files[0]; const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) { alert('Erro upload: ' + error.message); return; } const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id); setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents(); }
  const toggleHighlight = async (studentId: string, currentVal: boolean, e: React.MouseEvent) => { e.stopPropagation(); const updatedStudents = students.map(s => s.id === studentId ? { ...s, is_highlight: !currentVal } : s); setStudents(updatedStudents); await supabase.from('students').update({ is_highlight: !currentVal }).eq('id', studentId); };
  const togglePraise = async (studentId: string, currentVal: boolean, e: React.MouseEvent) => { e.stopPropagation(); const updatedStudents = students.map(s => s.id === studentId ? { ...s, is_praised: !currentVal } : s); setStudents(updatedStudents); await supabase.from('students').update({ is_praised: !currentVal }).eq('id', studentId); };
  const checkRisk = (student: any) => { const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0; const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null; let notasVermelhas = 0; if (ultDesempenho) { const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; } return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3, totalFaltas, notasVermelhas }; };
  const stats = useMemo(() => { const allLogs = students.flatMap(s => s.logs || []); const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); const count = allLogs.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length; return { name: dateStr, total: count }; }).reverse(); const motivoCount: any = {}; allLogs.forEach(l => { try { const desc = JSON.parse(l.description); if (desc.motivos) desc.motivos.forEach((m: string) => { motivoCount[m] = (motivoCount[m] || 0) + 1; }); } catch (e) { } }); const pieData = Object.keys(motivoCount).map(key => ({ name: key, value: motivoCount[key] })).sort((a, b) => b.value - a.value).slice(0, 5); return { last7Days, pieData, allLogs }; }, [students]);
  
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) { if (!e.target.files || e.target.files.length === 0) return; setImporting(true); const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (evt) => { try { const bstr = evt.target?.result; const workbook = XLSX.read(bstr, { type: 'binary' }); const ws = workbook.Sheets[workbook.SheetNames[0]]; const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]; let headerRowIndex = 0; for (let i = 0; i < rawData.length; i++) { const rowStr = rawData[i].join(' ').toUpperCase(); if (rowStr.includes('ESTUDANTE') || rowStr.includes('NOME')) { headerRowIndex = i; break; } } const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }); const normalizeKey = (key: string) => key.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); let updatedCount = 0; for (const row of (data as any[])) { const rowMap: any = {}; Object.keys(row).forEach(k => rowMap[normalizeKey(k)] = row[k]); const nomeExcel = (rowMap['ESTUDANTE'] || rowMap['NOME'] || rowMap['NOME DO ESTUDANTE'])?.toString().toUpperCase().trim(); if (!nomeExcel) continue; const aluno = students.find(s => s.name.toUpperCase().trim() === nomeExcel); if (aluno) { const updates: any = {}; const rawDate = rowMap['DATA DE NASCIMENTO'] || rowMap['NASCIMENTO'] || rowMap['DN']; if (rawDate) { if (typeof rawDate === 'number') { const jsDate = new Date(Math.round((rawDate - 25569)*86400*1000)); jsDate.setMinutes(jsDate.getMinutes() + jsDate.getTimezoneOffset()); updates.birth_date = jsDate.toISOString(); } else if (typeof rawDate === 'string') { const parts = rawDate.trim().split('/'); if(parts.length === 3) updates.birth_date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString(); } } if (rowMap['NEE'] || rowMap['DEFICIENCIA']) updates.nee_description = rowMap['NEE'] || rowMap['DEFICIENCIA']; if (rowMap['CONSELHO TUTELAR'] || rowMap['CT']) { updates.ct_council_name = rowMap['CONSELHO TUTELAR'] || rowMap['CT']; updates.ct_referral = rowMap['MOTIVO DO ENCAMINHAMENTO'] || rowMap['MOTIVO']; } if (Object.keys(updates).length > 0) { await supabase.from('students').update(updates).eq('id', aluno.id); updatedCount++; } if(rowMap['LP'] || rowMap['MAT']) { const parseNota = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: parseNota(rowMap['ART']), cie: parseNota(rowMap['CIE']), edf: parseNota(rowMap['EDF']), geo: parseNota(rowMap['GEO']), his: parseNota(rowMap['HIS']), ing: parseNota(rowMap['ING']), lp: parseNota(rowMap['LP'] || rowMap['L. PORTUGUESA']), mat: parseNota(rowMap['MAT'] || rowMap['MATEMATICA']), pd1: parseNota(rowMap['PD1']), pd2: parseNota(rowMap['PD2']), pd3: parseNota(rowMap['PD3']), faltas_bimestre: rowMap['FALTAS'] ? parseInt(rowMap['FALTAS']) : 0 }]); } } } alert(`Sucesso! ${updatedCount} alunos atualizados.`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); } catch (err) { alert('Erro: ' + err); setImporting(false); } }; reader.readAsBinaryString(file); }
  const handleUpdateGrade = (field: string, value: string) => { if(!projectedStudent) return; const newStudent = { ...projectedStudent }; const bimIndex = newStudent.desempenho.findIndex((d:any) => d.bimestre === selectedBimestre); if (bimIndex >= 0) { const numValue = value === '' ? null : parseFloat(value.replace(',', '.')); newStudent.desempenho[bimIndex][field] = numValue; setProjectedStudent(newStudent); } };
  const handleSaveCouncilChanges = async () => { if(!projectedStudent) return; const d = projectedStudent.desempenho.find((x:any) => x.bimestre === selectedBimestre); if(!d) return; await supabase.from('desempenho_bimestral').update({ lp: d.lp, mat: d.mat, cie: d.cie, his: d.his, geo: d.geo, ing: d.ing, art: d.art, edf: d.edf, pd1: d.pd1, pd2: d.pd2, pd3: d.pd3, faltas_bimestre: d.faltas_bimestre, obs_conselho: councilObs, encaminhamento_conselho: councilEnc }).eq('id', d.id); alert('Salvo!'); fetchStudents(); };
  
  // --- HEADER OFICIAL COM ASSINATURA ---
  const addHeader = (doc: jsPDF) => {
      doc.setFont("times", "bold"); doc.setFontSize(12);
      doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, {align: "center"});
      doc.text("CENTRO EDUCACIONAL 4 DO GUARÁ", 105, 21, {align: "center"});
      doc.text("SERVIÇO DE ORIENTAÇÃO EDUCACIONAL", 105, 27, {align: "center"});
      doc.setLineWidth(0.5); doc.line(14, 32, 196, 32);
  };
  const addSignature = (doc: jsPDF) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.setLineWidth(0.5); doc.line(70, pageHeight - 35, 140, pageHeight - 35);
      doc.setFontSize(11); doc.setFont("times", "bold"); doc.text(SYSTEM_USER_NAME, 105, pageHeight - 30, {align: "center"});
      doc.setFontSize(10); doc.setFont("times", "normal"); doc.text(SYSTEM_ROLE, 105, pageHeight - 25, {align: "center"});
      doc.text(SYSTEM_MATRICULA, 105, pageHeight - 20, {align: "center"});
  };

  const generateSuperAta = (targetClass: string) => {
    const councilStudents = students.filter(s => s.class_id === targetClass); if(councilStudents.length === 0) return alert('Turma vazia'); const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(`ATA DE CONSELHO DE CLASSE - ${targetClass}`, 148, 20, {align: "center"}); 
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("GOVERNO DO DISTRITO FEDERAL | CED 4 DO GUARÁ | SOE", 148, 10, {align: "center"}); // Mini header for landscape
    doc.text(`${selectedBimestre} | Data: ${new Date(dataConselho).toLocaleDateString('pt-BR')}`, 148, 26, {align: "center"});

    autoTable(doc, { startY: 32, head: [['Indicador', 'Assiduidade', 'Participação', 'Relacionamento', 'Rendimento', 'Tarefas']], body: [[ 'Avaliação da Turma (0-5)', radarData.assiduidade, radarData.participacao, radarData.relacionamento, radarData.rendimento, radarData.tarefas ]], theme: 'grid', styles: { fontSize: 8, halign: 'center' }, headStyles: { fillColor: [55, 65, 81] } });
    const rows = councilStudents.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre) || {}; return [s.name, d.lp||'-', d.mat||'-', d.cie||'-', d.his||'-', d.geo||'-', d.ing||'-', d.art||'-', d.edf||'-', d.pd1||'-', d.pd2||'-', d.pd3||'-', d.faltas_bimestre||0, s.logs?.length||0]; });
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, head: [['Estudante', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'PD2', 'PD3', 'Faltas', 'Ocorr.']], body: rows, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [30, 41, 59] } });
    doc.addPage(); doc.setFontSize(14); doc.setTextColor(0); doc.text("REGISTROS ESPECÍFICOS E ENCAMINHAMENTOS", 14, 20); let currentY = 30;
    const createSection = (title: string, data: any[], headerColor: [number, number, number], headers: string[][]) => { if (data.length > 0) { doc.setFillColor(headerColor[0] + 180 > 255 ? 245 : headerColor[0] + 180, headerColor[1] + 180, headerColor[2] + 180); doc.rect(14, currentY, 269, 8, 'F'); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...headerColor); doc.text(title, 16, currentY + 5.5); autoTable(doc, { startY: currentY + 10, head: headers, body: data, theme: 'grid', styles: { fontSize: 8, textColor: [50, 50, 50] }, headStyles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } }); currentY = (doc as any).lastAutoTable.finalY + 15; if (currentY > 180) { doc.addPage(); currentY = 20; } } };
    const destaques = councilStudents.filter(s => s.is_highlight); createSection("⭐ DESTAQUES ACADÊMICOS", destaques.map(s => [s.name, 'Honra ao Mérito']), [202, 138, 4], [['Nome', 'Ação']]);
    const elogios = councilStudents.filter(s => s.is_praised); createSection("👏 ELOGIOS E INCENTIVOS", elogios.map(s => [s.name, 'Elogio Verbal']), [21, 128, 61], [['Nome', 'Ação']]);
    const baixoRendimento = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); if (!d) return false; return [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf].filter(n => n !== null && n < 5).length > 3; }); createSection("📉 BAIXO RENDIMENTO", baixoRendimento.map(s => [s.name, 'Convocação']), [180, 83, 9], [['Nome', 'Ação']]);
    const faltosos = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && d.faltas_bimestre > 20; }); createSection("🚨 BUSCA ATIVA (Faltas > 20)", faltosos.map(s => [s.name, s.desempenho?.find((x:any) => x.bimestre === selectedBimestre)?.faltas_bimestre]), [185, 28, 28], [['Nome', 'Faltas']]);
    const deliberacoes = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && (d.obs_conselho || d.encaminhamento_conselho); }); createSection("📝 OBSERVAÇÕES FINAIS", deliberacoes.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return [s.name, d.obs_conselho || '', d.encaminhamento_conselho || '']; }), [75, 85, 99], [['Estudante', 'Obs', 'Encaminhamento']]);
    
    // Assinatura na última página
    if (currentY > 150) doc.addPage();
    addSignature(doc);
    doc.save(`ATA_COMPLETA_${targetClass}.pdf`);
  };
  const printCTList = () => { const ctStudents = students.filter(s => s.ct_referral); if(ctStudents.length === 0) return alert('Nenhum estudante no Conselho Tutelar.'); const doc = new jsPDF(); addHeader(doc); const rows = ctStudents.map(s => [s.name, s.class_id, s.ct_council_name || '-', s.ct_date ? new Date(s.ct_date).toLocaleDateString() : '-', s.ct_referral]); autoTable(doc, { startY: 40, head: [['Nome', 'Turma', 'Conselho', 'Data', 'Motivo']], body: rows }); addSignature(doc); doc.save("LISTA_CONSELHO_TUTELAR.pdf"); };
  const printStudentData = (doc: jsPDF, student: any) => { 
      addHeader(doc); doc.setFontSize(11); doc.text(`FICHA INDIVIDUAL DO ESTUDANTE`, 14, 40);
      autoTable(doc, { startY: 45, head: [['Informação', 'Detalhe']], body: [['Nome Completo', student.name], ['Turma', student.class_id], ['Data de Nascimento', student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '-'], ['Responsável', student.guardian_name || 'Não informado'], ['Telefone', student.guardian_phone || '-'], ['Endereço', student.address || '-']], theme: 'grid', headStyles: { fillColor: [55, 65, 81] }, columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } } });
      let currentY = (doc as any).lastAutoTable.finalY + 10; doc.setFontSize(11); doc.setTextColor(0); doc.text("DESEMPENHO ACADÊMICO", 14, currentY);
      const acadData = student.desempenho?.map((d: any) => [d.bimestre, d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf, d.pd1, d.pd2, d.pd3, d.faltas_bimestre]) || []; 
      autoTable(doc, { startY: currentY + 5, head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'PD2', 'PD3', 'Faltas']], body: acadData, theme: 'grid', headStyles: { fillColor: [55, 65, 81] } });
      currentY = (doc as any).lastAutoTable.finalY + 10; doc.text("HISTÓRICO DE ATENDIMENTOS", 14, currentY);
      const logsData = student.logs?.filter((l: any) => l.student_id === student.id).map((l: any) => { let desc = { obs: '' }; try { desc = JSON.parse(l.description); } catch(e) {} return [new Date(l.created_at).toLocaleDateString(), l.category, desc.obs]; }) || []; 
      autoTable(doc, { startY: currentY + 5, head: [['Data', 'Tipo', 'Detalhes']], body: logsData, theme: 'grid', headStyles: { fillColor: [55, 65, 81] } }); 
      addSignature(doc);
  };
  const generatePDF = () => { if (!selectedStudent) return; const doc = new jsPDF(); printStudentData(doc, selectedStudent); doc.save(`Ficha_${selectedStudent.name}.pdf`); };
  const handleExportReport = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Dados"); XLSX.writeFile(wb, `Relatorio_Geral.xlsx`); };
  const handleBackup = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Backup"); XLSX.writeFile(wb, `BACKUP_SOE.xlsx`); };
  
  // --- MÓDULO DE DOCUMENTOS (SEPARADO) ---
  const generateOfficialDoc = (type: string, content: string = "") => {
      if(!docStudent) return;
      const doc = new jsPDF();
      addHeader(doc);
      let title = ""; if (type === 'CONVOCACAO') title = "CONVOCAÇÃO"; if (type === 'DECLARACAO') title = "DECLARAÇÃO DE COMPARECIMENTO"; if (type === 'ATA') title = "ATA DE REUNIÃO / ATENDIMENTO"; if (type === 'CT') title = "RELATÓRIO AO CONSELHO TUTELAR"; if (type === 'SAUDE') title = "RELATÓRIO ESCOLAR (SAÚDE)"; if (type === 'TERMO') title = "TERMO DE COMPROMISSO";
      doc.setFontSize(14); doc.setFont("times", "bold"); doc.text(title, 105, 55, {align: "center"});
      autoTable(doc, { startY: 65, head: [['Estudante', 'Turma', 'Responsável']], body: [[docStudent.name, docStudent.class_id, docStudent.guardian_name || '']], theme: 'grid', styles: { font: 'times', fontSize: 10, cellPadding: 2, lineColor: [0,0,0], lineWidth: 0.1 }, headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' } });
      let finalY = (doc as any).lastAutoTable.finalY + 15; doc.setFontSize(12); doc.setFont("times", "normal"); const textLines = doc.splitTextToSize(content, 170); doc.text(textLines, 20, finalY);
      addSignature(doc);
      doc.save(`${title}_${docStudent.name}.pdf`); setIsEditorModalOpen(false); setIsTermoModalOpen(false);
  };
  const prepareDoc = (type: string) => { if(!docStudent) return; let t = ""; if (type === 'CONVOCACAO') { t = TEXTO_CONVOCACAO.replace('[DATA]', '_____/_____/_____').replace('[HORA]', '____:____').replace('[NOME_ALUNO]', docStudent.name).replace('[TURMA]', docStudent.class_id); } if (type === 'DECLARACAO') { t = TEXTO_DECLARACAO.replace('[NOME_RESPONSAVEL]', docStudent.guardian_name || "__________________________").replace('[NOME_ALUNO]', docStudent.name).replace('[TURMA]', docStudent.class_id).replace('[DATA_HOJE]', new Date().toLocaleDateString()); } if (type === 'ATA') t = "Descreva aqui o teor da reunião..."; setDocContent(t); setDocType(type); setIsEditorModalOpen(true); };
  const prepareTermo = () => { setTermoChecks([]); setIsTermoModalOpen(true); };
  const generateTermoPDF = () => { const listaProblemas = [ "Desatenção", "Desrespeita professores", "Desrespeita colegas", "Brincadeiras Inoportunas", "Bullying", "Agressão física", "Não realiza atividades", "Não traz material", "Chega atrasado", "Uso de celular", "Danifica patrimônio" ]; let content = "Eu, " + docStudent.name + ", da turma " + docStudent.class_id + ", estou ciente que apresento os seguintes comportamentos:\n\n"; listaProblemas.forEach(prob => { const marked = termoChecks.includes(prob) ? "[ X ]" : "[   ]"; content += `${marked} ${prob}\n`; }); content += "\nDeclaro que fui orientado(a) e comprometo-me a melhorar os comportamentos acima mencionados. Caso contrário receberei as medidas disciplinares necessárias."; generateOfficialDoc('TERMO', content); };
  const changeStudent = (direction: 'prev' | 'next') => { const turmas = [...new Set(students.map(s => s.class_id))].sort(); const currentClass = conselhoTurma || turmas[0]; const currentList = students.filter(s => s.class_id === currentClass).sort((a,b) => a.name.localeCompare(b.name)); if (!projectedStudent || currentList.length === 0) return; const currentIndex = currentList.findIndex(s => s.id === projectedStudent.id); if (direction === 'next') { if (currentIndex < currentList.length - 1) setProjectedStudent(currentList[currentIndex + 1]); else setProjectedStudent(currentList[0]); } else { if (currentIndex > 0) setProjectedStudent(currentList[currentIndex - 1]); else setProjectedStudent(currentList[currentList.length - 1]); } };

  // --- RENDERIZADORES ---
  const renderDashboard = () => {
    let sR = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    const nees = students.filter(s => s.nee_description).length;
    const cts = students.filter(s => s.ct_referral).length;
    return (
      <div className="space-y-6 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div onClick={() => { setDashboardFilterType('ALL'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total</p><p className="text-2xl font-black text-indigo-900">{students.length}</p></div><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors"><Users2 size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('RISK'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Alerta</p><p className="text-2xl font-black text-red-600">{sR.length}</p></div><div className="bg-red-50 p-3 rounded-lg text-red-600"><AlertTriangle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('NEE'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">NEE</p><p className="text-2xl font-black text-purple-600">{nees}</p></div><div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Puzzle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('CT'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">CT</p><p className="text-2xl font-black text-orange-600">{cts}</p></div><div className="bg-orange-50 p-3 rounded-lg text-orange-600"><Scale size={20}/></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Volume Atendimentos</h4><div className="flex-1 min-h-0"><ResponsiveContainer><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="total" stroke="#6366f1"/></LineChart></ResponsiveContainer></div></div>
                    {/* PIE CHART SEM LEGENDA E MAIOR */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Temas de Orientação</h4><div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.pieData} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>{stats.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip contentStyle={{fontSize: '12px'}}/></PieChart></ResponsiveContainer></div></div>
                </div>
            </div>
            <div className="lg:col-span-4 bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-red-50 p-4 font-bold text-red-800 text-xs uppercase">Alunos Críticos</div>
                <div className="flex-1 overflow-y-auto p-2">{sR.map(s => (<div key={s.id} onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="p-3 hover:bg-red-50 cursor-pointer flex justify-between"><span>{s.name}</span><ChevronRight size={14}/></div>))}</div>
            </div>
        </div>
      </div>
    );
  };

  const renderConselho = () => {
    const turmas = [...new Set(students.map(s => s.class_id))].sort(); 
    const targetClass = conselhoTurma || turmas[0]; 
    let cS = students.filter(s => s.class_id === targetClass);
    let barData = [ { name: 'Assiduidade', valor: radarData.assiduidade }, { name: 'Participação', valor: radarData.participacao }, { name: 'Relacionamento', valor: radarData.relacionamento }, { name: 'Rendimento', valor: radarData.rendimento }, { name: 'Tarefas', valor: radarData.tarefas } ];
    const renderNota = (val: any) => (val === undefined || val === null) ? <span className="text-slate-300">-</span> : <span className={`font-bold ${val < 5 ? 'text-red-600' : 'text-blue-600'}`}>{val}</span>;

    if (!targetClass) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;
    return (
        <div className="max-w-[1800px] mx-auto pb-4 w-full h-full flex flex-col overflow-hidden">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Conselho de Classe</h2>
                <div className="flex gap-2">
                    <select className="border p-1" value={targetClass} onChange={e => setConselhoTurma(e.target.value)}>{turmas.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <button onClick={() => generateSuperAta(targetClass)} className="bg-indigo-600 text-white px-4 py-2 rounded">Gerar Ata</button>
                </div>
            </div>
            <div className="px-6 py-4"><div className="bg-white p-4 border rounded-xl h-64"><div className="flex justify-between mb-2"><h4 className="font-bold text-slate-700">Radar da Turma</h4></div><ResponsiveContainer width="100%" height="85%"><BarChart data={barData} layout="vertical" margin={{left:40}}><XAxis type="number" domain={[0,5]} hide/><YAxis dataKey="name" type="category" width={100} style={{fontSize:10}}/><Tooltip/><Bar dataKey="valor" fill="#f97316" radius={[0,4,4,0]} barSize={20}/></BarChart></ResponsiveContainer></div></div>
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0"><tr><th className="p-3">Ações</th><th className="p-3">Nome</th><th className="p-3 text-center">LP</th><th className="p-3 text-center">MAT</th><th className="p-3 text-center">CIE</th><th className="p-3 text-center">HIS</th><th className="p-3 text-center">GEO</th><th className="p-3 text-center">ING</th><th className="p-3 text-center">ART</th><th className="p-3 text-center">EDF</th><th className="p-3 text-center">Faltas</th></tr></thead>
                    <tbody>{cS.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre) || {}; return (<tr key={s.id} onClick={() => setProjectedStudent(s)} className="border-b hover:bg-slate-50 cursor-pointer"><td className="p-3 flex gap-2"><button onClick={(e) => toggleHighlight(s.id, s.is_highlight, e)}><Star size={14} className={s.is_highlight ? 'fill-orange-400 text-orange-400' : 'text-slate-300'}/></button></td><td className="p-3 font-bold">{s.name}</td><td className="p-3 text-center">{renderNota(d.lp)}</td><td className="p-3 text-center">{renderNota(d.mat)}</td><td className="p-3 text-center">{renderNota(d.cie)}</td><td className="p-3 text-center">{renderNota(d.his)}</td><td className="p-3 text-center">{renderNota(d.geo)}</td><td className="p-3 text-center">{renderNota(d.ing)}</td><td className="p-3 text-center">{renderNota(d.art)}</td><td className="p-3 text-center">{renderNota(d.edf)}</td><td className="p-3 text-center">{d.faltas_bimestre||0}</td></tr>); })}</tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderDocs = () => {
      const filteredForDocs = students.filter(s => docSearch && s.name.toLowerCase().includes(docSearch.toLowerCase())).slice(0, 5);
      return (
          <div className="max-w-4xl mx-auto pb-20 p-6 space-y-8 animate-in fade-in">
              <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-3"><Printer className="text-indigo-600"/> Central de Documentos</h2>
                  <p className="text-slate-500">Emissão de documentos oficiais com formatação automática.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100">
                  <label className="block text-sm font-bold text-slate-700 mb-2">1. Selecione o Estudante</label>
                  <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input className="w-full pl-12 pr-4 py-4 border rounded-xl bg-slate-50 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Digite o nome..." value={docSearch} onChange={e => { setDocSearch(e.target.value); setDocStudent(null); }} />
                  </div>
                  {docSearch && !docStudent && (
                      <div className="mt-2 space-y-1 border rounded-xl overflow-hidden shadow-sm">
                          {filteredForDocs.map(s => (
                              <div key={s.id} onClick={() => { setDocStudent(s); setDocSearch(s.name); }} className="p-3 bg-white hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b last:border-0">
                                  <span className="font-bold text-slate-700">{s.name}</span>
                                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{s.class_id}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
              
              {docStudent && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-4 mb-6 border-b pb-4">
                          <Avatar name={docStudent.name} src={docStudent.photo_url} size="lg"/>
                          <div><h3 className="text-xl font-bold">{docStudent.name}</h3><p className="text-slate-500">Turma {docStudent.class_id}</p></div>
                      </div>
                      <label className="block text-sm font-bold text-slate-700 mb-4">2. Escolha o Documento</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <button onClick={() => prepareDoc('CONVOCACAO')} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><Bell className="text-red-500"/> Convocação</button>
                          <button onClick={() => prepareDoc('DECLARACAO')} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><FileText className="text-blue-500"/> Declaração</button>
                          <button onClick={() => prepareDoc('ATA')} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><Book className="text-green-500"/> Ata de Reunião</button>
                          <button onClick={prepareTermo} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><CheckSquare className="text-amber-500"/> Termo Compromisso</button>
                          <button onClick={() => { setDocType('CT'); setDocContent(""); setIsEditorModalOpen(true); }} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><Scale className="text-orange-500"/> Relatório CT</button>
                          <button onClick={() => { setDocType('SAUDE'); setDocContent(""); setIsEditorModalOpen(true); }} className="p-4 border rounded-xl hover:bg-indigo-50 font-bold text-sm text-left flex items-center gap-3"><Heart className="text-pink-500"/> Relatório Saúde</button>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1E1E2D] text-white flex flex-col shadow-2xl transition-transform md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10"><BookOpen/> <h1 className="font-bold">SOE Digital</h1></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-indigo-600' : ''}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'students' ? 'bg-indigo-600' : ''}`}><Users size={18} /> Alunos</button>
          <button onClick={() => setView('conselho')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'conselho' ? 'bg-indigo-600' : ''}`}><GraduationCap size={18} /> Conselho</button>
          <div className="pt-4 mt-4 border-t border-white/10">
              <button onClick={() => setView('documentos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'documentos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Printer size={18} /> Documentos Oficiais</button>
              <button onClick={() => { setIsReportModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><FileBarChart2 size={18} /> <span className="font-medium text-sm">Relatórios</span></button>
              <button onClick={handleBackup} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><Database size={18} /> <span className="font-medium text-sm">Backup</span></button>
              <button onClick={() => { setIsSettingsModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={18} /> <span className="font-medium text-sm">Configurações</span></button>
          </div>
        </nav>
        <div className="p-4 border-t border-white/5 flex items-center gap-3"><Avatar name={SYSTEM_USER_NAME} size="sm"/><p className="text-[10px] font-bold">{SYSTEM_USER_NAME}</p></div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden"><Menu/></button><div className="flex-1 max-w-md relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}/></div><Zap onClick={() => setIsQuickModalOpen(true)} className="text-amber-500 cursor-pointer"/></header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {view === 'dashboard' && renderDashboard()}
            {view === 'students' && (<div className="max-w-[1600px] mx-auto space-y-6"><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold">+ Novo Aluno</button><StudentList students={students.filter(s => s.name.toLowerCase().includes(globalSearch.toLowerCase()) && (dashboardFilterType === 'ALL' || (dashboardFilterType === 'NEE' && s.nee_description) || (dashboardFilterType === 'CT' && s.ct_referral)))} onSelectStudent={(s:any) => { setSelectedStudent(s); setIsModalOpen(true); }} filterType={dashboardFilterType} /></div>)}
            {view === 'conselho' && renderConselho()}
            {view === 'documentos' && renderDocs()}
        </div>
      </main>
      
      {/* MODAL PRINCIPAL ALUNO - AGORA COM NOTAS AZUIS NA PROJEÇÃO */}
      {projectedStudent && (<div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 lg:p-8 backdrop-blur-md"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300"><div className="bg-indigo-900 text-white p-6 flex justify-between items-center shadow-lg"><div className="flex items-center gap-4"><MonitorPlay size={32} className="text-indigo-400"/><div><h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider">{projectedStudent.name}</h2><p className="text-indigo-300 font-bold text-sm lg:text-lg">TURMA {projectedStudent.class_id} | {selectedBimestre}</p></div></div><div className="flex items-center gap-2 lg:gap-4"><button onClick={() => changeStudent('prev')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Anterior"><ChevronLeft size={24} color="white"/></button><button onClick={() => changeStudent('next')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Próximo"><ChevronRight size={24} color="white"/></button><div className="w-[1px] h-8 bg-white/20 mx-2"></div><button onClick={() => setIsSensitiveVisible(!isSensitiveVisible)} className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-[10px] lg:text-sm transition-colors ${isSensitiveVisible ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{isSensitiveVisible ? <EyeOff size={16}/> : <Eye size={16}/>} Sigilo</button><button onClick={handleSaveCouncilChanges} className="bg-green-500 hover:bg-green-600 text-white px-4 lg:px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg text-sm lg:text-base"><Save size={18}/> SALVAR</button><button onClick={() => setProjectedStudent(null)} className="p-2 bg-white/10 rounded-full text-white"><X size={28}/></button></div></div><div className="flex-1 overflow-hidden flex flex-col lg:flex-row"><div className="lg:w-1/3 bg-slate-100 p-4 lg:p-8 flex flex-col items-center border-r border-slate-200 overflow-y-auto"><div className="mb-6"><Avatar name={projectedStudent.name} src={projectedStudent.photo_url} size="2xl"/></div><div className="w-full bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200"><h3 className="text-center font-bold text-slate-400 text-xs uppercase mb-4 tracking-widest flex items-center justify-center gap-2"><Pencil size={12}/> Notas</h3><div className="grid grid-cols-3 gap-2 lg:gap-3">{(() => { const notas = projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {}; const disciplinas = [{n:'LP', k:'lp', v: notas.lp}, {n:'MAT', k:'mat', v: notas.mat}, {n:'CIE', k:'cie', v: notas.cie}, {n:'HIS', k:'his', v: notas.his}, {n:'GEO', k:'geo', v: notas.geo}, {n:'ING', k:'ing', v: notas.ing}, {n:'ART', k:'art', v: notas.art}, {n:'EDF', k:'edf', v: notas.edf}, {n:'PD1', k:'pd1', v: notas.pd1}, {n:'PD2', k:'pd2', v: notas.pd2}, {n:'PD3', k:'pd3', v: notas.pd3}]; return disciplinas.map(d => (<div key={d.k} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors ${d.v < 5 && d.v !== null ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}><span className="text-lg font-black text-slate-700">{d.n}</span><input type="number" className={`w-full text-center bg-transparent font-black text-2xl outline-none ${d.v < 5 ? 'text-red-600' : 'text-blue-600 font-bold'}`} value={d.v ?? ''} onChange={(e) => handleUpdateGrade(d.k, e.target.value)} /></div>)); })()}</div><div className="mt-4 pt-4 border-t flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Faltas</span><input type="number" title="Faltas" className="w-16 text-right font-black text-xl lg:text-2xl text-slate-700 bg-slate-50 border rounded-lg p-1" value={(projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {}).faltas_bimestre || ''} onChange={(e) => handleUpdateGrade('faltas_bimestre', e.target.value)} /></div></div></div><div className="lg:w-2/3 p-4 lg:p-8 bg-white overflow-y-auto flex flex-col gap-8"><div className="flex-1"><h3 className="font-bold text-indigo-900 text-lg uppercase mb-4 flex items-center gap-2"><FileText size={20}/> Atendimentos SOE</h3><div className="space-y-3">{projectedStudent.logs && projectedStudent.logs.length > 0 ? projectedStudent.logs.map((log: any) => { let desc = { motivos: [], obs: '' }; try { desc = JSON.parse(log.description); } catch(e) {} return (<div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">{new Date(log.created_at).toLocaleDateString()}</span><span className="text-[10px] font-bold text-slate-400">{log.category}</span></div><div className="flex flex-wrap gap-1 mb-2">{desc.motivos?.map((m:string) => <span key={m} className="text-[9px] font-bold bg-white border px-2 py-0.5 rounded text-slate-600">{m}</span>)}</div><div className={`text-sm text-slate-600 italic ${isSensitiveVisible ? '' : 'blur-sm select-none'}`}>"{desc.obs}"</div></div>) }) : <p className="text-slate-400 text-center py-8">Nenhum atendimento registrado.</p>}</div></div><div className="bg-orange-50 p-6 rounded-2xl border border-orange-100"><h3 className="font-bold text-orange-800 text-lg uppercase mb-4 flex items-center gap-2"><ClipboardList size={20}/> Deliberação do Conselho</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Anotações</label><textarea title="Anotações" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Digite as observações..." value={councilObs} onChange={(e) => setCouncilObs(e.target.value)}></textarea></div><div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Encaminhamentos</label><textarea title="Encaminhamentos" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Encaminhar para..." value={councilEnc} onChange={(e) => setCouncilEnc(e.target.value)}></textarea></div></div></div></div></div></div></div>)}

      {/* MODAL ALUNO ORIGINAL V10.1 (SEM MODIFICAÇÕES) */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b flex justify-between bg-slate-50 flex-shrink-0">
                    <div className="flex items-center gap-6"><Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" /><div><h2 className="text-3xl font-bold">{selectedStudent.name}</h2><p>Turma {selectedStudent.class_id}</p></div></div>
                    <div className="flex gap-2"><button onClick={generatePDF} className="bg-purple-100 p-3 rounded-full"><FileDown/></button><button onClick={startEditing} className="bg-indigo-100 p-3 rounded-full"><Pencil/></button><X onClick={() => setIsModalOpen(false)} className="cursor-pointer"/></div>
                </div>
                <div className="flex border-b px-8 bg-white overflow-x-auto gap-8 flex-shrink-0">{['perfil', 'academico', 'historico', 'familia'].map(t => <button key={t} onClick={() => setActiveTab(t as any)} className={`py-5 font-bold uppercase ${activeTab === t ? 'border-b-4 border-indigo-600' : ''}`}>{t}</button>)}</div>
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'perfil' && <div className="p-8 bg-white border rounded-xl"><h4>Responsável: {selectedStudent.guardian_name}</h4><p>Telefone: {selectedStudent.guardian_phone}</p></div>}
                    {activeTab === 'historico' && <div className="space-y-4">
                        <textarea className="w-full border p-4 rounded-xl h-48" value={obsLivre} onChange={e => setObsLivre(e.target.value)} placeholder="Novo registro de atendimento..."/>
                        <button onClick={handleSaveLog} className="bg-indigo-600 text-white px-8 py-3 rounded-xl">Salvar no Histórico</button>
                        <div className="pt-8">{selectedStudent.logs?.map((l:any) => <div key={l.id} className="border-l-4 border-indigo-400 p-4 bg-white mb-2"><p className="text-xs font-bold">{new Date(l.created_at).toLocaleDateString()}</p><p>{JSON.parse(l.description).obs}</p></div>)}</div>
                    </div>}
                </div>
            </div>
        </div>
      )}

      {/* JANELINHA EDITORA DE DOCUMENTOS */}
      {isEditorModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 flex flex-col h-[80vh]">
                  <div className="flex justify-between mb-4"><h3 className="font-bold text-lg uppercase text-slate-600">Editando: {docType}</h3><button onClick={() => setIsEditorModalOpen(false)}><X/></button></div>
                  <div className="bg-yellow-50 p-2 text-xs text-yellow-700 mb-2 rounded border border-yellow-200">💡 Dica: Revise o texto abaixo. O corretor ortográfico do navegador está ativo.</div>
                  <textarea spellCheck={true} className="flex-1 border p-4 rounded-xl text-sm font-serif leading-relaxed resize-none outline-none" value={docContent} onChange={e => setDocContent(e.target.value)} placeholder="Cole ou digite o texto do documento aqui..."/>
                  <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setIsEditorModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancelar</button>
                      <button onClick={() => generateOfficialDoc(docType, docContent)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2"><Printer size={18}/> Gerar PDF</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL TERMO */}
      {isTermoModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Selecione as Infrações</h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                      {["Desatenção", "Desrespeita professores", "Desrespeita colegas", "Brincadeiras Inoportunas", "Bullying", "Agressão física", "Não realiza atividades", "Não traz material", "Chega atrasado", "Uso de celular", "Danifica patrimônio"].map(item => (
                          <label key={item} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={termoChecks.includes(item)} onChange={() => toggleItem(termoChecks, setTermoChecks, item)} /> {item}</label>
                      ))}
                  </div>
                  <button onClick={generateTermoPDF} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Gerar Termo</button>
              </div>
          </div>
      )}

      {isNewStudentModalOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"><h3 className="font-bold text-xl mb-6 text-indigo-900">Novo Aluno</h3><form onSubmit={handleAddStudent} className="space-y-4"><input title="nome" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nome"/><input title="turma" value={newClass} onChange={e => setNewClass(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Turma"/><div className="flex gap-3"><button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="flex-1 py-3">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl">Salvar</button></div></form></div></div>)}
      {isQuickModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3>Registro Rápido</h3><input className="w-full border p-2" value={quickSearchTerm} onChange={e => setQuickSearchTerm(e.target.value)} placeholder="Aluno..."/><div className="max-h-40 overflow-y-auto">{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0,5).map(s => <div key={s.id} onClick={() => {setQuickSelectedStudent(s); setQuickSearchTerm(s.name);}} className="p-2 border-b cursor-pointer">{s.name}</div>)}</div><button onClick={() => {supabase.from('logs').insert([{student_id: quickSelectedStudent.id, category:'Atendimento SOE', description: JSON.stringify({obs:'Registro Rápido'})}]); setIsQuickModalOpen(false);}} className="bg-green-600 text-white w-full py-3 mt-4">Confirmar</button></div></div>}
    </div>
  );
}
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
  UserCircle, FileDown, CalendarDays, Zap, Menu, Search, Users2, MoreHorizontal, Folder, BarChart3, FileSpreadsheet, MapPin, Clock, ShieldCheck, ChevronRight, Copy, History, GraduationCap, Printer, FileBarChart2, Database, Settings, Trash2, Maximize2, MonitorPlay, Eye, EyeOff, Filter, Calendar, ClipboardList, ArrowLeft, Home, ChevronLeft, Star, Activity, Heart, Brain, PenTool, Copyright, Code, Cpu
} from 'lucide-react';

// --- CONEXÃO ---
const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co";
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves da Silva";
const SYSTEM_ROLE = "Orientador Educacional - SOE";
const SYSTEM_MATRICULA = "212.235-9";
const SYSTEM_ORG = "SEEDF";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

// --- LISTAS PADRÃO ---
const DEFAULT_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const DEFAULT_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const DEFAULT_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const DEFAULT_ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];
const FLASH_REASONS = ["Uniforme Inadequado", "Atraso / Chegada Tardia", "Uso de Celular", "Sem Material", "Saída de Sala", "Conversa / Bagunça", "Conflito entre Colegas", "Sono em Sala", "Falta de Atividade", "Elogio / Destaque", "Encaminhamento Saúde", "Outros"];

// --- COMPONENTES ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses: any = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-2xl", "2xl": "w-40 h-40 text-4xl" };
  const pxSize: any = { sm: 32, md: 40, lg: 64, xl: 96, "2xl": 160 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-4 ring-white bg-gray-100`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-4 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

const StudentList = ({ students, onSelectStudent }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b sticky top-0 bg-slate-50 z-10">
            <tr><th className="px-6 py-4">Estudante</th><th className="px-6 py-4">Turma</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s: any) => (
              <tr key={s.id} onClick={() => onSelectStudent(s)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4"><Avatar name={s.name} src={s.photo_url} size="md" /><div className="font-bold text-slate-700 text-base group-hover:text-indigo-700 transition-colors">{s.name}</div></td>
                <td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
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
  const [dashboardFilterType, setDashboardFilterType] = useState<'ALL' | 'RISK' | 'ACTIVE' | 'TRANSFER' | 'ABANDON' | 'RESOLVED' | 'RECURRENT' | 'WITH_LOGS'>('ALL');
  const [conselhoFilterType, setConselhoFilterType] = useState<'ALL' | 'RISK' | 'LOGS' | 'GRADES'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [projectedStudent, setProjectedStudent] = useState<any | null>(null);
  const [isSensitiveVisible, setIsSensitiveVisible] = useState(false); 
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
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

  useEffect(() => { const savedAuth = localStorage.getItem('soe_auth'); const savedPhoto = localStorage.getItem('adminPhoto'); const savedComp = localStorage.getItem('list_comp'); if (savedComp) setListComportamento(JSON.parse(savedComp)); const savedPed = localStorage.getItem('list_ped'); if (savedPed) setListPedagogico(JSON.parse(savedPed)); const savedSoc = localStorage.getItem('list_soc'); if (savedSoc) setListSocial(JSON.parse(savedSoc)); const savedEnc = localStorage.getItem('list_enc'); if (savedEnc) setListEncaminhamentos(JSON.parse(savedEnc)); if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); } if (savedPhoto) setAdminPhoto(savedPhoto); setAttendanceDate(new Date().toISOString().split('T')[0]); }, []);
  useEffect(() => { if (selectedStudent) { const updated = students.find(s => s.id === selectedStudent.id); if (updated) setSelectedStudent(updated); } }, [students]);
  useEffect(() => { setObsLivre(""); setMotivosSelecionados([]); setResolvido(false); setSolicitante('Professor'); setEncaminhamento(''); setExitReason(''); setIsSensitiveVisible(false); }, [selectedStudent]);
  useEffect(() => { if (projectedStudent) { const dadosBimestre = projectedStudent.desempenho?.find((d: any) => d.bimestre === selectedBimestre); setCouncilObs(dadosBimestre?.obs_conselho || ''); setCouncilEnc(dadosBimestre?.encaminhamento_conselho || ''); } else { setCouncilObs(''); setCouncilEnc(''); } }, [projectedStudent, selectedBimestre]);
  useEffect(() => { async function fetchRadar() { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; const { data } = await supabase.from('class_radar').select('*').eq('turma', targetClass).eq('bimestre', selectedBimestre).single(); if (data) { setRadarData({ assiduidade: data.assiduidade, participacao: data.participacao, relacionamento: data.relacionamento, rendimento: data.rendimento, tarefas: data.tarefas }); } else { setRadarData({ assiduidade: 3, participacao: 3, relacionamento: 3, rendimento: 3, tarefas: 3 }); } } fetchRadar(); }, [conselhoTurma, selectedBimestre, students]);

  const addListItem = (listName: string) => { if (!newItem) return; if (listName === 'comp') { const n = [...listComportamento, newItem]; setListComportamento(n); localStorage.setItem('list_comp', JSON.stringify(n)); } if (listName === 'ped') { const n = [...listPedagogico, newItem]; setListPedagogico(n); localStorage.setItem('list_ped', JSON.stringify(n)); } if (listName === 'soc') { const n = [...listSocial, newItem]; setListSocial(n); localStorage.setItem('list_soc', JSON.stringify(n)); } if (listName === 'enc') { const n = [...listEncaminhamentos, newItem]; setListEncaminhamentos(n); localStorage.setItem('list_enc', JSON.stringify(n)); } setNewItem(''); };
  const removeListItem = (listName: string, item: string) => { if (listName === 'comp') { const n = listComportamento.filter(i => i !== item); setListComportamento(n); localStorage.setItem('list_comp', JSON.stringify(n)); } if (listName === 'ped') { const n = listPedagogico.filter(i => i !== item); setListPedagogico(n); localStorage.setItem('list_ped', JSON.stringify(n)); } if (listName === 'soc') { const n = listSocial.filter(i => i !== item); setListSocial(n); localStorage.setItem('list_soc', JSON.stringify(n)); } if (listName === 'enc') { const n = listEncaminhamentos.filter(i => i !== item); setListEncaminhamentos(n); localStorage.setItem('list_enc', JSON.stringify(n)); } };
  async function fetchStudents() { setLoading(true); const { data, error } = await supabase.from('students').select(`*, logs(id, student_id, category, description, created_at, referral, resolved, return_date), desempenho:desempenho_bimestral(*)`) .order('name'); if (!error && data) { const sortedData = data.map((student: any) => ({ ...student, logs: student.logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) })); setStudents(sortedData); } setLoading(false); }
  const toggleItem = (list: string[], setList: any, item: string) => { if (list.includes(item)) setList(list.filter((i: string) => i !== item)); else setList([...list, item]); };
  const checkRisk = (student: any) => { const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0; const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null; let notasVermelhas = 0; if (ultDesempenho) { const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; } return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3, totalFaltas, notasVermelhas }; };
  const stats = useMemo(() => { const allLogs = students.flatMap(s => s.logs || []); const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); const count = allLogs.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length; return { name: dateStr, total: count }; }).reverse(); const motivoCount: any = {}; allLogs.forEach(l => { try { const desc = JSON.parse(l.description); if (desc.motivos) desc.motivos.forEach((m: string) => { motivoCount[m] = (motivoCount[m] || 0) + 1; }); } catch (e) { } }); const pieData = Object.keys(motivoCount).map(key => ({ name: key, value: motivoCount[key] })).sort((a, b) => b.value - a.value).slice(0, 5); return { last7Days, pieData, allLogs }; }, [students]);

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); } };
  const startEditing = () => { if (selectedStudent) { setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); setIsEditing(true); } };
  const saveEdits = async () => { if (!selectedStudent) return; const { error } = await supabase.from('students').update({ name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress }).eq('id', selectedStudent.id); if (!error) { alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); } else alert(error.message); };
  const handleSaveLog = async () => { if (!selectedStudent) return; const currentCategory = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); const { error } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: currentCategory, description: desc, referral: encaminhamento, resolved: resolvido, created_at: new Date(attendanceDate).toISOString(), return_date: returnDate || null }]); if (!error) { alert('Salvo!'); setMotivosSelecionados([]); setObsLivre(""); setResolvido(false); fetchStudents(); } else alert(error.message); };
  const handleQuickSave = async () => { if (!quickSelectedStudent || !quickReason) return; const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' }); const { error } = await supabase.from('logs').insert([{ student_id: quickSelectedStudent.id, category: 'Atendimento SOE', description: desc, resolved: false, created_at: new Date().toISOString() }]); if (!error) { alert(`Salvo!`); setIsQuickModalOpen(false); fetchStudents(); } };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if (!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleRegisterExit = async () => { if (!selectedStudent) return; const logDesc = JSON.stringify({ solicitante: 'Secretaria/SOE', motivos: [exitType], obs: `SAÍDA REGISTRADA. Motivo detalhado: ${exitReason}` }); const { error: logError } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: 'Situação Escolar', description: logDesc, resolved: true, created_at: new Date().toISOString() }]); if (logError) return alert('Erro ao salvar histórico: ' + logError.message); const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id); if (!error) { alert('Saída registrada!'); setExitReason(''); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); } else alert(error.message); };
  const handleSaveRadar = async () => { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; const { error } = await supabase.from('class_radar').upsert({ turma: targetClass, bimestre: selectedBimestre, ...radarData }, { onConflict: 'turma, bimestre' }); if (!error) { alert('Avaliação da Turma Salva!'); setIsEvalModalOpen(false); } else { alert('Erro: ' + error.message); } };

  const handleUpdateGrade = (field: string, value: string) => { if(!projectedStudent) return; const newStudent = { ...projectedStudent }; const bimIndex = newStudent.desempenho.findIndex((d:any) => d.bimestre === selectedBimestre); if (bimIndex >= 0) { const numValue = value === '' ? null : parseFloat(value.replace(',', '.')); newStudent.desempenho[bimIndex][field] = numValue; setProjectedStudent(newStudent); } };
  const handleSaveCouncilChanges = async () => { if(!projectedStudent) return; const desempenhoAtual = projectedStudent.desempenho.find((d:any) => d.bimestre === selectedBimestre); if(!desempenhoAtual) return; const { error } = await supabase.from('desempenho_bimestral').update({ lp: desempenhoAtual.lp, mat: desempenhoAtual.mat, cie: desempenhoAtual.cie, his: desempenhoAtual.his, geo: desempenhoAtual.geo, ing: desempenhoAtual.ing, art: desempenhoAtual.art, edf: desempenhoAtual.edf, pd1: desempenhoAtual.pd1, pd2: desempenhoAtual.pd2, pd3: desempenhoAtual.pd3, faltas_bimestre: desempenhoAtual.faltas_bimestre, obs_conselho: councilObs, encaminhamento_conselho: councilEnc }).eq('id', desempenhoAtual.id); if(!error) { alert('Dados Salvos!'); fetchStudents(); } else alert('Erro: ' + error.message); };
  const printStudentData = (doc: jsPDF, student: any) => { doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, { align: "center" }); doc.setFontSize(12); doc.text("CENTRO EDUCACIONAL 04 DO GUARÁ - SOE", 105, 22, { align: "center" }); doc.setLineWidth(0.5); doc.line(14, 25, 196, 25); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Aluno(a):`, 14, 35); doc.setFont("helvetica", "bold"); doc.text(`${student.name}`, 35, 35); doc.setFont("helvetica", "normal"); doc.text(`Turma: ${student.class_id}`, 160, 35); doc.text(`Responsável:`, 14, 43); doc.text(`${student.guardian_name || 'Não informado'}`, 40, 43); doc.text(`Telefone:`, 14, 50); doc.text(`${student.guardian_phone || '-'}`, 40, 50); doc.setFont("helvetica", "bold"); doc.text("DESEMPENHO ACADÊMICO", 14, 60); const acadData = student.desempenho?.map((d: any) => [d.bimestre, d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf, d.pd1, d.faltas_bimestre]) || []; autoTable(doc, { startY: 65, head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'Faltas']], body: acadData, theme: 'grid', headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'center' }, styles: { fontSize: 8, halign: 'center' } }); const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 85; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("HISTÓRICO DE ATENDIMENTOS", 14, finalY); const logsData = student.logs?.filter((l: any) => l.student_id === student.id).map((l: any) => { let desc = { motivos: [], obs: '', solicitante: '' }; try { desc = JSON.parse(l.description); } catch (e) { } return [new Date(l.created_at).toLocaleDateString('pt-BR'), l.category, `SOLICITANTE: ${desc.solicitante || 'SOE'}\nMOTIVOS: ${desc.motivos?.join(', ') || '-'}\nRELATO: ${desc.obs}\nENCAMINHAMENTO: ${l.referral || '-'}`, l.resolved ? 'Resolvido' : 'Pendente']; }) || []; autoTable(doc, { startY: finalY + 5, head: [['Data', 'Tipo', 'Detalhes do Atendimento', 'Status']], body: logsData, theme: 'grid', headStyles: { fillColor: [79, 70, 229], fontSize: 9 }, styles: { fontSize: 9, cellPadding: 3 }, columnStyles: { 2: { cellWidth: 100 } } }); const pageHeight = doc.internal.pageSize.height; doc.line(60, pageHeight - 35, 150, pageHeight - 35); doc.setFont("helvetica", "bold"); doc.text(`${SYSTEM_USER_NAME.toUpperCase()}`, 105, pageHeight - 30, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`${SYSTEM_ROLE} | ${SYSTEM_ORG} | Matrícula: ${SYSTEM_MATRICULA}`, 105, pageHeight - 25, { align: "center" }); doc.setFontSize(8); doc.setTextColor(100); const timeNow = new Date().toLocaleString('pt-BR'); doc.text(`Emitido em: ${timeNow}`, 105, pageHeight - 15, { align: "center" }); };
  const generatePDF = () => { if (!selectedStudent) return; const doc = new jsPDF(); printStudentData(doc, selectedStudent); doc.save(`Ficha_${selectedStudent.name}.pdf`); };
  const generateBatchPDF = (classId: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); const classStudents = students.filter(s => s.class_id === classId); if (classStudents.length === 0) return alert("Turma vazia."); if (!window.confirm(`Deseja gerar fichas da turma ${classId}?`)) return; const doc = new jsPDF(); classStudents.forEach((student, index) => { if (index > 0) doc.addPage(); printStudentData(doc, student); }); doc.save(`PASTA_TURMA_${classId}_COMPLETA.pdf`); };
  const generateCouncilAta = (targetClass: string) => { const councilStudents = students.filter(s => s.class_id === targetClass); if(councilStudents.length === 0) return alert('Turma vazia'); const doc = new jsPDF({ orientation: 'landscape' }); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(`ATA DO CONSELHO DE CLASSE - TURMA ${targetClass}`, 148, 20, {align: "center"}); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Referente ao: ${selectedBimestre} | Data da Reunião: ${new Date(dataConselho).toLocaleDateString('pt-BR')}`, 148, 26, {align: "center"}); const rows = councilStudents.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre) || {}; return [s.name, d.lp||'-', d.mat||'-', d.cie||'-', d.his||'-', d.geo||'-', d.ing||'-', d.art||'-', d.edf||'-', d.pd1||'-', d.pd2||'-', d.pd3||'-', d.faltas_bimestre||0, s.logs?.length||0]; }); autoTable(doc, { startY: 35, head: [['Estudante', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'PD2', 'PD3', 'Faltas', 'Atend.']], body: rows, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [30, 41, 59] } }); let finalY = (doc as any).lastAutoTable.finalY + 25; doc.setFont("helvetica", "bold"); doc.line(100, finalY, 200, finalY); doc.text(`${SYSTEM_USER_NAME.toUpperCase()}`, 150, finalY + 5, {align: "center"}); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`${SYSTEM_ROLE} - Matrícula: ${SYSTEM_MATRICULA}`, 150, finalY + 10, {align: "center"}); doc.save(`ATA_CONSELHO_${targetClass}.pdf`); };
  const handleExportReport = () => { const wb = XLSX.utils.book_new(); const summaryData = [["Métrica", "Valor"], ["Total Alunos", students.length], ["Total Atendimentos", stats.allLogs.length], ["Atendimentos Resolvidos", stats.allLogs.filter(l => l.resolved).length], ["Alunos em Risco", students.filter(s => checkRisk(s).reprovadoFalta || checkRisk(s).criticoNotas).length]]; const wsSummary = XLSX.utils.aoa_to_sheet(summaryData); XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo"); const motivesData = [["Motivo", "Ocorrências"]]; stats.pieData.forEach(d => motivesData.push([d.name, d.value])); const wsMotives = XLSX.utils.aoa_to_sheet(motivesData); XLSX.utils.book_append_sheet(wb, wsMotives, "Motivos"); const studentsData = [["Nome", "Turma", "Total Atendimentos", "Situação"]]; students.map(s => ({ ...s, count: s.logs?.length || 0 })).filter(s => s.count > 0).sort((a, b) => b.count - a.count).forEach(s => { studentsData.push([s.name, s.class_id, s.count, checkRisk(s).reprovadoFalta ? "Risco Faltas" : "Normal"]); }); const wsStudents = XLSX.utils.aoa_to_sheet(studentsData); XLSX.utils.book_append_sheet(wb, wsStudents, "Alunos Recorrentes"); XLSX.writeFile(wb, `Relatorio_Gerencial_SOE.xlsx`); };
  const handleBackup = () => { const wb = XLSX.utils.book_new(); const studentsBackup = students.map(s => ({ ID: s.id, Nome: s.name, Turma: s.class_id, Status: s.status, Responsavel: s.guardian_name, Telefone: s.guardian_phone })); const wsStudents = XLSX.utils.json_to_sheet(studentsBackup); XLSX.utils.book_append_sheet(wb, wsStudents, "Alunos"); const logsBackup = students.flatMap(s => s.logs?.map((l: any) => ({ Aluno: s.name, Turma: s.class_id, Data: new Date(l.created_at).toLocaleDateString(), Tipo: l.category, Descricao: l.description, Resolvido: l.resolved ? "SIM" : "NAO" })) || []); const wsLogs = XLSX.utils.json_to_sheet(logsBackup); XLSX.utils.book_append_sheet(wb, wsLogs, "Historico_Atendimentos"); XLSX.writeFile(wb, `BACKUP_COMPLETO_SOE_${new Date().toISOString().split('T')[0]}.xlsx`); };
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) { if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return; const file = event.target.files[0]; const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) { alert('Erro upload: ' + error.message); return; } const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id); setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents(); }
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) { if (!e.target.files || e.target.files.length === 0) return; setImporting(true); const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (evt) => { try { const bstr = evt.target?.result; const workbook = XLSX.read(bstr, { type: 'binary' }); const ws = workbook.Sheets[workbook.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(ws); for (const row of (data as any[])) { const nomeExcel = row['ESTUDANTE']?.toString().toUpperCase().trim(); if (!nomeExcel) continue; const aluno = students.find(s => s.name.toUpperCase().trim() === nomeExcel); if (aluno) { const parseNota = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: parseNota(row['ART']), cie: parseNota(row['CIE']), edf: parseNota(row['EDF']), geo: parseNota(row['GEO']), his: parseNota(row['HIS']), ing: parseNota(row['ING']), lp: parseNota(row['LP']), mat: parseNota(row['MAT']), pd1: parseNota(row['PD1']), pd2: parseNota(row['PD2']), pd3: parseNota(row['PD3']), faltas_bimestre: row['FALTAS'] ? parseInt(row['FALTAS']) : 0 }]); } } alert(`Sucesso!`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); } catch (err) { alert('Erro: ' + err); setImporting(false); } }; reader.readAsBinaryString(file); }

  const changeStudent = (direction: 'prev' | 'next') => { const turmas = [...new Set(students.map(s => s.class_id))].sort(); const currentClass = conselhoTurma || turmas[0]; const currentList = students.filter(s => s.class_id === currentClass).sort((a,b) => a.name.localeCompare(b.name)); if (!projectedStudent || currentList.length === 0) return; const currentIndex = currentList.findIndex(s => s.id === projectedStudent.id); if (direction === 'next') { if (currentIndex < currentList.length - 1) setProjectedStudent(currentList[currentIndex + 1]); else setProjectedStudent(currentList[0]); } else { if (currentIndex > 0) setProjectedStudent(currentList[currentIndex - 1]); else setProjectedStudent(currentList[currentList.length - 1]); } };

  // REORGANIZAÇÃO VISUAL DO CONSELHO (HEADER LIMPO + CARDS SEM BORDAS)
  const renderConselho = () => {
      const turmas = [...new Set(students.map(s => s.class_id))].sort(); const targetClass = conselhoTurma || turmas[0]; let councilStudents = students.filter(s => s.class_id === targetClass);
      let totalFaltas = 0; let alunosRisco = 0; let totalOcorrencias = 0; let alunosBaixoRendimento = 0;
      councilStudents.forEach(s => { 
          const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre);
          if(d) { totalFaltas += (d.faltas_bimestre || 0); if(d.faltas_bimestre > 20) alunosRisco++; const disciplinasBase = [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf]; const notasVermelhas = disciplinasBase.filter(n => n !== null && n < 5).length; if (notasVermelhas > 3) alunosBaixoRendimento++; } 
          totalOcorrencias += (s.logs?.length || 0); 
      });
      const mediaFaltas = councilStudents.length > 0 ? Math.round(totalFaltas / councilStudents.length) : 0;
      
      if (conselhoFilterType === 'RISK') councilStudents = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); return d && d.faltas_bimestre > 20; });
      if (conselhoFilterType === 'LOGS') councilStudents = councilStudents.filter(s => (s.logs?.length || 0) > 0);
      if (conselhoFilterType === 'GRADES') councilStudents = councilStudents.filter(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre); if (!d) return false; const disciplinasBase = [d.lp, d.mat, d.cie, d.his, d.geo, d.ing, d.art, d.edf]; return disciplinasBase.filter(n => n !== null && n < 5).length > 3; });

      const radarChartData = [
        { subject: 'Assiduidade', A: radarData.assiduidade || 0, fullMark: 5 }, { subject: 'Participação', A: radarData.participacao || 0, fullMark: 5 }, { subject: 'Relacionamento', A: radarData.relacionamento || 0, fullMark: 5 }, { subject: 'Rendimento', A: radarData.rendimento || 0, fullMark: 5 }, { subject: 'Tarefas', A: radarData.tarefas || 0, fullMark: 5 },
      ];

      if (!targetClass) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;
      return (
          <div className="max-w-[1800px] mx-auto pb-20 w-full h-full flex flex-col overflow-hidden">
              {/* HEADER ORGANIZADO: FILTROS À ESQUERDA, AÇÕES À DIREITA */}
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><GraduationCap className="text-indigo-600"/> Conselho de Classe Digital</h2>
                      <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"><Calendar size={16} className="text-slate-400"/><input type="date" className="text-xs font-bold outline-none bg-transparent" value={dataConselho} onChange={e => setDataConselho(e.target.value)}/></div>
                          <select className="p-2 border rounded-lg font-bold bg-slate-50 text-xs" value={targetClass} onChange={e => {setConselhoTurma(e.target.value); setConselhoFilterType('ALL');}}>{turmas.map(t => <option key={t} value={t}>{t}</option>)}</select>
                          <select className="p-2 border rounded-lg font-bold bg-slate-50 text-xs" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setIsEvalModalOpen(true)} className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-orange-100 text-xs transition-colors"><Activity size={16}/> Avaliar Turma</button>
                      <button onClick={() => generateCouncilAta(targetClass)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-slate-900 text-xs transition-colors shadow-lg shadow-slate-200"><Printer size={16}/> Gerar Ata PDF</button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* CARDS MINIMALISTAS */}
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                      <div onClick={() => setConselhoFilterType('ALL')} className={`cursor-pointer p-6 rounded-2xl transition-all flex items-center justify-between ${conselhoFilterType === 'ALL' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-xl' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><div className="flex flex-col"><span className="text-[10px] uppercase font-bold opacity-70">Total Alunos</span><span className="text-3xl font-black">{students.filter(s => s.class_id === targetClass).length}</span></div><Users2 size={32} className="opacity-20"/></div>
                      <div onClick={() => setConselhoFilterType('RISK')} className={`cursor-pointer p-6 rounded-2xl transition-all flex items-center justify-between ${conselhoFilterType === 'RISK' ? 'bg-red-500 text-white shadow-red-200 shadow-xl' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><div className="flex flex-col"><span className="text-[10px] uppercase font-bold opacity-70">Faltas Críticas</span><span className="text-3xl font-black">{alunosRisco}</span></div><AlertTriangle size={32} className="opacity-20"/></div>
                      <div onClick={() => setConselhoFilterType('GRADES')} className={`cursor-pointer p-6 rounded-2xl transition-all flex items-center justify-between ${conselhoFilterType === 'GRADES' ? 'bg-orange-500 text-white shadow-orange-200 shadow-xl' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><div className="flex flex-col"><span className="text-[10px] uppercase font-bold opacity-70">Notas Vermelhas</span><span className="text-3xl font-black">{alunosBaixoRendimento}</span></div><BarChart3 size={32} className="opacity-20"/></div>
                      <div onClick={() => setConselhoFilterType('LOGS')} className={`cursor-pointer p-6 rounded-2xl transition-all flex items-center justify-between ${conselhoFilterType === 'LOGS' ? 'bg-blue-600 text-white shadow-blue-200 shadow-xl' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><div className="flex flex-col"><span className="text-[10px] uppercase font-bold opacity-70">Com Ocorrências</span><span className="text-3xl font-black">{councilStudents.filter(s => (s.logs?.length || 0) > 0).length}</span></div><FileText size={32} className="opacity-20"/></div>
                  </div>
                  {/* RADAR INTEGRADO */}
                  <div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-center relative overflow-hidden">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase absolute top-4 left-6 tracking-widest">Radar da Turma</h4>
                      <div className="w-full h-48 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                            <Radar name="Turma" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0 shadow-sm">
                  <div className="overflow-x-auto flex-1">
                      <table className="w-full text-xs text-left min-w-[1000px]">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 z-10 border-b">
                              <tr>
                                  <th className="px-4 py-4 sticky left-0 bg-slate-50 z-20">Estudante</th>
                                  <th className="px-2 py-4 text-center">LP</th><th className="px-2 py-4 text-center">MAT</th><th className="px-2 py-4 text-center">CIE</th><th className="px-2 py-4 text-center">HIS</th><th className="px-2 py-4 text-center">GEO</th><th className="px-2 py-4 text-center">ING</th><th className="px-2 py-4 text-center">ART</th><th className="px-2 py-4 text-center">EDF</th><th className="px-2 py-4 text-center bg-slate-100">PD1</th><th className="px-2 py-4 text-center bg-slate-100">PD2</th><th className="px-2 py-4 text-center bg-slate-100">PD3</th><th className="px-4 py-4 text-center bg-red-50 text-red-700">FALTAS</th><th className="px-4 py-4">Atendimentos</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {councilStudents.map(s => {
                                  const notas = s.desempenho?.find((d: any) => d.bimestre === selectedBimestre) || {};
                                  const renderNota = (val: number) => { if (val === undefined || val === null) return <span className="text-slate-300">-</span>; return <span className={`font-bold ${val < 5 ? 'text-red-600 bg-red-50 px-1 rounded' : 'text-slate-700'}`}>{val}</span>; };
                                  return (
                                      <tr key={s.id} onClick={() => setProjectedStudent(s)} className="hover:bg-indigo-50 transition-colors cursor-pointer group">
                                          <td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-2 border-r sticky left-0 bg-white group-hover:bg-indigo-50 z-10 min-w-[200px]"><Avatar name={s.name} src={s.photo_url} size="sm"/> <span className="truncate">{s.name}</span></td>
                                          <td className="px-2 py-3 text-center border-r">{renderNota(notas.lp)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.mat)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.cie)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.his)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.geo)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.ing)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.art)}</td><td className="px-2 py-3 text-center border-r">{renderNota(notas.edf)}</td><td className="px-2 py-3 text-center border-r bg-slate-50">{renderNota(notas.pd1)}</td><td className="px-2 py-3 text-center border-r bg-slate-50">{renderNota(notas.pd2)}</td><td className="px-2 py-3 text-center border-r bg-slate-50">{renderNota(notas.pd3)}</td><td className="px-4 py-3 text-center border-r font-bold bg-red-50">{notas.faltas_bimestre > 20 ? <span className="text-red-600 animate-pulse">{notas.faltas_bimestre}</span> : <span>{notas.faltas_bimestre || 0}</span>}</td><td className="px-4 py-3"><span className="text-[10px] uppercase font-bold text-slate-400">{s.logs?.length || 0} Atend.</span></td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  };
  const renderDashboard = () => {
    let studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    const ativos = students.filter(s => s.status === 'ATIVO').length;
    const transferidos = students.filter(s => s.status === 'TRANSFERIDO').length;
    const abandono = students.filter(s => s.status === 'ABANDONO').length;
    if (selectedClassFilter) studentsInRisk = studentsInRisk.filter(s => s.class_id === selectedClassFilter);
    const turmas = [...new Set(students.map(s => s.class_id))].sort();

    return (
      <div className="space-y-8 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div onClick={() => { setDashboardFilterType('ALL'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Alunos</p><h3 className="text-3xl font-black text-indigo-600">{students.length}</h3></div>
          <div onClick={() => { setDashboardFilterType('ACTIVE'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Ativos</p><h3 className="text-3xl font-black text-emerald-600">{ativos}</h3></div>
          <div onClick={() => { setDashboardFilterType('RISK'); setView('students'); }} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Em Alerta</p><h3 className="text-3xl font-black text-red-500">{studentsInRisk.length}</h3></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-center gap-1">
            <div onClick={() => { setDashboardFilterType('TRANSFER'); setView('students'); }} className="cursor-pointer flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Transferidos</span><span className="text-xl font-black text-orange-500">{transferidos}</span></div>
            <div onClick={() => { setDashboardFilterType('ABANDON'); setView('students'); }} className="cursor-pointer flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Abandono</span><span className="text-xl font-black text-red-600">{abandono}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-80">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full"><h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Volume de Atendimentos</h4><ResponsiveContainer width="100%" height="100%"><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1' }} /></LineChart></ResponsiveContainer></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full"><h4 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2"><BarChart3 size={16} /> Motivos Recorrentes</h4><ResponsiveContainer width="100%" height="80%"><PieChart><Pie data={stats.pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-red-100 shadow-sm flex flex-col overflow-hidden"><div className="bg-red-50 px-6 py-4 border-b border-red-100"><h3 className="font-bold text-red-800 uppercase text-sm">Alunos em Risco</h3></div><div className="flex-1 overflow-y-auto p-2">{studentsInRisk.length > 0 ? studentsInRisk.map(s => (<div key={s.id} onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="p-3 hover:bg-red-50 rounded-xl cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100 group transition-colors"><div className="flex items-center gap-3"><Avatar name={s.name} src={s.photo_url} size="sm" /><div><p className="font-bold text-slate-800 text-sm group-hover:text-red-700">{s.name}</p><p className="text-xs text-slate-500 font-bold">Turma {s.class_id}</p></div></div></div>)) : <p className="p-4 text-center text-slate-400 text-sm">Nenhum aluno em risco.</p>}</div></div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col overflow-hidden"><div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center"><h3 className="font-bold text-indigo-800 uppercase">Pastas de Turmas</h3></div><div className="flex-1 overflow-y-auto p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{turmas.map(t => { const total = students.filter(s => s.class_id === t).length; const risco = students.filter(s => s.class_id === t && (checkRisk(s).reprovadoFalta || checkRisk(s).criticoNotas)).length; const percent = total > 0 ? (risco / total) * 100 : 0; const isSelected = selectedClassFilter === t; return (<div key={t} onClick={() => setSelectedClassFilter(isSelected ? null : t)} className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-lg flex flex-col justify-between h-36 hover:-translate-y-1 duration-300 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-300'}`}><div className="flex justify-between items-start"><h4 className="font-bold text-lg truncate w-3/4" title={t}>{t}</h4><div className="flex gap-2"><button onClick={(e) => generateBatchPDF(t, e)} className={`p-2 rounded-full transition-colors ${isSelected ? 'text-indigo-200 hover:bg-indigo-500 hover:text-white' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'}`} title="Imprimir Turma"><Printer size={18} /></button><Folder size={20} className={isSelected ? 'text-indigo-200' : 'text-slate-300'} /></div></div><div><div className="flex justify-between text-[10px] mb-1 font-bold"><span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>{total} Alunos</span><span className={isSelected ? 'text-white' : 'text-red-500'}>{Math.round(percent)}% Risco</span></div><div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-black/20' : 'bg-slate-100'}`}><div className={`h-full transition-all duration-500 ${percent > 30 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }}></div></div></div></div>) })}</div></div></div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 animate-in fade-in duration-1000"><div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in zoom-in duration-500"><div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><Lock className="text-indigo-600" size={32} /></div><h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso SOE</h1><form onSubmit={handleLogin} className="space-y-4"><input type="password" title="Senha" className="w-full p-3 border rounded-xl text-center focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} /><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">Entrar</button></form></div></div>
  );

  const turmasList = [...new Set(students.map(s => s.class_id))].sort();
  const filteredStudents = students.filter(s => {
    if (listClassFilter && s.class_id !== listClassFilter) return false;
    if (dashboardFilterType === 'RISK') { const r = checkRisk(s); if (!r.reprovadoFalta && !r.criticoFalta && !r.criticoNotas) return false; }
    if (dashboardFilterType === 'ACTIVE' && s.status !== 'ATIVO') return false;
    if (dashboardFilterType === 'TRANSFER' && s.status !== 'TRANSFERIDO') return false;
    if (dashboardFilterType === 'ABANDON' && s.status !== 'ABANDONO') return false;
    // NOVOS FILTROS
    if (dashboardFilterType === 'RESOLVED') return s.logs?.some((l:any) => l.resolved);
    if (dashboardFilterType === 'RECURRENT') return (s.logs?.length || 0) >= 3;
    if (dashboardFilterType === 'WITH_LOGS') return (s.logs?.length || 0) > 0;
    
    return !globalSearch || s.name.toLowerCase().includes(globalSearch.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800"><div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div><div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setView('dashboard'); setDashboardFilterType('ALL'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => { setView('students'); setDashboardFilterType('ALL'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'students' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><Users size={18} /> Alunos</button>
          <button onClick={() => { setView('conselho'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'conselho' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><GraduationCap size={18} /> Conselho de Classe</button>
          <button onClick={() => { setIsReportModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800"><FileBarChart2 size={18} /> Relatórios</button>
          <button onClick={handleBackup} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800"><Database size={18} /> Backup</button>
          <button onClick={() => { setIsSettingsModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800"><Settings size={18} /> Configurações</button>
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800 text-[10px] text-slate-400">
          <p className="font-bold text-white text-xs">{SYSTEM_USER_NAME}</p><p>{SYSTEM_ROLE}</p><p>{SYSTEM_ORG} | Mat. {SYSTEM_MATRICULA}</p>
          <button onClick={() => { localStorage.removeItem('soe_auth'); window.location.reload(); }} className="flex items-center gap-2 mt-4 hover:text-white transition-colors"><LogOut size={12} /> Sair do Sistema</button>
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-1 text-slate-500">
            <div className="flex items-center gap-2"><Code size={12}/> <span className="text-[9px] font-bold">Dev. & Design: {SYSTEM_USER_NAME}</span></div>
            <span className="text-[8px] opacity-50">v1.0.5 Enterprise Edition</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm z-10 gap-4">
          <div className="flex items-center gap-3 flex-1"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24} /></button>
          {view !== 'dashboard' && (<button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm bg-slate-100 px-3 py-1 rounded-full"><ArrowLeft size={16} /> Voltar ao Início</button>)}
          <div className="flex-1 max-w-md relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar aluno..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none" value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); if (e.target.value.length > 0) setView('students'); }} /></div></div>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'dashboard' && renderDashboard()}
          {view === 'students' && (
            <div className="max-w-[1600px] mx-auto pb-20 w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">Estudantes</h2><div className="flex gap-2"><button onClick={() => setIsImportModalOpen(true)} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-green-700 transition-all"><FileSpreadsheet size={20} /> Importar</button><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus size={20} /> Novo Aluno</button></div></div>
              {dashboardFilterType !== 'ALL' && (
                <div className="bg-indigo-50 border-indigo-200 border p-3 rounded-xl mb-4 flex items-center justify-between">
                  <span className="font-bold text-indigo-700 flex items-center gap-2"><Filter size={18}/> Filtrando por: {dashboardFilterType} ({filteredStudents.length})</span>
                  <button onClick={() => setDashboardFilterType('ALL')} className="text-xs font-bold text-slate-500 underline">Limpar</button>
                </div>
              )}
              <div className="mb-6 flex gap-3 overflow-x-auto pb-2"><button onClick={() => setListClassFilter(null)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border ${!listClassFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>Todos</button>{turmasList.map(t => (<button key={t} onClick={() => setListClassFilter(t)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border flex items-center gap-2 ${listClassFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}><Folder size={14} /> {t}</button>))}</div>
              <div className="flex-1 min-h-0"><StudentList students={filteredStudents} onSelectStudent={(s: any) => { setSelectedStudent(s); setIsModalOpen(true); }} /></div>
            </div>
          )}
          {view === 'conselho' && renderConselho()}
        </div>
      </main>

      {/* MODAL CONFIGURAÇÕES */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Settings className="text-slate-600" /> Configurações de Listas</h3><button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              <div><h4 className="font-bold text-lg text-orange-600 mb-2 border-b pb-2">Motivos Comportamentais</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo motivo..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('comp')} className="bg-orange-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listComportamento.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('comp', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div>
              <div><h4 className="font-bold text-lg text-blue-600 mb-2 border-b pb-2">Motivos Pedagógicos</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo motivo..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('ped')} className="bg-blue-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listPedagogico.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('ped', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div>
              <div><h4 className="font-bold text-lg text-purple-600 mb-2 border-b pb-2">Encaminhamentos</h4><div className="flex gap-2 mb-2"><input className="flex-1 border p-2 rounded-lg" placeholder="Novo destino..." value={newItem} onChange={e => setNewItem(e.target.value)} /><button onClick={() => addListItem('enc')} className="bg-purple-600 text-white px-4 rounded-lg font-bold">Adicionar</button></div><div className="flex flex-wrap gap-2">{listEncaminhamentos.map(i => <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">{i} <button onClick={() => removeListItem('enc', i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></span>)}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RADAR TURMA (SALVA NO BANCO) */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> Avaliação da Turma</h3><button onClick={() => setIsEvalModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button></div>
            <div className="space-y-6">
              {[ {l: 'Assiduidade', k: 'assiduidade', i: <Clock size={18}/>}, {l: 'Participação', k: 'participacao', i: <Brain size={18}/>}, {l: 'Relacionamento', k: 'relacionamento', i: <Heart size={18}/>}, {l: 'Rendimento', k: 'rendimento', i: <BarChart3 size={18}/>}, {l: 'Tarefas', k: 'tarefas', i: <PenTool size={18}/>} ].map((item: any, idx) => (
                <div key={idx}>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">{item.i} {item.l}</label>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">Fraco</span><input type="range" min="1" max="5" value={radarData[item.k as keyof typeof radarData] || 3} onChange={(e) => setRadarData({...radarData, [item.k]: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" /><span className="text-xs font-bold text-slate-400">Excelente</span></div>
                </div>
              ))}
              <div className="pt-4 border-t"><button onClick={handleSaveRadar} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600">Salvar Avaliação</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROJEÇÃO (SALVA OBS NO BANCO) */}
      {projectedStudent && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 lg:p-8 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-indigo-900 text-white p-6 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-4"><MonitorPlay size={32} className="text-indigo-400"/><div><h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider">{projectedStudent.name}</h2><p className="text-indigo-300 font-bold text-sm lg:text-lg">TURMA {projectedStudent.class_id} | {selectedBimestre}</p></div></div>
                    <div className="flex items-center gap-2 lg:gap-4">
                        <button onClick={() => changeStudent('prev')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Anterior"><ChevronLeft size={24} color="white"/></button>
                        <button onClick={() => changeStudent('next')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Próximo"><ChevronRight size={24} color="white"/></button>
                        <div className="w-[1px] h-8 bg-white/20 mx-2"></div>
                        <button onClick={() => setIsSensitiveVisible(!isSensitiveVisible)} className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-[10px] lg:text-sm transition-colors ${isSensitiveVisible ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {isSensitiveVisible ? <EyeOff size={16}/> : <Eye size={16}/>} Sigilo
                        </button>
                        <button onClick={handleSaveCouncilChanges} className="bg-green-500 hover:bg-green-600 text-white px-4 lg:px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg text-sm lg:text-base"><Save size={18}/> SALVAR</button>
                        <button onClick={() => setProjectedStudent(null)} className="p-2 bg-white/10 rounded-full text-white"><X size={28}/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    <div className="lg:w-1/3 bg-slate-100 p-4 lg:p-8 flex flex-col items-center border-r border-slate-200 overflow-y-auto">
                        <div className="mb-6"><Avatar name={projectedStudent.name} src={projectedStudent.photo_url} size="2xl"/></div>
                        <div className="w-full bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
                            <h3 className="text-center font-bold text-slate-400 text-xs uppercase mb-4 tracking-widest flex items-center justify-center gap-2"><Pencil size={12}/> Notas</h3>
                            <div className="grid grid-cols-3 gap-2 lg:gap-3">
                                {(() => {
                                    const notas = projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {};
                                    const disciplinas = [{n:'LP', k:'lp', v: notas.lp}, {n:'MAT', k:'mat', v: notas.mat}, {n:'CIE', k:'cie', v: notas.cie}, {n:'HIS', k:'his', v: notas.his}, {n:'GEO', k:'geo', v: notas.geo}, {n:'ING', k:'ing', v: notas.ing}, {n:'ART', k:'art', v: notas.art}, {n:'EDF', k:'edf', v: notas.edf}, {n:'PD1', k:'pd1', v: notas.pd1}, {n:'PD2', k:'pd2', v: notas.pd2}, {n:'PD3', k:'pd3', v: notas.pd3}];
                                    return disciplinas.map(d => (
                                        <div key={d.k} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors ${d.v < 5 && d.v !== null ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-[10px] font-bold text-slate-400">{d.n}</span>
                                            <input type="number" className={`w-full text-center bg-transparent font-black text-xl lg:text-2xl outline-none ${d.v < 5 ? 'text-red-600' : 'text-slate-700'}`} value={d.v ?? ''} onChange={(e) => handleUpdateGrade(d.k, e.target.value)} />
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Faltas</span>
                                <input type="number" title="Faltas" className="w-16 text-right font-black text-xl lg:text-2xl text-slate-700 bg-slate-50 border rounded-lg p-1" value={(projectedStudent.desempenho?.find((d:any) => d.bimestre === selectedBimestre) || {}).faltas_bimestre || ''} onChange={(e) => handleUpdateGrade('faltas_bimestre', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-2/3 p-4 lg:p-8 bg-white overflow-y-auto flex flex-col gap-8">
                        <div className="flex-1"><h3 className="font-bold text-indigo-900 text-lg uppercase mb-4 flex items-center gap-2"><FileText size={20}/> Atendimentos SOE</h3>
                            <div className="space-y-3">
                                {projectedStudent.logs && projectedStudent.logs.length > 0 ? projectedStudent.logs.map((log: any) => {
                                    let desc = { motivos: [], obs: '' }; try { desc = JSON.parse(log.description); } catch(e) {}
                                    return (
                                        <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">{new Date(log.created_at).toLocaleDateString()}</span><span className="text-[10px] font-bold text-slate-400">{log.category}</span></div>
                                            <div className="flex flex-wrap gap-1 mb-2">{desc.motivos?.map((m:string) => <span key={m} className="text-[9px] font-bold bg-white border px-2 py-0.5 rounded text-slate-600">{m}</span>)}</div>
                                            <div className={`text-sm text-slate-600 italic ${isSensitiveVisible ? '' : 'blur-sm select-none'}`}>"{desc.obs}"</div>
                                        </div>
                                    )
                                }) : <p className="text-slate-400 text-center py-8">Nenhum atendimento registrado.</p>}
                            </div>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                            <h3 className="font-bold text-orange-800 text-lg uppercase mb-4 flex items-center gap-2"><ClipboardList size={20}/> Deliberação do Conselho</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Anotações</label><textarea title="Anotações" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Digite as observações..." value={councilObs} onChange={(e) => setCouncilObs(e.target.value)}></textarea></div>
                                <div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Encaminhamentos</label><textarea title="Encaminhamentos" className="w-full p-3 rounded-xl border border-orange-200 text-sm h-32" placeholder="Encaminhar para..." value={councilEnc} onChange={(e) => setCouncilEnc(e.target.value)}></textarea></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DETALHES ALUNO */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-6"><div className="relative group"><Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" /><label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} /></label></div><div><h2 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h2><p className="text-lg text-slate-500 font-bold uppercase mt-1">Turma {selectedStudent.class_id}</p></div></div>
              <div className="flex gap-2"><button onClick={generatePDF} className="p-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200" title="Gerar PDF"><FileDown size={20} /></button><button onClick={startEditing} className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200" title="Editar"><Pencil size={20} /></button><button onClick={() => setIsExitModalOpen(true)} className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Saída"><LogOut size={20} /></button><button onClick={() => setIsModalOpen(false)} className="ml-4 hover:bg-slate-200 p-2 rounded-full"><X className="text-slate-400 hover:text-red-500" size={32} /></button></div>
            </div>
            <div className="flex border-b px-8 bg-white overflow-x-auto gap-8">{['perfil', 'academico', 'historico', 'familia'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 font-bold text-sm border-b-4 uppercase tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab === 'familia' ? 'Família & Responsáveis' : tab.toUpperCase()}</button>))}</div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {activeTab === 'perfil' && (<div className="bg-white p-8 rounded-2xl border shadow-sm w-full mx-auto"><h3 className="font-bold text-indigo-900 uppercase mb-6 flex items-center gap-2 border-b pb-4"><UserCircle className="text-indigo-600" /> Informações de Contato</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Responsável Legal</span>{isEditing ? <input title="Resp" value={editGuardian} onChange={e => setEditGuardian(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.guardian_name || "Não informado"}</p>}</div><div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Telefone</span>{isEditing ? <input title="Tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.guardian_phone || "Não informado"}</p>}</div><div className="md:col-span-2"><span className="text-xs font-bold text-slate-400 uppercase block mb-1">Endereço</span>{isEditing ? <input title="End" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full border p-3 rounded-lg" /> : <p className="font-medium text-lg">{selectedStudent.address || "Não informado"}</p>}</div></div>{isEditing && <button onClick={saveEdits} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold mt-6 shadow-lg">Salvar Alterações</button>}</div>)}
              {activeTab === 'academico' && (<div className="bg-white rounded-2xl border shadow-sm overflow-x-auto w-full"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b"><tr><th className="px-4 py-4">Bimestre</th><th className="px-2">Português</th><th className="px-2">Matemática</th><th className="px-2">Ciências</th><th className="px-2">História</th><th className="px-2">Geografia</th><th className="px-2">Inglês</th><th className="px-2">Arte</th><th className="px-2">Ed. Física</th><th className="px-2 bg-slate-200">PD1</th><th className="px-2 bg-slate-200">PD2</th><th className="px-2 bg-slate-200">PD3</th><th className="px-4 text-red-600 bg-red-50 text-center">FALTAS</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedStudent.desempenho?.map((d: any, i: number) => (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-5 font-bold text-slate-700">{d.bimestre}</td><td className={`px-2 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td><td className={`px-2 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td><td className="px-2">{d.cie}</td><td className="px-2">{d.his}</td><td className="px-2">{d.geo}</td><td className="px-2">{d.ing}</td><td className="px-2">{d.art}</td><td className="px-2">{d.edf}</td><td className="px-2 bg-slate-50">{d.pd1}</td><td className="px-2 bg-slate-50">{d.pd2}</td><td className="px-2 bg-slate-50">{d.pd3}</td><td className="px-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td></tr>))}</tbody></table></div>)}
              {(activeTab === 'historico' || activeTab === 'familia') && (<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-full"><div className={`lg:col-span-8 p-8 rounded-2xl border shadow-sm h-full flex flex-col ${activeTab === 'familia' ? 'bg-orange-50 border-orange-200' : 'bg-white border-indigo-100'}`}><h3 className="font-bold mb-6 uppercase text-sm flex items-center gap-2 pb-4 border-b border-black/5">{activeTab === 'familia' ? <><Users2 /> Novo Atendimento Família</> : <><FileText /> Novo Atendimento Estudante</>}</h3><div className="space-y-6 flex-1 flex flex-col"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase">Solicitante</label><select title="sol" className="w-full mt-1 p-3 border rounded-lg bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option></select></div><div><label className="text-xs font-bold text-slate-400 uppercase">Encaminhar</label><select title="enc" className="w-full mt-1 p-3 border rounded-lg bg-white" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Selecione --</option>{listEncaminhamentos.map(e => <option key={e}>{e}</option>)}</select></div></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Data</label><input type="date" title="date" className="w-full mt-1 p-3 border rounded-lg bg-white" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></div><div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Retorno</label><input type="date" title="ret" className="w-full mt-1 p-3 border rounded-lg bg-white" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div></div><div className="border p-4 rounded-xl bg-white/50 space-y-4"><div className="grid grid-cols-3 gap-4"><div><p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Comportamental</p><div className="flex flex-col gap-1">{listComportamento.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div><div><p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Pedagógico</p><div className="flex flex-col gap-1">{listPedagogico.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div><div><p className="text-[10px] font-bold text-purple-600 uppercase mb-2">Social/Outros</p><div className="flex flex-col gap-1">{listSocial.map(m => (<label key={m} className="text-xs flex gap-2 cursor-pointer hover:bg-white p-1 rounded"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} /> {m}</label>))}</div></div></div></div><div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col"><label className="text-center block text-sm font-bold text-slate-600 uppercase mb-2 tracking-widest bg-slate-200 py-1 rounded">RELATÓRIO DE ATENDIMENTO</label><textarea title="rel" className="w-full p-4 border rounded-xl flex-1 text-sm bg-white" rows={12} value={obsLivre} onChange={e => setObsLivre(e.target.value)} /></div><div className="flex justify-between items-center pt-4 border-t border-slate-200"><div className="text-xs text-slate-400 font-mono"><p>Registrado por: <span className="font-bold text-slate-600">{SYSTEM_USER_NAME}</span></p><p>{SYSTEM_ROLE} | {SYSTEM_ORG} | Mat. {SYSTEM_MATRICULA} | {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p></div><div className="flex items-center gap-4"><label className="text-sm font-bold text-green-700 flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 rounded" checked={resolvido} onChange={e => setResolvido(e.target.checked)} /> <ShieldCheck size={18} /> Resolvido</label><button onClick={handleSaveLog} className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 ${activeTab === 'familia' ? 'bg-orange-600' : 'bg-indigo-600'}`}><Save size={18} /> SALVAR REGISTRO</button></div></div></div></div><div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 bg-slate-100 p-4 rounded-2xl h-full"><h3 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-slate-100 py-2 z-10 flex items-center gap-2"><History size={14} /> Histórico Completo</h3>{selectedStudent.logs?.filter((l: any) => l.student_id === selectedStudent.id).map((log: any) => { let p = { obs: log.description, motivos: [], solicitante: '' }; try { p = JSON.parse(log.description); } catch (e) { } const isFamily = log.category === 'Família'; return (<div key={log.id} className={`p-4 rounded-xl border shadow-sm bg-white hover:shadow-md transition-shadow relative ${isFamily ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-indigo-400'}`}><div className="flex justify-between items-center mb-2 border-b pb-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isFamily ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{isFamily ? 'FAMÍLIA' : 'ESTUDANTE'}</span><span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span></div><div className="mb-2"><span className="text-[10px] font-bold uppercase text-slate-500 block">Solicitante: {p.solicitante}</span></div><p className="text-xs text-slate-600 line-clamp-3 mb-2 italic">"{p.obs}"</p><div className="flex justify-between items-center mt-2"><button className="text-[10px] text-indigo-600 font-bold underline" onClick={() => { setObsLivre(p.obs); setMotivosSelecionados(p.motivos || []); }}><Copy size={10}/> Copiar</button>{log.resolved && <span className="text-[10px] font-bold text-green-600"><ShieldCheck size={10}/> Resolvido</span>}</div></div>) })}</div></div>)}
            </div>
          </div>
        </div>
      )}

      {/* OUTROS MODAIS (RELATÓRIOS, ZAP, SAÍDA, IMPORTAÇÃO, NOVO ALUNO) */}
      {isReportModalOpen && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col h-[80vh]"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-indigo-800 flex items-center gap-3"><FileBarChart2 className="text-indigo-600" /> Relatórios Gerenciais</h3><button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={28} /></button></div><div className="flex-1 overflow-y-auto space-y-6 pr-2"><div className="grid grid-cols-3 gap-4"><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('WITH_LOGS'); setView('students'); }} className="cursor-pointer bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center hover:bg-indigo-100 transition-colors"><h4 className="text-sm uppercase font-bold text-indigo-400 mb-2">Total Atendimentos</h4><p className="text-4xl font-black text-indigo-700">{stats.allLogs.length}</p></div><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('RESOLVED'); setView('students'); }} className="cursor-pointer bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center hover:bg-emerald-100 transition-colors"><h4 className="text-sm uppercase font-bold text-emerald-400 mb-2">Casos Resolvidos</h4><p className="text-4xl font-black text-emerald-700">{stats.allLogs.filter(l => l.resolved).length}</p></div><div onClick={() => { setIsReportModalOpen(false); setDashboardFilterType('RECURRENT'); setView('students'); }} className="cursor-pointer bg-amber-50 p-6 rounded-xl border border-amber-100 text-center hover:bg-amber-100 transition-colors"><h4 className="text-sm uppercase font-bold text-amber-400 mb-2">Alunos Recorrentes</h4><p className="text-4xl font-black text-amber-700">{students.filter(s => (s.logs?.length || 0) >= 3).length}</p></div></div><div className="grid grid-cols-2 gap-6"><div className="border rounded-xl p-4"><h4 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Top 5 Motivos</h4>{stats.pieData.map((d, i) => (<div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm"><span className="font-medium text-slate-700">{d.name}</span><span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{d.value}</span></div>))}</div><div className="border rounded-xl p-4"><h4 className="font-bold text-sm uppercase text-slate-500 mb-4 border-b pb-2">Alunos com +3 Atendimentos</h4><div className="max-h-48 overflow-y-auto">{students.map(s => ({ ...s, count: s.logs?.length || 0 })).filter(s => s.count >= 3).sort((a, b) => b.count - a.count).map(s => (<div key={s.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm"><div><p className="font-bold text-slate-700">{s.name}</p><p className="text-[10px] text-slate-400">{s.class_id}</p></div><span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{s.count}</span></div>))}</div></div></div></div><div className="pt-6 border-t mt-4 flex justify-end"><button onClick={handleExportReport} className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg transition-transform hover:scale-105"><FileSpreadsheet /> Baixar Relatório Completo</button></div></div></div>)}
      {isQuickModalOpen && (<div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-200"><button onClick={() => setIsQuickModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X size={24} /></button><h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800"><div className="bg-yellow-100 p-2 rounded-full"><Zap className="text-yellow-600" fill="currentColor" /></div> Registro Flash</h3><div className="relative mb-4"><input autoFocus placeholder="Digite o nome do aluno..." className={`w-full p-4 border rounded-xl text-lg font-bold outline-none transition-all ${quickSelectedStudent ? 'bg-green-50 border-green-300 text-green-800' : 'bg-slate-50 focus:ring-2 focus:ring-yellow-400'}`} value={quickSearchTerm} onChange={e => { setQuickSearchTerm(e.target.value); if (quickSelectedStudent && e.target.value !== quickSelectedStudent.name) setQuickSelectedStudent(null); }} />{quickSelectedStudent && <CheckSquare className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600" />}{quickSearchTerm.length > 0 && !quickSelectedStudent && (<div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto z-50">{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 10).map(s => (<div key={s.id} onClick={() => { setQuickSelectedStudent(s); setQuickSearchTerm(s.name); }} className="p-3 hover:bg-yellow-50 cursor-pointer border-b last:border-0 transition-colors flex justify-between items-center"><span className="font-bold text-slate-700 text-sm">{s.name}</span><span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">{s.class_id}</span></div>))}{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).length === 0 && <div className="p-3 text-center text-slate-400 text-xs">Nenhum aluno encontrado</div>}</div>)}</div><div className="grid grid-cols-2 gap-2 mb-6 mt-4">{FLASH_REASONS.map(r => (<button key={r} onClick={() => setQuickReason(r)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${quickReason === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{r}</button>))}</div><button onClick={handleQuickSave} disabled={!quickSelectedStudent || !quickReason} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:shadow-none transition-all hover:bg-green-700 active:scale-95">CONFIRMAR REGISTRO</button></div></div>)}
      {isExitModalOpen && (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"><h3 className="text-xl font-bold mb-4 text-red-600">Registrar Saída de Aluno</h3><div className="space-y-4"><div className="flex gap-4 bg-slate-100 p-2 rounded-lg"><label className="flex items-center gap-2 font-bold text-sm cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'TRANSFERIDO'} onChange={() => setExitType('TRANSFERIDO')} /> TRANSFERÊNCIA</label><label className="flex items-center gap-2 font-bold text-sm text-red-600 cursor-pointer"><input type="radio" name="exitType" checked={exitType === 'ABANDONO'} onChange={() => setExitType('ABANDONO')} /> ABANDONO</label></div><textarea className="w-full p-3 border rounded-xl h-24" placeholder="Motivo detalhado da saída..." value={exitReason} onChange={e => setExitReason(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">CANCELAR</button><button onClick={handleRegisterExit} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg">CONFIRMAR SAÍDA</button></div></div></div></div>)}
      {isImportModalOpen && (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"><h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><FileSpreadsheet size={24} /> Importar Excel</h3><div className="space-y-4"><div><label className="block text-sm font-bold text-slate-700 mb-1">Bimestre de Referência</label><select title="bim" className="w-full p-3 border rounded-xl" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select></div><div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50">{importing ? <p className="animate-pulse font-bold text-indigo-600">Sincronizando...</p> : <input title="file" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="w-full text-sm" />}</div><div className="flex justify-end"><button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Fechar</button></div></div></div></div>)}
      {isNewStudentModalOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"><h3 className="font-bold text-xl mb-6 text-indigo-900">Cadastrar Novo Aluno</h3><form onSubmit={handleAddStudent} className="space-y-4"><div><label className="text-xs font-bold uppercase text-slate-400">Nome Completo</label><input title="nome" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div><div><label className="text-xs font-bold uppercase text-slate-400">Turma</label><input title="turma" value={newClass} onChange={e => setNewClass(e.target.value)} className="w-full p-3 border rounded-xl mt-1" required /></div><div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Salvar</button></div></form></div></div>)}

      <button onClick={() => setIsQuickModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-all border-4 border-white"><Zap size={32} /></button>
    </div>
  );
}
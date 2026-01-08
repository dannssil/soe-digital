import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { LayoutDashboard, Users, BookOpen, LogOut, Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock, FileText, CheckSquare, Phone, UserCircle, FileDown, CalendarDays, Zap, Menu, Search as SearchIcon, Users2, MoreHorizontal, Folder, BarChart3 as BarChartIcon, FileSpreadsheet, MapPin, Clock, ShieldCheck, ChevronRight, Copy, History, GraduationCap, Printer, FileBarChart2, Database, Settings, Trash2, Maximize2, MonitorPlay, Eye, EyeOff, Filter, Calendar, ClipboardList, ArrowLeft, Home, ChevronLeft, Star, Activity, Heart, Brain, PenTool, Copyright, Code, PieChart as PieChartIcon, FileOutput, ThumbsUp, Puzzle, Scale, Cake, Siren, Bell, ListChecks, FileInput } from 'lucide-react';

const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co";
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";
const supabase = createClient(supabaseUrl, supabaseKey);

const SYSTEM_USER_NAME = "Daniel Alves da Silva";
const SYSTEM_ROLE = "Orientador Educacional";
const SYSTEM_MATRICULA = "Mat: 212.235-9 | SEEDF";
const SYSTEM_ORG = "CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

const DEFAULT_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const DEFAULT_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const DEFAULT_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const DEFAULT_ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];
const AGENDA_CATEGORIES = ["ESTUDANTE", "PAIS", "PROFESSOR", "COLETIVO", "COORDENAÇÃO", "CONSELHO"];
const FLASH_REASONS = ["Uniforme Inadequado", "Atraso / Chegada Tardia", "Uso de Celular", "Sem Material", "Saída de Sala", "Conversa / Bagunça", "Conflito entre Colegas", "Sono em Sala", "Falta de Atividade", "Elogio / Destaque", "Encaminhamento Saúde", "Outros"];

// --- HELPERS E COMPONENTES ---
const getAge = (dateString: string) => { if (!dateString) return '-'; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age + " anos"; };

function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  const safeName = name || "Aluno"; const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses: any = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-2xl", "2xl": "w-40 h-40 text-4xl" };
  const pxSize: any = { sm: 32, md: 40, lg: 64, xl: 96, "2xl": 160 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

const StudentList = ({ students, onSelectStudent, filterType }: any) => {
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
                {filterType === 'NEE' && (<><td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold text-xs">{s.nee_description}</span></td><td className="px-6 py-4 text-slate-600 font-bold">{getAge(s.birth_date)}</td></>)}
                {filterType === 'CT' && (<><td className="px-6 py-4 text-orange-700 font-bold text-xs uppercase">{s.ct_council_name}</td><td className="px-6 py-4 text-slate-500 text-xs italic truncate max-w-[200px]">{s.ct_referral}</td></>)}
                {filterType !== 'NEE' && filterType !== 'CT' && (<><td className="px-6 py-4 text-slate-500 font-bold">{s.class_id}</td><td className="px-6 py-4"><div className="flex gap-2 flex-wrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>{s.nee_description && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">NEE</span>}{s.ct_referral && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">CT</span>}</div></td></>)}
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
  // --- ESTADOS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [view, setView] = useState<'dashboard' | 'students' | 'conselho' | 'agenda'>('dashboard');
  const [dashboardFilterType, setDashboardFilterType] = useState<'ALL' | 'RISK' | 'NEE' | 'CT'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'dossie' | 'familia'>('perfil');
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  // Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(''); const [editClass, setEditClass] = useState(''); 
  const [editGuardian, setEditGuardian] = useState(''); const [editPhone, setEditPhone] = useState(''); const [editAddress, setEditAddress] = useState('');
  const [editNee, setEditNee] = useState(''); const [editCtReason, setEditCtReason] = useState('');
  const [editCtCouncil, setEditCtCouncil] = useState(''); const [editCtDate, setEditCtDate] = useState('');
  const [editHealthInfo, setEditHealthInfo] = useState('');
  const [editLegacyRecords, setEditLegacyRecords] = useState('');
  const [editProtectiveNetwork, setEditProtectiveNetwork] = useState('');

  // Agenda & Conselho
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('ESTUDANTE');
  const [newEventStudentId, setNewEventStudentId] = useState('');
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');
  const [conselhoTurma, setConselhoTurma] = useState('');
  const [radarData, setRadarData] = useState({ assiduidade: 3, participacao: 3, relacionamento: 3, rendimento: 3, tarefas: 3 });
  const [dataConselho, setDataConselho] = useState(new Date().toISOString().split('T')[0]);
  const [projectedStudent, setProjectedStudent] = useState<any | null>(null);
  const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
  const [councilObs, setCouncilObs] = useState('');
  const [councilEnc, setCouncilEnc] = useState('');

  // Atendimento
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [obsLivre, setObsLivre] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');

  // Outros
  const [listComportamento, setListComportamento] = useState<string[]>(DEFAULT_COMPORTAMENTO);
  const [listPedagogico, setListPedagogico] = useState<string[]>(DEFAULT_PEDAGOGICO);
  const [listSocial, setListSocial] = useState<string[]>(DEFAULT_SOCIAL);
  const [listEncaminhamentos, setListEncaminhamentos] = useState<string[]>(DEFAULT_ENCAMINHAMENTOS);
  const [newItem, setNewItem] = useState('');
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');
  const [newName, setNewName] = useState(''); const [newClass, setNewClass] = useState('');
  const [listClassFilter, setListClassFilter] = useState<string | null>(null);

  useEffect(() => { const savedAuth = localStorage.getItem('soe_auth'); if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); fetchAgenda(); } }, []);

  async function fetchStudents() { const { data, error } = await supabase.from('students').select(`*, logs(*), desempenho:desempenho_bimestral(*)`).order('name'); if (!error && data) setStudents(data); }
  async function fetchAgenda() { const { data } = await supabase.from('agenda').select(`*, student:students(name, class_id)`).order('event_date'); if (data) setAgenda(data); }

  const checkRisk = (student: any) => { const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0; const ult = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null; let nV = 0; if (ult) { nV = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf'].filter(disc => ult[disc] !== null && ult[disc] < 5).length; } return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: nV > 3, totalFaltas, notasVermelhas: nV }; };
  const stats = useMemo(() => { const allL = students.flatMap(s => s.logs || []); const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const c = allL.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length; return { name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), total: c }; }).reverse(); const mC: any = {}; allL.forEach(l => { try { const d = JSON.parse(l.description); if (d.motivos) d.motivos.forEach((m: string) => { mC[m] = (mC[m] || 0) + 1; }); } catch (e) { } }); return { last7Days: last7, pieData: Object.keys(mC).map(key => ({ name: key, value: mC[key] })).sort((a, b) => b.value - a.value).slice(0, 5), allLogs: allL }; }, [students]);
  
  const toggleItem = (list: string[], setList: any, item: string) => { if (list.includes(item)) setList(list.filter((i: string) => i !== item)); else setList([...list, item]); };
  const addListItem = (listName: string) => { if (!newItem) return; if (listName === 'comp') setListComportamento([...listComportamento, newItem]); if (listName === 'ped') setListPedagogico([...listPedagogico, newItem]); if (listName === 'soc') setListSocial([...listSocial, newItem]); if (listName === 'enc') setListEncaminhamentos([...listEncaminhamentos, newItem]); setNewItem(''); };
  const removeListItem = (listName: string, item: string) => { if (listName === 'comp') setListComportamento(listComportamento.filter(i => i !== item)); if (listName === 'ped') setListPedagogico(listPedagogico.filter(i => i !== item)); if (listName === 'soc') setListSocial(listSocial.filter(i => i !== item)); if (listName === 'enc') setListEncaminhamentos(listEncaminhamentos.filter(i => i !== item)); };

  const startEditing = () => { if (selectedStudent) { setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); setEditNee(selectedStudent.nee_description || ''); setEditCtReason(selectedStudent.ct_referral || ''); setEditCtCouncil(selectedStudent.ct_council_name || ''); setEditCtDate(selectedStudent.ct_date || ''); setEditHealthInfo(selectedStudent.health_info || ''); setEditLegacyRecords(selectedStudent.legacy_records || ''); setEditProtectiveNetwork(selectedStudent.protective_network || ''); setIsEditing(true); } };
  const saveEdits = async () => { if (!selectedStudent) return; const updates = { name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress, nee_description: editNee, ct_referral: editCtReason, ct_council_name: editCtCouncil, ct_date: editCtDate || null, health_info: editHealthInfo, legacy_records: editLegacyRecords, protective_network: editProtectiveNetwork }; await supabase.from('students').update(updates).eq('id', selectedStudent.id); alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); fetchAgenda(); } };
  const handleSaveLog = async () => { if (!selectedStudent) return; const cat = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: cat, description: desc, resolved: resolvido, created_at: new Date(attendanceDate).toISOString() }]); alert('Salvo!'); setMotivosSelecionados([]); setObsLivre(""); setResolvido(false); fetchStudents(); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files || e.target.files.length === 0) return; setImporting(true); const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (evt) => { try { const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const ws = wb.Sheets[wb.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(ws); for (const row of (data as any[])) { const aluno = students.find(s => s.name.toUpperCase().trim() === row['Estudante']?.toString().toUpperCase().trim()); if (aluno && row['LP']) { const pN = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: pN(row['ART']), cie: pN(row['CIE']), edf: pN(row['EDF']), geo: pN(row['GEO']), his: pN(row['HIS']), ing: pN(row['ING']), lp: pN(row['LP']), mat: pN(row['MAT']), pd1: pN(row['PD1']), faltas_bimestre: row['FALTAS'] || 0 }]); } } alert(`Sucesso!`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); } catch (err) { alert('Erro: ' + err); setImporting(false); } }; reader.readAsBinaryString(file); };

  const handleSaveEvent = async () => { await supabase.from('agenda').insert([{ title: newEventTitle, event_date: newEventDate, category_type: newEventCategory, student_id: newEventStudentId || null }]); alert('Compromisso agendado!'); fetchAgenda(); setIsNewEventModalOpen(false); };
  const handleToggleEvent = async (id: string, cur: boolean) => { await supabase.from('agenda').update({ completed: !cur }).eq('id', id); fetchAgenda(); };
  const toggleHighlight = async (sId: string, cur: boolean, e: React.MouseEvent) => { e.stopPropagation(); await supabase.from('students').update({ is_highlight: !cur }).eq('id', sId); fetchStudents(); };
  const togglePraise = async (sId: string, cur: boolean, e: React.MouseEvent) => { e.stopPropagation(); await supabase.from('students').update({ is_praised: !cur }).eq('id', sId); fetchStudents(); };
  const handleRegisterExit = async () => { if (!selectedStudent) return; const logDesc = JSON.stringify({ solicitante: 'Secretaria/SOE', motivos: [exitType], obs: `SAÍDA REGISTRADA. Motivo detalhado: ${exitReason}` }); await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: 'Situação Escolar', description: logDesc, resolved: true }]); await supabase.from('students').update({ status: exitType }).eq('id', selectedStudent.id); alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); };
  const handleSaveRadar = async () => { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; await supabase.from('class_radar').upsert({ turma: targetClass, bimestre: selectedBimestre, ...radarData }, { onConflict: 'turma, bimestre' }); alert('Avaliação Salva!'); setIsEvalModalOpen(false); };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if (!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) { if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return; const file = event.target.files[0]; const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) { alert('Erro upload: ' + error.message); return; } const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id); setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents(); }
  const handleUpdateGrade = (field: string, value: string) => { if(!projectedStudent) return; const newStudent = { ...projectedStudent }; const bimIndex = newStudent.desempenho.findIndex((d:any) => d.bimestre === selectedBimestre); if (bimIndex >= 0) { const numValue = value === '' ? null : parseFloat(value.replace(',', '.')); newStudent.desempenho[bimIndex][field] = numValue; setProjectedStudent(newStudent); } };
  const handleSaveCouncilChanges = async () => { if(!projectedStudent) return; const d = projectedStudent.desempenho.find((x:any) => x.bimestre === selectedBimestre); if(!d) return; await supabase.from('desempenho_bimestral').update({ lp: d.lp, mat: d.mat, cie: d.cie, his: d.his, geo: d.geo, ing: d.ing, art: d.art, edf: d.edf, pd1: d.pd1, pd2: d.pd2, pd3: d.pd3, faltas_bimestre: d.faltas_bimestre, obs_conselho: councilObs, encaminhamento_conselho: councilEnc }).eq('id', d.id); alert('Salvo!'); fetchStudents(); };

  // --- GERADORES DE PDF (DOCUMENTOS) ---
  const printStudentData = (doc: jsPDF, student: any) => { 
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, { align: "center" }); doc.text("CED 04 DO GUARÁ - SOE", 105, 22, { align: "center" }); doc.setLineWidth(0.5); doc.line(14, 25, 196, 25); doc.setFontSize(11); doc.text(`FICHA INDIVIDUAL DO ESTUDANTE`, 14, 35);
      autoTable(doc, { startY: 40, head: [['Informação', 'Detalhe']], body: [['Nome Completo', student.name], ['Turma', student.class_id], ['Nascimento', student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '-'], ['Responsável', student.guardian_name || 'Não informado'], ['Saúde/NEE', student.nee_description || 'Nenhuma']], theme: 'grid' });
      let curY = (doc as any).lastAutoTable.finalY + 10; doc.text("HISTÓRICO DE ATENDIMENTOS E EVOLUÇÃO", 14, curY);
      const logsD = student.logs?.map((l: any) => [new Date(l.created_at).toLocaleDateString(), l.category, JSON.parse(l.description).obs]) || []; autoTable(doc, { startY: curY + 5, head: [['Data', 'Tipo', 'Descrição']], body: logsD, theme: 'grid' });
      doc.addPage(); doc.text("TERMO DE CIÊNCIA / ASSINATURAS", 14, 20); doc.line(14, 60, 90, 60); doc.text("Responsável", 14, 65); doc.line(110, 60, 190, 60); doc.text("Orientador(a)", 110, 65);
  };
  const generatePDF = () => { if (selectedStudent) { const doc = new jsPDF(); printStudentData(doc, selectedStudent); doc.save(`Ficha_${selectedStudent.name}.pdf`); } };
  
  const generateDeclaration = () => { if(selectedStudent) { const doc = new jsPDF(); doc.setFont("times", "bold"); doc.text("CED 04 DO GUARÁ - DECLARAÇÃO", 105, 40, {align: "center"}); doc.setFont("times", "normal"); const text = `Declaramos que o(a) Sr(a) ${selectedStudent.guardian_name || '____________________'}, responsável pelo(a) estudante ${selectedStudent.name}, da turma ${selectedStudent.class_id}, esteve presente nesta Unidade Escolar no dia ${new Date().toLocaleDateString()} para atendimento junto ao Serviço de Orientação Educacional.`; doc.text(doc.splitTextToSize(text, 170), 20, 60); doc.text("Guará, " + new Date().toLocaleDateString(), 20, 100); doc.line(60, 140, 150, 140); doc.text("Orientador Educacional", 105, 145, {align: "center"}); doc.save(`Declaracao_${selectedStudent.name}.pdf`); } };
  
  const generateReferralReport = () => { if(selectedStudent) { const doc = new jsPDF(); doc.setFont("times", "bold"); doc.text("OFÍCIO DE ENCAMINHAMENTO - REDE PROTETIVA", 105, 30, {align: "center"}); doc.setFontSize(12); doc.text(`Estudante: ${selectedStudent.name}`, 20, 50); doc.text(`Responsável: ${selectedStudent.guardian_name}`, 20, 60); doc.text(`Turma: ${selectedStudent.class_id}`, 140, 50); doc.line(20, 70, 190, 70); doc.setFont("times", "normal"); doc.text("Ao Conselho Tutelar / Unidade de Saúde,", 20, 80); doc.text("Pelo presente, encaminhamos o(a) estudante supracitado(a) para acompanhamento, conforme relato abaixo:", 20, 95); const reason = selectedStudent.protective_network || selectedStudent.ct_referral || "Motivo não especificado."; doc.text(doc.splitTextToSize(reason, 170), 20, 110); doc.text("Colocamo-nos à disposição para mais esclarecimentos.", 20, 200); doc.text("Brasília, " + new Date().toLocaleDateString(), 20, 220); doc.line(60, 250, 150, 250); doc.text("Orientação Educacional - CED 04", 105, 255, {align: "center"}); doc.save(`Encaminhamento_${selectedStudent.name}.pdf`); } };

  const generateSuperAta = (target: string) => { const cS = students.filter(s => s.class_id === target); if(cS.length === 0) return alert('Turma vazia'); const doc = new jsPDF({ orientation: 'landscape' }); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(`ATA DE CONSELHO - ${target}`, 148, 20, {align: "center"}); autoTable(doc, { startY: 32, head: [['Indicador', 'Assiduidade', 'Participação', 'Relacionamento', 'Rendimento', 'Tarefas']], body: [[ 'Avaliação (0-5)', radarData.assiduidade, radarData.participacao, radarData.relacionamento, radarData.rendimento, radarData.tarefas ]], theme: 'grid' }); const rows = cS.map(s => { const d = s.desempenho?.find((x:any) => x.bimestre === selectedBimestre) || {}; return [s.name, d.lp||'-', d.mat||'-', d.cie||'-', d.his||'-', d.geo||'-', d.ing||'-', d.art||'-', d.edf||'-', d.faltas_bimestre||0, s.logs?.length||0]; }); autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, head: [['Estudante', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'Faltas', 'Ocorr.']], body: rows, styles: {fontSize: 7} }); doc.save(`ATA_${target}.pdf`); };
  const renderDashboard = () => {
    let sR = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoNotas; });
    const tE = agenda.filter(e => new Date(e.event_date).toDateString() === new Date().toDateString());
    return (
      <div className="space-y-6 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div onClick={() => { setDashboardFilterType('ALL'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total</p><p className="text-2xl font-black">{students.length}</p></div><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><Users2 size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('RISK'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Alerta</p><p className="text-2xl font-black text-red-600">{sR.length}</p></div><div className="bg-red-50 p-3 rounded-lg text-red-600"><AlertTriangle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('NEE'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">NEE</p><p className="text-2xl font-black text-purple-600">{students.filter(s => s.nee_description).length}</p></div><div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Puzzle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('CT'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">CT</p><p className="text-2xl font-black text-orange-600">{students.filter(s => s.ct_referral).length}</p></div><div className="bg-orange-50 p-3 rounded-lg text-orange-600"><Scale size={20}/></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Volume Atendimentos</h4><div className="flex-1 min-h-0"><ResponsiveContainer><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="total" stroke="#6366f1"/></LineChart></ResponsiveContainer></div></div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Recorrência</h4><div className="flex-1 min-h-0"><PieChart><Pie data={stats.pieData} innerRadius={40} outerRadius={60} dataKey="value">{stats.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></div></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase mb-4"><CalendarDays size={18}/> Compromissos de Hoje</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{tE.length > 0 ? tE.map(e => (<div key={e.id} className="p-3 rounded-lg border flex items-center justify-between bg-indigo-50/30"><div><p className="text-sm font-bold">{e.title}</p><p className="text-[10px] uppercase">{e.category_type}</p></div><button onClick={() => handleToggleEvent(e.id, e.completed)} className={e.completed ? 'text-green-600' : 'text-slate-300'}><CheckSquare size={14}/></button></div>)) : <p className="text-xs text-slate-400">Sem compromissos.</p>}</div>
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

  const renderAgenda = () => (
      <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-2xl font-bold flex items-center gap-3"><CalendarDays/> Agenda</h2>
              <button onClick={() => setIsNewEventModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">+ Novo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AGENDA_CATEGORIES.map(cat => (
                  <div key={cat} className="bg-white rounded-xl border p-4 shadow-sm h-[400px] flex flex-col">
                      <h4 className="font-bold text-xs uppercase mb-4 border-b pb-2">{cat}</h4>
                      <div className="flex-1 overflow-y-auto space-y-3">
                          {agenda.filter(a => a.category_type === cat).map(e => (
                              <div key={e.id} className="p-4 rounded-xl border bg-white">
                                  <span className="text-[10px] font-bold text-indigo-600">{new Date(e.event_date).toLocaleDateString()}</span>
                                  <p className="font-bold text-sm">{e.title}</p>
                                  <button onClick={async () => { await supabase.from('agenda').delete().eq('id', e.id); fetchAgenda(); }} className="text-red-400 mt-2"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderConselho = () => {
    const turmas = [...new Set(students.map(s => s.class_id))].sort(); 
    const targetClass = conselhoTurma || turmas[0]; 
    let cS = students.filter(s => s.class_id === targetClass);
    return (
        <div className="max-w-[1800px] mx-auto pb-4 w-full h-full flex flex-col overflow-hidden">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Conselho de Classe</h2>
                <div className="flex gap-2">
                    <select className="border p-1" value={targetClass} onChange={e => setConselhoTurma(e.target.value)}>{turmas.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <button onClick={() => generateSuperAta(targetClass)} className="bg-indigo-600 text-white px-4 py-2 rounded">Gerar Ata</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0"><tr><th className="p-3">Ações</th><th className="p-3">Nome</th><th className="p-3 text-center">Faltas</th></tr></thead>
                    <tbody>{cS.map(s => (<tr key={s.id} onClick={() => setProjectedStudent(s)} className="border-b hover:bg-slate-50 cursor-pointer"><td className="p-3 flex gap-2"><button onClick={(e) => toggleHighlight(s.id, s.is_highlight, e)}><Star size={14} className={s.is_highlight ? 'fill-orange-400 text-orange-400' : 'text-slate-300'}/></button></td><td className="p-3 font-bold">{s.name}</td><td className="p-3 text-center">{s.desempenho?.[0]?.faltas_bimestre || 0}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
  };

  if (!isAuthenticated) return (<div className="h-screen bg-slate-900 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center"><Lock size={32} className="mx-auto mb-4 text-indigo-600"/><h1 className="text-2xl font-bold mb-4">SOE Digital</h1><form onSubmit={handleLogin}><input type="password" className="w-full border p-3 rounded mb-4" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} /><button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded">Entrar</button></form></div></div>);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1E1E2D] text-white flex flex-col shadow-2xl transition-transform md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10"><BookOpen/> <h1 className="font-bold">SOE Digital</h1></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-indigo-600' : ''}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'students' ? 'bg-indigo-600' : ''}`}><Users size={18} /> Alunos</button>
          <button onClick={() => setView('agenda')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'agenda' ? 'bg-indigo-600' : ''}`}><CalendarDays size={18} /> Agenda Digital</button>
          <button onClick={() => setView('conselho')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'conselho' ? 'bg-indigo-600' : ''}`}><GraduationCap size={18} /> Conselho</button>
        </nav>
        <div className="p-4 border-t border-white/5 flex items-center gap-3"><Avatar name={SYSTEM_USER_NAME} size="sm"/><p className="text-[10px] font-bold">{SYSTEM_USER_NAME}</p></div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden"><Menu/></button><div className="flex-1 max-w-md relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}/></div><Zap onClick={() => setIsQuickModalOpen(true)} className="text-amber-500 cursor-pointer"/></header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{view === 'dashboard' && renderDashboard()}{view === 'agenda' && renderAgenda()}{view === 'students' && (<div className="max-w-[1600px] mx-auto space-y-6"><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold">+ Novo Aluno</button><StudentList students={students.filter(s => s.name.toLowerCase().includes(globalSearch.toLowerCase()) && (dashboardFilterType === 'ALL' || (dashboardFilterType === 'NEE' && s.nee_description) || (dashboardFilterType === 'CT' && s.ct_referral)))} onSelectStudent={(s:any) => { setSelectedStudent(s); setIsModalOpen(true); }} filterType={dashboardFilterType} /></div>)}{view === 'conselho' && renderConselho()}</div>
      </main>
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b flex justify-between bg-slate-50 flex-shrink-0">
                    <div className="flex items-center gap-6"><Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="xl" /><div><h2 className="text-3xl font-bold">{selectedStudent.name}</h2><p>Turma {selectedStudent.class_id}</p></div></div>
                    <div className="flex gap-2"><button onClick={generatePDF} className="bg-purple-100 p-3 rounded-full"><FileDown/></button><button onClick={startEditing} className="bg-indigo-100 p-3 rounded-full"><Pencil/></button><X onClick={() => setIsModalOpen(false)} className="cursor-pointer"/></div>
                </div>
                <div className="flex border-b px-8 bg-white overflow-x-auto gap-8 flex-shrink-0">{['perfil', 'academico', 'dossie', 'historico', 'familia'].map(t => <button key={t} onClick={() => setActiveTab(t as any)} className={`py-5 font-bold uppercase ${activeTab === t ? 'border-b-4 border-indigo-600' : ''}`}>{t}</button>)}</div>
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'dossie' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-bold flex items-center gap-2"><Heart className="text-red-500"/> Saúde</h3>
                                <textarea className="w-full border p-2 rounded h-32" value={editHealthInfo} onChange={e => setEditHealthInfo(e.target.value)} placeholder="Laudos e CID..."/>
                                <button onClick={saveEdits} className="bg-slate-800 text-white w-full py-2 rounded">Salvar Saúde</button>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-bold flex items-center gap-2"><Siren className="text-orange-500"/> Rede Protetiva</h3>
                                <textarea className="w-full border p-2 rounded h-32" value={editProtectiveNetwork} onChange={e => setEditProtectiveNetwork(e.target.value)} placeholder="Contatos CRAS/CT..."/>
                                <button onClick={generateReferralReport} className="bg-indigo-600 text-white w-full py-2 rounded flex items-center justify-center gap-2"><FileText size={16}/> Gerar Ofício Encaminhamento</button>
                            </div>
                            <div className="bg-indigo-900 p-8 rounded-xl text-white space-y-4">
                                <h3 className="font-bold">Documentos Oficiais</h3>
                                <button onClick={generateDeclaration} className="w-full bg-white/10 p-4 rounded-xl flex items-center gap-3"><FileText/> Declaração Comparecimento</button>
                                <button onClick={generatePDF} className="w-full bg-white/10 p-4 rounded-xl flex items-center gap-3"><ListChecks/> Ficha Atendimento (Ata)</button>
                            </div>
                        </div>
                    )}
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
      {isNewEventModalOpen && <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"><div className="bg-white p-8 rounded-xl w-96"><h3>Agendar</h3><input className="w-full border mb-2 p-2" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Título"/><input type="datetime-local" className="w-full border mb-4 p-2" value={newEventDate} onChange={e => setNewEventDate(e.target.value)}/><button onClick={handleSaveEvent} className="bg-indigo-600 text-white w-full py-2 rounded">Agendar</button></div></div>}
      {isQuickModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3>Registro Rápido</h3><input className="w-full border p-2" value={quickSearchTerm} onChange={e => setQuickSearchTerm(e.target.value)} placeholder="Aluno..."/><div className="max-h-40 overflow-y-auto">{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0,5).map(s => <div key={s.id} onClick={() => {setQuickSelectedStudent(s); setQuickSearchTerm(s.name);}} className="p-2 border-b cursor-pointer">{s.name}</div>)}</div><button onClick={() => {supabase.from('logs').insert([{student_id: quickSelectedStudent.id, category:'Atendimento SOE', description: JSON.stringify({obs:'Registro Rápido'})}]); setIsQuickModalOpen(false);}} className="bg-green-600 text-white w-full py-3 mt-4">Confirmar</button></div></div>}
    </div>
  );
}
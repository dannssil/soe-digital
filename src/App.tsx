import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { 
  LayoutDashboard, Users, BookOpen, LogOut, Plus, Save, X, AlertTriangle, Camera, User, Pencil, Lock, 
  FileText, CheckSquare, Phone, UserCircle, FileDown, CalendarDays, Zap, Menu, Search as SearchIcon, 
  Users2, MoreHorizontal, Folder, BarChart3 as BarChartIcon, FileSpreadsheet, MapPin, Clock, ShieldCheck, 
  ChevronRight, Copy, History, GraduationCap, Printer, FileBarChart2, Database, Settings, Trash2, 
  Maximize2, MonitorPlay, Eye, EyeOff, Filter, Calendar, ClipboardList, ArrowLeft, Home, ChevronLeft, 
  Star, Activity, Heart, Brain, PenTool, Copyright, Code, PieChart as PieChartIcon, FileOutput, ThumbsUp, 
  Puzzle, Scale, Cake, Siren, Bell, ListChecks, FileInput, Book, FileSignature 
} from 'lucide-react';

// --- CONEXÃO COM SUPABASE ---
const supabaseUrl = "https://zfryhzmujfaqqzybjuhb.supabase.co";
const supabaseKey = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES GERAIS ---
const SYSTEM_USER_NAME = "Daniel Alves da Silva";
const SYSTEM_ROLE = "Orientador Educacional";
const SYSTEM_MATRICULA = "Mat: 212.235-9 | SEEDF";
const SYSTEM_ORG = "CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1";
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

// --- TEMPLATES DE DOCUMENTOS ---
const TEXTO_CONVOCACAO = "O Centro Educacional 4 do Guará convoca-a para comparecer com urgência à escola no dia [DATA] às [HORA] para tratar de assuntos relacionados ao seu filho(a) [NOME_ALUNO], da turma [TURMA]. Será uma oportunidade valiosa para discutirmos questões de extrema importância para o desenvolvimento do estudante.\n\nDe acordo com a Lei da Educação Nacional (Lei nº 9.394/96), é obrigação dos pais participarem ativamente da vida escolar de seus filhos. Como parte desse compromisso, reforçamos esta convocação.\n\nSua presença é vital para garantir o sucesso e o bem-estar do estudante na escola.\nNão deixem de comparecer!";
const TEXTO_DECLARACAO = "Declaramos para os devidos fins que o(a) Senhor(a) [NOME_RESPONSAVEL], responsável pelo(a) estudante [NOME_ALUNO], da turma [TURMA], esteve nesta Unidade de Ensino no dia [DATA_HOJE], no período de ______ às ______, para tratar de assuntos relacionados ao desempenho e acompanhamento escolar do(a) referido(a) aluno(a).";

// --- LISTAS PADRÃO ---
const DEFAULT_COMPORTAMENTO = ["Conversa excessiva", "Desacato", "Agressividade verbal", "Agressividade física", "Uso de celular", "Saída s/ autorização", "Bullying", "Desobediência", "Uniforme", "Outros"];
const DEFAULT_PEDAGOGICO = ["Sem tarefa", "Dificuldade aprend.", "Sem material", "Desatenção", "Baixo desempenho", "Faltas excessivas", "Sono em sala", "Outros"];
const DEFAULT_SOCIAL = ["Ansiedade", "Problemas familiares", "Isolamento", "Conflito colegas", "Saúde/Laudo", "Vulnerabilidade", "Outros"];
const DEFAULT_ENCAMINHAMENTOS = ["Coordenação", "Psicologia", "Família", "Direção", "Conselho Tutelar", "Sala Recursos", "Apoio Aprendizagem", "Disciplinar", "Saúde"];

// --- COMPONENTES AUXILIARES ---
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

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  // ESTADOS GERAIS
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'students' | 'conselho' | 'documentos'>('dashboard');
  const [dashboardFilterType, setDashboardFilterType] = useState<'ALL' | 'RISK' | 'NEE' | 'CT'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  
  // MODAIS (TODOS)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false); // Docs
  const [isTermoModalOpen, setIsTermoModalOpen] = useState(false); // Docs
  
  // ESTADOS DIVERSOS
  const [importing, setImporting] = useState(false);
  const [projectedStudent, setProjectedStudent] = useState<any | null>(null);
  const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
  const [radarData, setRadarData] = useState({ assiduidade: 3, participacao: 3, relacionamento: 3, rendimento: 3, tarefas: 3 });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(''); const [editClass, setEditClass] = useState(''); const [editGuardian, setEditGuardian] = useState(''); const [editPhone, setEditPhone] = useState(''); const [editAddress, setEditAddress] = useState('');
  const [editNee, setEditNee] = useState(''); const [editCtReason, setEditCtReason] = useState(''); const [editCtCouncil, setEditCtCouncil] = useState(''); const [editCtDate, setEditCtDate] = useState('');
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');
  const [conselhoTurma, setConselhoTurma] = useState('');
  const [dataConselho, setDataConselho] = useState(new Date().toISOString().split('T')[0]);
  const [councilObs, setCouncilObs] = useState(''); const [councilEnc, setCouncilEnc] = useState('');
  
  // ESTADOS DE DOCUMENTOS
  const [docStudent, setDocStudent] = useState<any | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [docType, setDocType] = useState(''); 
  const [docContent, setDocContent] = useState('');
  const [termoChecks, setTermoChecks] = useState<string[]>([]);

  // OUTROS ESTADOS
  const [listComportamento, setListComportamento] = useState<string[]>(DEFAULT_COMPORTAMENTO);
  const [listPedagogico, setListPedagogico] = useState<string[]>(DEFAULT_PEDAGOGICO);
  const [listSocial, setListSocial] = useState<string[]>(DEFAULT_SOCIAL);
  const [listEncaminhamentos, setListEncaminhamentos] = useState<string[]>(DEFAULT_ENCAMINHAMENTOS);
  const [newItem, setNewItem] = useState('');
  const [newName, setNewName] = useState(''); const [newClass, setNewClass] = useState('');
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [obsLivre, setObsLivre] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<any | null>(null);
  const [quickReason, setQuickReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');
  const [globalSearch, setGlobalSearch] = useState('');
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [listClassFilter, setListClassFilter] = useState<string | null>(null);

  // --- EFEITOS E BUSCA DE DADOS ---
  useEffect(() => { const savedAuth = localStorage.getItem('soe_auth'); if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); } }, []);
  async function fetchStudents() { 
    setLoading(true);
    const { data, error } = await supabase.from('students').select(`*, logs(*), desempenho:desempenho_bimestral(*)`).order('name'); 
    if (!error && data) setStudents(data); 
    else if (error) console.error("Erro Supabase:", error);
    setLoading(false);
  }

  // --- LÓGICA E CÁLCULOS ---
  const checkRisk = (student: any) => { const totalFaltas = student.desempenho?.reduce((acc: number, d: any) => acc + (d.faltas_bimestre || 0), 0) || 0; const ult = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null; let nV = 0; if (ult) { nV = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf'].filter(disc => ult[disc] !== null && ult[disc] < 5).length; } return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: nV > 3, totalFaltas, notasVermelhas: nV }; };
  const stats = useMemo(() => { const allL = students.flatMap(s => s.logs || []); const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const c = allL.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length; return { name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), total: c }; }).reverse(); const mC: any = {}; allL.forEach(l => { try { const d = JSON.parse(l.description); if (d.motivos) d.motivos.forEach((m: string) => { mC[m] = (mC[m] || 0) + 1; }); } catch (e) { } }); return { last7Days: last7, pieData: Object.keys(mC).map(key => ({ name: key, value: mC[key] })).sort((a, b) => b.value - a.value).slice(0, 5), allLogs: allL }; }, [students]);
  
  const toggleItem = (list: string[], setList: any, item: string) => { if (list.includes(item)) setList(list.filter((i: string) => i !== item)); else setList([...list, item]); };
  const addListItem = (listName: string) => { if (!newItem) return; if (listName === 'comp') setListComportamento([...listComportamento, newItem]); if (listName === 'ped') setListPedagogico([...listPedagogico, newItem]); if (listName === 'soc') setListSocial([...listSocial, newItem]); if (listName === 'enc') setListEncaminhamentos([...listEncaminhamentos, newItem]); setNewItem(''); };
  const removeListItem = (listName: string, item: string) => { if (listName === 'comp') setListComportamento(listComportamento.filter(i => i !== item)); if (listName === 'ped') setListPedagogico(listPedagogico.filter(i => i !== item)); if (listName === 'soc') setListSocial(listSocial.filter(i => i !== item)); if (listName === 'enc') setListEncaminhamentos(listEncaminhamentos.filter(i => i !== item)); };

  const startEditing = () => { if (selectedStudent) { setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || ''); setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || ''); setEditNee(selectedStudent.nee_description || ''); setEditCtReason(selectedStudent.ct_referral || ''); setEditCtCouncil(selectedStudent.ct_council_name || ''); setEditCtDate(selectedStudent.ct_date || ''); setIsEditing(true); } };
  const saveEdits = async () => { if (!selectedStudent) return; const updates = { name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress, nee_description: editNee, ct_referral: editCtReason, ct_council_name: editCtCouncil, ct_date: editCtDate || null }; await supabase.from('students').update(updates).eq('id', selectedStudent.id); alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); } };
  const handleSaveLog = async () => { if (!selectedStudent) return; const cat = activeTab === 'familia' ? 'Família' : 'Atendimento SOE'; const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, obs: obsLivre }); await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: cat, description: desc, resolved: resolvido, created_at: new Date(attendanceDate).toISOString() }]); alert('Salvo!'); setMotivosSelecionados([]); setObsLivre(""); setResolvido(false); fetchStudents(); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files || e.target.files.length === 0) return; setImporting(true); const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (evt) => { try { const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const ws = wb.Sheets[wb.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(ws); for (const row of (data as any[])) { const aluno = students.find(s => s.name.toUpperCase().trim() === row['Estudante']?.toString().toUpperCase().trim()); if (aluno && row['LP']) { const pN = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : null; await supabase.from('desempenho_bimestral').insert([{ aluno_id: aluno.id, bimestre: selectedBimestre, art: pN(row['ART']), cie: pN(row['CIE']), edf: pN(row['EDF']), geo: pN(row['GEO']), his: pN(row['HIS']), ing: pN(row['ING']), lp: pN(row['LP']), mat: pN(row['MAT']), pd1: pN(row['PD1']), faltas_bimestre: row['FALTAS'] || 0 }]); } } alert(`Sucesso!`); setIsImportModalOpen(false); setImporting(false); fetchStudents(); } catch (err) { alert('Erro: ' + err); setImporting(false); } }; reader.readAsBinaryString(file); };

  const toggleHighlight = async (sId: string, cur: boolean, e: React.MouseEvent) => { e.stopPropagation(); await supabase.from('students').update({ is_highlight: !cur }).eq('id', sId); fetchStudents(); };
  const togglePraise = async (sId: string, cur: boolean, e: React.MouseEvent) => { e.stopPropagation(); await supabase.from('students').update({ is_praised: !cur }).eq('id', sId); fetchStudents(); };
  const handleRegisterExit = async () => { if (!selectedStudent) return; const logDesc = JSON.stringify({ solicitante: 'Secretaria/SOE', motivos: [exitType], obs: `SAÍDA REGISTRADA. Motivo detalhado: ${exitReason}` }); await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: 'Situação Escolar', description: logDesc, resolved: true }]); await supabase.from('students').update({ status: exitType }).eq('id', selectedStudent.id); alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); };
  const handleSaveRadar = async () => { const targetClass = conselhoTurma || students[0]?.class_id; if (!targetClass) return; await supabase.from('class_radar').upsert({ turma: targetClass, bimestre: selectedBimestre, ...radarData }, { onConflict: 'turma, bimestre' }); alert('Avaliação Salva!'); setIsEvalModalOpen(false); };
  const handleAddStudent = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, status: 'ATIVO' }]); if (!error) { alert('Criado!'); setIsNewStudentModalOpen(false); fetchStudents(); } else alert(error.message); };
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) { if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return; const file = event.target.files[0]; const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('photos').upload(fileName, file); if (error) { alert('Erro upload: ' + error.message); return; } const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id); setSelectedStudent({ ...selectedStudent, photo_url: publicUrl }); fetchStudents(); }
  const handleUpdateGrade = (field: string, value: string) => { if(!projectedStudent) return; const newStudent = { ...projectedStudent }; const bimIndex = newStudent.desempenho.findIndex((d:any) => d.bimestre === selectedBimestre); if (bimIndex >= 0) { const numValue = value === '' ? null : parseFloat(value.replace(',', '.')); newStudent.desempenho[bimIndex][field] = numValue; setProjectedStudent(newStudent); } };
  const handleSaveCouncilChanges = async () => { if(!projectedStudent) return; const d = projectedStudent.desempenho.find((x:any) => x.bimestre === selectedBimestre); if(!d) return; await supabase.from('desempenho_bimestral').update({ lp: d.lp, mat: d.mat, cie: d.cie, his: d.his, geo: d.geo, ing: d.ing, art: d.art, edf: d.edf, pd1: d.pd1, pd2: d.pd2, pd3: d.pd3, faltas_bimestre: d.faltas_bimestre, obs_conselho: councilObs, encaminhamento_conselho: councilEnc }).eq('id', d.id); alert('Salvo!'); fetchStudents(); };
  const handleExportReport = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Dados"); XLSX.writeFile(wb, `Relatorio_Geral.xlsx`); };
  const handleBackup = () => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(students); XLSX.utils.book_append_sheet(wb, ws, "Backup"); XLSX.writeFile(wb, `BACKUP_SOE.xlsx`); };

  // --- MÓDULO DE DOCUMENTOS (ISOLADO) ---
  const generateOfficialDoc = (type: string, content: string = "") => {
      if(!docStudent) return;
      const doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(12);
      doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 20, {align: "center"});
      doc.text("SECRETARIA DE ESTADO DE EDUCAÇÃO", 105, 26, {align: "center"});
      doc.text("CENTRO EDUCACIONAL 4 DO GUARÁ", 105, 32, {align: "center"});
      doc.setFontSize(10); doc.setFont("times", "normal");
      doc.text("Fone: 3318-2289 / 3318-2288", 105, 38, {align: "center"});
      doc.setLineWidth(0.5); doc.line(20, 42, 190, 42);

      let title = "";
      if (type === 'CONVOCACAO') title = "CONVOCAÇÃO";
      if (type === 'DECLARACAO') title = "DECLARAÇÃO DE COMPARECIMENTO";
      if (type === 'ATA') title = "ATA DE REUNIÃO / ATENDIMENTO";
      if (type === 'CT') title = "RELATÓRIO AO CONSELHO TUTELAR";
      if (type === 'SAUDE') title = "RELATÓRIO ESCOLAR (SAÚDE)";
      if (type === 'TERMO') title = "TERMO DE COMPROMISSO";

      doc.setFontSize(14); doc.setFont("times", "bold"); doc.text(title, 105, 55, {align: "center"});
      autoTable(doc, { startY: 65, head: [['Estudante', 'Turma', 'Responsável']], body: [[docStudent.name, docStudent.class_id, docStudent.guardian_name || '']], theme: 'grid', styles: { font: 'times', fontSize: 10, cellPadding: 2, lineColor: [0,0,0], lineWidth: 0.1 }, headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' } });

      let finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12); doc.setFont("times", "normal");
      const textLines = doc.splitTextToSize(content, 170);
      doc.text(textLines, 20, finalY);

      const pageHeight = doc.internal.pageSize.height;
      doc.text("Brasília, " + new Date().toLocaleDateString(), 20, pageHeight - 50);
      doc.line(20, pageHeight - 30, 90, pageHeight - 30); doc.text("Responsável / Estudante", 55, pageHeight - 25, {align: "center"});
      doc.line(110, pageHeight - 30, 180, pageHeight - 30); doc.text("Orientador(a) Educacional", 145, pageHeight - 25, {align: "center"});

      doc.save(`${title}_${docStudent.name}.pdf`);
      setIsEditorModalOpen(false); setIsTermoModalOpen(false);
  };

  const prepareDoc = (type: string) => {
      if(!docStudent) return;
      let t = "";
      if (type === 'CONVOCACAO') { t = TEXTO_CONVOCACAO.replace('[DATA]', '_____/_____/_____').replace('[HORA]', '____:____').replace('[NOME_ALUNO]', docStudent.name).replace('[TURMA]', docStudent.class_id); }
      if (type === 'DECLARACAO') { t = TEXTO_DECLARACAO.replace('[NOME_RESPONSAVEL]', docStudent.guardian_name || "__________________________").replace('[NOME_ALUNO]', docStudent.name).replace('[TURMA]', docStudent.class_id).replace('[DATA_HOJE]', new Date().toLocaleDateString()); }
      if (type === 'ATA') t = "Descreva aqui o teor da reunião...";
      setDocContent(t); setDocType(type); setIsEditorModalOpen(true);
  };
  const prepareTermo = () => { setTermoChecks([]); setIsTermoModalOpen(true); };
  const generateTermoPDF = () => {
      const listaProblemas = [ "Desatenção", "Desrespeita professores", "Desrespeita colegas", "Brincadeiras Inoportunas", "Bullying", "Agressão física", "Não realiza atividades", "Não traz material", "Chega atrasado", "Uso de celular", "Danifica patrimônio" ];
      let content = "Eu, " + docStudent.name + ", da turma " + docStudent.class_id + ", estou ciente que apresento os seguintes comportamentos:\n\n";
      listaProblemas.forEach(prob => { const marked = termoChecks.includes(prob) ? "[ X ]" : "[   ]"; content += `${marked} ${prob}\n`; });
      content += "\nDeclaro que fui orientado(a) e comprometo-me a melhorar os comportamentos acima mencionados. Caso contrário receberei as medidas disciplinares necessárias.";
      generateOfficialDoc('TERMO', content);
  };

  const printStudentData = (doc: jsPDF, student: any) => { doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("FICHA INDIVIDUAL", 105, 20, { align: "center" }); autoTable(doc, { startY: 30, head: [['Dado', 'Valor']], body: [['Nome', student.name], ['Turma', student.class_id], ['Resp.', student.guardian_name]] }); };
  const generatePDF = () => { if (selectedStudent) { const doc = new jsPDF(); printStudentData(doc, selectedStudent); doc.save(`Ficha_${selectedStudent.name}.pdf`); } };
  const generateSuperAta = (target: string) => { const cS = students.filter(s => s.class_id === target); if(cS.length === 0) return alert('Vazia'); const doc = new jsPDF({orientation:'landscape'}); autoTable(doc, {head:[['Nome','Faltas']], body: cS.map(s => [s.name, s.desempenho?.[0]?.faltas_bimestre||0])}); doc.save('Ata.pdf'); };

  // --- RENDERIZADORES ---
  const renderDashboard = () => {
    let sR = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoNotas; });
    const nees = students.filter(s => s.nee_description).length;
    const cts = students.filter(s => s.ct_referral).length;
    return (
      <div className="space-y-6 pb-20 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div onClick={() => { setDashboardFilterType('ALL'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total</p><p className="text-2xl font-black">{students.length}</p></div><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><Users2 size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('RISK'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Alerta</p><p className="text-2xl font-black text-red-600">{sR.length}</p></div><div className="bg-red-50 p-3 rounded-lg text-red-600"><AlertTriangle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('NEE'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">NEE</p><p className="text-2xl font-black text-purple-600">{nees}</p></div><div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Puzzle size={20}/></div></div>
            <div onClick={() => { setDashboardFilterType('CT'); setView('students'); }} className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group"><div><p className="text-[10px] font-bold text-slate-400 uppercase">CT</p><p className="text-2xl font-black text-orange-600">{cts}</p></div><div className="bg-orange-50 p-3 rounded-lg text-orange-600"><Scale size={20}/></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Volume Atendimentos</h4><div className="flex-1 min-h-0"><ResponsiveContainer><LineChart data={stats.last7Days}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="total" stroke="#6366f1"/></LineChart></ResponsiveContainer></div></div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col"><h4>Recorrência</h4><div className="flex-1 min-h-0"><PieChart><Pie data={stats.pieData} innerRadius={40} outerRadius={60} dataKey="value">{stats.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></div></div>
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

      {/* MODAIS RESTAURADOS V10.1 E ADICIONAIS */}
      {isReportModalOpen && (<div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col h-[80vh]"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-indigo-800 flex items-center gap-3"><FileBarChart2 className="text-indigo-600" /> Relatórios Gerenciais</h3><button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={28} /></button></div><div className="flex-1 overflow-y-auto space-y-6 pr-2"><div className="pt-6 border-t mt-4 flex justify-end"><button onClick={handleExportReport} className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg transition-transform hover:scale-105"><FileSpreadsheet /> Baixar Relatório Completo</button></div></div></div></div>)}
      
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
      
      {/* BOTÃO REGISTRO RÁPIDO V10.1 (RESTAURADO) */}
      {isQuickModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3>Registro Rápido</h3><input className="w-full border p-2" value={quickSearchTerm} onChange={e => setQuickSearchTerm(e.target.value)} placeholder="Aluno..."/><div className="max-h-40 overflow-y-auto">{students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0,5).map(s => <div key={s.id} onClick={() => {setQuickSelectedStudent(s); setQuickSearchTerm(s.name);}} className="p-2 border-b cursor-pointer">{s.name}</div>)}</div><button onClick={() => {supabase.from('logs').insert([{student_id: quickSelectedStudent.id, category:'Atendimento SOE', description: JSON.stringify({obs:'Registro Rápido'})}]); setIsQuickModalOpen(false);}} className="bg-green-600 text-white w-full py-3 mt-4">Confirmar</button></div></div>}
      
      <button onClick={() => setIsQuickModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-all border-4 border-white"><Zap size={32} /></button>
    </div>
  );
}
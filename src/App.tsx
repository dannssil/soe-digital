import StudentList from './StudentList';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LayoutDashboard, Users, BookOpen, LogOut, 
  Plus, Save, X, AlertTriangle, Camera, User, Pencil, Printer, Lock,
  GraduationCap, FileText, History, Upload, FileSpreadsheet,
  TrendingDown, AlertCircle, BarChart3, CheckSquare, MapPin, Phone, 
  UserCircle, FileDown, CalendarDays, Download, Menu, Search, Clock, Users2, Zap
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1"; 

// --- LISTAS GERAIS ---
const MOTIVOS_COMPORTAMENTO = [
  "Conversa excessiva em sala", "Desacato / falta de respeito",
  "Agressividade verbal", "Agressividade física", "Uso indevido de celular",
  "Saída de sala sem autorização", "Bullying / conflito com colegas", 
  "Desobediência às orientações", "Uniforme inadequado", "Outros"
];
const MOTIVOS_PEDAGOGICO = [
  "Não realização de atividades", "Dificuldade de aprendizagem",
  "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado",
  "Faltas excessivas / Infrequência", "Sono em sala", "Outros"
];
const MOTIVOS_SOCIAL = [
  "Ansiedade / desmotivação", "Problemas familiares",
  "Isolamento / dificuldade de socialização", "Queixas de colegas",
  "Questões de saúde / Laudo", "Vulnerabilidade social", "Outros"
];
const ENCAMINHAMENTOS = [
  "Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis",
  "Direção", "Conselho Tutelar", "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar", "Saúde"
];

// --- MOTIVOS RÁPIDOS (FLASH) ---
const FLASH_REASONS = [
    "Uniforme Inadequado", "Atraso / Chegada Tardia", "Uso de Celular", 
    "Sem Material", "Saída de Sala", "Conversa / Bagunça"
];

// --- INTERFACES ---
interface Student {
  id: any; 
  name: string;      
  class_id: string;  
  guardian_name?: string;  
  guardian_phone?: string; 
  address?: string;        
  photo_url?: string; 
  absences?: number;
  performance?: string;
  grades?: string;
  logs?: Log[];
  status: string; 
  desempenho?: any[]; 
}

interface Log {
  id: number;
  created_at: string;
  category: string; 
  description: string;
  referral?: string;
  return_date?: string; 
  resolved?: boolean;
}

// --- AVATAR ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  const pxSize = { sm: 32, md: 40, lg: 64 };
  if (src) return <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100 print:border-0`} style={{ width: pxSize[size], height: pxSize[size] }} />;
  return <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white print:border print:border-black print:text-black print:bg-white`} style={{ width: pxSize[size], height: pxSize[size] }}>{initials}</div>;
}

// --- APP ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<'dashboard' | 'students'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(localStorage.getItem('adminPhoto'));
  
  // -- ESTADOS GLOBAIS --
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // -- MODAIS --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // -- REGISTRO RÁPIDO (FLASH) --
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSelectedStudent, setQuickSelectedStudent] = useState<Student | null>(null);
  const [quickReason, setQuickReason] = useState('');
  
  // -- EDICAO E ABAS --
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico' | 'familia'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  
  // -- STATES DE FORMULARIO --
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editGuardian, setEditGuardian] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAbsences, setEditAbsences] = useState(0);
  const [editPerformance, setEditPerformance] = useState('');
  const [editGrades, setEditGrades] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newResponsavel, setNewResponsavel] = useState('');
  const [newPhone, setNewPhone] = useState('');   
  const [newAddress, setNewAddress] = useState(''); 

  // -- ATENDIMENTO E FOLLOW-UP --
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); 
  const [returnDate, setReturnDate] = useState(''); 
  
  const DEFAULT_OBS = "Relatório de Atendimento:\n\n- Relato:\n\n- Mediação realizada:\n\n- Combinados:";
  const [obsLivre, setObsLivre] = useState(DEFAULT_OBS);

  useEffect(() => {
    const savedAuth = localStorage.getItem('soe_auth');
    if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); }
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase.from('students')
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date), desempenho:desempenho_bimestral(*)`)
      .eq('status', 'ATIVO').order('name'); 
    if (error) setErrorMsg(`Erro: ${error.message}`);
    else {
      const sortedData = data?.map(student => ({
        ...student,
        logs: student.logs?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }));
      setStudents(sortedData || []);
    }
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); }
    else setLoginError(true);
  };

  const handleLogout = () => { if(confirm("Sair?")) { localStorage.removeItem('soe_auth'); window.location.reload(); } };

  const handleExportBackup = async () => {
    if(!confirm("Deseja baixar um backup completo de todos os dados?")) return;
    const { data: alunos } = await supabase.from('students').select('*');
    const { data: notas } = await supabase.from('desempenho_bimestral').select('*');
    const { data: logs } = await supabase.from('logs').select('*');

    const wb = XLSX.utils.book_new();
    if(alunos) { const wsAlunos = XLSX.utils.json_to_sheet(alunos); XLSX.utils.book_append_sheet(wb, wsAlunos, "Alunos"); }
    if(notas) { const wsNotas = XLSX.utils.json_to_sheet(notas); XLSX.utils.book_append_sheet(wb, wsNotas, "Notas"); }
    if(logs) {
      const logsFormatados = logs.map(l => {
        let parsed = { motivos: [], obs: '' }; try { parsed = JSON.parse(l.description) } catch(e) {}
        return { id: l.id, aluno_id: l.student_id, data: new Date(l.created_at).toLocaleDateString(), categoria: l.category, detalhes: parsed.obs, motivos: Array.isArray(parsed.motivos) ? parsed.motivos.join(', ') : '', encaminhamento: l.referral, resolvido: l.resolved ? 'SIM' : 'NÃO', data_retorno: l.return_date ? new Date(l.return_date).toLocaleDateString() : '' };
      });
      const wsLogs = XLSX.utils.json_to_sheet(logsFormatados);
      XLSX.utils.book_append_sheet(wb, wsLogs, "Atendimentos");
    }
    XLSX.writeFile(wb, `Backup_SOE_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
  };

  const generatePDF = () => {
    if (!selectedStudent) return;
    const doc = new jsPDF();
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO DISTRITO FEDERAL", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE EDUCAÇÃO", 105, 20, { align: "center" });
    doc.text("CENTRO EDUCACIONAL 04 DO GUARÁ", 105, 25, { align: "center" });
    doc.text("SERVIÇO DE ORIENTAÇÃO EDUCACIONAL - SOE", 105, 32, { align: "center" });
    doc.setLineWidth(0.5); doc.line(20, 35, 190, 35);

    doc.setFontSize(12); doc.text(`FICHA INDIVIDUAL DE ACOMPANHAMENTO`, 105, 45, { align: "center" });
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Aluno(a):`, 20, 55); doc.setFont("helvetica", "bold"); doc.text(`${selectedStudent.name}`, 40, 55);
    doc.setFont("helvetica", "normal"); doc.text(`Turma:`, 150, 55); doc.setFont("helvetica", "bold"); doc.text(`${selectedStudent.class_id}`, 165, 55);

    doc.setFont("helvetica", "normal"); doc.text(`Responsável:`, 20, 62); doc.text(`${selectedStudent.guardian_name || "Não informado"}`, 45, 62);
    doc.text(`Telefone:`, 20, 69); doc.text(`${selectedStudent.guardian_phone || "-"}`, 45, 69);

    doc.setFont("helvetica", "bold"); doc.text("DESEMPENHO ACADÊMICO", 20, 80);
    let tableStartY = 85;
    if (selectedStudent.desempenho && selectedStudent.desempenho.length > 0) {
      const tableData = selectedStudent.desempenho.map(d => [d.bimestre, d.lp?.toString() || "-", d.mat?.toString() || "-", d.cie?.toString() || "-", d.his?.toString() || "-", d.geo?.toString() || "-", d.ing?.toString() || "-", d.art?.toString() || "-", d.edf?.toString() || "-", d.pd1?.toString() || "-", d.faltas_bimestre?.toString() || "0"]);
      autoTable(doc, { startY: tableStartY, head: [['Bimestre', 'LP', 'MAT', 'CIE', 'HIS', 'GEO', 'ING', 'ART', 'EDF', 'PD1', 'Faltas']], body: tableData, theme: 'grid', headStyles: { fillColor: [79, 70, 229], fontSize: 8 }, styles: { fontSize: 8, halign: 'center' } });
    } else { doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.text("Nenhum dado acadêmico registrado.", 20, 90); tableStartY = 90; }

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : tableStartY + 15;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("HISTÓRICO DE ATENDIMENTOS", 20, finalY);

    if (selectedStudent.logs && selectedStudent.logs.length > 0) {
      let currentY = finalY + 10;
      const sortedLogs = [...selectedStudent.logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      sortedLogs.forEach((log) => {
        if (currentY > 260) { doc.addPage(); currentY = 20; } 
        let parsed = { obs: log.description, solicitante: 'SOE', motivos: [] }; try { parsed = JSON.parse(log.description); } catch (e) {}
        const dataAtendimento = new Date(log.created_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        
        if(log.category === 'Família') {
            doc.setTextColor(234, 88, 12); 
            doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`[FAMÍLIA] ${dataAtendimento} - Solicitante: ${parsed.solicitante || 'SOE'}`, 20, currentY);
        } else {
            doc.setTextColor(0, 0, 0); 
            doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`${dataAtendimento} - Solicitante: ${parsed.solicitante || 'SOE'}`, 20, currentY);
        }
        
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal"); const splitObs = doc.splitTextToSize(`Relato: ${parsed.obs}`, 170); doc.text(splitObs, 20, currentY + 5);
        currentY += 10 + (splitObs.length * 4);
        if (log.referral) { doc.setFont("helvetica", "bold"); doc.setTextColor(100); doc.text(`Encaminhamento: ${log.referral}`, 20, currentY - 2); doc.setTextColor(0); }
        if (log.return_date) { 
            const dataRetorno = new Date(log.return_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38); 
            doc.text(`Retorno Agendado: ${dataRetorno}`, 120, currentY - 6); doc.setTextColor(0); 
        }
        doc.setDrawColor(200); doc.line(20, currentY, 190, currentY); currentY += 8;
      });
    } else { doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.text("Nenhum atendimento registrado.", 20, finalY + 10); }

    doc.setDrawColor(0); doc.line(60, 280, 150, 280); doc.setFontSize(8); doc.text("Assinatura do Responsável SOE", 105, 285, { align: "center" });
    const dataAtual = new Date().toLocaleString('pt-BR'); doc.setFontSize(7); doc.setTextColor(150); doc.text(`Documento gerado em: ${dataAtual}`, 20, 290);
    doc.save(`Ficha_${selectedStudent.name}.pdf`);
  };

  const checkRisk = (student: Student) => {
    const totalFaltas = student.desempenho?.reduce((acc, d) => acc + (d.faltas_bimestre || 0), 0) || 0;
    const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null;
    let notasVermelhas = 0;
    if (ultDesempenho) { const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf']; notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length; }
    return { reprovadoFalta: totalFaltas >= 280, criticoFalta: totalFaltas >= 200, criticoNotas: notasVermelhas > 3, totalFaltas, notasVermelhas };
  };

  const renderDashboard = () => {
    let studentsInRisk = students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; });
    if (selectedClassFilter) studentsInRisk = studentsInRisk.filter(s => s.class_id === selectedClassFilter);
    const turmas = [...new Set(students.map(s => s.class_id))].sort();

    const today = new Date().toISOString().split('T')[0];
    const pendingReturns = students.flatMap(s => s.logs || []).filter(l => l.return_date && !l.resolved).map(l => ({...l, student_name: students.find(s => s.id === (l as any).student_id)?.name || 'Aluno', student_class: students.find(s => s.id === (l as any).student_id)?.class_id }));
    const sortedReturns = pendingReturns.sort((a,b) => new Date(a.return_date!).getTime() - new Date(b.return_date!).getTime());

    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div><h3 className="text-2xl font-bold">Painel de Controle SOE</h3><p className="opacity-90">Gestão Pedagógica e Disciplinar</p></div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={handleExportBackup} className="bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-600 flex items-center gap-2 transition-all"><Download size={20}/> Backup</button>
            <button onClick={() => setIsImportModalOpen(true)} className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-50 flex items-center gap-2 transition-all"><Upload size={20}/> Importar Notas</button>
          </div>
        </div>

        {sortedReturns.length > 0 && (
           <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-amber-800 font-bold uppercase text-sm">
               <Clock size={18} />
               <h3>Agendamentos de Retorno ({sortedReturns.length})</h3>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2">
               {sortedReturns.map((ret, idx) => {
                 const isLate = ret.return_date! < today;
                 return (
                   <div key={idx} className={`min-w-[200px] p-3 rounded-xl border shadow-sm bg-white ${isLate ? 'border-red-300' : 'border-amber-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLate ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {new Date(ret.return_date!).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </span>
                        {isLate && <span className="text-[10px] text-red-600 font-bold animate-pulse">ATRASADO</span>}
                      </div>
                      <p className="font-bold text-slate-800 text-sm truncate">{ret.student_name}</p>
                      <p className="text-xs text-slate-500">Turma {ret.student_class}</p>
                   </div>
                 )
               })}
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                <div><h3 className="font-bold text-red-800 uppercase">Alunos em Alerta {selectedClassFilter && `(${selectedClassFilter})`}</h3>
                  {selectedClassFilter && <span className="text-[10px] text-red-600 cursor-pointer underline" onClick={() => setSelectedClassFilter(null)}>Limpar Filtro</span>}
                </div>
              </div>
              <span className="text-[10px] text-red-500 font-bold bg-white px-2 py-1 rounded border border-red-200">{studentsInRisk.length} Casos</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {studentsInRisk.length > 0 ? (
                <div className="space-y-2">
                  {studentsInRisk.map(s => {
                    const risk = checkRisk(s);
                    return (
                      <div key={s.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-red-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group" onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} src={s.photo_url} size="sm" />
                          <div><p className="font-bold text-slate-800 text-sm group-hover:text-red-700">{s.name}</p><p className="text-xs text-slate-500 font-bold">Turma {s.class_id}</p></div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {risk.reprovadoFalta && <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">REP. FALTA ({risk.totalFaltas})</span>}
                          {risk.criticoNotas && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200">{risk.notasVermelhas} NOTAS VERMELHAS</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center flex-col text-slate-400"><CheckSquare size={48} className="mb-2 opacity-20"/><p>Tudo tranquilo! Nenhum aluno {selectedClassFilter ? `da turma ${selectedClassFilter}` : ''} em zona de risco.</p></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2"><BarChart3 className="text-indigo-600" size={20} /><h3 className="font-bold text-indigo-800 uppercase">Estatísticas por Turma</h3></div>
              <p className="text-[10px] text-indigo-400">Toque para filtrar</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {turmas.map(t => {
                  const alunosTurma = students.filter(s => s.class_id === t);
                  const riscoTurma = alunosTurma.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoNotas; }).length;
                  const percent = Math.round((riscoTurma / alunosTurma.length) * 100) || 0;
                  const isSelected = selectedClassFilter === t;
                  return (
                    <div key={t} onClick={() => setSelectedClassFilter(isSelected ? null : t)} className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-slate-50 border-slate-100 hover:border-indigo-300 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start"><h4 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-700'}`}>{t}</h4><span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{alunosTurma.length}</span></div>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-1"><span className={isSelected ? 'text-indigo-100' : 'text-slate-500'}>Risco</span><span className={`font-bold ${isSelected ? 'text-white' : percent > 30 ? 'text-red-600' : 'text-green-600'}`}>{percent}%</span></div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-indigo-800' : 'bg-slate-200'}`}><div className={`h-full ${percent > 30 ? 'bg-red-500' : percent > 15 ? 'bg-orange-400' : 'bg-green-500'}`} style={{ width: `${percent}%` }}></div></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* BOTÃO FLUTUANTE (FAB) - REGISTRO RÁPIDO */}
        <button 
           onClick={() => { setQuickSearchTerm(''); setQuickSelectedStudent(null); setQuickReason(''); setIsQuickModalOpen(true); }}
           className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white md:hidden"
        >
          <Zap size={24} fill="white" />
        </button>
      </div>
    );
  };

  const toggleItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter((i: string) => i !== item));
    else setList([...list, item]);
  };

  function startEditing() {
    if (!selectedStudent) return;
    setEditName(selectedStudent.name); setEditClass(selectedStudent.class_id); setEditGuardian(selectedStudent.guardian_name || '');
    setEditPhone(selectedStudent.guardian_phone || ''); setEditAddress(selectedStudent.address || '');
    setEditAbsences(selectedStudent.absences || 0); setEditPerformance(selectedStudent.performance || 'Regular');
    setEditGrades(selectedStudent.grades || ''); setIsEditing(true);
  }

  async function saveEdits() {
    if (!selectedStudent) return;
    const { error } = await supabase.from('students').update({
        name: editName, class_id: editClass, guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress,
        absences: editAbsences, performance: editPerformance, grades: editGrades
      }).eq('id', selectedStudent.id);
    if (error) alert('Erro: ' + error.message);
    else { alert('Sucesso!'); setIsEditing(false); fetchStudents(); setIsModalOpen(false); }
  }

  // --- FUNÇÃO DE SALVAR LOG (NORMAL) ---
  async function handleSaveLog() {
    if (!selectedStudent) return;
    const currentCategory = activeTab === 'familia' ? 'Família' : 'Atendimento SOE';
    const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, acoes: acoesSelecionadas, obs: obsLivre });
    const selectedDateISO = new Date(attendanceDate).toISOString();
    
    const { error } = await supabase.from('logs').insert([{ 
        student_id: selectedStudent.id, 
        category: currentCategory,
        description: desc, 
        referral: encaminhamento, 
        resolved: resolvido, 
        created_at: selectedDateISO,
        return_date: returnDate || null 
    }]);
    if (error) alert('Erro: ' + error.message);
    else { 
        alert(`Salvo em ${currentCategory}!`); 
        setMotivosSelecionados([]); 
        setObsLivre(DEFAULT_OBS); 
        setAttendanceDate(new Date().toISOString().split('T')[0]); 
        setReturnDate(''); 
        fetchStudents(); 
        setIsModalOpen(false); 
    }
  }
  
  // --- FUNÇÃO DE SALVAR LOG (RÁPIDO) ---
  async function handleQuickSave() {
    if (!quickSelectedStudent || !quickReason) return;
    const desc = JSON.stringify({ solicitante: 'SOE (Rápido)', motivos: [quickReason], acoes: [], obs: '[Registro Rápido via Mobile]' });
    const { error } = await supabase.from('logs').insert([{ 
        student_id: quickSelectedStudent.id, 
        category: 'Atendimento SOE',
        description: desc, 
        resolved: false, 
        created_at: new Date().toISOString()
    }]);
    if (error) alert('Erro: ' + error.message);
    else { 
        alert(`Registro rápido salvo!`); 
        setIsQuickModalOpen(false);
        fetchStudents();
    }
  }

  async function handleRegisterExit() {
    if (!selectedStudent || !exitReason) { alert("Informe o motivo."); return; }
    const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id);
    if (error) alert('Erro: ' + error.message);
    else { alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;
    const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, guardian_name: newResponsavel, guardian_phone: newPhone, address: newAddress, status: 'ATIVO' }]);
    if (error) alert('Erro: ' + error.message);
    else { alert('Cadastrado!'); setNewName(''); setNewClass(''); setIsNewStudentModalOpen(false); fetchStudents(); }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return;
    const file = event.target.files[0];
    const fileName = `${selectedStudent.id}-${Math.random()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('photos').upload(fileName, file);
    if (error) { alert('Erro upload'); return; }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
    await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id);
    setSelectedStudent({ ...selectedStudent, photo_url: publicUrl });
    fetchStudents();
  }

  function handleAdminPhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAdminPhoto(result);
        localStorage.setItem('adminPhoto', result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
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
            await supabase.from('desempenho_bimestral').insert([{
              aluno_id: aluno.id, bimestre: selectedBimestre, art: parseNota(row['ART']), cie: parseNota(row['CIE']),
              edf: parseNota(row['EDF']), geo: parseNota(row['GEO']), his: parseNota(row['HIS']), ing: parseNota(row['ING']),
              lp: parseNota(row['LP']), mat: parseNota(row['MAT']), pd1: parseNota(row['PD1']), pd2: parseNota(row['PD2']),
              pd3: parseNota(row['PD3']), faltas_bimestre: row['FALTAS'] ? parseInt(row['FALTAS']) : 0
            }]);
            count++;
          }
        }
        alert(`Sucesso: ${count} registros.`); setIsImportModalOpen(false); setImporting(false); fetchStudents();
      } catch (err) { alert('Erro: ' + err); setImporting(false); }
    };
    reader.readAsBinaryString(file);
  }

  const handlePrint = () => window.print();

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="text-indigo-600" size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-6 text-sm">SOE Digital - CED 4 Guará</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" title="Senha" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg border-slate-300" placeholder="Senha" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
            {loginError && <p className="text-red-500 text-xs font-bold">Senha incorreta.</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white; }
          .modal-content { box-shadow: none !important; width: 100% !important; max-width: 100% !important; height: auto !important; position: relative !important; overflow: visible !important; }
          .modal-overlay { position: static !important; background: white !important; padding: 0 !important; }
          .new-log-area, .tabs-header { display: none !important; }
          .print-header { display: block !important; }
          .tab-content { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} className="text-white"/></div>
          <div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => { setView('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18} /> Alunos e Turmas</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full"><LogOut size={16} /> Sair</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-600"><Menu size={24}/></button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase hidden md:block">{view === 'dashboard' ? 'Painel de Controle' : 'Gerenciamento'}</h2>
            
            <div className="flex-1 max-w-md relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
               <input 
                  type="text" 
                  placeholder="Buscar aluno em toda a escola..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-full text-sm transition-all outline-none"
                  value={globalSearch}
                  onChange={(e) => {
                      setGlobalSearch(e.target.value);
                      if(e.target.value.length > 0) setView('students'); 
                  }}
               />
            </div>
          </div>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {view === 'dashboard' ? renderDashboard() : (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-end mb-8"><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={20} /> Novo Aluno</button></div>
              <StudentList students={students} onSelectStudent={(s) => { setSelectedStudent(s); setIsModalOpen(true); }} searchTerm={globalSearch} onSearchChange={setGlobalSearch} />
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES ALUNO */}
      {isModalOpen && selectedStudent && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
            <div className="print-header p-8 border-b-2 border-black mb-4 text-center">
               <h1 className="font-bold text-xl uppercase">Governo do Distrito Federal</h1>
               <h2 className="font-bold text-lg uppercase">Secretaria de Estado de Educação</h2>
               <h3 className="font-bold text-lg uppercase mt-2">Centro Educacional 04 do Guará</h3>
               <p className="font-bold text-sm mt-4 uppercase border p-2 inline-block">Serviço de Orientação Educacional - SOE</p>
            </div>

            <div className="px-4 md:px-8 py-4 md:py-6 border-b flex justify-between items-center bg-slate-50 no-print flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative group hidden md:block">
                  <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="lg" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/></label>
                </div>
                <div><h2 className="text-lg md:text-2xl font-bold text-slate-800 line-clamp-1">{selectedStudent.name}</h2><p className="text-xs md:text-sm text-slate-500 font-bold uppercase">Turma {selectedStudent.class_id}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={generatePDF} className="p-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200" title="Gerar PDF Oficial"><FileDown size={18} /></button>
                <button onClick={startEditing} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200" title="Editar"><Pencil size={18} /></button>
                <button onClick={() => setIsExitModalOpen(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Registrar Saída"><LogOut size={18} /></button>
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" size={28}/></button>
              </div>
            </div>

            <div className="flex border-b px-4 md:px-8 bg-white overflow-x-auto no-print flex-shrink-0">
              <button onClick={() => setActiveTab('perfil')} className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 whitespace-nowrap ${activeTab === 'perfil' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>DADOS PESSOAIS</button>
              <button onClick={() => setActiveTab('academico')} className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 whitespace-nowrap ${activeTab === 'academico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>BOLETIM</button>
              
              <button onClick={() => setActiveTab('historico')} className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                <UserCircle size={16}/> ATENDIMENTOS ESTUDANTE
              </button>
              <button onClick={() => setActiveTab('familia')} className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'familia' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>
                <Users2 size={16}/> FAMÍLIA / RESPONSÁVEIS
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
              
              {activeTab === 'perfil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 tab-content">
                  <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                      <UserCircle className="text-indigo-600" />
                      <h3 className="font-bold text-indigo-900 uppercase">Informações de Contato</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded-lg"><User size={20} className="text-slate-500"/></div>
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Responsável Legal</span>
                          {isEditing ? <input value={editGuardian} onChange={e=>setEditGuardian(e.target.value)} className="w-full border rounded p-2"/> : <p className="font-medium text-lg text-slate-800 break-words">{selectedStudent.guardian_name || "Não informado"}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded-lg"><Phone size={20} className="text-slate-500"/></div>
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone / WhatsApp</span>
                          {isEditing ? <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full border rounded p-2"/> : <p className="font-medium text-lg text-slate-800 break-words whitespace-pre-line">{selectedStudent.guardian_phone || "Não informado"}</p>}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded-lg"><MapPin size={20} className="text-slate-500"/></div>
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Endereço Residencial</span>
                          {isEditing ? <input value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full border rounded p-2"/> : <p className="font-medium text-lg text-slate-800 leading-relaxed break-words">{selectedStudent.address || "Não informado"}</p>}
                        </div>
                      </div>

                      {isEditing && <button onClick={saveEdits} className="w-full mt-4 bg-green-600 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors">Salvar Alterações</button>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academico' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-x-auto tab-content">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Bimestre</th>
                        <th className="px-2 py-3">LP</th><th className="px-2 py-3">MAT</th><th className="px-2 py-3">CIE</th><th className="px-2 py-3">HIS</th><th className="px-2 py-3">GEO</th><th className="px-2 py-3">ING</th>
                        <th className="px-2 py-3">ART</th><th className="px-2 py-3">EDF</th>
                        <th className="px-2 py-3 bg-slate-100">PD1</th><th className="px-2 py-3 bg-slate-100">PD2</th><th className="px-2 py-3 bg-slate-100">PD3</th>
                        <th className="px-2 py-3 text-red-600">Faltas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.desempenho?.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold">{d.bimestre}</td>
                          <td className={`px-2 py-4 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td>
                          <td className={`px-2 py-4 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td>
                          <td className="px-2 py-4">{d.cie}</td><td className="px-2 py-4">{d.his}</td><td className="px-2 py-4">{d.geo}</td><td className="px-2 py-4">{d.ing}</td>
                          <td className="px-2 py-4">{d.art}</td><td className="px-2 py-4">{d.edf}</td>
                          <td className="px-2 py-4 bg-slate-50">{d.pd1}</td><td className="px-2 py-4 bg-slate-50">{d.pd2}</td><td className="px-2 py-4 bg-slate-50">{d.pd3}</td>
                          <td className="px-2 py-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(activeTab === 'historico' || activeTab === 'familia') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 tab-content">
                  <div className="lg:col-span-7 space-y-6 no-print">
                    <div className={`p-6 rounded-xl border shadow-sm new-log-area ${activeTab === 'familia' ? 'bg-orange-50 border-orange-200' : 'bg-white border-indigo-100'}`}>
                       
                       <h3 className={`font-bold mb-6 border-b pb-2 uppercase text-sm flex items-center gap-2 ${activeTab === 'familia' ? 'text-orange-800 border-orange-200' : 'text-indigo-800 border-indigo-100'}`}>
                         {activeTab === 'familia' ? <><Users2 size={18}/> Novo Atendimento à Família</> : <><FileText size={18}/> Novo Atendimento ao Estudante</>}
                       </h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Solicitante</label>
                           <select className="w-full mt-1 p-3 border rounded-lg text-sm bg-white focus:ring-2 transition-colors" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option><option>Próprio Aluno</option><option>Direção</option></select>
                         </div>
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Encaminhar Para</label>
                           <select className="w-full mt-1 p-3 border rounded-lg text-sm bg-white focus:ring-2 transition-colors" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Selecione --</option>{ENCAMINHAMENTOS.map(e => <option key={e}>{e}</option>)}</select>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                           <div>
                             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-1"><CalendarDays size={14}/> Data do Atendimento</label>
                             <input type="date" className="w-full p-3 border rounded-lg text-sm bg-white focus:ring-2" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                           </div>
                           <div>
                             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-1 text-indigo-600"><Clock size={14}/> Agendar Retorno (Opcional)</label>
                             <input type="date" className="w-full p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                           </div>
                       </div>

                       <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Motivo do Atendimento</label>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white/50 rounded-xl border border-slate-200">
                         <div>
                            <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Comportamental</p>
                            {MOTIVOS_COMPORTAMENTO.map(m => (<label key={m} className="flex gap-2 text-xs text-slate-600 cursor-pointer mb-1 hover:text-slate-900"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Pedagógico</p>
                            {MOTIVOS_PEDAGOGICO.map(m => (<label key={m} className="flex gap-2 text-xs text-slate-600 cursor-pointer mb-1 hover:text-slate-900"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-purple-600 uppercase mb-2">Social / Outros</p>
                            {MOTIVOS_SOCIAL.map(m => (<label key={m} className="flex gap-2 text-xs text-slate-600 cursor-pointer mb-1 hover:text-slate-900"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}
                         </div>
                       </div>
                       <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Relatório Detalhado</label>
                       <textarea className="w-full p-4 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner" rows={10} value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                       <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-green-700 select-none p-2 hover:bg-green-50 rounded-lg transition-colors"><input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500" checked={resolvido} onChange={e => setResolvido(e.target.checked)}/> Caso Resolvido / Finalizado</label>
                         
                         <button onClick={handleSaveLog} className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${activeTab === 'familia' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                           <Save size={18}/> {activeTab === 'familia' ? 'Salvar Contato Família' : 'Salvar Atendimento'}
                         </button>
                       </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-5 bg-slate-100 rounded-xl p-4 overflow-y-auto max-h-[800px] print:col-span-12 print:bg-white print:border print:border-black">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 print:text-black sticky top-0 bg-slate-100 py-2 z-10">
                      Histórico: {activeTab === 'familia' ? 'Família & Responsáveis' : 'Estudante'}
                    </h3>
                    
                    {selectedStudent.logs?.filter(l => activeTab === 'familia' ? l.category === 'Família' : l.category !== 'Família').length === 0 && <p className="text-center text-slate-400 py-10">Nenhum registro nesta categoria.</p>}
                    
                    {selectedStudent.logs?.filter(l => activeTab === 'familia' ? l.category === 'Família' : l.category !== 'Família').map(log => {
                        let p = { obs: log.description, motivos: [], solicitante: '' }; try { p = JSON.parse(log.description); } catch(e) {}
                        const dataVisual = new Date(log.created_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                        const dataRetorno = log.return_date ? new Date(log.return_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : null;
                        
                        return (
                          <div key={log.id} className={`p-5 rounded-xl border shadow-sm mb-4 hover:shadow-md transition-shadow bg-white ${log.category === 'Família' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-indigo-400'}`}>
                            <div className="flex justify-between items-start mb-3 border-b pb-2">
                              <div>
                                <span className={`font-bold text-sm block ${log.category === 'Família' ? 'text-orange-700' : 'text-indigo-700'}`}>{dataVisual}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">{p.solicitante || 'SOE'}</span>
                              </div>
                              {log.resolved ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase border border-green-200">Resolvido</span> : <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase border border-amber-200">Em Aberto</span>}
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{p.obs}</p>
                            {log.referral && <div className="mt-3 pt-2 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-purple-600 uppercase"><span className="bg-purple-50 p-1 rounded">➔ Encaminhado:</span> {log.referral}</div>}
                            {dataRetorno && !log.resolved && (
                                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-600 uppercase bg-amber-50 p-2 rounded">
                                    <Clock size={14}/> Retorno Agendado: {dataRetorno}
                                </div>
                            )}
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

      {/* MODAL IMPORTAÇÃO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><FileSpreadsheet size={24}/> Importar Excel</h3>
            <div className="space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1 font-bold">Bimestre de Referência</label>
                 <select className="w-full p-3 border rounded-xl" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}>
                   <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                 </select>
               </div>
               <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50">
                  {importing ? <p className="animate-pulse font-bold text-indigo-600">Sincronizando iEducar...</p> : <input type="file" accept=".xlsx, .xls" title="Arquivo" onChange={handleFileUpload} className="w-full text-sm"/>}
               </div>
               <div className="flex justify-end"><button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Fechar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE SAÍDA */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">Registrar Saída</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-bold text-sm"><input type="radio" checked={exitType === 'TRANSFERIDO'} onChange={() => setExitType('TRANSFERIDO')} /> TRANSFERÊNCIA</label>
                <label className="flex items-center gap-2 font-bold text-sm text-red-600"><input type="radio" checked={exitType === 'ABANDONO'} onChange={() => setExitType('ABANDONO')} /> ABANDONO</label>
              </div>
              <textarea className="w-full p-3 border rounded-xl" placeholder="Motivo da saída..." value={exitReason} onChange={e => setExitReason(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsExitModalOpen(false)} className="px-4 py-2">CANCELAR</button>
                <button onClick={handleRegisterExit} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">CONFIRMAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL REGISTRO RÁPIDO (FLASH) */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            
            <div className="text-center mb-6">
              <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap size={28} className="text-indigo-600 fill-indigo-600"/>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Registro Rápido</h3>
              <p className="text-xs text-slate-500">Modo simplificado para mobile</p>
            </div>

            <div className="space-y-4">
               {/* 1. BUSCA DE ALUNO SIMPLIFICADA */}
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quem é o estudante?</label>
                 <div className="relative">
                   <input 
                      autoFocus
                      placeholder="Digite o nome..." 
                      className="w-full p-3 pl-10 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={quickSearchTerm}
                      onChange={e => {
                        setQuickSearchTerm(e.target.value);
                        setQuickSelectedStudent(null); // Reseta se mudar o texto
                      }}
                   />
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   
                   {/* SUGESTÕES DE ALUNOS */}
                   {quickSearchTerm.length > 2 && !quickSelectedStudent && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                        {students.filter(s => s.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 5).map(s => (
                          <div key={s.id} onClick={() => { setQuickSelectedStudent(s); setQuickSearchTerm(s.name); }} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0">
                            <p className="font-bold text-sm text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400">Turma {s.class_id}</p>
                          </div>
                        ))}
                      </div>
                   )}
                 </div>
                 {quickSelectedStudent && <p className="text-xs text-green-600 font-bold mt-1 text-center">✅ {quickSelectedStudent.name} selecionado</p>}
               </div>

               {/* 2. BOTÕES DE MOTIVO RÁPIDO */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Qual o motivo?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FLASH_REASONS.map(r => (
                      <button 
                        key={r}
                        onClick={() => setQuickReason(r)}
                        className={`p-3 rounded-xl text-xs font-bold transition-all border ${quickReason === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
               </div>

               <button 
                 onClick={handleQuickSave}
                 disabled={!quickSelectedStudent || !quickReason}
                 className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 flex items-center justify-center gap-2"
               >
                 <Save size={20}/> SALVAR REGISTRO
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO ALUNO */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">Novo Aluno</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full p-3 border rounded-xl" placeholder="Turma (ex: 6A)" value={newClass} onChange={e => setNewClass(e.target.value)} />
                <div className="w-full p-3 border rounded-xl bg-slate-100 text-slate-500 flex items-center p-3 text-sm font-bold">Vespertino</div>
              </div>
              <input className="w-full p-3 border rounded-xl" placeholder="Responsável" value={newResponsavel} onChange={e => setNewResponsavel(e.target.value)} />
              <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="px-4 py-2">Cancelar</button><button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
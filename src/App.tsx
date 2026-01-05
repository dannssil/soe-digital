import StudentList from './StudentList';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx'; 
import { 
  LayoutDashboard, Users, BookOpen, LogOut, 
  Plus, Save, X, CheckSquare, 
  AlertTriangle, Camera, User, Pencil, Printer, Lock,
  GraduationCap, FileText, History, Upload, FileSpreadsheet,
  TrendingDown, AlertCircle
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1"; 

// --- LISTAS PARA ATENDIMENTOS ---
const MOTIVOS_COMPORTAMENTO = [
  "Conversa excessiva em sala", "Desacato / falta de respeito",
  "Agressividade verbal", "Agressividade física", "Uso indevido de celular",
  "Saída de sala sem autorização", "Bullying / conflito com colegas", 
  "Desobediência às orientações", "Outros"
];
const MOTIVOS_PEDAGOGICO = [
  "Não realização de atividades", "Dificuldade de aprendizagem",
  "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado",
  "Faltas excessivas / Infrequência", "Outros"
];
const MOTIVOS_SOCIAL = [
  "Ansiedade / desmotivação", "Problemas familiares",
  "Isolamento / dificuldade de socialização", "Queixas de colegas / professores",
  "Outros"
];
const ENCAMINHAMENTOS = [
  "Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis",
  "Direção", "Conselho Tutelar", "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar"
];
const OPCOES_RENDIMENTO = ["Excelente", "Bom", "Regular", "Baixo", "Crítico"];

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedBimestre, setSelectedBimestre] = useState('1º Bimestre');
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico'>('perfil');

  // FORMULÁRIO DE ATENDIMENTO
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [obsLivre, setObsLivre] = useState("Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:");

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
    else setStudents(data || []);
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); }
    else setLoginError(true);
  };

  const handleLogout = () => { if(confirm("Sair?")) { localStorage.removeItem('soe_auth'); window.location.reload(); } };

  // LÓGICA DE RISCO
  const checkRisk = (student: Student) => {
    const totalFaltas = student.desempenho?.reduce((acc, d) => acc + (d.faltas_bimestre || 0), 0) || 0;
    const ultDesempenho = student.desempenho && student.desempenho.length > 0 ? student.desempenho[student.desempenho.length - 1] : null;
    let notasVermelhas = 0;
    if (ultDesempenho) {
      const disciplinas = ['lp', 'mat', 'cie', 'his', 'geo', 'ing', 'art', 'edf'];
      notasVermelhas = disciplinas.filter(disc => ultDesempenho[disc] !== null && ultDesempenho[disc] < 5).length;
    }
    return {
      reprovadoFalta: totalFaltas >= 280,
      criticoFalta: totalFaltas >= 200,
      criticoNotas: notasVermelhas > 3,
      totalFaltas,
      notasVermelhas
    };
  };

  const toggleItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter((i: string) => i !== item));
    else setList([...list, item]);
  };

  async function handleSaveLog() {
    if (!selectedStudent) return;
    const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, acoes: acoesSelecionadas, obs: obsLivre });
    const { error } = await supabase.from('logs').insert([{ 
      student_id: selectedStudent.id, 
      category: "Atendimento SOE", 
      description: desc, 
      referral: encaminhamento, 
      resolved: resolvido 
    }]);
    if (error) alert('Erro: ' + error.message);
    else { 
      alert('Salvo com sucesso!'); 
      setMotivosSelecionados([]); 
      setObsLivre("Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:");
      fetchStudents(); 
      setIsModalOpen(false); 
    }
  }

  async function handleRegisterExit() {
    if (!selectedStudent || !exitReason) { alert("Informe o motivo."); return; }
    const { error } = await supabase.from('students').update({ status: exitType, exit_reason: exitReason, exit_date: new Date().toISOString() }).eq('id', selectedStudent.id);
    if (error) alert('Erro: ' + error.message);
    else { alert('Saída registrada!'); setIsExitModalOpen(false); setIsModalOpen(false); fetchStudents(); }
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} className="text-white"/></div>
          <div><h1 className="font-bold text-lg">SOE Digital</h1><p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18} /> Alunos e Turmas</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full"><LogOut size={16} /> Sair</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800 uppercase">{view === 'dashboard' ? 'Painel de Controle' : 'Gerenciamento'}</h2>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {view === 'dashboard' ? (
            <div className="space-y-8">
               {/* Dashboard de Risco e Estatísticas */}
               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                 <div><h3 className="text-2xl font-bold">Importação iEducar</h3><p className="opacity-90">Sincronize notas e faltas bimestrais.</p></div>
                 <button onClick={() => setIsImportModalOpen(true)} className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-50 flex items-center gap-2"><Upload size={20}/> Importar Excel</button>
               </div>
               
               <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                 <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                   <AlertCircle className="text-red-600" size={20} />
                   <h3 className="font-bold text-red-800 uppercase">Alunos em Risco (Faltas/Notas)</h3>
                 </div>
                 <div className="divide-y divide-slate-100">
                   {students.filter(s => { const r = checkRisk(s); return r.reprovadoFalta || r.criticoFalta || r.criticoNotas; }).map(s => {
                     const risk = checkRisk(s);
                     return (
                       <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}>
                         <div className="flex items-center gap-3">
                           <Avatar name={s.name} src={s.photo_url} size="sm" />
                           <span className="font-bold text-sm">{s.name} ({s.class_id})</span>
                         </div>
                         <div className="flex gap-2">
                           {risk.reprovadoFalta && <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded">REPROVADO POR FALTA</span>}
                           {risk.criticoNotas && <span className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded">RISCO NOTAS</span>}
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-end mb-8"><button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={20} /> Novo Aluno</button></div>
              <StudentList students={students} onSelectStudent={(s) => { setSelectedStudent(s); setIsModalOpen(true); }} />
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES ALUNO (TUDO RESTAURADO) */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="lg" />
                <div><h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2><p className="text-sm text-slate-500 font-bold uppercase">Turma {selectedStudent.class_id}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsExitModalOpen(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Registrar Saída"><LogOut size={18} /></button>
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" size={28}/></button>
              </div>
            </div>

            <div className="flex border-b px-8 bg-white overflow-x-auto">
              <button onClick={() => setActiveTab('perfil')} className={`px-6 py-4 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'perfil' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>DADOS PESSOAIS</button>
              <button onClick={() => setActiveTab('academico')} className={`px-6 py-4 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'academico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>BOLETIM iEDUCAR</button>
              <button onClick={() => setActiveTab('historico')} className={`px-6 py-4 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>ATENDIMENTOS SOE</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              {activeTab === 'perfil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b pb-2">Informações do Responsável</h3>
                    <div className="space-y-3">
                      <p className="text-sm"><span className="font-bold text-slate-500">NOME:</span> {selectedStudent.guardian_name || "—"}</p>
                      <p className="text-sm"><span className="font-bold text-slate-500">CONTATO:</span> {selectedStudent.guardian_phone || "—"}</p>
                      <p className="text-sm"><span className="font-bold text-slate-500">ENDEREÇO:</span> {selectedStudent.address || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academico' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr><th className="px-6 py-3">Bimestre</th><th className="px-2 py-3">LP</th><th className="px-2 py-3">MAT</th><th className="px-2 py-3">CIE</th><th className="px-2 py-3">HIS</th><th className="px-2 py-3 text-red-600">Faltas</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.desempenho?.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold">{d.bimestre}</td>
                          <td className={`px-2 py-4 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp}</td>
                          <td className={`px-2 py-4 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat}</td>
                          <td className="px-2 py-4">{d.cie}</td>
                          <td className="px-2 py-4">{d.his}</td>
                          <td className="px-2 py-4 font-bold text-red-600 bg-red-50 text-center">{d.faltas_bimestre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'historico' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                       <h3 className="font-bold text-indigo-800 mb-4 border-b pb-2 uppercase text-sm">Novo Atendimento</h3>
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         <div><label className="text-[10px] font-bold text-slate-500">SOLICITANTE</label>
                           <select className="w-full mt-1 p-2 border rounded text-sm bg-slate-50" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Responsável</option><option>Disciplinar</option></select>
                         </div>
                         <div><label className="text-[10px] font-bold text-slate-500">ENCAMINHAR PARA</label>
                           <select className="w-full mt-1 p-2 border rounded text-sm bg-slate-50" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">Nenhum</option>{ENCAMINHAMENTOS.map(e => <option key={e}>{e}</option>)}</select>
                         </div>
                       </div>
                       <label className="text-[10px] font-bold text-slate-500">MOTIVOS</label>
                       <div className="grid grid-cols-2 gap-2 mt-1 mb-4">
                         {MOTIVOS_COMPORTAMENTO.slice(0,4).map(m => (<label key={m} className="flex gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}
                       </div>
                       <textarea className="w-full p-4 border rounded-xl bg-slate-50 text-sm" rows={8} value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                       <div className="flex justify-between items-center mt-4">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-green-700"><input type="checkbox" checked={resolvido} onChange={e => setResolvido(e.target.checked)}/> Caso Resolvido?</label>
                         <button onClick={handleSaveLog} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Salvar Atendimento</button>
                       </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 bg-slate-200/50 rounded-xl p-4 overflow-y-auto max-h-[600px]">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Registros Anteriores</h3>
                    {selectedStudent.logs?.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum registro encontrado.</p>}
                    {selectedStudent.logs?.map(log => {
                       let p = { obs: log.description }; try { p = JSON.parse(log.description); } catch(e) {}
                       return (
                         <div key={log.id} className="bg-white p-4 rounded-lg border shadow-sm mb-3">
                           <div className="flex justify-between text-[10px] font-bold text-indigo-600 mb-1">
                             <span>{new Date(log.created_at).toLocaleDateString()}</span>
                             {log.resolved && <span className="text-green-600 uppercase">Resolvido</span>}
                           </div>
                           <p className="text-xs text-slate-700 whitespace-pre-line">{p.obs}</p>
                           {log.referral && <p className="mt-2 text-[10px] font-bold text-purple-600 border-t pt-1 uppercase">➔ Encaminhado: {log.referral}</p>}
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
    </div>
  );
}
import StudentList from './StudentList';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx'; 
import { 
  LayoutDashboard, Users, BookOpen, LogOut, 
  Plus, Save, X, CheckSquare, 
  AlertTriangle, Camera, User, Pencil, Printer, Lock,
  GraduationCap, FileText, History, Upload, FileSpreadsheet
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1"; 

// --- LISTAS ---
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
  desempenho?: any[]; // Notas importadas do iEducar
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
  const [view, setView] = useState<'dashboard' | 'students'>('students');
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
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'academico' | 'historico'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
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
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [obsLivre, setObsLivre] = useState("Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:");

  useEffect(() => {
    const savedAuth = localStorage.getItem('soe_auth');
    if (savedAuth === 'true') { setIsAuthenticated(true); fetchStudents(); }
  }, []);

  async function fetchStudents() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.from('students')
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date), desempenho:desempenho_bimestral(*)`)
      .eq('status', 'ATIVO').order('name'); 
    if (error) setErrorMsg(`Erro de conexão: ${error.message}`);
    else setStudents(data || []);
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) { setIsAuthenticated(true); localStorage.setItem('soe_auth', 'true'); fetchStudents(); }
    else setLoginError(true);
  };

  const handleLogout = () => { if(confirm("Deseja realmente sair?")) { localStorage.removeItem('soe_auth'); window.location.reload(); } };

  function openStudentModal(student: Student) {
    setSelectedStudent(student);
    setIsEditing(false);
    setActiveTab('perfil');
    setIsModalOpen(true);
  }

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

  async function handleSaveLog() {
    if (!selectedStudent) return;
    const desc = JSON.stringify({ solicitante, motivos: motivosSelecionados, acoes: acoesSelecionadas, obs: obsLivre });
    const { error } = await supabase.from('logs').insert([{ student_id: selectedStudent.id, category: "Atendimento SOE", description: desc, referral: encaminhamento, resolved: resolvido }]);
    if (error) alert('Erro: ' + error.message);
    else { alert('Salvo!'); setIsModalOpen(false); fetchStudents(); }
  }

  const handlePrint = () => window.print();

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
          <h2 className="text-xl font-bold text-slate-800">{view === 'dashboard' ? 'Visão Geral' : 'Gerenciamento'}</h2>
          <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {view === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                <div><h3 className="text-2xl font-bold">Importação de Dados</h3><p className="opacity-90">Atualize as notas e faltas do iEducar.</p></div>
                <button onClick={() => setIsImportModalOpen(true)} className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-50 flex items-center gap-2"><Upload size={20}/> Importar Excel</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-slate-500 text-sm font-bold uppercase">Total Ativos</p><h3 className="text-4xl font-bold text-slate-800 mt-2">{students.length}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-500"><p className="text-slate-500 text-sm font-bold uppercase">Faltas Críticas</p><h3 className="text-4xl font-bold text-red-600 mt-2">{students.filter(s => (s.desempenho?.reduce((acc,d) => acc + (d.faltas_bimestre || 0), 0) || 0) > 15).length}</h3></div>
              </div>
            </div>
          )}

          {view === 'students' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between mb-8">
                <div className="invisible w-10"></div>
                <button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={20} /> Novo Aluno</button>
              </div>
              {loading ? <p className="text-center">Carregando...</p> : <StudentList students={students} onSelectStudent={openStudentModal} />}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETALHES ALUNO (ATUALIZADO COM TABELA ACADÊMICA) */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="lg" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                  <p className="text-sm text-slate-500">Turma {selectedStudent.class_id} • Matrícula Ativa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={startEditing} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"><Pencil size={18} /></button>
                <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"><Printer size={18} /></button>
                <button onClick={() => setIsExitModalOpen(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><LogOut size={18} /></button>
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" size={28}/></button>
              </div>
            </div>

            <div className="flex border-b px-8 bg-white">
              <button onClick={() => setActiveTab('perfil')} className={`px-6 py-4 font-bold text-sm border-b-2 ${activeTab === 'perfil' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Perfil</button>
              <button onClick={() => setActiveTab('academico')} className={`px-6 py-4 font-bold text-sm border-b-2 ${activeTab === 'academico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Acadêmico (iEducar)</button>
              <button onClick={() => setActiveTab('historico')} className={`px-6 py-4 font-bold text-sm border-b-2 ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Histórico SOE</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              {activeTab === 'perfil' && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Informações de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Responsável</span><p className="font-medium">{selectedStudent.guardian_name || "—"}</p></div>
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Telefone</span><p className="font-medium">{selectedStudent.guardian_phone || "—"}</p></div>
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Endereço</span><p className="font-medium">{selectedStudent.address || "—"}</p></div>
                  </div>
                </div>
              )}

              {activeTab === 'academico' && (
                <div className="space-y-6">
                  {/* TABELA DE NOTAS IMPORTADAS */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-4 border-b"><h3 className="font-bold text-indigo-800">Boletim Bimestral (Dados do iEducar)</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="px-6 py-3">Bimestre</th>
                            <th className="px-2 py-3">LP</th><th className="px-2 py-3">MAT</th><th className="px-2 py-3">CIE</th>
                            <th className="px-2 py-3">HIS</th><th className="px-2 py-3">GEO</th><th className="px-2 py-3">ING</th>
                            <th className="px-2 py-3">ART</th><th className="px-2 py-3">EDF</th><th className="px-2 py-3 text-red-600">Faltas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedStudent.desempenho && selectedStudent.desempenho.length > 0 ? (
                            selectedStudent.desempenho.map((d, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{d.bimestre}</td>
                                <td className={`px-2 py-4 font-bold ${d.lp < 5 ? 'text-red-500' : ''}`}>{d.lp?.toFixed(1) || '-'}</td>
                                <td className={`px-2 py-4 font-bold ${d.mat < 5 ? 'text-red-500' : ''}`}>{d.mat?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.cie?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.his?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.geo?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.ing?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.art?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4">{d.edf?.toFixed(1) || '-'}</td>
                                <td className="px-2 py-4 font-bold text-red-600 bg-red-50/50 text-center">{d.faltas_bimestre || 0}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={10} className="px-6 py-10 text-center text-slate-400">Nenhum dado bimestral importado para este aluno.</td></tr>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td className="px-6 py-4 font-bold">TOTAL ACUMULADO</td>
                            <td colSpan={8}></td>
                            <td className="px-2 py-4 font-bold text-center text-red-700 text-lg bg-red-100">
                              {selectedStudent.desempenho?.reduce((acc, d) => acc + (d.faltas_bimestre || 0), 0) || 0}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* CAMPO DE OBSERVAÇÕES MANUAIS */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Notas Adicionais / Resumo Pedagógico</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{selectedStudent.grades || "Sem observações registradas."}</p>
                  </div>
                </div>
              )}

              {activeTab === 'historico' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <h3 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2"><FileText size={14}/> Novo Atendimento</h3>
                      <textarea className="w-full p-4 border rounded-xl bg-white" rows={6} value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                      <div className="flex justify-end mt-3"><button onClick={handleSaveLog} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold">Salvar Registro</button></div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 bg-slate-100 rounded-xl p-4 overflow-y-auto max-h-[500px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Histórico Completo</h3>
                    {selectedStudent.logs?.map(log => (
                      <div key={log.id} className="bg-white p-4 rounded-lg border shadow-sm mb-3 text-sm">
                        <div className="flex justify-between mb-2"><span className="font-bold text-indigo-600">{new Date(log.created_at).toLocaleDateString()}</span></div>
                        <p className="text-slate-600 whitespace-pre-line">{log.description.includes('{') ? JSON.parse(log.description).obs : log.description}</p>
                      </div>
                    ))}
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
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Bimestre</label>
                 <select className="w-full p-3 border rounded-xl" value={selectedBimestre} onChange={e => setSelectedBimestre(e.target.value)}>
                   <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                 </select>
               </div>
               <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50">
                  {importing ? <p className="animate-pulse">Processando...</p> : <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="w-full text-sm"/>}
               </div>
               <div className="flex justify-end"><button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-50" disabled={importing}>Fechar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
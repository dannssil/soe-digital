import StudentList from './StudentList';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, BookOpen, LogOut, 
  Plus, Save, X, CheckSquare, 
  AlertTriangle, Camera, User, Pencil, Printer, Lock,
  GraduationCap, FileText, History
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";
const ACCESS_PASSWORD = "Ced@1rf1"; 

// --- LISTAS ---
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
  "Direção", "Conselho Tutelar",
  "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar"
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
  
  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100 print:border-0`}
        style={{ width: pxSize[size], height: pxSize[size] }}
      />
    );
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white print:border print:border-black print:text-black print:bg-white`} style={{ width: pxSize[size], height: pxSize[size] }}>
      {initials}
    </div>
  );
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
  
  // --- NOVOS STATES PARA SAÍDA ---
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [exitType, setExitType] = useState<'TRANSFERIDO' | 'ABANDONO'>('TRANSFERIDO');
  // -------------------------------

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
  
  const DEFAULT_OBS = "Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:";
  const [obsLivre, setObsLivre] = useState(DEFAULT_OBS);

  useEffect(() => {
    const savedAuth = localStorage.getItem('soe_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchStudents();
    }
  }, []);

  async function fetchStudents() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('students') 
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date)`)
      .eq('status', 'ATIVO') 
      .order('name'); 

    if (error) setErrorMsg(`Erro de conexão: ${error.message}`);
    else setStudents(data || []);
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('soe_auth', 'true');
      fetchStudents();
    } else setLoginError(true);
  };

  const handleLogout = () => { 
    if(confirm("Deseja realmente sair?")) {
      localStorage.removeItem('soe_auth');
      window.location.reload(); 
    }
  };

  function startEditing() {
    if (!selectedStudent) return;
    setEditName(selectedStudent.name);
    setEditClass(selectedStudent.class_id);
    setEditGuardian(selectedStudent.guardian_name || '');
    setEditPhone(selectedStudent.guardian_phone || '');
    setEditAddress(selectedStudent.address || '');
    setEditAbsences(selectedStudent.absences || 0);
    setEditPerformance(selectedStudent.performance || 'Regular');
    setEditGrades(selectedStudent.grades || '');
    setIsEditing(true);
  }

  async function saveEdits() {
    if (!selectedStudent) return;
    const { error } = await supabase
      .from('students')
      .update({
        name: editName,
        class_id: editClass,
        guardian_name: editGuardian,
        guardian_phone: editPhone,
        address: editAddress,
        absences: editAbsences,
        performance: editPerformance,
        grades: editGrades
      })
      .eq('id', selectedStudent.id);

    if (error) alert('Erro ao atualizar: ' + error.message);
    else {
      alert('Dados atualizados com sucesso!');
      setIsEditing(false);
      const updatedStudent = { 
        ...selectedStudent, 
        name: editName, class_id: editClass, 
        guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress,
        absences: editAbsences, performance: editPerformance, grades: editGrades
      };
      setSelectedStudent(updatedStudent);
      fetchStudents();
    }
  }

  // --- NOVA FUNÇÃO DE SAÍDA ---
  async function handleRegisterExit() {
    if (!selectedStudent || !exitReason) {
      alert("Por favor, informe o motivo da saída.");
      return;
    }

    const { error } = await supabase
      .from('students')
      .update({ 
        status: exitType, 
        exit_reason: exitReason,
        exit_date: new Date().toISOString()
      })
      .eq('id', selectedStudent.id);

    if (error) {
      alert('Erro ao registrar saída: ' + error.message);
    } else {
      alert('Saída registrada com sucesso! O aluno não aparecerá mais na lista ativa.');
      setIsExitModalOpen(false);
      setIsModalOpen(false); 
      fetchStudents(); 
    }
  }
  // ---------------------------

  const handlePrint = () => window.print();

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return;
    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedStudent.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
    if (uploadError) { alert('Erro no upload: ' + uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
    const { error: updateError } = await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id);
    if (updateError) alert('Erro ao salvar link: ' + updateError.message);
    else {
      setSelectedStudent({ ...selectedStudent, photo_url: publicUrl });
      fetchStudents();
    }
    setUploading(false);
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

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;
    const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, guardian_name: newResponsavel, guardian_phone: newPhone, address: newAddress, status: 'ATIVO' }]);
    if (error) alert('Erro ao cadastrar: ' + error.message);
    else {
      alert('Aluno cadastrado!');
      setNewName(''); setNewClass(''); setNewResponsavel(''); setNewPhone(''); setNewAddress('');
      setIsNewStudentModalOpen(false);
      fetchStudents();
    }
  }

  async function handleSaveLog() {
    if (!selectedStudent) return;
    const descriptionCompiled = JSON.stringify({ solicitante, motivos: motivosSelecionados, acoes: acoesSelecionadas, obs: obsLivre });
    const { error } = await supabase.from('logs').insert([{
        student_id: selectedStudent.id, category: "Atendimento SOE", description: descriptionCompiled, referral: encaminhamento, return_date: dataRetorno || null, resolved: resolvido
    }]);
    if (error) alert('Erro: ' + error.message);
    else {
      alert('Registro salvo!');
      setIsModalOpen(false);
      setMotivosSelecionados([]); setAcoesSelecionadas([]); setObsLivre(DEFAULT_OBS);
      fetchStudents();
    }
  }

  const toggleItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="text-indigo-600" size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-6 text-sm">SOE Digital - CED 4 Guará</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} placeholder="Digite a Senha" value={passwordInput} onChange={e => { setPasswordInput(e.target.value); setLoginError(false); }} />
            {loginError && <p className="text-red-500 text-xs font-bold">Senha incorreta.</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">Entrar no Sistema</button>
          </form>
          <p className="mt-8 text-[10px] text-slate-400">Sistema Seguro • Versão 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
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
          <h2 className="text-xl font-bold text-slate-800">{view === 'dashboard' ? 'Visão Geral' : 'Gerenciamento de Alunos'}</h2>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block"><p className="text-sm font-bold text-slate-700">{SYSTEM_USER_NAME}</p><p className="text-xs text-slate-500">{SYSTEM_ROLE}</p></div>
             <div className="relative group cursor-pointer">
               <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
               <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={12} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={handleAdminPhotoUpload} /></label>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3"><AlertTriangle /><div><p className="font-bold">Atenção:</p><p className="text-sm">{errorMsg}</p></div></div>}
          
          {view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-slate-500 text-sm font-bold uppercase">Total de Alunos</p><h3 className="text-4xl font-bold text-slate-800 mt-2">{students.length}</h3></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-slate-500 text-sm font-bold uppercase">Atendimentos</p><h3 className="text-4xl font-bold text-indigo-600 mt-2">{students.reduce((acc, s) => acc + (s.logs?.length || 0), 0)}</h3></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                <p className="text-slate-500 text-sm font-bold uppercase">Rendimento Crítico</p>
                <h3 className="text-4xl font-bold text-red-600 mt-2">{students.filter(s => s.performance === 'Crítico' || s.performance === 'Baixo').length}</h3>
              </div>
            </div>
          )}

          {view === 'students' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                <div className="relative flex-1 max-w-lg invisible"> 
                </div>
                <button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"><Plus size={20} /> Novo Aluno</button>
              </div>
              
              {loading ? (
                <p className="text-center text-slate-500">Carregando dados...</p>
              ) : (
                <StudentList 
                  students={students} 
                  onSelectStudent={(student) => {
                    setSelectedStudent(student);
                    setIsEditing(false);
                    setActiveTab('perfil');
                    setIsModalOpen(true);
                  }}
                />
              )}

            </div>
          )}
        </div>
      </main>
      
      {/* MODAL NOVO ALUNO */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">Novo Aluno</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full p-3 border rounded-xl" placeholder="Turma (ex: 6A)" value={newClass} onChange={e => setNewClass(e.target.value)} />
                <div className="w-full p-3 border rounded-xl bg-slate-100 text-slate-500 flex items-center">Vespertino (Automático)</div>
              </div>
              <input className="w-full p-3 border rounded-xl" placeholder="Responsável (Mãe/Pai)" value={newResponsavel} onChange={e => setNewResponsavel(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full p-3 border rounded-xl" placeholder="Telefone Contato" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                <input className="w-full p-3 border rounded-xl" placeholder="Endereço / Cidade" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE SAÍDA (NOVO) */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <LogOut size={24}/> Registrar Saída
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              O aluno será removido da lista de turmas ativas, mas seus dados permanecerão salvos no banco de dados.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Saída</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="exitType" checked={exitType === 'TRANSFERIDO'} onChange={() => setExitType('TRANSFERIDO')} />
                    Transferência
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="exitType" checked={exitType === 'ABANDONO'} onChange={() => setExitType('ABANDONO')} />
                    Abandono
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Destino</label>
                <textarea 
                  className="w-full p-3 border rounded-xl" 
                  rows={3}
                  placeholder="Ex: Mudança de endereço para Taguatinga..."
                  value={exitReason}
                  onChange={e => setExitReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button onClick={handleRegisterExit} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700">Confirmar Saída</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES ALUNO */}
      {isModalOpen && selectedStudent && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="print-header p-8 border-b-2 border-black mb-4 text-center">
               <h1 className="font-bold text-xl uppercase">Governo do Distrito Federal</h1>
               <h2 className="font-bold text-lg uppercase">Secretaria de Estado de Educação</h2>
               <h3 className="font-bold text-lg uppercase mt-2">Centro Educacional 04 do Guará</h3>
               <p className="font-bold text-sm mt-4 uppercase border p-2 inline-block">Serviço de Orientação Educacional - SOE</p>
            </div>
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 no-print">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="lg" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} /></label>
                  {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                <div>
                   {isEditing ? (
                     <div className="flex gap-2">
                       <input className="border p-1 rounded font-bold text-lg w-64" value={editName} onChange={e => setEditName(e.target.value)} />
                       <input className="border p-1 rounded w-20" value={editClass} onChange={e => setEditClass(e.target.value)} />
                     </div>
                   ) : (
                     <div className="flex items-center gap-3">
                       <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                          <div className="flex gap-2 text-sm text-slate-500 items-center">
                            <span>Turma {selectedStudent.class_id}</span>
                            <span>•</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${selectedStudent.performance === 'Crítico' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {selectedStudent.performance || 'Situação Regular'}
                            </span>
                          </div>
                       </div>
                       <button onClick={startEditing} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors" title="Editar Dados"><Pencil size={18} /></button>
                       <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors" title="Imprimir Ficha"><Printer size={18} /></button>
                       <button onClick={() => setIsExitModalOpen(true)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="Registrar Saída"><LogOut size={18} /></button>
                     </div>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && <button onClick={saveEdits} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Salvar</button>}
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" size={28}/></button>
              </div>
            </div>
            <div className="flex border-b px-8 tabs-header no-print">
              <button onClick={() => setActiveTab('perfil')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'perfil' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><User size={16}/> Perfil e Dados</button>
              <button onClick={() => setActiveTab('academico')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'academico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><GraduationCap size={16}/> Acadêmico</button>
              <button onClick={() => setActiveTab('historico')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><History size={16}/> Atendimentos e Histórico</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              {(activeTab === 'perfil' || isEditing) && (
                <div className={`p-6 rounded-xl border border-slate-200 shadow-sm mb-6 ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white'} tab-content`}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 print:text-black">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Responsável</span>{isEditing ? <input className="w-full p-2 border rounded" value={editGuardian} onChange={e => setEditGuardian(e.target.value)} /> : <p className="font-medium text-lg text-slate-800">{selectedStudent.guardian_name || "—"}</p>}</div>
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Telefone</span>{isEditing ? <input className="w-full p-2 border rounded" value={editPhone} onChange={e => setEditPhone(e.target.value)} /> : <p className="font-medium text-lg text-slate-800">{selectedStudent.guardian_phone || "—"}</p>}</div>
                    <div><span className="block text-xs font-bold text-slate-500 mb-1">Endereço</span>{isEditing ? <input className="w-full p-2 border rounded" value={editAddress} onChange={e => setEditAddress(e.target.value)} /> : <p className="font-medium text-lg text-slate-800">{selectedStudent.address || "—"}</p>}</div>
                  </div>
                </div>
              )}
              {(activeTab === 'academico' || isEditing) && (
                <div className={`p-6 rounded-xl border border-slate-200 shadow-sm mb-6 ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white'} tab-content`}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 print:text-black">Desempenho Escolar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <span className="block text-xs font-bold text-slate-500 mb-1">Total de Faltas</span>
                      {isEditing ? <input type="number" className="w-full p-2 border rounded text-2xl font-bold" value={editAbsences} onChange={e => setEditAbsences(Number(e.target.value))} /> : <p className={`text-3xl font-bold ${selectedStudent.absences && selectedStudent.absences > 15 ? 'text-red-600' : 'text-slate-800'}`}>{selectedStudent.absences || 0}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">Acima de 15 faltas = Risco</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <span className="block text-xs font-bold text-slate-500 mb-1">Situação / Rendimento</span>
                      {isEditing ? <select className="w-full p-2 border rounded font-bold" value={editPerformance} onChange={e => setEditPerformance(e.target.value)}><option value="">Selecione...</option>{OPCOES_RENDIMENTO.map(op => <option key={op}>{op}</option>)}</select> : <p className={`text-2xl font-bold ${selectedStudent.performance === 'Crítico' ? 'text-red-600' : 'text-slate-800'}`}>{selectedStudent.performance || "Não avaliado"}</p>}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border col-span-1 md:col-span-3">
                      <span className="block text-xs font-bold text-slate-500 mb-2">Resumo de Notas / Observações Pedagógicas</span>
                      {isEditing ? <textarea className="w-full p-2 border rounded h-24" placeholder="Ex: Port: 8.0, Mat: 4.5 (Recuperação), Hist: 9.0..." value={editGrades} onChange={e => setEditGrades(e.target.value)} /> : <p className="text-sm text-slate-700 whitespace-pre-line">{selectedStudent.grades || "Sem notas registradas."}</p>}
                    </div>
                  </div>
                </div>
              )}
              {(activeTab === 'historico' && !isEditing) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 tab-content">
                  <div className="lg:col-span-7 space-y-6 no-print">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 new-log-area">
                      <h3 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2"><FileText size={14}/> Novo Atendimento</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500">Solicitante</label><select className="w-full mt-1 p-2 border rounded bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}><option>Professor</option><option>Coordenação</option><option>Direção</option><option>Responsável</option><option>Disciplinar</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500">Data</label><div className="mt-1 p-2 bg-slate-200 rounded text-slate-600 text-sm">{new Date().toLocaleDateString()}</div></div>
                      </div>
                    </div>
                    <div className="new-log-area"><h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Motivos</h3><div className="grid grid-cols-2 gap-6"><div><p className="text-xs font-bold text-amber-600 uppercase mb-2">Comportamento</p>{MOTIVOS_COMPORTAMENTO.map(m => (<label key={m} className="flex gap-2 text-sm text-slate-600 mb-1 cursor-pointer"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div><div><p className="text-xs font-bold text-blue-600 uppercase mb-2">Pedagógico</p>{[...MOTIVOS_PEDAGOGICO, ...MOTIVOS_SOCIAL].map(m => (<label key={m} className="flex gap-2 text-sm text-slate-600 mb-1 cursor-pointer"><input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}</label>))}</div></div></div>
                    <div className="new-log-area"><h3 className="font-bold text-slate-800 mb-3">Encaminhamentos</h3><div className="grid grid-cols-2 gap-6"><select className="w-full p-2 border rounded" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}><option value="">-- Encaminhar para --</option>{ENCAMINHAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}</select><div onClick={() => setResolvido(!resolvido)} className={`p-3 rounded border flex items-center gap-2 cursor-pointer ${resolvido ? 'bg-green-50 border-green-300' : 'bg-slate-50'}`}><div className={`w-5 h-5 border rounded flex items-center justify-center ${resolvido ? 'bg-green-500 text-white' : 'bg-white'}`}>{resolvido && <CheckSquare size={14}/>}</div><span className="text-sm font-bold">Caso Resolvido?</span></div></div></div>
                    <textarea className="w-full p-4 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-base leading-relaxed new-log-area" rows={8} value={obsLivre} onChange={e => setObsLivre(e.target.value)} />
                    <div className="flex justify-end"><button onClick={handleSaveLog} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700"><Save size={18}/> Salvar Registro</button></div>
                  </div>
                  <div className="lg:col-span-5 bg-slate-100 rounded-xl p-4 overflow-y-auto max-h-[800px] print:col-span-12 print:bg-white print:border print:border-black">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 print:text-black">Histórico Completo</h3>
                    {!selectedStudent.logs?.length && <p className="text-slate-400 text-center">Nenhum registro.</p>}
                    {selectedStudent.logs?.map(log => {
                      let parsed = { motivos: [], obs: log.description };
                      try { parsed = JSON.parse(log.description) } catch(e) {}
                      return (
                        <div key={log.id} className="bg-white p-4 rounded-lg border shadow-sm mb-3 text-sm print:border-black print:shadow-none">
                          <div className="flex justify-between mb-2"><span className="font-bold text-indigo-600 print:text-black">{new Date(log.created_at).toLocaleDateString()}</span>{log.resolved && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded print:border print:border-black">RESOLVIDO</span>}</div>
                          <p className="text-slate-600 mb-2 whitespace-pre-line print:text-black">{parsed.obs}</p>
                          {log.referral && <p className="text-xs text-purple-600 font-bold print:text-black">➔ {log.referral}</p>}
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
    </div>
  );
}
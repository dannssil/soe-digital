import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, FileText, LogOut, 
  Search, Plus, Save, X, ChevronDown, CheckSquare, 
  AlertTriangle, Heart, BookOpen, Calendar, Folder, Camera,
  Phone, MapPin, User, Pencil, Printer
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";

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
const ACOES_REALIZADAS = [
  "Escuta individual", "Mediação de conflito", "Comunicação à família",
  "Contato com professor", "Encaminhamento à coordenação", "Encaminhamento à direção"
];
const ENCAMINHAMENTOS = [
  "Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis",
  "Direção", "Conselho Tutelar",
  "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar"
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
  logs?: Log[];
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
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<'dashboard' | 'students'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(localStorage.getItem('adminPhoto'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados de EDIÇÃO
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editGuardian, setEditGuardian] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Form Novo Aluno
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newResponsavel, setNewResponsavel] = useState('');
  const [newPhone, setNewPhone] = useState('');   
  const [newAddress, setNewAddress] = useState(''); 
  
  // Form Atendimento
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [resolvido, setResolvido] = useState(false);
  
  const DEFAULT_OBS = "Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:";
  const [obsLivre, setObsLivre] = useState(DEFAULT_OBS);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('students') 
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date)`)
      .order('name'); 

    if (error) {
      setErrorMsg(`Erro de conexão: ${error.message}`);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  // --- FUNÇÕES DE EDIÇÃO ---
  function startEditing() {
    if (!selectedStudent) return;
    setEditName(selectedStudent.name);
    setEditClass(selectedStudent.class_id);
    setEditGuardian(selectedStudent.guardian_name || '');
    setEditPhone(selectedStudent.guardian_phone || '');
    setEditAddress(selectedStudent.address || '');
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
        address: editAddress
      })
      .eq('id', selectedStudent.id);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
    } else {
      alert('Dados atualizados com sucesso!');
      setIsEditing(false);
      const updatedStudent = { 
        ...selectedStudent, 
        name: editName, class_id: editClass, 
        guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress 
      };
      setSelectedStudent(updatedStudent);
      fetchStudents();
    }
  }

  // --- FUNÇÃO DE IMPRESSÃO ---
  const handlePrint = () => {
    window.print();
  };

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
    const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, guardian_name: newResponsavel, guardian_phone: newPhone, address: newAddress }]);
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

  const handleLogout = () => { if(confirm("Deseja realmente sair?")) window.location.reload(); };

  const studentsByClass = students.reduce((acc, student) => {
    const turma = student.class_id || 'Sem Turma';
    if (turma.trim().startsWith('1')) return acc;
    if (!acc[turma]) acc[turma] = [];
    acc[turma].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const filteredTurmas = Object.keys(studentsByClass).sort();

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* CSS PARA IMPRESSÃO */}
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white; }
          .modal-content { 
            box-shadow: none !important; 
            width: 100% !important; 
            max-width: 100% !important;
            height: auto !important;
            position: relative !important;
            overflow: visible !important;
          }
          .modal-overlay { 
            position: static !important; 
            background: white !important; 
            padding: 0 !important; 
          }
          /* Esconder área de novo atendimento na impressão */
          .new-log-area { display: none !important; }
          /* Mostrar cabeçalho oficial */
          .print-header { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} className="text-white"/></div>
          <div>
            <h1 className="font-bold text-lg">SOE Digital</h1>
            <p className="text-[10px] uppercase text-slate-400">CED 4 Guará</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users size={18} /> Alunos e Turmas
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full"><LogOut size={16} /> Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">{view === 'dashboard' ? 'Visão Geral' : 'Gerenciamento de Alunos'}</h2>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-slate-700">{SYSTEM_USER_NAME}</p>
               <p className="text-xs text-slate-500">{SYSTEM_ROLE}</p>
             </div>
             <div className="relative group cursor-pointer">
               <Avatar name={SYSTEM_USER_NAME} src={adminPhoto} />
               <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera size={12} className="text-white"/>
                 <input type="file" className="hidden" accept="image/*" onChange={handleAdminPhotoUpload} />
               </label>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertTriangle /><div><p className="font-bold">Atenção:</p><p className="text-sm">{errorMsg}</p></div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-slate-500 text-sm font-bold uppercase">Total de Alunos</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-2">{students.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-slate-500 text-sm font-bold uppercase">Atendimentos</p>
                <h3 className="text-4xl font-bold text-indigo-600 mt-2">{students.reduce((acc, s) => acc + (s.logs?.length || 0), 0)}</h3>
              </div>
            </div>
          )}

          {view === 'students' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" placeholder="Buscar estudante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setIsNewStudentModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all">
                  <Plus size={20} /> Novo Aluno
                </button>
              </div>

              {loading ? <p className="text-center text-slate-500">Carregando dados...</p> : 
               filteredTurmas.length === 0 ? <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"><Users size={48} className="mx-auto text-slate-300 mb-4"/><p className="text-slate-500">Nenhum aluno encontrado.</p></div> :
               filteredTurmas.map(turma => {
                 const turmaAlunos = studentsByClass[turma].filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
                 if (turmaAlunos.length === 0) return null;
                 return (
                  <div key={turma} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <Folder className="text-indigo-500" />
                      <h3 className="font-bold text-slate-700 text-lg">Turma {turma}</h3>
                      <span className="bg-white border px-2 py-0.5 rounded-md text-xs font-bold text-slate-500">{turmaAlunos.length}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {turmaAlunos.map(student => (
                        <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-indigo-50 cursor-pointer transition-colors group" onClick={() => { setSelectedStudent(student); setIsEditing(false); setIsModalOpen(true); }}>
                          <div className="flex items-center gap-4">
                            <Avatar name={student.name} src={student.photo_url} />
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-indigo-700">{student.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="bg-slate-100 px-2 rounded font-bold text-slate-600">{student.class_id}</span>
                                <span>• Vespertino</span>
                              </div>
                            </div>
                          </div>
                          <ChevronDown className="text-slate-300 group-hover:text-indigo-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                 )
               })
              }
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

      {/* MODAL ATENDIMENTO (COM IMPRESSÃO E EDIÇÃO) */}
      {isModalOpen && selectedStudent && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* CABEÇALHO PARA IMPRESSÃO (Escondido na tela) */}
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
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
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
                          <p className="text-slate-500">Turma {selectedStudent.class_id} • Vespertino</p>
                       </div>
                       <button onClick={startEditing} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors" title="Editar Dados">
                          <Pencil size={18} />
                       </button>
                       {/* BOTAO IMPRIMIR */}
                       <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors" title="Imprimir Ficha">
                          <Printer size={18} />
                       </button>
                     </div>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && <button onClick={saveEdits} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Salvar</button>}
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" size={28}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                
                {/* DADOS CADASTRAIS */}
                <div className={`p-5 rounded-xl border border-slate-200 shadow-sm ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white'} print:border-black print:shadow-none`}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 print:text-black">
                    <User size={14}/> {isEditing ? 'Editando Dados...' : 'Dados Cadastrais'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 mb-1 print:text-black">Responsável</span>
                      {isEditing ? <input className="w-full p-1 border rounded" value={editGuardian} onChange={e => setEditGuardian(e.target.value)} /> : <p className="font-medium text-slate-800">{selectedStudent.guardian_name || "—"}</p>}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-500 mb-1 print:text-black">Telefone</span>
                      {isEditing ? <input className="w-full p-1 border rounded" value={editPhone} onChange={e => setEditPhone(e.target.value)} /> : <p className="font-medium text-slate-800">{selectedStudent.guardian_phone || "—"}</p>}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-500 mb-1 print:text-black">Endereço</span>
                      {isEditing ? <input className="w-full p-1 border rounded" value={editAddress} onChange={e => setEditAddress(e.target.value)} /> : <p className="font-medium text-slate-800">{selectedStudent.address || "—"}</p>}
                    </div>
                  </div>
                </div>

                {/* AREA DE REGISTRO (SOME NA IMPRESSÃO) */}
                {!isEditing && (
                  <>
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 new-log-area">
                      <h3 className="text-xs font-bold text-indigo-800 uppercase mb-3">2. Novo Atendimento</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500">Solicitante</label>
                          <select className="w-full mt-1 p-2 border rounded bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}>
                            <option>Professor</option><option>Coordenação</option><option>Direção</option>
                            <option>Responsável</option><option>Disciplinar</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500">Data</label>
                          <div className="mt-1 p-2 bg-slate-200 rounded text-slate-600 text-sm">{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="new-log-area">
                      <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Motivos e Ações</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-bold text-amber-600 uppercase mb-2">Comportamento</p>
                          {MOTIVOS_COMPORTAMENTO.map(m => (
                            <label key={m} className="flex gap-2 text-sm text-slate-600 mb-1 cursor-pointer">
                              <input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}
                            </label>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase mb-2">Pedagógico/Social</p>
                          {[...MOTIVOS_PEDAGOGICO, ...MOTIVOS_SOCIAL].map(m => (
                            <label key={m} className="flex gap-2 text-sm text-slate-600 mb-1 cursor-pointer">
                              <input type="checkbox" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)}/> {m}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="new-log-area">
                      <h3 className="font-bold text-slate-800 mb-3">Encaminhamentos</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <select className="w-full p-2 border rounded" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}>
                          <option value="">-- Encaminhar para --</option>
                          {ENCAMINHAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <div onClick={() => setResolvido(!resolvido)} className={`p-3 rounded border flex items-center gap-2 cursor-pointer ${resolvido ? 'bg-green-50 border-green-300' : 'bg-slate-50'}`}>
                          <div className={`w-5 h-5 border rounded flex items-center justify-center ${resolvido ? 'bg-green-500 text-white' : 'bg-white'}`}>{resolvido && <CheckSquare size={14}/>}</div>
                          <span className="text-sm font-bold">Caso Resolvido?</span>
                        </div>
                      </div>
                    </div>
                    
                    <textarea 
                      className="w-full p-4 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-base leading-relaxed new-log-area" 
                      rows={15} 
                      value={obsLivre} 
                      onChange={e => setObsLivre(e.target.value)} 
                    />
                  </>
                )}
              </div>

              {/* HISTÓRICO - VISÍVEL NA IMPRESSÃO */}
              <div className="lg:col-span-4 bg-slate-50 rounded-xl p-4 overflow-y-auto max-h-[700px] print:col-span-12 print:max-h-none print:bg-white print:border print:border-black">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 print:text-black print:text-lg">Histórico do Aluno</h3>
                {!selectedStudent.logs?.length && <p className="text-slate-400 text-center">Nenhum registro.</p>}
                {selectedStudent.logs?.map(log => {
                  let parsed = { motivos: [], obs: log.description };
                  try { parsed = JSON.parse(log.description) } catch(e) {}
                  return (
                    <div key={log.id} className="bg-white p-3 rounded-lg border shadow-sm mb-3 text-sm print:border-black print:shadow-none print:mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-indigo-600 print:text-black">{new Date(log.created_at).toLocaleDateString()}</span>
                        {log.resolved && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded print:border print:border-black print:text-black print:bg-white">RESOLVIDO</span>}
                      </div>
                      <p className="text-slate-600 mb-2 whitespace-pre-line print:text-black">{parsed.obs}</p>
                      {log.referral && <p className="text-xs text-purple-600 font-bold print:text-black">➔ Encaminhado: {log.referral}</p>}
                    </div>
                  )
                })}
              </div>
            </div>

            {!isEditing && (
              <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 no-print">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl bg-white border font-bold text-slate-600">Cancelar</button>
                <button onClick={handleSaveLog} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2"><Save size={18}/> Salvar Registro</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
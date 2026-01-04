import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, 
  Search, Plus, Save, X, Filter, ChevronDown, CheckSquare, 
  AlertTriangle, Heart, BookOpen, Menu, Calendar, Phone
} from 'lucide-react';

// --- CONFIGURAÇÕES E LISTAS (Recuperadas do seu pedido original) ---

const MOTIVOS_COMPORTAMENTO = [
  "Conversa excessiva em sala", "Desacato / falta de respeito",
  "Agressividade verbal", "Agressividade física", "Uso indevido de celular",
  "Saída de sala sem autorização", "Bullying / conflito com colegas", "Desobediência às orientações"
];

const MOTIVOS_PEDAGOGICO = [
  "Não realização de atividades", "Dificuldade de aprendizagem",
  "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado"
];

const MOTIVOS_SOCIAL = [
  "Ansiedade / desmotivação", "Problemas familiares",
  "Isolamento / dificuldade de socialização", "Queixas de colegas / professores"
];

const ACOES_REALIZADAS = [
  "Escuta individual", "Mediação de conflito", "Comunicação à família",
  "Contato com professor", "Encaminhamento à coordenação", "Encaminhamento à direção",
  "Acompanhamento pedagógico", "Agendamento de retorno"
];

const ENCAMINHAMENTOS = [
  "Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis",
  "Serviço social", "Direção", "Conselho Tutelar"
];

// --- INTERFACES ---
interface Student {
  id: any; 
  nome_do_aluno: string;
  turma: string;
  turno?: string;       // Recuperado
  responsavel?: string; // Recuperado
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

// --- COMPONENTE AVATAR (Visual bonito sem precisar de upload) ---
function Avatar({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) {
  const initials = (name || "?")
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-sm`}>
      {initials}
    </div>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  // Estados Gerais
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'students'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false); // Modal novo aluno separado

  // Estados Novo Aluno (Completos)
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newTurno, setNewTurno] = useState('Matutino');
  const [newResponsavel, setNewResponsavel] = useState('');
  
  // Estados do Formulário de Atendimento (Complexo)
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [resolvido, setResolvido] = useState(false);
  const [obsLivre, setObsLivre] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    // Busca correta na tabela 'estudantes'
    const { data, error } = await supabase
      .from('estudantes') 
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date)`)
      .order('nome_do_aluno');

    if (error) console.error("Erro ao buscar:", error);
    else setStudents(data || []);
    setLoading(false);
  }

  // --- CADASTRO DE ALUNO COMPLETO ---
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;

    const { error } = await supabase
      .from('estudantes')
      .insert([{ 
        nome_do_aluno: newName, 
        turma: newClass,
        turno: newTurno,
        responsavel: newResponsavel
      }]);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Aluno cadastrado com sucesso!');
      setNewName(''); setNewClass(''); setNewResponsavel('');
      setIsNewStudentModalOpen(false);
      fetchStudents();
    }
  }

  // --- SALVAR ATENDIMENTO (LOGICA JSON) ---
  async function handleSaveLog() {
    if (!selectedStudent) return;

    // Estrutura rica de dados salva como JSON
    const descriptionCompiled = JSON.stringify({
      solicitante,
      motivos: motivosSelecionados,
      acoes: acoesSelecionadas,
      obs: obsLivre
    });

    const mainCategory = motivosSelecionados.length > 0 ? "Ocorrência/Atendimento" : "Observação";

    const { error } = await supabase
      .from('logs')
      .insert([{
        student_id: selectedStudent.id,
        category: mainCategory,
        description: descriptionCompiled,
        referral: encaminhamento,
        return_date: dataRetorno || null,
        resolved: resolvido
      }]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Atendimento registrado!');
      setIsModalOpen(false);
      // Resetar form
      setMotivosSelecionados([]);
      setAcoesSelecionadas([]);
      setObsLivre('');
      setEncaminhamento('');
      fetchStudents();
    }
  }

  const toggleItem = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  // Agrupamento por Turma
  const studentsByClass = students.reduce((acc, student) => {
    const turma = student.turma || 'Sem Turma';
    if (!acc[turma]) acc[turma] = [];
    acc[turma].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const filteredTurmas = Object.keys(studentsByClass).sort();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- SIDEBAR FIXA --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30"><BookOpen size={20} className="text-white"/></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SOE Digital</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Gestão Escolar</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Users size={18} /> Alunos e Turmas
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {view === 'dashboard' ? 'Painel de Controle' : 'Gerenciamento de Alunos'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-500">Olá, Coordenador</span>
             <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">C</div>
          </div>
        </header>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {view === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium uppercase">Total de Alunos</p>
                    <h3 className="text-3xl font-bold text-slate-800">{students.length}</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FileText size={24}/></div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium uppercase">Atendimentos</p>
                    <h3 className="text-3xl font-bold text-slate-800">{students.reduce((acc, s) => acc + (s.logs?.length || 0), 0)}</h3>
                  </div>
                </div>
              </div>
              {/* Mais cards aqui */}
            </div>
          )}

          {view === 'students' && (
            <div className="max-w-5xl mx-auto">
              {/* Barra de Ações */}
              <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
                    placeholder="Buscar por nome, turma..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsNewStudentModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform hover:-translate-y-1"
                >
                  <Plus size={20} /> Cadastrar Aluno
                </button>
              </div>

              {/* Lista por Turmas */}
              {loading ? <div className="text-center py-20 text-slate-400">Carregando base de dados...</div> : 
               filteredTurmas.map(turma => {
                 const turmaAlunos = studentsByClass[turma].filter(s => s.nome_do_aluno.toLowerCase().includes(searchTerm.toLowerCase()));
                 if (turmaAlunos.length === 0) return null;

                 return (
                  <div key={turma} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                        Turma {turma}
                      </h3>
                      <span className="text-xs font-bold bg-white border px-3 py-1 rounded-full text-slate-500">
                        {turmaAlunos.length} estudantes
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {turmaAlunos.map(student => (
                        <div 
                          key={student.id} 
                          className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                          onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar name={student.nome_do_aluno} />
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{student.nome_do_aluno}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>ID: #{student.id}</span>
                                {student.turno && <span>• {student.turno}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             {student.logs && student.logs.length > 0 && (
                               <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                 <FileText size={12}/> {student.logs.length} Reg.
                               </div>
                             )}
                             <ChevronDown className="text-slate-300 group-hover:text-indigo-500" />
                          </div>
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

      {/* --- MODAL 1: NOVO ALUNO (AGORA COM TURNO E RESPONSÁVEL) --- */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Novo Cadastro</h3>
              <button onClick={() => setIsNewStudentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Nome Completo</label>
                <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Ana Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Turma</label>
                  <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="Ex: 301" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Turno</label>
                  <select className="w-full p-3 border rounded-xl bg-white" value={newTurno} onChange={e => setNewTurno(e.target.value)}>
                    <option>Matutino</option>
                    <option>Vespertino</option>
                    <option>Noturno</option>
                    <option>Integral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Nome do Responsável</label>
                <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newResponsavel} onChange={e => setNewResponsavel(e.target.value)} placeholder="Opcional" />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Confirmar Cadastro</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ATENDIMENTO COMPLETO --- */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-5">
                <Avatar name={selectedStudent.nome_do_aluno} size="lg" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.nome_do_aluno}</h2>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="bg-white border px-2 py-0.5 rounded font-semibold text-slate-600">Turma {selectedStudent.turma}</span>
                    <span className="flex items-center gap-1"><Calendar size={14}/> {selectedStudent.turno || 'Não informado'}</span>
                    {selectedStudent.responsavel && <span className="flex items-center gap-1 text-indigo-600"><Users size={14}/> Resp: {selectedStudent.responsavel}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ESQUERDA: FORMULÁRIO (8 colunas) */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Seção 1 */}
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <FileText size={16}/> 1. Identificação do Atendimento
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Solicitado por</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-white" value={solicitante} onChange={e => setSolicitante(e.target.value)}>
                          <option>Professor</option>
                          <option>Coordenação</option>
                          <option>Direção</option>
                          <option>Responsável</option>
                          <option>Espontâneo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Data do Registro</label>
                        <div className="mt-1 p-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                          {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2 */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">2. Motivo do Atendimento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1"><AlertTriangle size={14}/> Comportamento</p>
                        {MOTIVOS_COMPORTAMENTO.map(m => (
                          <label key={m} className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="mt-1 rounded text-indigo-600" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} />
                            {m}
                          </label>
                        ))}
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><BookOpen size={14}/> Pedagógico</p>
                          {MOTIVOS_PEDAGOGICO.map(m => (
                            <label key={m} className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                              <input type="checkbox" className="mt-1 rounded text-indigo-600" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} />
                              {m}
                            </label>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1"><Heart size={14}/> Social / Emocional</p>
                          {MOTIVOS_SOCIAL.map(m => (
                            <label key={m} className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                              <input type="checkbox" className="mt-1 rounded text-indigo-600" checked={motivosSelecionados.includes(m)} onChange={() => toggleItem(motivosSelecionados, setMotivosSelecionados, m)} />
                              {m}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção 3 e 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3">3. Ações Realizadas</h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        {ACOES_REALIZADAS.map(a => (
                          <label key={a} className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={acoesSelecionadas.includes(a)} onChange={() => toggleItem(acoesSelecionadas, setAcoesSelecionadas, a)}/>
                            {a}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 mb-3">4. Encaminhamentos</h3>
                      <select className="w-full p-2.5 border rounded-lg text-sm" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)}>
                        <option value="">-- Selecione se houver --</option>
                        {ENCAMINHAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                      
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Previsão de Retorno</label>
                        <input type="date" className="w-full mt-1 p-2 border rounded-lg text-sm" value={dataRetorno} onChange={e => setDataRetorno(e.target.value)} />
                      </div>

                      <div className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${resolvido ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setResolvido(!resolvido)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${resolvido ? 'bg-green-500 border-green-500 text-white' : 'bg-white'}`}>
                          {resolvido && <CheckSquare size={14}/>}
                        </div>
                        <span className={`text-sm font-bold ${resolvido ? 'text-green-700' : 'text-slate-500'}`}>Situação Resolvida</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">5. Observações Detalhadas</h3>
                    <textarea 
                      className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 leading-relaxed shadow-sm"
                      rows={4}
                      placeholder="Descreva aqui os detalhes da conversa, combinados e percepções..."
                      value={obsLivre}
                      onChange={e => setObsLivre(e.target.value)}
                    />
                  </div>

                </div>

                {/* DIREITA: HISTÓRICO (4 colunas) */}
                <div className="lg:col-span-4 flex flex-col h-full">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <Calendar size={14}/> Histórico de Registros
                  </h3>
                  <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-y-auto p-4 space-y-4 max-h-[600px]">
                    {!selectedStudent.logs || selectedStudent.logs.length === 0 ? (
                       <div className="text-center py-10 opacity-50">
                         <FileText size={40} className="mx-auto mb-2 text-slate-300"/>
                         <p className="text-sm text-slate-400">Nenhum registro encontrado.</p>
                       </div>
                    ) : (
                      selectedStudent.logs
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(log => {
                        let detalhes = { motivos: [], acoes: [], obs: log.description };
                        try {
                          const parsed = JSON.parse(log.description);
                          if (parsed.motivos) detalhes = parsed;
                        } catch (e) {}

                        return (
                          <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-50">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{new Date(log.created_at).toLocaleDateString()}</span>
                              {log.resolved && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">RESOLVIDO</span>}
                            </div>
                            
                            {detalhes.motivos && detalhes.motivos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {detalhes.motivos.map((m:any) => <span key={m} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{m}</span>)}
                              </div>
                            )}

                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detalhes.obs}</p>
                            
                            {log.referral && (
                              <div className="mt-3 pt-2 border-t border-slate-50 text-xs font-semibold text-purple-600 flex items-center gap-1">
                                ➔ {log.referral}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSaveLog} className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center gap-2">
                <Save size={18}/> Salvar Registro
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
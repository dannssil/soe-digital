import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Trash2, UserPlus, Search, FileText, X, Save, 
  Filter, Download, LogOut, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, Calendar, Database
} from 'lucide-react';

// --- Interfaces ---
interface Student {
  id: number;
  name: string;
  class: string;
  tags?: string[];
  logs?: Log[];
}

interface Log {
  id: number;
  student_id: number;
  description: string;
  category: string;
  created_at: string;
  referral?: string;
  resolved?: boolean;
  return_date?: string;
}

// --- Listas e Configurações ---
const ACTIONS_LIST = [
  "Conversa com o aluno",
  "Contato com o responsável",
  "Encaminhamento à direção",
  "Ocorrência disciplinar",
  "Atendimento pedagógico",
  "Suspensão",
  "Outro"
];

const TAGS_TEMPLATE = [
  "Dificuldade de Aprendizagem",
  "Comportamento",
  "Frequência Irregular",
  "Saúde",
  "Vulnerabilidade Social",
  "Acompanhamento Especializado"
];

// --- Componente de Estatísticas ---
function Statistics({ students }: { students: Student[] }) {
  const totalStudents = students.length;
  
  // Contagem de atendimentos (logs)
  const totalLogs = students.reduce((acc, s) => acc + (s.logs?.length || 0), 0);
  
  // Alunos com "Comportamento"
  const behaviorIssues = students.filter(s => s.tags?.includes('Comportamento')).length;
  
  // Pendências (logs não resolvidos)
  const pendingIssues = students.reduce((acc, s) => {
    const unresolved = s.logs?.filter(l => l.resolved === false).length || 0;
    return acc + unresolved;
  }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <UserPlus size={18} />
          <span className="text-sm font-medium">Alunos Monitorados</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
        <div className="flex items-center gap-2 text-purple-600 mb-1">
          <Database size={18} />
          <span className="text-sm font-medium">Total de Registros</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{totalLogs}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
        <div className="flex items-center gap-2 text-orange-600 mb-1">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">Comportamento</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{behaviorIssues}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
        <div className="flex items-center gap-2 text-red-600 mb-1">
          <Clock size={18} />
          <span className="text-sm font-medium">Pendências</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{pendingIssues}</p>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Estados para novo aluno
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');

  // Estados para novo registro (log)
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogCategory, setNewLogCategory] = useState(ACTIONS_LIST[0]);
  const [newLogReferral, setNewLogReferral] = useState('');
  const [newLogReturnDate, setNewLogReturnDate] = useState('');
  const [newLogResolved, setNewLogResolved] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        logs (
          id, description, category, created_at, referral, resolved, return_date
        )
      `)
      .order('name');

    if (error) {
      console.error('Erro ao buscar:', error);
      alert('Erro ao carregar dados. Verifique o console.');
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  // Adicionar Aluno
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;

    const { error } = await supabase
      .from('students')
      .insert([{ name: newName, class: newClass }]);

    if (error) {
      alert('Erro ao criar aluno: ' + error.message);
    } else {
      setNewName('');
      setNewClass('');
      fetchStudents();
    }
  }

  // Adicionar Registro (Log)
  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !newLogDesc) return;

    const { error } = await supabase
      .from('logs')
      .insert([{
        student_id: selectedStudent.id,
        description: newLogDesc,
        category: newLogCategory,
        referral: newLogReferral,
        return_date: newLogReturnDate || null,
        resolved: newLogResolved
      }]);

    if (error) {
      alert('Erro ao salvar registro: ' + error.message);
    } else {
      alert('Registro salvo com sucesso!');
      setNewLogDesc('');
      setNewLogReferral('');
      setNewLogReturnDate('');
      setNewLogResolved(false);
      fetchStudents(); // Recarrega para atualizar a lista local
      setIsModalOpen(false); // Fecha modal
    }
  }

  // Atualizar Tags
  async function toggleTag(student: Student, tag: string) {
    const currentTags = student.tags || [];
    let updatedTags;

    if (currentTags.includes(tag)) {
      updatedTags = currentTags.filter(t => t !== tag);
    } else {
      updatedTags = [...currentTags, tag];
    }

    const { error } = await supabase
      .from('students')
      .update({ tags: updatedTags })
      .eq('id', student.id);

    if (error) {
      alert('Erro ao atualizar tags');
    } else {
      // Atualiza estado local rápido
      setStudents(students.map(s => 
        s.id === student.id ? { ...s, tags: updatedTags } : s
      ));
      if (selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, tags: updatedTags });
      }
    }
  }

  // Filtragem
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">SOE Digital</h1>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            title="Recarregar"
          >
            <Filter size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <Statistics students={students} />

        {/* Formulário Novo Aluno */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <UserPlus size={16} /> Novo Cadastro
          </h2>
          <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome completo do aluno"
              className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Turma (ex: 301)"
              className="w-full md:w-32 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={newClass}
              onChange={e => setNewClass(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Cadastrar
            </button>
          </form>
        </div>

        {/* Lista de Alunos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <UserPlus size={18} className="text-gray-400" />
              Lista de Alunos ({filteredStudents.length})
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou turma..." 
                className="w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando dados...</div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">Turma: {student.class}</p>
                      
                      {/* Tags visíveis na lista */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.tags?.map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown className="text-gray-300 group-hover:text-blue-500" size={20} />
                  </div>
                </div>
              ))}
              
              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  Nenhum aluno encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE DETALHES */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-500">Turma {selectedStudent.class} • ID #{selectedStudent.id}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b">
              <button 
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('details')}
              >
                Novo Registro & Tags
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('history')}
              >
                Histórico ({selectedStudent.logs?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* ABA: DETALHES */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Seção de Tags */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Marcadores de Atenção</h3>
                    <div className="flex flex-wrap gap-2">
                      {TAGS_TEMPLATE.map(tag => {
                        const active = selectedStudent.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(selectedStudent, tag)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                              active 
                                ? 'bg-blue-100 border-blue-200 text-blue-700 font-medium' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr />

                  {/* Formulário de Registro */}
                  <form onSubmit={handleAddLog}>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Adicionar Ocorrência / Atendimento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tipo de Ação</label>
                        <select 
                          className="w-full p-2 border rounded-md text-sm"
                          value={newLogCategory}
                          onChange={e => setNewLogCategory(e.target.value)}
                        >
                          {ACTIONS_LIST.map(action => (
                            <option key={action} value={action}>{action}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Retorno (Opcional)</label>
                        <input 
                          type="date" 
                          className="w-full p-2 border rounded-md text-sm"
                          value={newLogReturnDate}
                          onChange={e => setNewLogReturnDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 mb-1">Descrição Detalhada</label>
                      <textarea 
                        className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                        placeholder="Descreva o que aconteceu, o que foi conversado e quais os combinados..."
                        value={newLogDesc}
                        onChange={e => setNewLogDesc(e.target.value)}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1">Encaminhamento (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Encaminhado para psicóloga escolar..."
                        className="w-full p-2 border rounded-md text-sm"
                        value={newLogReferral}
                        onChange={e => setNewLogReferral(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <input 
                        type="checkbox" 
                        id="resolved"
                        checked={newLogResolved}
                        onChange={e => setNewLogResolved(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="resolved" className="text-sm text-gray-700">Situação Resolvida?</label>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Salvar Registro no Histórico
                    </button>
                  </form>
                </div>
              )}

              {/* ABA: HISTÓRICO */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {(!selectedStudent.logs || selectedStudent.logs.length === 0) ? (
                    <div className="text-center text-gray-400 py-10">
                      <FileText size={40} className="mx-auto mb-2 opacity-20" />
                      <p>Nenhum registro encontrado para este aluno.</p>
                    </div>
                  ) : (
                    selectedStudent.logs
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Mais recente primeiro
                      .map(log => (
                        <div key={log.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                              {log.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{log.description}</p>
                          
                          {(log.referral || log.return_date || log.resolved !== undefined) && (
                            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                              {log.referral && (
                                <div className="col-span-2 flex items-center gap-1">
                                  <LogOut size={12} /> Encaminhamento: {log.referral}
                                </div>
                              )}
                              {log.return_date && (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Calendar size={12} /> Retorno: {new Date(log.return_date).toLocaleDateString()}
                                </div>
                              )}
                              <div className={`flex items-center gap-1 ${log.resolved ? 'text-green-600' : 'text-red-500'}`}>
                                {log.resolved ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                {log.resolved ? 'Resolvido' : 'Pendente'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
              SOE Digital • Confidencial
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
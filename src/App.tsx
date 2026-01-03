import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Trash2, UserPlus, Search, FileText, X, Save, 
  Filter, Download, LogOut, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, Calendar, Database
} from 'lucide-react';

// --- Interfaces (Compatíveis com seu Banco) ---
interface Student {
  id: any; 
  nome_do_aluno: string;
  turma: string;
  tags?: string[];
  logs?: Log[];
}

interface Log {
  id: number;
  student_id: any;
  description: string;
  category: string;
  created_at: string;
  referral?: string;
  resolved?: boolean;
  return_date?: string;
}

const ACTIONS_LIST = [
  "Conversa com o aluno",
  "Contato com o responsável",
  "Encaminhamento à direção",
  "Ocorrência disciplinar",
  "Atendimento pedagógico",
  "Suspensão",
  "Outro"
];

// --- Estatísticas ---
function Statistics({ students }: { students: Student[] }) {
  const totalStudents = students.length;
  const totalLogs = students.reduce((acc, s) => acc + (s.logs?.length || 0), 0);
  const pendingIssues = students.reduce((acc, s) => {
    const unresolved = s.logs?.filter(l => l.resolved === false).length || 0;
    return acc + unresolved;
  }, 0);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <UserPlus size={18} /> <span className="text-xs font-bold uppercase">Alunos</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
        <div className="flex items-center gap-2 text-purple-600 mb-1">
          <Database size={18} /> <span className="text-xs font-bold uppercase">Registros</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{totalLogs}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
        <div className="flex items-center gap-2 text-red-600 mb-1">
          <AlertCircle size={18} /> <span className="text-xs font-bold uppercase">Pendências</span>
        </div>
        <p className="text-2xl font-bold text-gray-800">{pendingIssues}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Cadastro Novo Aluno
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');

  // Cadastro Novo Log
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogCategory, setNewLogCategory] = useState(ACTIONS_LIST[0]);
  const [newLogReferral, setNewLogReferral] = useState('');
  const [newLogReturnDate, setNewLogReturnDate] = useState('');
  const [newLogResolved, setNewLogResolved] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students') // Nome da tabela em inglês
      .select(`
        *,
        logs (
          id, description, category, created_at, referral, resolved, return_date
        )
      `)
      .order('nome_do_aluno'); // Ordenação

    if (error) {
      console.error('Erro:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;

    const { error } = await supabase
      .from('students')
      .insert([{ nome_do_aluno: newName, turma: newClass }]);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      setNewName('');
      setNewClass('');
      fetchStudents();
    }
  }

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
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Registro salvo com sucesso!');
      setNewLogDesc('');
      setNewLogReferral('');
      setNewLogReturnDate('');
      setNewLogResolved(false);
      fetchStudents();
      setIsModalOpen(false);
    }
  }

  const filteredStudents = students.filter(s => 
    (s.nome_do_aluno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.turma || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Cabeçalho */}
      <header className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SOE Digital</h1>
          </div>
          <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-blue-600">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <Statistics students={students} />

        {/* Cadastro Rápido */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <UserPlus size={16} /> Cadastrar Novo Aluno
          </h2>
          <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-3">
            <input 
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nome Completo do Aluno" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />
            <input 
              className="w-full md:w-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Turma (ex: 301)" 
              value={newClass} 
              onChange={e => setNewClass(e.target.value)} 
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
              Salvar
            </button>
          </form>
        </div>

        {/* Lista de Alunos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="font-semibold text-gray-700">Lista de Alunos ({filteredStudents.length})</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                className="w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Buscar aluno ou turma..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y">
            {loading ? <div className="p-8 text-center text-gray-500">Carregando dados...</div> : 
             filteredStudents.map(student => (
              <div 
                key={student.id} 
                className="p-4 hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Badge da Turma */}
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-bold border">
                      {student.turma || '?'}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800">{student.nome_do_aluno}</h3>
                      {student.logs && student.logs.length > 0 && (
                         <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                           <FileText size={12}/> {student.logs.length} registro(s)
                         </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="text-gray-300 group-hover:text-blue-500" />
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-400">Nenhum aluno encontrado.</div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DETALHADO */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.nome_do_aluno}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Turma {selectedStudent.turma}</span>
                  <span>• ID: {typeof selectedStudent.id === 'string' ? selectedStudent.id.slice(0,8) : selectedStudent.id}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b bg-white">
              <button 
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                onClick={() => setActiveTab('details')}
              >
                Novo Atendimento
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                onClick={() => setActiveTab('history')}
              >
                Histórico ({selectedStudent.logs?.length || 0})
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activeTab === 'details' ? (
                <form onSubmit={handleAddLog} className="space-y-4">
                  
                  {/* Linha 1: Categoria e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ocorrência</label>
                      <div className="relative">
                        <select 
                          className="w-full p-3 border rounded-lg appearance-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newLogCategory} 
                          onChange={e => setNewLogCategory(e.target.value)}
                        >
                          {ACTIONS_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Retorno (Opcional)</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newLogReturnDate} 
                        onChange={e => setNewLogReturnDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição Detalhada</label>
                    <textarea 
                      className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" 
                      placeholder="Descreva o atendimento, combinados e observações..." 
                      value={newLogDesc} 
                      onChange={e => setNewLogDesc(e.target.value)}
                    />
                  </div>

                  {/* Encaminhamento */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Encaminhamento (Se houver)</label>
                    <div className="relative">
                      <LogOut className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        className="w-full pl-10 p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: Psicologia, Direção, Família..."
                        value={newLogReferral}
                        onChange={e => setNewLogReferral(e.target.value)}
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Checkbox Resolvido */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer" onClick={() => setNewLogResolved(!newLogResolved)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newLogResolved ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                      {newLogResolved && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <label className="text-sm font-medium text-blue-900 cursor-pointer select-none">
                      Marcar este atendimento como RESOLVIDO
                    </label>
                  </div>

                  <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                    <Save size={20} /> Salvar Registro
                  </button>
                </form>
              ) : (
                // ABA HISTÓRICO
                <div className="space-y-4">
                  {(!selectedStudent.logs || selectedStudent.logs.length === 0) ? (
                    <div className="text-center py-10">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="text-gray-400" size={30} />
                      </div>
                      <p className="text-gray-500">Nenhum registro encontrado.</p>
                    </div>
                  ) : (
                    selectedStudent.logs
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Mais recentes primeiro
                      .map(log => (
                      <div key={log.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide border border-blue-100">
                            {log.category}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{log.description}</p>
                        
                        {/* Rodapé do Card */}
                        <div className="flex flex-wrap gap-2 text-xs pt-3 border-t border-gray-100">
                          {log.referral && (
                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              <LogOut size={12} /> Encaminhado: {log.referral}
                            </span>
                          )}
                          {log.return_date && (
                            <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              <Calendar size={12} /> Retorno: {new Date(log.return_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2 py-1 rounded ${log.resolved ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {log.resolved ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                            {log.resolved ? 'Resolvido' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t text-center">
              <p className="text-xs text-gray-400">Sistema SOE Digital • Confidencial</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
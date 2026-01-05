import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder, User } from 'lucide-react';

// Interface do Aluno (Igual ao App.tsx)
interface Student {
  id: any;
  name: string;
  class_id: string;
  photo_url?: string;
  status: string; // Adicionado para evitar erro de compatibilidade
}

// AQUI ESTAVA FALTANDO: Definimos que o componente aceita 'onSelectStudent'
interface StudentListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void; 
}

export default function StudentList({ students, onSelectStudent }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const groupedStudents = useMemo(() => {
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, Student[]> = {};
    const ordemTurmas = ['6A', '6B', '6C', '6D', '7A', '7B', '7C', '7D', '8A', '8B', '8C', '9A', '9B', '9C'];

    ordemTurmas.forEach(t => groups[t] = []);

    filtered.forEach(student => {
      const turma = student.class_id || 'Sem Turma';
      if (!groups[turma]) groups[turma] = [];
      groups[turma].push(student);
    });

    return groups;
  }, [students, searchTerm]);

  const toggleFolder = (turma: string) => {
    setExpandedFolders(prev => ({ ...prev, [turma]: !prev[turma] }));
  };

  const isExpanded = (turma: string) => {
    if (searchTerm.length > 0) return true;
    return !!expandedFolders[turma];
  };

  return (
    <div className="w-full space-y-4">
      {/* BARRA DE PESQUISA DENTRO DAS PASTAS */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar estudante nas pastas..."
          className="w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {Object.entries(groupedStudents).map(([turma, alunosDaTurma]) => {
          if (searchTerm && alunosDaTurma.length === 0) return null;
          if (!searchTerm && alunosDaTurma.length === 0) return null;

          return (
            <div key={turma} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleFolder(turma)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded(turma) ? <ChevronDown className="text-slate-400" size={20} /> : <ChevronRight className="text-slate-400" size={20} />}
                  <div className="flex items-center gap-2">
                    <Folder className="text-indigo-500 fill-indigo-100" size={24} />
                    <span className="font-bold text-lg text-slate-700">Turma {turma}</span>
                  </div>
                </div>
                <span className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                  {alunosDaTurma.length} alunos
                </span>
              </button>

              {isExpanded(turma) && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {alunosDaTurma.map((aluno) => (
                    <div 
                      key={aluno.id} 
                      className="p-4 pl-12 flex items-center gap-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                      onClick={() => onSelectStudent(aluno)}
                    >
                      {aluno.photo_url ? (
                        <img src={aluno.photo_url} alt={aluno.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {aluno.name.substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{aluno.name}</p>
                        <p className="text-xs text-slate-400">Vespertino</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
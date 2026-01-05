import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder, User } from 'lucide-react'; // Ajuste conforme sua lib de ícones

// Interface simples baseada no que conversamos (ajuste se necessário)
interface Student {
  id: string;
  name: string;
  class_id: string; // Sua coluna de turma (6A, 6B...)
  photo_url?: string;
  status: string; // 'ATIVO', 'BAIXO', etc.
}

export default function StudentList({ students }: { students: Student[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar quais pastas estão abertas
  // Ex: { "6A": true, "6B": false }
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // --- LÓGICA DE FILTRO E AGRUPAMENTO ---
  const groupedStudents = useMemo(() => {
    // 1. Primeiro filtramos pelo termo de busca (se houver)
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Depois agrupamos por turma
    const groups: Record<string, Student[]> = {};
    
    // Ordem fixa para garantir que apareça 6A, 6B... e não misturado
    const ordemTurmas = [
      '6A', '6B', '6C', '6D', 
      '7A', '7B', '7C', '7D', 
      '8A', '8B', '8C', 
      '9A', '9B', '9C'
    ];

    // Inicializa os arrays vazios para manter a ordem
    ordemTurmas.forEach(t => groups[t] = []);

    // Preenche os grupos
    filtered.forEach(student => {
      const turma = student.class_id || 'Sem Turma';
      if (!groups[turma]) groups[turma] = [];
      groups[turma].push(student);
    });

    return groups;
  }, [students, searchTerm]);

  // Função para abrir/fechar pasta
  const toggleFolder = (turma: string) => {
    setExpandedFolders(prev => ({ ...prev, [turma]: !prev[turma] }));
  };

  // Se o usuário estiver pesquisando, forçamos a pasta a ficar aberta
  const isExpanded = (turma: string) => {
    if (searchTerm.length > 0) return true; // Pesquisa ativa = Tudo aberto
    return !!expandedFolders[turma];
  };

  return (
    <div className="w-full space-y-4">
      {/* --- BARRA DE PESQUISA --- */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar estudante por nome..."
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- LISTAGEM DE PASTAS --- */}
      <div className="space-y-2">
        {Object.entries(groupedStudents).map(([turma, alunosDaTurma]) => {
          // Se a pesquisa estiver ativa e a turma estiver vazia, esconde a pasta
          if (searchTerm && alunosDaTurma.length === 0) return null;
          // Se não tiver pesquisa e a turma for vazia, você decide se mostra ou não (aqui optei por esconder se estiver vazia sempre)
          if (alunosDaTurma.length === 0) return null;

          return (
            <div key={turma} className="border rounded-lg bg-white shadow-sm overflow-hidden">
              {/* CABEÇALHO DA PASTA (CLICÁVEL) */}
              <button
                onClick={() => toggleFolder(turma)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Ícone muda se aberto ou fechado */}
                  {isExpanded(turma) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  
                  <div className="flex items-center gap-2">
                    <Folder className="text-blue-600" size={20} />
                    <span className="font-bold text-lg text-gray-800">Turma {turma}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   {/* Aqui entraremos com os Badges de Críticos no futuro */}
                   <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                     {alunosDaTurma.length} alunos
                   </span>
                </div>
              </button>

              {/* CONTEÚDO DA PASTA (LISTA DE ALUNOS) */}
              {isExpanded(turma) && (
                <div className="divide-y divide-gray-100 border-t">
                  {alunosDaTurma.map((aluno) => (
                    <div 
                      key={aluno.id} 
                      className="p-3 pl-10 flex items-center gap-3 hover:bg-blue-50 cursor-pointer transition-colors"
                      // onClick={() => abrirPerfil(aluno)} <--- Sua função de abrir modal aqui
                    >
                      {/* Avatar ou Foto */}
                      {aluno.photo_url ? (
                        <img src={aluno.photo_url} alt={aluno.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">{aluno.name}</span>
                        {/* Exemplo de status visual rápido */}
                        {/* <span className="text-xs text-gray-400">Status: {aluno.status}</span> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Feedback visual se a busca não encontrar nada */}
        {searchTerm && Object.values(groupedStudents).flat().length === 0 && (
          <div className="text-center p-8 text-gray-500">
            Nenhum aluno encontrado para "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
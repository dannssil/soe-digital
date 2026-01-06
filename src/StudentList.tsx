import React, { useState } from 'react';
import { Search, Folder, ChevronRight, User } from 'lucide-react';

interface StudentListProps {
  students: any[];
  onSelectStudent: (s: any) => void;
  searchTerm: string;                  // Recebe o texto da busca global
  onSearchChange: (term: string) => void; // Avisa o App que a busca mudou (opcional se for unidirecional)
}

export default function StudentList({ students, onSelectStudent, searchTerm, onSearchChange }: StudentListProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  // Agrupar alunos por turma
  const studentsByClass = students.reduce((acc: any, student) => {
    const turma = student.class_id || 'Sem Turma';
    if (!acc[turma]) acc[turma] = [];
    acc[turma].push(student);
    return acc;
  }, {});

  const turmas = Object.keys(studentsByClass).sort();

  // Filtragem da busca global
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Se houver texto na busca, ativa o modo "Lista Direta"
  const isSearching = searchTerm.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Cabeçalho da Lista */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 uppercase text-sm">
          {isSearching ? `Resultados: ${filteredStudents.length} encontrado(s)` : 'Navegação por Turmas'}
        </h3>
        {/* Dica visual */}
        {!isSearching && <span className="text-xs text-slate-400">Selecione uma pasta abaixo</span>}
      </div>

      <div className="p-4">
        {/* MODO BUSCA (Lista direta) */}
        {isSearching ? (
          <div className="space-y-2">
            {filteredStudents.map(student => (
              <div key={student.id} onClick={() => onSelectStudent(student)} className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-indigo-100 group">
                {student.photo_url ? (
                  <img src={student.photo_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{student.name.substring(0,2)}</div>
                )}
                <div>
                  <p className="font-bold text-slate-700 group-hover:text-indigo-700">{student.name}</p>
                  <p className="text-xs text-slate-500">Turma {student.class_id}</p>
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && <p className="text-center text-slate-400 py-4">Nenhum aluno encontrado para "{searchTerm}".</p>}
          </div>
        ) : (
          /* MODO PASTAS (Turmas) */
          <div className="space-y-3">
            {turmas.map(turma => (
              <div key={turma} className="border border-slate-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setOpenFolder(openFolder === turma ? null : turma)}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${openFolder === turma ? 'bg-indigo-50 text-indigo-800' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <Folder size={20} className={openFolder === turma ? "text-indigo-600 fill-indigo-600" : "text-slate-400"} />
                    <span className="font-bold">Turma {turma}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                      {studentsByClass[turma].length} alunos
                    </span>
                    <ChevronRight size={16} className={`transition-transform ${openFolder === turma ? 'rotate-90' : ''}`}/>
                  </div>
                </button>

                {/* Lista de Alunos dentro da Pasta */}
                {openFolder === turma && (
                  <div className="bg-white border-t border-indigo-100 p-2 space-y-1">
                    {studentsByClass[turma].map((student: any) => (
                      <div key={student.id} onClick={() => onSelectStudent(student)} className="flex items-center gap-3 p-2 pl-4 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                         {student.photo_url ? (
                            <img src={student.photo_url} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold"><User size={14}/></div>
                          )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{student.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{student.guardian_phone || "Sem telefone"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
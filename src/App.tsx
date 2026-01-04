<textarea 
  className="w-full p-4 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-base leading-relaxed" 
  rows={15} 
  placeholder="Relatório de Atendimento:
- Descreva o relato do estudante...
- Qual foi a mediação realizada...
- Combinados e observações finais..." 
  value={obsLivre} 
  onChange={e => setObsLivre(e.target.value)} 
/>
import React from 'react';
import { LayoutDashboard, Users, GraduationCap, Settings, LogOut } from 'lucide-react';
import { InstallButton } from './InstallButton';

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#111827] text-white flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800">
      
      {/* --- CABEÇALHO DO MENU --- */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {/* Logo Simplificado (Círculo) */}
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SOE <span className="text-indigo-500">Digital</span></h1>
            <p className="text-xs text-gray-400">CED 4 Guará</p>
          </div>
        </div>
      </div>

      {/* --- LINKS DE NAVEGAÇÃO --- */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        
        {/* Item Ativo (Exemplo: Dashboard) */}
        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-500">
          <LayoutDashboard size={20} />
          <span className="font-medium">Visão Geral</span>
        </a>

        {/* Outros Itens */}
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
          <Users size={20} />
          <span className="font-medium">Alunos e Turmas</span>
        </a>

        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
          <GraduationCap size={20} />
          <span className="font-medium">Ocorrências</span>
        </a>

        <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
          <Settings size={20} />
          <span className="font-medium">Configurações</span>
        </a>
      </nav>

      {/* --- RODAPÉ DO MENU --- */}
      <div className="p-4 border-t border-gray-800 bg-[#0f1523]">
        
        {/* 1. Botão de Instalar (Só aparece se puder instalar) */}
        <InstallButton />

        {/* 2. Botão de Sair */}
        <button className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
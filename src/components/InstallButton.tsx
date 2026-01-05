import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Impede o Chrome de mostrar a barra nativa automaticamente
      e.preventDefault();
      // Salva o evento para disparar quando clicarmos no botão
      setDeferredPrompt(e);
      // Mostra o botão no menu
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt de instalação
    deferredPrompt.prompt();

    // Espera a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  // Se o app já estiver instalado ou não for suportado, não renderiza nada
  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg mb-4 animate-pulse"
    >
      <Download size={20} />
      <span>Instalar App</span>
    </button>
  );
};
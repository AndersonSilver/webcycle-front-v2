import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

export function BackendOffline() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // @ts-ignore - Vite environment variables
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  // O endpoint /health está na raiz, não em /api
  const BASE_URL = API_BASE_URL.replace('/api', '');

  const checkBackend = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Backend está online, recarregar a página
        window.location.reload();
      } else {
        setLastCheck(new Date());
        setIsChecking(false);
      }
    } catch (error) {
      setLastCheck(new Date());
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verificar automaticamente a cada 10 segundos
    const interval = setInterval(() => {
      checkBackend();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-2xl w-full text-center">
        {/* Ícone animado */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <WifiOff className="w-24 h-24 text-red-500 opacity-20" />
            </div>
            <WifiOff className="w-24 h-24 text-red-500 relative" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
          Servidor Indisponível
        </h1>

        {/* Mensagem */}
        <p className="text-lg md:text-xl mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
          Não foi possível conectar ao servidor
        </p>
        <p className="text-sm md:text-base mb-8" style={{ color: 'var(--theme-text-secondary)' }}>
          O serviço está temporariamente fora do ar. Por favor, tente novamente em alguns instantes.
        </p>

        {/* Informações técnicas */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Detalhes Técnicos
              </h3>
              {lastCheck && (
                <p className="text-xs text-red-700 dark:text-red-300">
                  Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botão de tentar novamente */}
        <Button
          onClick={checkBackend}
          disabled={isChecking}
          className="shadow-2xl text-lg px-10 py-6 hover:scale-105 transition-transform text-white"
          style={{ background: 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 65% / 0.9), hsl(280 70% 60% / 0.9))'}
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Tentar Novamente
            </>
          )}
        </Button>

        {/* Informação sobre verificação automática */}
        <p className="text-xs mt-6" style={{ color: 'var(--theme-text-secondary)' }}>
          Verificando automaticamente a cada 10 segundos...
        </p>
      </div>
    </div>
  );
}


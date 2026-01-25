import { useEffect } from 'react';

/**
 * Hook para proteger vídeos contra download e cópia
 * Implementa múltiplas camadas de segurança
 */
export function useVideoProtection(videoRef: React.RefObject<HTMLVideoElement>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Desabilitar menu de contexto (botão direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 2. Desabilitar atalhos de teclado perigosos
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S (Salvar)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+U (Ver código fonte)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+I ou F12 (DevTools)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+C (Inspetor)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+P (Imprimir - pode salvar como PDF)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Desabilitar seleção de texto na área do vídeo
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // 4. Desabilitar drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 5. Prevenir download direto do vídeo
    const handleLoadStart = () => {
      // Remover atributos que permitem download
      if (video) {
        video.removeAttribute('download');
        video.removeAttribute('controlsList');
      }
    };

    // 6. Proteger contra cópia de URL
    const handleCopy = (e: ClipboardEvent) => {
      // Permitir cópia normal, mas podemos adicionar proteção aqui se necessário
      // Por enquanto, apenas logamos tentativas suspeitas
      if (e.target === video || video?.contains(e.target as Node)) {
        console.warn('⚠️ Tentativa de cópia detectada na área do vídeo');
      }
    };

    // 7. Detectar tentativas de inspeção de elementos
    const detectDevTools = () => {
      let devtools = false;
      const threshold = 160;
      
      setInterval(() => {
        if (
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold
        ) {
          if (!devtools) {
            devtools = true;
            console.warn('⚠️ DevTools detectado!');
            // Podemos pausar o vídeo ou mostrar aviso
            if (video && !video.paused) {
              video.pause();
              setTimeout(() => {
                if (video) video.play();
              }, 2000);
            }
          }
        } else {
          devtools = false;
        }
      }, 500);
    };

    // Adicionar event listeners
    video.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    video.addEventListener('selectstart', handleSelectStart);
    video.addEventListener('dragstart', handleDragStart);
    video.addEventListener('loadstart', handleLoadStart);
    document.addEventListener('copy', handleCopy);

    // Iniciar detecção de DevTools
    detectDevTools();

    // Cleanup
    return () => {
      video.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      video.removeEventListener('selectstart', handleSelectStart);
      video.removeEventListener('dragstart', handleDragStart);
      video.removeEventListener('loadstart', handleLoadStart);
      document.removeEventListener('copy', handleCopy);
    };
  }, [videoRef]);
}


import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Conectar ao servidor Socket.io
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado ao chat de suporte');
    });

    socketRef.current.on('disconnect', (reason) => {
      // Não logar desconexões normais ou quando o backend está offline
      if (reason !== 'io server disconnect' && reason !== 'transport close') {
        console.log('❌ Desconectado do chat de suporte:', reason);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      // Não logar erros de conexão quando o backend está offline (esperado)
      // Apenas logar se for um erro diferente de conexão recusada
      if (error.message && !error.message.includes('ECONNREFUSED') && !error.message.includes('websocket error')) {
        console.warn('Erro na conexão Socket.io:', error.message);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  return socketRef.current;
};


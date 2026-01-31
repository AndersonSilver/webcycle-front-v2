import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { apiClient } from '../../services/apiClient';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Send, MessageCircle, X, Loader2, Clock, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Headphones, MessageSquare, Plus, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'admin';
  sender: {
    name: string;
    email: string;
  };
  createdAt: string;
  read: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  messages?: Message[];
  user?: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obter token do localStorage
  const sessionData = localStorage.getItem('SESSION');
  const token = sessionData ? JSON.parse(sessionData)?.token : null;

  const socket = useSocket(token);

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket) return;

    // Escutar novas mensagens
    socket.on('new_message', (data: { ticketId: string; message: Message }) => {
      if (currentTicket?.id === data.ticketId) {
        setCurrentTicket((prev) => {
          if (!prev) return null;
          
          // Verificar se a mensagem já existe para evitar duplicação
          const messageExists = prev.messages?.some((msg) => msg.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        });
        scrollToBottom();
      }
      // Atualizar lista de tickets
      loadTickets();
    });

    // Escutar ticket atribuído
    socket.on('ticket_assigned', (ticket: Ticket) => {
      if (currentTicket?.id === ticket.id) {
        setCurrentTicket(ticket);
      }
      loadTickets();
    });

    // Escutar ticket fechado
    socket.on('ticket_closed', (ticket: Ticket) => {
      if (currentTicket?.id === ticket.id) {
        setCurrentTicket(ticket);
      }
      loadTickets();
    });

    // Escutar novo ticket
    socket.on('new_ticket', () => {
      loadTickets();
    });

    return () => {
      socket.off('new_message');
      socket.off('ticket_assigned');
      socket.off('ticket_closed');
      socket.off('new_ticket');
    };
  }, [socket, currentTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [currentTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMySupportTickets();
      setTickets(response.tickets || []);
    } catch (error: any) {
      console.error('Erro ao carregar tickets:', error);
      if (error.message?.includes('401')) {
        toast.error('Faça login para acessar o suporte');
        setIsOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };


  const createTicket = async () => {
    if (!newTicketSubject.trim()) {
      toast.error('Digite um assunto para a conversa');
      return;
    }

    if (newTicketSubject.trim().length < 5) {
      toast.error('O assunto deve ter pelo menos 5 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.createSupportTicket({
        subject: newTicketSubject.trim(),
      });
      setTickets([response.ticket, ...tickets]);
      await openTicket(response.ticket.id);
      setShowNewTicket(false);
      setNewTicketSubject('');
      toast.success('Conversa criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar ticket:', error);
      
      // Tratar erros de validação do backend
      if (error.errors && Array.isArray(error.errors)) {
        const validationError = error.errors.find((err: any) => err.property === 'subject');
        if (validationError?.constraints?.minLength) {
          toast.error('O assunto deve ter pelo menos 5 caracteres');
        } else {
          const errorMessage = validationError?.constraints 
            ? Object.values(validationError.constraints)[0] as string 
            : 'Erro de validação';
          toast.error(errorMessage);
        }
      } else {
        toast.error(error.message || 'Erro ao criar conversa');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentTicket) return;

    const messageContent = message.trim();
    setMessage(''); // Limpar campo imediatamente para melhor UX

    try {
      // Enviar via API (salva no banco e o backend já emite via Socket.io)
      await apiClient.sendSupportMessage(currentTicket.id, {
        content: messageContent,
      });

      // Não precisa emitir via Socket.io aqui, o backend já faz isso
      // A mensagem será adicionada automaticamente via listener 'new_message'
      
      scrollToBottom();
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
      // Restaurar mensagem em caso de erro
      setMessage(messageContent);
    }
  };

  const openTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getSupportTicket(ticketId);
      setCurrentTicket(response.ticket);
      
      // Marcar mensagens como lidas
      socket?.emit('mark_read', { ticketId });
    } catch (error: any) {
      console.error('Erro ao abrir ticket:', error);
      toast.error(error.message || 'Erro ao carregar conversa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          {/* Efeito de brilho animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Button
            onClick={() => {
              if (!token) {
                toast.error('Faça login para acessar o suporte');
                return;
              }
              setIsOpen(true);
            }}
            className="relative rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all hover:scale-110 hover:shadow-blue-500/50 border-2 border-white/20 animate-bounce"
            style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
            size="lg"
          >
            <MessageCircle className="w-7 h-7 drop-shadow-lg" />
            {/* Badge de notificação (se houver tickets não lidos) */}
            {tickets.some(t => t.status !== 'closed') && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                <span className="text-[10px] text-white font-bold">{tickets.filter(t => t.status !== 'closed').length}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-700 overflow-hidden">
      {/* Header melhorado */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-5 rounded-t-2xl flex justify-between items-center shadow-xl relative overflow-hidden flex-shrink-0">
        {/* Efeito de brilho no fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-300 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 drop-shadow-lg" />
              <h3 className="font-bold text-xl drop-shadow-md">Suporte</h3>
            </div>
          </div>
          {currentTicket && (
            <div className="flex items-center gap-2 mt-2">
              <MessageSquare className="w-4 h-4 text-blue-200" />
              <p className="text-sm text-blue-100 font-medium truncate">{currentTicket.subject}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 relative z-10">
          {currentTicket && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTicket(null)}
              className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110 border border-white/20"
              title="Voltar para lista"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm transition-all hover:scale-110 border border-white/20"
            title="Fechar chat"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-800 min-h-0">
        {loading && !currentTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Carregando...</p>
            </div>
          </div>
        ) : !currentTicket ? (
          <div className="p-5 flex-1 overflow-y-auto">
            {!showNewTicket ? (
              <>
                <Button
                  onClick={() => setShowNewTicket(true)}
                  className="w-full mb-5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all font-semibold text-base hover:scale-[1.02] border-2 border-white/10 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5 drop-shadow-lg" />
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Nova Conversa</span>
                  </div>
                </Button>

                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 via-blue-700/20 to-blue-800/20 flex items-center justify-center shadow-xl animate-pulse border border-blue-600/30">
                          <MessageCircle className="w-10 h-10 text-blue-400" />
                        </div>
                        <div className="absolute -top-1 -right-1">
                          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-lg font-bold text-white mb-2">Nenhuma conversa encontrada</p>
                      <p className="text-sm text-gray-400 text-center">Crie uma nova conversa para começar a receber suporte</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const ticketId = ticket.id;
                      const isSelected = Boolean(currentTicket && (currentTicket as Ticket).id === ticketId);
                      return (
                      <Card
                        key={ticket.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-xl rounded-xl border-2 group ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500 shadow-lg ring-2 ring-blue-500/30' 
                            : 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-600'
                        }`}
                        onClick={() => openTicket(ticket.id)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                              ticket.status === 'open' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                              ticket.status === 'in_progress' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                              'bg-gradient-to-br from-gray-400 to-gray-600'
                            }`}>
                              {ticket.status === 'open' && <AlertCircle className="w-5 h-5 text-white" />}
                              {ticket.status === 'in_progress' && <Headphones className="w-5 h-5 text-white" />}
                              {ticket.status === 'closed' && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white truncate mb-1 group-hover:text-blue-400 transition-colors">{ticket.subject}</h4>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {(() => {
                                  const dateStr = String(ticket.createdAt);
                                  const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                                  const utcDate = new Date(utcDateStr);
                                  const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                                  return brDate.toLocaleDateString('pt-BR');
                                })()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-sm ${
                              ticket.status === 'open' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                              ticket.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400 border border-blue-700' :
                              'bg-gray-700 text-gray-300 border border-gray-600'
                            }`}
                          >
                            {ticket.status === 'open' && (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Aberto</span>
                              </>
                            )}
                            {ticket.status === 'in_progress' && (
                              <>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Em Atendimento</span>
                              </>
                            )}
                            {ticket.status === 'closed' && (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Fechado</span>
                              </>
                            )}
                          </span>
                        </div>
                      </Card>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <Card className="p-5 bg-gray-700 shadow-lg rounded-xl border-2 border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Nova Conversa
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewTicket(false)}
                    className="rounded-full hover:bg-gray-600 text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Assunto da conversa
                    </label>
                    <Input
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && newTicketSubject.trim()) {
                          e.preventDefault();
                          createTicket();
                        }
                      }}
                      placeholder="Ex: Dúvida sobre o curso..."
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Mínimo de 5 caracteres
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createTicket}
                      disabled={loading || !newTicketSubject.trim() || newTicketSubject.trim().length < 5}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Conversa
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewTicket(false);
                        setNewTicketSubject('');
                      }}
                      className="px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loading && currentTicket.messages?.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : currentTicket.messages && currentTicket.messages.length > 0 ? (
                currentTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.senderType !== 'user' && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-gray-800">
                        {(msg.sender.name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-lg transition-all hover:shadow-xl ${
                        msg.senderType === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                          : 'bg-gray-700 text-white border border-gray-600 rounded-bl-md shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className={`font-bold text-xs ${
                          msg.senderType === 'user' ? 'text-blue-100' : 'text-gray-300'
                        }`}>
                          {msg.sender.name || (msg.senderType === 'user' ? 'Você' : 'Suporte')}
                        </p>
                        <p className={`text-xs ${
                          msg.senderType === 'user' ? 'text-blue-100 opacity-80' : 'text-gray-400'
                        }`}>
                          {(() => {
                            // Converter data UTC para horário do Brasil
                            const dateStr = String(msg.createdAt);
                            // Se não tem Z, adicionar para forçar UTC
                            const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                            const utcDate = new Date(utcDateStr);
                            
                            // Converter UTC para horário do Brasil (UTC-3)
                            // Criar uma nova data ajustando o offset
                            const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                            
                            return brDate.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          })()}
                        </p>
                      </div>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.senderType === 'user' ? 'text-white' : 'text-gray-200'
                      }`}>
                        {msg.content}
                      </p>
                    </div>
                    {msg.senderType === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-gray-800">
                        {(msg.sender.name || 'V').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 via-blue-700/20 to-blue-800/20 flex items-center justify-center shadow-xl border border-blue-600/30">
                      <MessageSquare className="w-10 h-10 text-blue-400" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white mb-2">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-gray-400 text-center">Inicie a conversa enviando uma mensagem abaixo</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {currentTicket.status !== 'closed' ? (
              <div className="p-5 border-t border-gray-700 bg-gray-800 shadow-2xl flex-shrink-0">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Digite sua mensagem..."
                      disabled={loading}
                      className="w-full px-5 py-3.5 rounded-xl border-2 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
                      style={{ 
                        backgroundColor: '#374151', 
                        borderColor: '#9CA3AF', 
                        color: '#FFFFFF',
                        outline: 'none',
                        minHeight: '48px'
                      }}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !message.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed h-auto min-h-[48px] min-w-[60px]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-gray-800 via-gray-800 to-gray-800 border-t border-gray-700 text-center flex-shrink-0">
                <div className="inline-flex items-center gap-3 text-gray-300 bg-gray-700 px-6 py-3 rounded-full shadow-lg border-2 border-gray-600">
                  <Ban className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold">Esta conversa foi fechada</span>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Headphones, Plus, Check, Clock, Eye, Loader2 } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";

interface Podcast {
  id: string;
  title: string;
  description?: string;
  image?: string;
  videoUrl: string;
  duration?: string;
  listens: number;
  active: boolean;
  tags?: string[];
  createdAt: string;
}

interface PodcastSectionProps {
  onAddToMyCourses?: (podcast: Podcast) => void;
}

export function PodcastSection({ onAddToMyCourses }: PodcastSectionProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedPodcasts, setAddedPodcasts] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar se usuário está logado
    const sessionData = localStorage.getItem('SESSION');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUser(session.user || null);
      } catch (error) {
        console.error("Erro ao ler sessão:", error);
      }
    }
  }, []);

  useEffect(() => {
    const loadPodcasts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getPodcasts({ page: 1, limit: 6 });
        if (response?.podcasts) {
          const activePodcasts = response.podcasts.filter((p: Podcast) => p.active);
          setPodcasts(activePodcasts);

          // Se usuário está logado, verificar quais podcasts já foram adicionados
          if (user) {
            const addedSet = new Set<string>();
            await Promise.all(
              activePodcasts.map(async (podcast: Podcast) => {
                try {
                  const checkResponse = await apiClient.checkIfPodcastAdded(podcast.id);
                  if (checkResponse?.isAdded) {
                    addedSet.add(podcast.id);
                  }
                } catch (error) {
                  // Ignorar erros individuais
                }
              })
            );
            setAddedPodcasts(addedSet);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar podcasts:", error);
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPodcasts();
  }, [user]);

  const handleAddToMyCourses = async (podcast: Podcast) => {
    // Verificar se usuário está logado
    const sessionData = localStorage.getItem('SESSION');
    if (!sessionData) {
      toast.error("Você precisa estar logado para adicionar podcasts aos seus cursos");
      return;
    }

    try {
      await apiClient.addPodcastToMyCourses(podcast.id);
      setAddedPodcasts(prev => new Set(prev).add(podcast.id));
      toast.success("Podcast adicionado aos seus cursos!");

      if (onAddToMyCourses) {
        onAddToMyCourses(podcast);
      }
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('já está')) {
        toast.info("Este podcast já está nos seus cursos");
      } else {
        toast.error("Erro ao adicionar podcast aos seus cursos");
      }
    }
  };

  if (loading) {
    return (
      <section
        id="podcasts"
        className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col justify-center items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-slate-400 text-lg">Carregando podcasts...</p>
          </div>
        </div>
      </section>
    );
  }

  if (podcasts.length === 0) {
    return null; // Não exibir seção se não houver podcasts
  }

  return (
    <section id="podcasts" className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 relative overflow-hidden">
      {/* Background decorative elements - apenas azul */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 backdrop-blur-sm">
            <Headphones className="w-4 h-4" />
            Conteúdo Gratuito
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Podcasts Gratuitos
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Adicione nossos podcasts gratuitos aos seus cursos e expanda seu conhecimento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {podcasts.map((podcast, index) => (
            <div
              key={podcast.id}
              className="flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all max-h-[420px] w-full"
              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
            >
              {/* Imagem */}
              {podcast.image && (
                <div className="md:w-1/2 relative h-40 md:h-[300px]">
                  <img
                    src={podcast.image}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Tag na parte inferior */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-medium rounded-full border border-white/10">
                      Podcast
                    </span>
                  </div>
                </div>
              )}
              
              {/* Conteúdo */}
              <div className="md:w-1/2 p-3 flex flex-col justify-between space-y-2">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white line-clamp-2">{podcast.title}</h3>
                  
                  {podcast.description && (
                    <p className="text-sm text-slate-300 line-clamp-2">{podcast.description}</p>
                  )}
                </div>

                {/* Detalhes */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  {podcast.duration && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {podcast.duration}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {podcast.listens || 0} visualizações
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                  <div className="text-xs text-slate-400">
                    Conteúdo Gratuito
                  </div>
                  {addedPodcasts.has(podcast.id) ? (
                    <button
                      disabled
                      className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-xl transition-all text-xs shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-1 cursor-not-allowed opacity-80"
                    >
                      <Check className="w-3 h-3" />
                      Adicionado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToMyCourses(podcast)}
                      className="px-3 py-1.5 bg-white text-black font-semibold rounded-xl transition-all text-xs shadow-md hover:shadow-lg hover:scale-105 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

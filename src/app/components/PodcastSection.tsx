import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Headphones, Plus, Check, Clock, Eye } from "lucide-react";
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Carregando podcasts...</p>
          </div>
        </div>
      </section>
    );
  }

  if (podcasts.length === 0) {
    return null; // Não exibir seção se não houver podcasts
  }

  return (
    <section id="podcasts" className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
            🎧 Conteúdo Gratuito
          </div>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
            <Headphones className="w-8 h-8 text-blue-600" />
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Podcasts Gratuitos
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Adicione nossos podcasts gratuitos aos seus cursos e expanda seu conhecimento
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
              {podcast.image && (
                <div className="relative h-48 bg-gray-200 flex-shrink-0">
                  <img
                    src={podcast.image}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {addedPodcasts.has(podcast.id) ? (
                      <Button
                        size="lg"
                        disabled
                        className="bg-green-700 text-white hover:bg-green-800 border border-green-800"
                      >
                        <Check className="w-6 h-6 mr-2" />
                        Já Adicionado
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => handleAddToMyCourses(podcast)}
                        className="bg-white text-blue-600 hover:bg-blue-50"
                      >
                        <Plus className="w-6 h-6 mr-2" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{podcast.title}</h3>
                  {podcast.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{podcast.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {podcast.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {podcast.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {podcast.listens || 0} visualizações
                    </span>
                  </div>
                </div>
                <div className="mt-auto">
                {addedPodcasts.has(podcast.id) ? (
                  <Button
                    disabled
                    className="w-full bg-green-700 text-white hover:bg-green-800 border border-green-800"
                  >
                    <Check className="w-4 h-4 mr-2 text-black" />
                    Já Adicionado
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAddToMyCourses(podcast)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar aos Meus Cursos
                  </Button>
                )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

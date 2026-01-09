import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Clock, Eye, Headphones, Calendar } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";

interface PodcastPlayerProps {
  podcastId: string;
  onBack: () => void;
}

export function PodcastPlayer({ podcastId, onBack }: PodcastPlayerProps) {
  const [podcast, setPodcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPodcast = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getPodcastById(podcastId);
        if (response?.podcast) {
          setPodcast(response.podcast);
          
          // Incrementar contador de reproduções
          try {
            await apiClient.incrementPodcastListens(podcastId);
          } catch (error) {
            console.error("Erro ao incrementar reproduções:", error);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar podcast:", error);
        toast.error("Erro ao carregar podcast");
      } finally {
        setLoading(false);
      }
    };

    loadPodcast();
  }, [podcastId]);

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando podcast...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Headphones className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Podcast não encontrado</h2>
          <p className="text-gray-600 mb-6">O podcast que você está procurando não existe ou foi removido.</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header com gradiente e imagem */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700 text-white pt-24 pb-16 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-8 transition-all"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="max-w-4xl">
            {/* Badge Podcast */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-semibold">Podcast Gratuito</span>
            </div>

            {/* Título */}
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 leading-tight line-clamp-1">
              {podcast.title}
            </h3>

            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-6 text-sm lg:text-base">
              {podcast.duration && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{podcast.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Eye className="w-5 h-5" />
                <span className="font-medium">{podcast.listens || 0} visualizações</span>
              </div>
              {podcast.createdAt && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{formatDate(podcast.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {podcast.tags && podcast.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {podcast.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Player Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Player Card */}
          <Card className="overflow-hidden shadow-2xl border-0">
            <CardContent className="p-0">
              <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
                {(() => {
                  const isYouTube = isYouTubeUrl(podcast.videoUrl);
                  if (isYouTube) {
                    const videoId = getYouTubeVideoId(podcast.videoUrl);
                    if (videoId) {
                      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
                      return (
                        <iframe
                          className="w-full h-full min-h-[500px] lg:min-h-[600px]"
                          src={embedUrl}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={podcast.title}
                        />
                      );
                    }
                  }
                  // Fallback para outros formatos de vídeo
                  return (
                    <video
                      src={podcast.videoUrl}
                      controls
                      className="w-full h-full min-h-[500px] lg:min-h-[600px]"
                      poster={podcast.image}
                    />
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {/* Card de Duração */}
            {podcast.duration && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duração</p>
                      <p className="text-xl font-bold text-gray-900">{podcast.duration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card de Visualizações */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Visualizações</p>
                    <p className="text-xl font-bold text-gray-900">{podcast.listens || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Data */}
            {podcast.createdAt && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Publicado em</p>
                      <p className="text-xl font-bold text-gray-900">{formatDate(podcast.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Descrição Expandida */}
          {podcast.description && podcast.description.length > 200 && (
            <Card className="mt-8 border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Sobre este Podcast</h3>
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                  {podcast.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

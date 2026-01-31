import { Course } from "../data/courses";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  FileText,
  Heart,
  MessageCircle,
  Brain,
  Trophy,
  Headphones,
  Shield,
  Sparkles,
  Quote
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useState } from "react";
import { apiClient } from "../../services/apiClient";

// Helper para converter URL do Azure para endpoint de streaming
const getStreamingUrl = (azureUrl: string): string => {
  // Se já for uma URL do Azure Blob Storage, converter para endpoint de streaming
  if (azureUrl && azureUrl.includes('blob.core.windows.net')) {
    try {
      // Obter token de autenticação
      const sessionData = localStorage.getItem('SESSION');
      const token = sessionData ? JSON.parse(sessionData)?.token : null;
      
      if (!token) {
        console.warn('⚠️ Token não encontrado, vídeo pode não carregar');
      }
      
      // Usar query parameter em vez de path parameter para URLs longas
      const encodedUrl = encodeURIComponent(azureUrl);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      let streamingUrl = `${apiBaseUrl}/upload/stream?url=${encodedUrl}`;
      
      // Adicionar token na URL para autenticação (necessário porque <video> não envia headers)
      if (token) {
        streamingUrl += `&token=${encodeURIComponent(token)}`;
      }
      
      console.log('🔄 Convertendo para streaming URL (com autenticação)');
      return streamingUrl;
    } catch (error) {
      console.error('❌ Erro ao converter URL para streaming:', error);
      // Não usar fallback direto - manter segurança
      throw new Error('Erro ao gerar URL de streaming protegida');
    }
  }
  // Se for YouTube ou outra URL, retornar como está
  return azureUrl;
};

interface Review {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onEnroll: (course: Course) => void;
  onAddToCart?: (course: Course) => void;
  onGoToMyCourses?: () => void;
}

const iconMap: { [key: string]: any } = {
  Heart,
  MessageCircle,
  Brain,
  Trophy,
  Headphones,
  Shield,
  Sparkles,
  Users,
  Clock
};

export function CourseDetail({ course, onBack, onEnroll, onAddToCart, onGoToMyCourses }: CourseDetailProps) {
  // Converter preços para número (podem vir como string da API)
  const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
  const originalPrice = course.originalPrice 
    ? (typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)
    : undefined;
  
  const discount = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Estado para controle do vídeo
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [useDirectUrl, setUseDirectUrl] = useState(false); // Fallback para URL direta

  const [reviews, setReviews] = useState<Review[]>([]);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar avaliações da API
        try {
          const reviewsResponse = await apiClient.getCourseReviews(course.id);
          if (reviewsResponse?.reviews) {
            setReviews(reviewsResponse.reviews.map((r: any) => ({
              id: r.id,
              courseId: r.courseId,
              courseTitle: course.title,
              userId: r.userId,
              userName: r.user?.name || "Usuário",
              userEmail: r.user?.email || "",
              rating: r.rating,
              comment: r.comment,
              date: r.createdAt,
              approved: r.approved,
            })));
          }
        } catch (error) {
          console.error("Erro ao carregar avaliações:", error);
          setReviews([]);
        }

        // Verificar se já possui o curso
        try {
          const myCoursesResponse = await apiClient.getMyCourses();
          if (myCoursesResponse?.courses) {
            const hasCourse = myCoursesResponse.courses.some(
              (item: any) => item.course?.id === course.id
            );
            setAlreadyOwned(hasCourse);
          }
        } catch (error) {
          // Se não autenticado ou erro, assumir que não possui
          setAlreadyOwned(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do curso:", error);
      }
    };

    loadData();
  }, [course.id]);

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Hero Section */}
      <section 
        className="relative text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Cursos
          </Button>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30">
                {course.category}
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-blue-100">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-blue-200">({course.students.toLocaleString('pt-BR')} alunos)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration} de conteúdo</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.lessons} aulas</span>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-blue-200">Instrutor: </span>
                <span className="font-semibold">{course.instructor}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4">
                  <div>
                    {originalPrice && (
                      <div className="text-sm text-blue-200 line-through">
                        De R$ {originalPrice.toFixed(2)}
                      </div>
                    )}
                    <div className="font-bold text-3xl">
                      R$ {price.toFixed(2)}
                    </div>
                    {discount > 0 && (
                      <div className="text-sm text-green-300">
                        Economize {discount}%
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {alreadyOwned ? (
                    <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4 text-center max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold text-lg text-white">Você já possui este curso!</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">
                        Acesse em "Meus Cursos" para continuar assistindo
                      </p>
                      <Button
                        size="lg"
                        onClick={() => {
                          if (onGoToMyCourses) {
                            onGoToMyCourses();
                          } else {
                            onBack();
                          }
                        }}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-xl"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Ir para Meus Cursos
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => onEnroll(course)}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl"
                      >
                        🛒 Comprar Agora
                      </Button>
                      {onAddToCart && (
                        <Button
                          size="lg"
                          onClick={() => onAddToCart(course)}
                          variant="outline"
                          className="bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 shadow-xl backdrop-blur-sm"
                        >
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-teal-500/30 blur-3xl"></div>
                <ImageWithFallback
                  src={course.image}
                  alt={course.title}
                  className="relative rounded-2xl shadow-2xl w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video de Apresentação - Seção dedicada */}
      {course.videoUrl && (
        <section className="py-12" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                <PlayCircle className="w-6 h-6 text-gray-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent via-gray-500 to-transparent"></div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Apresentação do Curso
              </h2>
              <p className="text-gray-300 text-sm">Conheça mais sobre este curso</p>
            </div>
            <div className="max-w-4xl mx-auto px-2 sm:px-0">
              <div className="relative rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden bg-black w-full" style={{ aspectRatio: '16/9' }}>
                {(() => {
                  const isYouTube = course.videoUrl?.includes('youtube.com') || course.videoUrl?.includes('youtu.be');
                  if (isYouTube && course.videoUrl) {
                    // Extrair ID do YouTube
                    let videoId: string | null = null;
                    const watchMatch = course.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                    const embedMatch = course.videoUrl.match(/youtube\.com\/embed\/([^&\n?#]+)/);
                    if (watchMatch) videoId = watchMatch[1];
                    else if (embedMatch) videoId = embedMatch[1];
                    
                    if (videoId) {
                      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                      return (
                        <iframe
                          className="w-full h-full absolute inset-0"
                          src={embedUrl}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                  }
                  // Fallback para outros formatos de vídeo ou se não for YouTube
                  if (!course.videoUrl) {
                    return (
                      <div className="flex items-center justify-center w-full h-full absolute inset-0 text-white" style={{ minHeight: '200px' }}>
                        <div className="text-center">
                          <PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-base sm:text-lg">Vídeo não disponível</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="relative w-full h-full absolute inset-0">
                      {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-sm">Carregando vídeo...</p>
                          </div>
                        </div>
                      )}
                      {videoError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                          <div className="text-white text-center p-4">
                            <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Erro ao carregar vídeo</p>
                            <p className="text-sm text-gray-400 mb-4">{videoError}</p>
                            <a 
                              href={course.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline"
                            >
                              Abrir vídeo em nova aba
                            </a>
                          </div>
                        </div>
                      )}
                      <video
                        src={useDirectUrl ? (course.videoUrl || '') : getStreamingUrl(course.videoUrl || '')}
                        controls
                        className="w-full h-full absolute inset-0 object-contain"
                        preload="auto"
                        playsInline
                        crossOrigin="anonymous"
                        onLoadedMetadata={() => {
                          console.log('✅ Metadados do vídeo carregados');
                          // Não esconder loading ainda, esperar ter buffer suficiente
                        }}
                        onLoadedData={() => {
                          console.log('✅ Dados iniciais do vídeo carregados');
                          setVideoError(null);
                        }}
                        onCanPlay={(e) => {
                          console.log('✅ Vídeo pode ser reproduzido (tem buffer suficiente)');
                          setVideoLoading(false);
                          // Tentar reproduzir automaticamente quando tiver buffer suficiente
                          const video = e.currentTarget;
                          if (video.paused && video.readyState >= 2) {
                            video.play().catch(() => {
                              // Ignorar erro se autoplay for bloqueado pelo navegador
                            });
                          }
                        }}
                        onCanPlayThrough={() => {
                          console.log('✅ Vídeo pode ser reproduzido completamente');
                          setVideoLoading(false);
                        }}
                        onProgress={(e) => {
                          const video = e.currentTarget;
                          if (video.buffered.length > 0 && video.duration > 0) {
                            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                            const progress = (bufferedEnd / video.duration) * 100;
                            setBufferingProgress(progress);
                            // Ocultar loading quando tiver pelo menos 3% de buffer (muito rápido!)
                            if (progress >= 3 && video.readyState >= 2) {
                              setVideoLoading(false);
                            }
                          }
                        }}
                        onError={(e) => {
                          const videoElement = e.currentTarget;
                          const error = videoElement.error;
                          
                          // Se ainda não estiver usando URL direta e der erro, tentar URL direta
                          if (!useDirectUrl && course.videoUrl && course.videoUrl.includes('blob.core.windows.net')) {
                            console.warn('⚠️ Erro no streaming, tentando URL direta do Azure...');
                            setUseDirectUrl(true);
                            setVideoError(null);
                            setVideoLoading(true);
                            return;
                          }
                          
                          let errorMessage = 'Não foi possível carregar o vídeo.';
                          
                          if (error) {
                            switch (error.code) {
                              case error.MEDIA_ERR_ABORTED:
                                errorMessage = 'Carregamento do vídeo foi abortado.';
                                break;
                              case error.MEDIA_ERR_NETWORK:
                                errorMessage = 'Erro de rede ao carregar o vídeo. Verifique sua conexão.';
                                break;
                              case error.MEDIA_ERR_DECODE:
                                errorMessage = 'Erro ao decodificar o vídeo.';
                                break;
                              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                errorMessage = 'Formato de vídeo não suportado ou URL inválida.';
                                break;
                              default:
                                errorMessage = 'Erro desconhecido ao carregar o vídeo.';
                            }
                          }
                          
                          console.error('❌ Erro ao carregar vídeo:', {
                            url: course.videoUrl,
                            streamingUrl: getStreamingUrl(course.videoUrl || ''),
                            useDirectUrl,
                            error: error,
                            errorCode: error?.code,
                            errorMessage: errorMessage
                          });
                          
                          setVideoLoading(false);
                          setVideoError(errorMessage);
                        }}
                        onLoadStart={() => {
                          console.log('🔄 Iniciando carregamento do vídeo:', course.videoUrl);
                          setVideoLoading(true);
                          setVideoError(null);
                          setBufferingProgress(0);
                        }}
                        onStalled={() => {
                          console.warn('⚠️ Carregamento do vídeo travou:', course.videoUrl);
                          setVideoLoading(true);
                        }}
                        onWaiting={() => {
                          console.log('⏳ Vídeo aguardando buffer:', course.videoUrl);
                          setVideoLoading(true);
                        }}
                        onPlaying={() => {
                          setVideoLoading(false);
                        }}
                      />
                      {videoLoading && bufferingProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 z-20">
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${bufferingProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
              <Brain className="w-6 h-6 text-gray-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent via-gray-500 to-transparent"></div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2 text-white">
              O Que Você Vai Aprender
            </h2>
            <p className="text-gray-300 text-sm">Conhecimentos práticos e aplicáveis para transformar sua vida</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(course.benefits || []).map((benefit, index) => {
              const Icon = iconMap[benefit.icon] || Heart;
              return (
                <Card key={index} className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-white group-hover:text-gray-100 transition-colors">{benefit.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Informações adicionais do curso */}
          <div className="mt-16 grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{course.lessons}</div>
              <div className="text-xs text-gray-400">Aulas Disponíveis</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{course.duration}</div>
              <div className="text-xs text-gray-400">de Conteúdo</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{course.students.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-gray-400">Alunos Inscritos</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{course.rating}</div>
              <div className="text-xs text-gray-400">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
              <BookOpen className="w-6 h-6 text-gray-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent via-gray-500 to-transparent"></div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2 text-white">
              Conteúdo do Curso
            </h2>
            <p className="text-gray-300 text-sm">Explore todos os módulos e aulas disponíveis</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <Card className="p-6 bg-gray-800/30 backdrop-blur-sm border-2 border-gray-600/40">
              <Accordion type="single" collapsible className="w-full">
                {(course.modules || []).map((module, index) => {
                  // Extract lesson titles from module
                  const moduleTopics = module.lessons?.map(l => l.title) || [];
                  const lessonCount = module.lessons?.length || 0;
                  const lessons = module.lessons || [];
                  
                  // Calcular duração total do módulo a partir das aulas
                  const calculateModuleDuration = () => {
                    if (lessons.length === 0) return module.duration || '0h';
                    
                    let totalMinutes = 0;
                    lessons.forEach((lesson) => {
                      if (typeof lesson === 'object' && lesson.duration) {
                        const duration = lesson.duration.toLowerCase();
                        // Parsear diferentes formatos: "30min", "30m", "1h 30min", "1h30min", etc.
                        const hoursMatch = duration.match(/(\d+)\s*h/);
                        const minutesMatch = duration.match(/(\d+)\s*min?/);
                        
                        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
                        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
                        // Se só tem número sem h/min, assumir minutos
                        if (!hoursMatch && !minutesMatch) {
                          const numMatch = duration.match(/(\d+)/);
                          if (numMatch) totalMinutes += parseInt(numMatch[1]);
                        }
                      }
                    });
                    
                    if (totalMinutes === 0) return module.duration || '0h';
                    
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    
                    if (hours > 0 && minutes > 0) {
                      return `${hours}h ${minutes}min`;
                    } else if (hours > 0) {
                      return `${hours}h`;
                    } else {
                      return `${minutes}min`;
                    }
                  };
                  
                  const moduleDuration = calculateModuleDuration();
                  
                  return (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-white/10 last:border-0">
                    <AccordionTrigger className="hover:no-underline text-white py-4 sm:py-6 px-3 sm:px-4 hover:bg-white/5 rounded-lg transition-all">
                      <div className="flex items-start gap-2 sm:gap-4 text-left w-full">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="font-bold text-base sm:text-xl text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-white mb-1 sm:mb-2 break-words">{module.title}</h3>
                          <div className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-gray-300 overflow-x-auto">
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md whitespace-nowrap flex-shrink-0">
                              <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">{lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}</span>
                            </span>
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md whitespace-nowrap flex-shrink-0">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">{moduleDuration}</span>
                            </span>
                            <span className="flex items-center gap-1 sm:gap-1.5 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md whitespace-nowrap flex-shrink-0">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">Módulo {index + 1}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pr-2 sm:pr-4 pb-4 space-y-2 mt-4">
                        {lessons.map((lesson, lessonIndex) => (
                          <div 
                            key={lessonIndex} 
                            className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
                          >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-600 transition-colors">
                              <span className="text-xs font-bold text-gray-300">{lessonIndex + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-white group-hover:text-gray-100 transition-colors break-words">
                                  {typeof lesson === 'object' && lesson.title ? lesson.title : String(lesson)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className="bg-gray-700/50 text-gray-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-0 whitespace-nowrap">
                                {typeof lesson === 'object' && lesson.duration ? lesson.duration : '--'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {moduleTopics.length > 0 && lessons.length === 0 && (
                          <div className="space-y-2">
                            {moduleTopics.map((topic, topicIndex) => (
                              <div key={topicIndex} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-300 break-words">{typeof topic === 'string' ? topic : String(topic)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  );
                })}
              </Accordion>
            </Card>
            
            {/* Bonuses */}
            <div className="mt-8 p-6 bg-gray-800/30 rounded-lg border-2 border-gray-600/40 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xl mb-2 text-white">Bônus Exclusivos Inclusos</h3>
                  <ul className="space-y-2 text-gray-300">
                    {(course.bonuses || []).map((bonus: any, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span>{bonus.title || bonus.name || 'Material de Apoio'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {originalPrice && (
                  <div className="text-center md:text-right">
                    <div className="text-sm text-gray-400">Valor adicional</div>
                    <div className="font-bold text-3xl bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      R$ {(originalPrice - price).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-400 font-semibold">GRÁTIS</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-20" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                O Que Nossos Alunos Dizem
              </h2>
              <p className="text-gray-300 text-lg">
                Avaliações reais de alunos que já transformaram suas vidas
              </p>
            </div>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">
                  Seja o primeiro a avaliar este curso!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {reviews.map((review) => (
                  <Card key={review.id} className="border border-white/10 shadow-lg hover:shadow-xl transition-shadow bg-white/5 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {/* Header with avatar and stars */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{review.userName}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <Quote className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* Comment */}
                      <p className="text-gray-300 leading-relaxed mb-3">
                        "{review.comment}"
                      </p>

                      {/* Date */}
                      <div className="text-xs text-gray-400 pt-3 border-t border-white/10">
                        {new Date(review.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary stats */}
            {reviews.length > 0 && (
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-6 bg-white/5 backdrop-blur-sm rounded-xl shadow-lg px-8 py-4 border border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-3xl font-bold text-white">
                        {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">Avaliação média</p>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent mb-1">
                      {reviews.length}
                    </div>
                    <p className="text-sm text-gray-300">
                      {reviews.length === 1 ? 'Avaliação' : 'Avaliações'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pronto Para Começar Sua Transformação?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 50 alunos que já estão transformando suas vidas
          </p>
          {alreadyOwned ? (
            <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4 text-center max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-white">Você já possui este curso!</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                Acesse em "Meus Cursos" para continuar assistindo
              </p>
              <Button
                size="lg"
                onClick={() => {
                  if (onGoToMyCourses) {
                    onGoToMyCourses();
                  } else {
                    onBack();
                  }
                }}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-xl"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Ir para Meus Cursos
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => onEnroll(course)}
              // cor roxa do botão
              style={{
                backgroundColor: '#9333ea',
                color: '#ffffff'
              }}
              className="bg-white text-black hover:bg-gray-100 shadow-xl font-semibold "
            >
              Garantir Minha Vaga Agora - R$ {price.toFixed(2)}
            </Button>
          )}
          <p className="mt-4 text-sm text-gray-300">
            💕 Acesso imediato • ✅ Garantia de 7 dias • 🎓 Conteúdo exclusivo
          </p>
        </div>
      </section>
    </div>
  );
}
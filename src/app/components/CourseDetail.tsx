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
  Heart,
  MessageCircle,
  Brain,
  Trophy,
  Headphones,
  Shield,
  Sparkles,
  Quote,
  ShoppingCart,
  Plus,
  Lock,
  Zap,
  Infinity,
  Gift
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useState } from "react";
import { apiClient } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/apiUrl";

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
      let streamingUrl = `${API_BASE_URL}/upload/stream?url=${encodedUrl}`;
      
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

  const moduleCount = course.modules?.length || 0;

  const getModuleDuration = (module: { duration?: string; lessons?: { duration?: string }[] }) => {
    const lessons = module.lessons || [];
    if (lessons.length === 0) return module.duration || '0h';

    let totalMinutes = 0;
    lessons.forEach((lesson) => {
      if (lesson.duration) {
        const duration = lesson.duration.toLowerCase();
        const hoursMatch = duration.match(/(\d+)\s*h/);
        const minutesMatch = duration.match(/(\d+)\s*min?/);
        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
        if (!hoursMatch && !minutesMatch) {
          const numMatch = duration.match(/(\d+)/);
          if (numMatch) totalMinutes += parseInt(numMatch[1]);
        }
      }
    });

    if (totalMinutes === 0) return module.duration || '0h';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  };

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
        // Same page shell as home (App.tsx)
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Hero — same treatment as HomeHero (admin theme + glows) */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-8 lg:px-8">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Cursos
          </Button>
          
          <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:gap-x-20 xl:gap-x-28">
            <div className="space-y-6 lg:pr-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {course.category}
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-blue-100 text-justify">
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
              
              <div className="max-w-xl rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:p-5">
                {alreadyOwned ? (
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2 text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-lg font-bold text-white">Você já possui este curso!</span>
                    </div>
                    <p className="mb-4 text-sm text-blue-100/80">
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
                      className="h-11 w-full rounded-lg bg-white/15 text-white hover:bg-white/25"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ir para Meus Cursos
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        {originalPrice && (
                          <p className="text-sm text-blue-200/80 line-through">
                            De R$ {originalPrice.toFixed(2)}
                          </p>
                        )}
                        <p className="text-3xl font-bold tracking-tight text-white">
                          R$ {price.toFixed(2)}
                        </p>
                      </div>
                      {discount > 0 && (
                        <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          Economize {discount}%
                        </span>
                      )}
                    </div>

                    <ul className="mb-4 space-y-2 border-t border-white/10 pt-4">
                      <li className="flex items-start gap-2 text-sm text-blue-100/90">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{course.lessons} aulas · {course.duration} de conteúdo</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-100/90">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>Suporte ao aluno durante o curso</span>
                      </li>
                    </ul>

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2.5">
                      <Button
                        size="lg"
                        onClick={() => onEnroll(course)}
                        className="h-11 flex-1 gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-none hover:bg-emerald-500"
                      >
                        <ShoppingCart className="h-4 w-4 shrink-0" />
                        Comprar Agora
                      </Button>
                      {onAddToCart && (
                        <Button
                          size="lg"
                          onClick={() => onAddToCart(course)}
                          variant="outline"
                          className="h-11 flex-1 gap-2 rounded-lg border border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10 hover:text-white"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-white/10 pt-3 text-[11px] text-blue-200/70 sm:text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="h-3 w-3 shrink-0" />
                        Pagamento seguro
                      </span>
                      <span className="hidden text-white/20 sm:inline" aria-hidden>
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Zap className="h-3 w-3 shrink-0" />
                        Acesso imediato
                      </span>
                      <span className="hidden text-white/20 sm:inline" aria-hidden>
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Infinity className="h-3 w-3 shrink-0" />
                        Acesso vitalício
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div
                  className="absolute inset-0 blur-3xl"
                  style={{
                    background: `linear-gradient(to top right, var(--theme-primary-light), var(--theme-secondary))`,
                    opacity: 0.3,
                  }}
                />
                <ImageWithFallback
                  src={course.image}
                  alt={course.title}
                  className="relative rounded-2xl shadow-2xl w-full h-[400px] object-cover"
                  style={{ objectPosition: course.imagePosition || "50% 50%" }}
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

      {/* Benefits + editorial stats — wide, left-aligned */}
      <section className="border-t border-white/[0.06] py-20 sm:py-28" style={{ background: 'transparent' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(course.benefits || []).length > 0 ? (
            <>
              <div className="mb-14 max-w-3xl">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
                  Resultados
                </p>
                <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  O que você leva deste curso
                </h2>
                <p className="text-base text-white/45 sm:text-lg">
                  Conhecimentos práticos e aplicáveis para transformar sua vida
                </p>
              </div>
              <div className="mb-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                {(course.benefits || []).map((benefit, index) => {
                  const Icon = iconMap[benefit.icon] || Heart;
                  return (
                    <div key={index} className="border-t border-white/10 pt-6">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-white">{benefit.title}</h3>
                      <p className="text-sm leading-relaxed text-white/45">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
              <div className="mb-5 flex items-center gap-2.5 text-white/40">
                <BookOpen className="h-4 w-4 text-violet-300/70" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Aulas</span>
              </div>
              <p className="text-5xl font-light tracking-tight text-white tabular-nums lg:text-6xl xl:text-7xl">
                {course.lessons}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
              <div className="mb-5 flex items-center gap-2.5 text-white/40">
                <Clock className="h-4 w-4 text-violet-300/70" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Conteúdo</span>
              </div>
              <p className="text-5xl font-light tracking-tight text-white tabular-nums lg:text-6xl xl:text-7xl">
                {course.duration}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
              <div className="mb-5 flex items-center gap-2.5 text-white/40">
                <Star className="h-4 w-4 fill-amber-400/90 text-amber-400/90" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Avaliação</span>
              </div>
              <p className="text-5xl font-light tracking-tight text-white tabular-nums lg:text-6xl xl:text-7xl">
                {course.rating}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content — full-width journey */}
      <section className="py-20 sm:py-28" style={{ background: 'transparent' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid gap-6 border-b border-white/[0.07] pb-10 lg:mb-14 lg:grid-cols-12 lg:items-end lg:gap-10 lg:pb-12">
            <div className="lg:col-span-8">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
                Jornada
              </p>
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Sua trilha módulo a módulo
              </h2>
              <p className="max-w-xl text-base text-white/45">
                Abra cada etapa e veja exatamente o que você vai assistir.
              </p>
            </div>
            {moduleCount > 0 && (
              <div className="lg:col-span-4 lg:text-right">
                <p className="text-sm text-white/35">
                  <span className="text-2xl font-light text-white">{moduleCount}</span>
                  <span className="ml-2">módulos</span>
                </p>
                <p className="mt-1 text-sm text-white/35">
                  <span className="text-white/70">{course.lessons}</span> aulas no total
                </p>
              </div>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full">
            {(course.modules || []).map((module, index) => {
              const moduleTopics = module.lessons?.map((l) => l.title) || [];
              const lessonCount = module.lessons?.length || 0;
              const lessons = module.lessons || [];
              const moduleDuration = getModuleDuration(module);

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-white/[0.07] last:border-b"
                >
                  <AccordionTrigger className="group py-6 hover:no-underline sm:py-7 [&_svg]:text-white/25 group-hover:[&_svg]:text-white/50 [&[data-state=open]_svg]:text-violet-300/80">
                    <div className="grid w-full grid-cols-[auto_1fr] items-start gap-4 text-left sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 lg:gap-12">
                      <span className="pt-0.5 text-sm font-medium tabular-nums tracking-wider text-violet-300/70 sm:text-base">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium tracking-tight text-white sm:text-xl lg:text-2xl">
                          {module.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-white/35 sm:hidden">
                          {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'} · {moduleDuration}
                        </p>
                      </div>
                      <div className="hidden text-right text-sm text-white/35 sm:block">
                        <p>
                          {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                        </p>
                        <p className="mt-0.5 tabular-nums text-white/50">{moduleDuration}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <ul className="ml-0 space-y-0 border-l border-white/[0.08] pl-6 sm:ml-12 sm:pl-10 lg:ml-14">
                      {lessons.map((lesson, lessonIndex) => (
                        <li
                          key={lessonIndex}
                          className="group/lesson grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-white/[0.04] py-3.5 last:border-0 sm:gap-8"
                        >
                          <span className="w-6 text-xs tabular-nums text-white/25">
                            {String(lessonIndex + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[15px] text-white/60 transition-colors group-hover/lesson:text-white">
                            {typeof lesson === 'object' && lesson.title
                              ? lesson.title
                              : String(lesson)}
                          </span>
                          <span className="text-xs tabular-nums text-white/30">
                            {typeof lesson === 'object' && lesson.duration
                              ? lesson.duration
                              : '--'}
                          </span>
                        </li>
                      ))}
                      {moduleTopics.length > 0 &&
                        lessons.length === 0 &&
                        moduleTopics.map((topic, topicIndex) => (
                          <li
                            key={topicIndex}
                            className="flex items-center gap-3 border-b border-white/[0.04] py-3.5 text-[15px] text-white/60 last:border-0"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-white/30" />
                            <span>{typeof topic === 'string' ? topic : String(topic)}</span>
                          </li>
                        ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {(course.bonuses || []).length > 0 && (
            <div className="mt-16 grid gap-8 border border-white/[0.08] bg-white/[0.03] p-6 sm:mt-20 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
              <div className="lg:col-span-8">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">
                  Incluído
                </p>
                <h3 className="mb-6 text-2xl font-medium tracking-tight text-white">
                  Bônus exclusivos
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {(course.bonuses || []).map((bonus: any, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-[15px] text-white/65"
                    >
                      <Gift className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/70" />
                      <span>{bonus.title || bonus.name || 'Material de Apoio'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {originalPrice && originalPrice > price && (
                <div className="flex flex-col justify-center border-t border-white/[0.07] pt-6 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <p className="text-xs tracking-wide text-white/35">Valor do bônus</p>
                  <p className="mt-2 text-lg text-white/30 line-through">
                    R$ {(originalPrice - price).toFixed(2)}
                  </p>
                  <p className="mt-1 text-xl font-medium text-white">
                    Incluído · sem custo extra
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="border-t border-white/[0.06] py-20 sm:py-28" style={{ background: 'transparent' }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-2xl lg:mb-14">
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                O que nossos alunos dizem
              </h2>
              <p className="text-base text-white/45">
                Avaliações reais de alunos que já transformaram suas vidas
              </p>
            </div>
            
            {reviews.length === 0 ? (
              <div className="py-12">
                <MessageCircle className="mb-4 h-12 w-12 text-white/30" />
                <p className="text-white/45">
                  Seja o primeiro a avaliar este curso!
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.id} className="border border-white/10 shadow-none bg-white/[0.04]">
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
              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-white/[0.07] pt-8">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="text-3xl font-light text-white">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-white/40">Avaliação média</p>
                </div>
                <div className="hidden h-10 w-px bg-white/10 sm:block" />
                <div>
                  <div className="mb-1 text-3xl font-light text-white">
                    {reviews.length}
                  </div>
                  <p className="text-sm text-white/40">
                    {reviews.length === 1 ? 'Avaliação' : 'Avaliações'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Final — wide split */}
      <section className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,_rgba(139,92,246,0.14)_0%,_transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {alreadyOwned ? (
            <div className="grid gap-8 border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-10">
              <div>
                <div className="mb-2 flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-white">Você já possui este curso</span>
                </div>
                <p className="text-sm text-white/40">
                  Acesse em &quot;Meus Cursos&quot; para continuar assistindo
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  if (onGoToMyCourses) {
                    onGoToMyCourses();
                  } else {
                    onBack();
                  }
                }}
                className="h-12 rounded-lg bg-violet-600 text-white hover:bg-violet-500 lg:justify-self-end lg:px-10"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Ir para Meus Cursos
              </Button>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-end">
              <div className="lg:col-span-6">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
                  Inscrição
                </p>
                <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Pronto para começar?
                </h2>
                <p className="max-w-md text-base leading-relaxed text-white/45">
                  Acesso imediato ao conteúdo completo, no seu ritmo.
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/35">
                  <span>Pagamento seguro</span>
                  <span className="text-white/15">·</span>
                  <span>Garantia de 7 dias</span>
                  <span className="text-white/15">·</span>
                  <span>Acesso vitalício</span>
                </div>
              </div>

              <div className="border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md sm:p-8 lg:col-span-6">
                <div className="mb-6 flex items-end justify-between gap-3">
                  <div>
                    {originalPrice && originalPrice > price && (
                      <p className="mb-1 text-sm text-white/30 line-through">
                        R$ {originalPrice.toFixed(2)}
                      </p>
                    )}
                    <p className="text-4xl font-light tracking-tight text-white">
                      R$ {price.toFixed(2)}
                    </p>
                  </div>
                  {discount > 0 && (
                    <span className="mb-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300/90">
                      −{discount}%
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={() => onEnroll(course)}
                    className="h-12 flex-1 gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-none hover:bg-emerald-500"
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    Garantir minha vaga
                  </Button>
                  {onAddToCart && (
                    <Button
                      size="lg"
                      onClick={() => onAddToCart(course)}
                      variant="outline"
                      className="h-12 flex-1 gap-2 rounded-lg border-white/15 bg-transparent text-sm font-medium text-white/85 hover:bg-white/[0.06] hover:text-white"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      Adicionar ao carrinho
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
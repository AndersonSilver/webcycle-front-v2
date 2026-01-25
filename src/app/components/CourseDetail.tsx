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
    <div className="min-h-screen bg-white">
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
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold text-lg">Você já possui este curso!</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl"
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
                        className="bg-green-600 hover:bg-green-700 text-white shadow-xl"
                      >
                        🛒 Comprar Agora
                      </Button>
                      {onAddToCart && (
                        <Button
                          size="lg"
                          onClick={() => onAddToCart(course)}
                          variant="outline"
                          className="bg-white text-blue-700 hover:bg-blue-50 border-2 border-white shadow-xl"
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
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
                <PlayCircle className="w-6 h-6 text-blue-600" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Apresentação do Curso
              </h2>
              <p className="text-gray-600 text-sm">Conheça mais sobre este curso</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl shadow-2xl overflow-hidden bg-black aspect-video">
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
                          className="w-full h-full min-h-[400px]"
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
                      <div className="flex items-center justify-center w-full h-full min-h-[400px] text-white">
                        <div className="text-center">
                          <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Vídeo não disponível</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="relative w-full h-full min-h-[400px]">
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
                        className="w-full h-full min-h-[400px]"
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            O Que Você Vai Aprender
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(course.benefits || []).map((benefit, index) => {
              const Icon = iconMap[benefit.icon] || Heart;
              return (
                <Card key={index} className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Conteúdo do Curso
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Card className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {(course.modules || []).map((module, index) => {
                  // Extract lesson titles from module
                  const moduleTopics = module.lessons?.map(l => l.title) || [];
                  const lessonCount = module.lessons?.length || 0;
                  
                  return (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-start gap-4 text-left w-full">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{module.title}</h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="w-4 h-4" />
                              {lessonCount} aulas
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {module.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-16 pr-4 space-y-3 mt-4">
                        {moduleTopics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="flex items-center gap-3 text-gray-700">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>{typeof topic === 'string' ? topic : topic}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  );
                })}
              </Accordion>
            </Card>
            
            {/* Bonuses */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xl mb-2">Bônus Exclusivos Inclusos</h3>
                  <ul className="space-y-2 text-gray-700">
                    {(course.bonuses || []).map((bonus: any, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>{bonus.title || bonus.name || 'Material de Apoio'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {originalPrice && (
                  <div className="text-center md:text-right">
                    <div className="text-sm text-gray-600">Valor adicional</div>
                    <div className="font-bold text-3xl text-blue-600">
                      R$ {(originalPrice - price).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600 font-semibold">GRÁTIS</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                O Que Nossos Alunos Dizem
              </h2>
              <p className="text-gray-600 text-lg">
                Avaliações reais de alunos que já transformaram suas vidas
              </p>
            </div>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Seja o primeiro a avaliar este curso!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      {/* Header with avatar and stars */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold">{review.userName}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <Quote className="w-8 h-8 text-blue-200" />
                      </div>

                      {/* Comment */}
                      <p className="text-gray-700 leading-relaxed mb-3">
                        "{review.comment}"
                      </p>

                      {/* Date */}
                      <div className="text-xs text-gray-500 pt-3 border-t">
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
                <div className="inline-flex items-center gap-6 bg-white rounded-xl shadow-lg px-8 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-3xl font-bold">
                        {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Avaliação média</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {reviews.length}
                    </div>
                    <p className="text-sm text-gray-600">
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
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pronto Para Começar Sua Transformação?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a {course.students.toLocaleString('pt-BR')} alunos que já estão transformando suas vidas
          </p>
          {alreadyOwned ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">Você já possui este curso!</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Ir para Meus Cursos
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => onEnroll(course)}
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl"
            >
              Garantir Minha Vaga Agora - R$ {price.toFixed(2)}
            </Button>
          )}
          <p className="mt-4 text-sm text-blue-200">
            💕 Acesso imediato • ✅ Garantia de 7 dias • 🎓 Certificado incluído
          </p>
        </div>
      </section>
    </div>
  );
}
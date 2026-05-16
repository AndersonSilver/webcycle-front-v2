import { useState, useEffect, useCallback, useRef } from "react";
import { Course } from "../data/courses";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle2, 
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Loader2,
  Star,
  X
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/apiUrl";
import { toast } from "sonner";
import { useVideoProtection } from "../../hooks/useVideoProtection";

interface CoursePlayerProps {
  course: Course;
  onBack: () => void;
  progress?: number;
  completedLessons?: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  duration: string;
  order: number;
  lessons: Lesson[];
}

export function CoursePlayer({ course, onBack, progress = 0 }: CoursePlayerProps) {
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [watchTime, setWatchTime] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [myReview, setMyReview] = useState<any | null>(null);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null);
  const [videoStartWatchTime, setVideoStartWatchTime] = useState(0); // Tempo assistido quando o vídeo começou
  const [actualVideoDuration, setActualVideoDuration] = useState<number | null>(null); // Duração real do vídeo do YouTube
  const [useDirectUrl, setUseDirectUrl] = useState(false); // Fallback para URL direta do Azure
  
  // Ref para o elemento de vídeo para proteção
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Aplicar proteções de vídeo
  useVideoProtection(videoRef);

  // Verificar se o aluno já avaliou o curso
  useEffect(() => {
    const checkMyReview = async () => {
      try {
        const response = await apiClient.getMyReview(course.id);
        if (response?.review) {
          setMyReview(response.review);
          setReviewRating(response.review.rating);
          setReviewComment(response.review.comment);
        }
      } catch (error) {
        console.error("Erro ao verificar avaliação:", error);
      }
    };
    
    if (hasAccess) {
      checkMyReview();
    }
  }, [course.id, hasAccess]);


  // Carregar detalhes da aula (definir ANTES de ser usado)
  const loadLesson = useCallback(async (lessonId: string) => {
    try {
      const response = await apiClient.getLessonById(lessonId);
      const lessonData = {
        ...response.lesson,
        completed: response.progress?.completed || false,
      };
      setCurrentLesson(lessonData);
      setHasAccess(response.hasAccess);
      setCurrentLessonId(lessonId);
      setAutoCompleted(false); // Resetar flag de conclusão automática ao carregar nova aula
      setUseDirectUrl(false); // Resetar fallback para tentar streaming primeiro
      
      // Atualizar estado dos módulos para refletir o status de conclusão
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, completed: response.progress?.completed || false }
              : lesson
          ),
        }))
      );
      
      if (response.hasAccess) {
        // Carregar materiais
        const materialsResponse = await apiClient.getLessonMaterials(lessonId);
        setMaterials(materialsResponse.materials);
        
        // Carregar progresso
        if (response.progress) {
          const initialWatchTime = Math.floor(response.progress.watchedDuration || 0);
          setWatchTime(initialWatchTime);
          setVideoStartWatchTime(initialWatchTime);
        } else {
          setWatchTime(0);
          setVideoStartWatchTime(0);
        }
        
        // Resetar tempo de início do vídeo
        setVideoStartTime(null);
      }
    } catch (error) {
      console.error("Erro ao carregar aula:", error);
      toast.error("Erro ao carregar aula");
    }
  }, []);

  const handleMarkComplete = useCallback(async (isAutoComplete = false) => {
    if (!currentLessonId || (isAutoComplete && autoCompleted)) return;

    try {
      await apiClient.completeLesson(currentLessonId, watchTime);
      
      if (isAutoComplete) {
        toast.success("Aula concluída automaticamente!");
        setAutoCompleted(true);
      } else {
      toast.success("Aula marcada como concluída!");
      }
      
      // Atualizar estado local da aula atual
      setCurrentLesson((prevLesson: any) => {
        if (!prevLesson) return prevLesson;
        return {
          ...prevLesson,
          completed: true,
        };
      });

      // Atualizar estado dos módulos para refletir a conclusão
      setModules(prevModules => {
        const updatedModules = prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === currentLessonId 
              ? { ...lesson, completed: true }
              : lesson
          ),
        }));
        
        // Encontrar próxima aula não concluída
        const allLessons = updatedModules.flatMap(m => m.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
        
        // Procurar próxima aula não concluída
        let nextLesson = null;
        for (let i = currentIndex + 1; i < allLessons.length; i++) {
          if (!allLessons[i].completed && !allLessons[i].locked) {
            nextLesson = allLessons[i];
            break;
          }
        }
        
        if (nextLesson && !isAutoComplete) {
          setTimeout(() => {
            loadLesson(nextLesson.id);
          }, 100);
        } else if (isAutoComplete) {
          // Se foi automático, não navegar automaticamente, apenas mostrar mensagem
          setTimeout(() => {
            if (nextLesson) {
              toast.info("Próxima aula disponível!");
            } else {
              toast.info("Parabéns! Você concluiu todas as aulas deste curso!");
            }
          }, 2000);
        } else {
          toast.info("Parabéns! Você concluiu todas as aulas deste curso!");
        }
        
        return updatedModules;
      });
      
      // Recarregar progresso do curso
      await apiClient.getCourseProgress(course.id);
    } catch (error: any) {
      console.error("Erro ao marcar aula como concluída:", error);
      toast.error(error?.message || "Erro ao marcar aula como concluída");
    }
  }, [currentLessonId, autoCompleted, watchTime, course.id, loadLesson]);

  // Verificar conclusão baseada em tempo assistido (fallback quando eventos não funcionam)
  useEffect(() => {
    if (!currentLessonId || !hasAccess || !currentLesson || autoCompleted || currentLesson.completed) {
      return;
    }

    // Converter duração da aula para segundos
    const parseDuration = (duration: string): number => {
      if (!duration) {
        console.warn('⚠️ [AutoComplete] Duração vazia');
        return 0;
      }
      
      const durationLower = duration.toLowerCase().trim();
      
      // Se for formato "45min" ou "45 min" ou "45 minutos"
      if (durationLower.includes('min')) {
        const match = durationLower.match(/(\d+)\s*min/i);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = minutes * 60;
          console.log(`📐 [AutoComplete] Parse "min": "${duration}" -> ${minutes}min = ${seconds}s`);
          return seconds;
        }
      }
      
      // Se for formato "MM:SS" ou "HH:MM:SS"
      if (duration.includes(':')) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
          const seconds = parts[0] * 60 + parts[1];
          console.log(`📐 [AutoComplete] Parse "MM:SS": "${duration}" -> ${seconds}s`);
          return seconds;
        }
        if (parts.length === 3) {
          const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          console.log(`📐 [AutoComplete] Parse "HH:MM:SS": "${duration}" -> ${seconds}s`);
          return seconds;
        }
      }
      
      // Se terminar com 's' (segundos)
      if (durationLower.endsWith('s') && !durationLower.endsWith('min')) {
        const seconds = parseInt(durationLower.replace('s', '')) || 0;
        console.log(`📐 [AutoComplete] Parse "s": "${duration}" -> ${seconds}s`);
        return seconds;
      }
      
      // Se terminar com 'm' (minutos) - mas não 'min'
      if (durationLower.endsWith('m') && !durationLower.includes('min')) {
        const minutes = parseInt(durationLower.replace('m', '')) || 0;
        const seconds = minutes * 60;
        console.log(`📐 [AutoComplete] Parse "m": "${duration}" -> ${minutes}min = ${seconds}s`);
        return seconds;
      }
      
      // Tentar parse direto como número (assumir segundos)
      const parsed = parseInt(durationLower.replace(/[^\d]/g, '')) || 0;
      if (parsed > 0) {
        console.log(`📐 [AutoComplete] Parse numérico: "${duration}" -> ${parsed}s (assumindo segundos)`);
        return parsed;
      }
      
      console.warn(`⚠️ [AutoComplete] Não foi possível parsear duração: "${duration}"`);
      return 0;
    };

    // Para vídeos do YouTube, usar a duração real do vídeo se disponível
    let lessonDuration: number;
    const isYouTube = isYouTubeUrl(currentLesson?.videoUrl || '');
    
    if (isYouTube && actualVideoDuration && actualVideoDuration > 0) {
      lessonDuration = actualVideoDuration;
      console.log('🔍 [AutoComplete] ✅ Usando duração REAL do vídeo do YouTube:', {
        actualDuration: `${actualVideoDuration}s (${(actualVideoDuration/60).toFixed(1)}min)`,
        storedDuration: currentLesson.duration,
        usingRealDuration: true
      });
    } else {
      lessonDuration = parseDuration(currentLesson.duration || '0');
      if (isYouTube && !actualVideoDuration) {
        console.log('⚠️ [AutoComplete] Aguardando duração real do vídeo do YouTube...', {
          storedDuration: currentLesson.duration,
          parsed: lessonDuration,
          actualVideoDuration: actualVideoDuration
        });
      } else {
        console.log('🔍 [AutoComplete] Parse de duração:', {
          original: currentLesson.duration,
          parsed: lessonDuration,
          parsedMinutes: (lessonDuration / 60).toFixed(2)
        });
      }
    }
    
    if (lessonDuration === 0) {
      console.warn('⚠️ [AutoComplete] Duração da aula não encontrada ou inválida:', currentLesson.duration);
      return;
    }

    // Para aulas muito curtas (menos de 1 minuto), usar threshold de 80%
    // Para aulas normais, usar 90% ou duração - 10s
    const completionThreshold = lessonDuration < 60 
      ? lessonDuration * 0.8  // 80% para aulas muito curtas
      : Math.max(lessonDuration * 0.9, lessonDuration - 10); // 90% ou duração - 10s
    
    console.log('🔍 [AutoComplete] Iniciando verificação:', {
      lessonDuration: `${lessonDuration}s (${(lessonDuration/60).toFixed(1)}min)`,
      threshold: `${completionThreshold}s (${(completionThreshold/60).toFixed(1)}min)`,
      duration: currentLesson.duration,
      thresholdPercent: `${((completionThreshold / lessonDuration) * 100).toFixed(1)}%`
    });

    // Buscar tempo assistido do backend periodicamente
    let checkCount = 0;
    let lastBackendWatchTime = 0;
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      try {
        const progressResponse = await apiClient.getCourseProgress(course.id);
        console.log(`📊 [AutoComplete] Resposta do backend:`, {
          hasLessons: !!progressResponse?.lessons,
          lessonsCount: progressResponse?.lessons?.length || 0,
          currentLessonId
        });
        
        if (progressResponse?.lessons && Array.isArray(progressResponse.lessons)) {
          const lessonProgress = progressResponse.lessons.find((p: any) => p.lessonId === currentLessonId);
          
          console.log(`📊 [AutoComplete] Progresso da aula encontrado:`, {
            found: !!lessonProgress,
            lessonId: lessonProgress?.lessonId,
            watchedDuration: lessonProgress?.watchedDuration,
            completed: lessonProgress?.completed,
            rawData: lessonProgress
          });
          
          const backendWatchTime = lessonProgress ? Math.floor(lessonProgress.watchedDuration || 0) : 0;
          
          // Atualizar estado local se diferente
          if (backendWatchTime !== lastBackendWatchTime) {
            console.log(`🔄 [AutoComplete] Tempo atualizado: ${lastBackendWatchTime}s -> ${backendWatchTime}s`);
            setWatchTime(backendWatchTime);
            lastBackendWatchTime = backendWatchTime;
          }
          
          const progressPercent = lessonDuration > 0 ? ((backendWatchTime / lessonDuration) * 100).toFixed(1) : '0.0';
          const timeRemaining = Math.max(0, completionThreshold - backendWatchTime);
          
          console.log(`🔍 [AutoComplete] Verificação #${checkCount}:`, {
            watchTime: `${backendWatchTime}s`,
            threshold: `${completionThreshold}s`,
            lessonDuration: `${lessonDuration}s`,
            progress: `${progressPercent}%`,
            timeRemaining: `${timeRemaining}s para completar`,
            shouldComplete: backendWatchTime >= completionThreshold,
            lessonCompleted: lessonProgress?.completed || false
          });

          // Verificar se atingiu o threshold E a aula não está marcada como concluída
          if (
            backendWatchTime >= completionThreshold && 
            !autoCompleted && 
            currentLesson && 
            !currentLesson.completed &&
            !lessonProgress?.completed
          ) {
            console.log(`✅ [AutoComplete] TEMPO ATINGIDO! Marcando como concluído...`);
            console.log(`   - Tempo assistido: ${backendWatchTime}s`);
            console.log(`   - Threshold: ${completionThreshold}s`);
            console.log(`   - Duração total: ${lessonDuration}s`);
            console.log(`   - Progresso: ${progressPercent}%`);
            handleMarkComplete(true);
            clearInterval(checkInterval);
          }
        } else {
          console.warn(`⚠️ [AutoComplete] Resposta do backend não contém lessons:`, progressResponse);
        }
      } catch (error) {
        console.error('❌ [AutoComplete] Erro ao buscar tempo assistido:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => {
      clearInterval(checkInterval);
    };
  }, [currentLessonId, hasAccess, currentLesson, autoCompleted, handleMarkComplete, course.id, actualVideoDuration]);

  const handleSubmitReview = async () => {
    const trimmedComment = reviewComment.trim();
    
    if (!trimmedComment) {
      toast.error("Por favor, escreva um comentário sobre o curso");
      return;
    }

    if (trimmedComment.length < 10) {
      toast.error("O comentário deve ter pelo menos 10 caracteres");
      return;
    }

    try {
      await apiClient.createReview({
        courseId: course.id,
        rating: reviewRating,
        comment: trimmedComment,
      });
      toast.success("Avaliação enviada com sucesso!");
      setShowReviewForm(false);
      // Recarregar avaliação do usuário
      const myReviewResponse = await apiClient.getMyReview(course.id);
      if (myReviewResponse?.review) {
        setMyReview(myReviewResponse.review);
        setReviewRating(myReviewResponse.review.rating);
        setReviewComment(myReviewResponse.review.comment);
      }
    } catch (error: any) {
      // Verificar se é erro de validação do backend
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const commentError = validationErrors.find((e: any) => e.property === 'comment');
        if (commentError) {
          toast.error(commentError.constraints?.minLength || "O comentário deve ter pelo menos 10 caracteres");
        } else {
          toast.error("Dados inválidos. Verifique os campos preenchidos.");
        }
      } else {
        toast.error(error?.message || "Erro ao enviar avaliação");
      }
      console.error(error);
    }
  };

  // Calcular estatísticas de progresso (antes de qualquer return condicional)
  const allLessons = modules.flatMap(m => m.lessons);
  const completedCount = allLessons.filter(l => l.completed).length;
  const totalLessons = allLessons.length;
  const courseProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : progress;
  
  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Verificar se é URL do YouTube
  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Helper para converter URL do Azure para endpoint de streaming
  const getStreamingUrl = (azureUrl: string, lessonId?: string | null): string => {
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
        const apiBaseUrl = API_BASE_URL;
        let streamingUrl = `${apiBaseUrl}/upload/stream?url=${encodedUrl}`;
        
        // Adicionar token na URL para autenticação (necessário porque <video> não envia headers)
        if (token) {
          streamingUrl += `&token=${encodeURIComponent(token)}`;
        }
        
        // Adicionar lessonId para verificação de acesso
        if (lessonId) {
          streamingUrl += `&lessonId=${lessonId}`;
        }
        
        console.log('🔄 Convertendo para streaming URL (com autenticação)');
        return streamingUrl;
      } catch (error) {
        console.error('❌ Erro ao converter URL para streaming:', error);
        // Não usar fallback direto - forçar erro para manter segurança
        throw new Error('Erro ao gerar URL de streaming protegida');
      }
    }
    // Se for YouTube ou outra URL, retornar como está
    return azureUrl;
  };

  // Extrair ID do vídeo do YouTube
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

  // Carregar módulos e aulas da API
  useEffect(() => {
    const loadCourseContent = async () => {
      try {
        setLoading(true);
        
        // Carregar progresso do curso primeiro para obter status de conclusão
        let courseProgressData: any = null;
        try {
          courseProgressData = await apiClient.getCourseProgress(course.id);
        } catch (progressError) {
          // Se não tiver acesso ainda, continuar sem progresso
          console.log("Não foi possível carregar progresso:", progressError);
        }
        
        // Criar mapa de progresso das aulas
        const progressMap = new Map<string, boolean>();
        if (courseProgressData?.lessons) {
          courseProgressData.lessons.forEach((lessonProgress: any) => {
            if (lessonProgress.completed) {
              progressMap.set(lessonProgress.lessonId, true);
            }
          });
        }
        
        // Carregar módulos do curso
        const modulesResponse = await apiClient.getCourseModules(course.id);
        const modulesData = await Promise.all(
          modulesResponse.modules.map(async (module: any) => {
            const lessonsResponse = await apiClient.getModuleLessons(module.id);
            // ✅ Transformar lessons para garantir que tenham os campos corretos
            const transformedLessons: Lesson[] = (lessonsResponse.lessons || []).map((lesson: any) => ({
              id: lesson.id || '',
              title: lesson.title || 'Aula sem título',
              duration: lesson.duration || '0min',
              // Usar progresso do curso se disponível, senão usar o retornado pela API
              completed: progressMap.has(lesson.id) ? progressMap.get(lesson.id)! : (lesson.completed || false),
              locked: lesson.locked !== undefined ? lesson.locked : false,
              videoUrl: lesson.videoUrl || undefined,
              order: lesson.order || 0,
            }));
            
            return {
              id: module.id || '',
              title: module.title || 'Módulo sem título',
              duration: module.duration || '0min',
              order: module.order || 0,
              lessons: transformedLessons,
            };
          })
        );
        
        setModules(modulesData);
        
        // Se houver aulas, carregar a primeira
        if (modulesData.length > 0 && modulesData[0].lessons.length > 0) {
          const firstLesson = modulesData[0].lessons[0];
          await loadLesson(firstLesson.id);
        }
      } catch (error) {
        console.error("Erro ao carregar conteúdo do curso:", error);
        toast.error("Erro ao carregar conteúdo do curso");
      } finally {
        setLoading(false);
      }
    };

    loadCourseContent();
  }, [course.id, loadLesson]);

  // Timer para atualizar tempo assistido enquanto o vídeo está reproduzindo
  useEffect(() => {
    if (!videoStartTime || !currentLessonId) {
      return;
    }

    let lastBackendUpdate = Date.now();
    const watchTimeInterval = setInterval(async () => {
      if (videoStartTime && currentLessonId) {
        const elapsedSeconds = Math.floor((Date.now() - videoStartTime) / 1000);
        const newWatchTime = videoStartWatchTime + elapsedSeconds;
        
        setWatchTime(newWatchTime);
        
        // Atualizar no backend a cada 30 segundos
        const timeSinceLastUpdate = Math.floor((Date.now() - lastBackendUpdate) / 1000);
        if (timeSinceLastUpdate >= 30) {
          try {
            await apiClient.updateWatchTime(currentLessonId, newWatchTime);
            console.log(`📹 [YouTube] Tempo atualizado no backend: ${newWatchTime}s`);
            lastBackendUpdate = Date.now();
            setVideoStartWatchTime(newWatchTime); // Atualizar tempo base
            setVideoStartTime(Date.now()); // Resetar contador
          } catch (error) {
            console.error('Erro ao atualizar tempo assistido:', error);
          }
        }
      }
    }, 5000); // Atualizar a cada 5 segundos

    return () => {
      clearInterval(watchTimeInterval);
    };
  }, [videoStartTime, currentLessonId, videoStartWatchTime]);

  // Detectar quando vídeo do YouTube termina usando postMessage API
  useEffect(() => {
    if (!currentLesson?.videoUrl || !isYouTubeUrl(currentLesson?.videoUrl || '') || !hasAccess || !currentLessonId) {
      return;
    }

    // Resetar flag quando mudar de aula
    setAutoCompleted(false);
    
    let checkCount = 0;
    const maxChecks = 300; // Máximo 10 minutos (300 * 2 segundos)

    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem é do YouTube (aceitar tanto www quanto sem www)
      if (!event.origin.includes('youtube.com')) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Log para debug - ver todas as mensagens do YouTube
        if (data && (data.infoDelivery || data.event)) {
          console.log('📨 [YouTube] Mensagem recebida:', {
            hasInfoDelivery: !!data.infoDelivery,
            playerState: data.infoDelivery?.playerState,
            currentTime: data.infoDelivery?.currentTime,
            duration: data.infoDelivery?.duration,
            event: data.event,
            info: data.info,
            eventName: data.eventName
          });
        }
        
        // Múltiplas formas de detectar fim do vídeo do YouTube
        if (data) {
          // Obter duração real do vídeo quando disponível
          if (data.infoDelivery && data.infoDelivery.duration !== undefined) {
            const duration = Math.floor(data.infoDelivery.duration);
            if (duration > 0 && (!actualVideoDuration || actualVideoDuration !== duration)) {
              console.log(`📐 [YouTube] Duração real do vídeo: ${duration}s (${(duration/60).toFixed(1)}min)`);
              setActualVideoDuration(duration);
            }
          }
          
          // Detectar quando o vídeo começa a reproduzir para iniciar tracking de tempo
          if (data.infoDelivery && data.infoDelivery.playerState !== undefined) {
            const playerState = data.infoDelivery.playerState;
            // 1 = PLAYING, 0 = ENDED, 2 = PAUSED
            if (playerState === 1 && !videoStartTime) {
              // Vídeo começou a reproduzir - iniciar tracking de tempo
              console.log('▶️ [YouTube] Vídeo começou a reproduzir, iniciando tracking');
              setVideoStartTime(Date.now());
              setVideoStartWatchTime(watchTime); // Salvar o tempo atual assistido
            } else if (playerState === 2 || playerState === 0) {
              // Vídeo pausado ou terminado - salvar tempo assistido
              if (videoStartTime) {
                const elapsedSeconds = Math.floor((Date.now() - videoStartTime) / 1000);
                const newWatchTime = videoStartWatchTime + elapsedSeconds;
                setWatchTime(newWatchTime);
                if (currentLessonId) {
                  apiClient.updateWatchTime(currentLessonId, newWatchTime).catch(err => {
                    console.error('Erro ao atualizar tempo assistido:', err);
                  });
                }
                setVideoStartTime(null);
              }
            }
          }
          
          // Obter tempo atual do vídeo quando disponível (pode não funcionar sempre)
          if (data.infoDelivery && data.infoDelivery.currentTime !== undefined) {
            const currentTime = Math.floor(data.infoDelivery.currentTime);
            if (currentTime > 0) {
              setWatchTime(currentTime);
            }
          }
          
          // Forma 1: infoDelivery com playerState = 0 (ENDED) - MARCAR COMO CONCLUÍDO DIRETAMENTE
          if (data.infoDelivery && data.infoDelivery.playerState !== undefined) {
            const playerState = data.infoDelivery.playerState;
            if (playerState === 0 && !autoCompleted && currentLesson && !currentLesson.completed) {
              console.log('✅ Vídeo do YouTube terminou (playerState=0), marcando como concluído automaticamente...');
              // Quando o vídeo termina, sabemos que foi assistido 100%, então marcar como concluído
              handleMarkComplete(true);
              return;
            }
          }
          
          // Forma 2: event com eventName = "onStateChange" e info = 0
          if (data.event === 'onStateChange' && data.info === 0) {
            if (!autoCompleted && currentLesson && !currentLesson.completed) {
              console.log('✅ Vídeo do YouTube terminou (onStateChange), marcando como concluído automaticamente...');
              handleMarkComplete(true);
              return;
            }
          }
          
          // Forma 3: eventName = "video-ended" ou similar
          if (data.event === 'video-ended' || data.eventName === 'video-ended') {
            if (!autoCompleted && currentLesson && !currentLesson.completed) {
              console.log('✅ Vídeo do YouTube terminou (video-ended), marcando como concluído automaticamente...');
              handleMarkComplete(true);
              return;
            }
          }
          
          // Forma 4: Detectar quando currentTime indica que o vídeo está próximo do fim
          // Se o tempo atual for maior que 90% da duração armazenada OU mais de 2 minutos, considerar como concluído
          if (data.infoDelivery && data.infoDelivery.currentTime !== undefined) {
            const currentTime = Math.floor(data.infoDelivery.currentTime);
            if (currentTime > 0 && currentLesson?.duration) {
              // Parse simples da duração armazenada
              const durationMatch = currentLesson.duration.match(/(\d+)\s*min/i);
              const storedDurationSeconds = durationMatch ? parseInt(durationMatch[1]) * 60 : 0;
              
              if (storedDurationSeconds > 0) {
                const progressPercent = (currentTime / storedDurationSeconds) * 100;
                // Se assistiu mais de 90% do vídeo armazenado OU mais de 2 minutos (vídeos curtos)
                if ((progressPercent >= 90 || currentTime >= 120) && !autoCompleted && currentLesson && !currentLesson.completed) {
                  console.log(`✅ Vídeo do YouTube assistido ${progressPercent.toFixed(1)}% (${currentTime}s/${storedDurationSeconds}s), marcando como concluído...`);
                  handleMarkComplete(true);
                  return;
                }
              } else if (currentTime >= 120 && !autoCompleted && currentLesson && !currentLesson.completed) {
                // Se não conseguir parsear a duração, mas assistiu mais de 2 minutos, marcar como concluído
                console.log(`✅ Vídeo do YouTube assistido ${currentTime}s (mais de 2 minutos), marcando como concluído...`);
                handleMarkComplete(true);
                return;
              }
            }
          }
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    };

    // Polling como fallback - verificar periodicamente se o vídeo terminou
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const startPolling = () => {
      pollInterval = setInterval(() => {
        checkCount++;
        if (checkCount > maxChecks) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        
        try {
          const iframe = document.querySelector(`iframe#youtube-iframe-${currentLessonId}`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow && !autoCompleted && currentLesson && !currentLesson.completed) {
            // Enviar comando para obter estado do player
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'getPlayerState',
                args: []
              }),
              '*'
            );
            
            // Enviar comando para obter tempo atual do vídeo
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'getCurrentTime',
                args: []
              }),
              '*'
            );
            
            // Enviar comando para obter duração do vídeo
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'getDuration',
                args: []
              }),
              '*'
            );
          }
        } catch (e) {
          // Ignorar erros de CORS
        }
      }, 2000); // Verificar a cada 2 segundos
    };

    window.addEventListener('message', handleMessage);
    startPolling();

    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentLesson?.videoUrl, currentLesson?.completed, currentLesson?.id, hasAccess, currentLessonId, handleMarkComplete, autoCompleted]);

  // Agora sim, podemos ter retornos condicionais após todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Se não houver aulas, mostrar mensagem
  if (!currentLesson || allLessons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Meus Cursos
            </Button>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Curso em Preparação</h2>
              <p className="text-gray-600">
                Este curso ainda não possui conteúdo disponível. Voltaremos em breve!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Meus Cursos
            </Button>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
              <p className="text-gray-600 mb-6">
                Você precisa comprar este curso para acessar o conteúdo.
              </p>
              <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
                Voltar aos Cursos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-32 pb-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Meus Cursos
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Video Player Area */}
          <div>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  {currentLesson?.videoUrl ? (
                    isYouTubeUrl(currentLesson?.videoUrl || '') ? (
                      // Player do YouTube usando iframe
                      (() => {
                        const videoId = getYouTubeVideoId(currentLesson?.videoUrl || '');
                        const embedUrl = videoId 
                          ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&playsinline=1&controls=1`
                          : '';
                        return embedUrl ? (
                          <iframe
                            id={`youtube-iframe-${currentLessonId}`}
                            className="w-full h-full"
                            src={embedUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ minHeight: '400px' }}
                          ></iframe>
                        ) : (
                          <div className="text-center text-white">
                            <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">URL do vídeo inválida</p>
                          </div>
                        );
                      })()
                    ) : (
                      // Player de vídeo HTML5 para outros formatos
                    <video
                        ref={videoRef}
                        src={useDirectUrl 
                          ? (currentLesson?.videoUrl || '') 
                          : getStreamingUrl(currentLesson?.videoUrl || '', currentLessonId)
                        }
                      controls
                      controlsList="nodownload noremoteplayback"
                      className="w-full h-full"
                      preload="auto"
                      playsInline
                      crossOrigin="anonymous"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      onTimeUpdate={async (e) => {
                        const video = e.currentTarget;
                        const currentTime = Math.floor(video.currentTime);
                        setWatchTime(currentTime);
                        
                        // Atualizar no backend a cada 30 segundos
                        if (currentTime > 0 && currentTime % 30 === 0 && currentLessonId) {
                          try {
                            await apiClient.updateWatchTime(currentLessonId, currentTime);
                            console.log(`📹 [HTML5] Tempo atualizado no backend: ${currentTime}s`);
                          } catch (error) {
                            console.error('Erro ao atualizar tempo assistido:', error);
                          }
                        }
                        
                        // Marcar como concluído se assistiu pelo menos 90% do vídeo
                        if (video.duration > 0 && !autoCompleted && currentLesson && !currentLesson.completed) {
                          const progress = (video.currentTime / video.duration) * 100;
                          if (progress >= 90) {
                            console.log('✅ Vídeo HTML5 assistido 90%+, marcando como concluído...');
                            handleMarkComplete(true);
                          }
                        }
                      }}
                        onEnded={() => {
                          // Marcar automaticamente quando vídeo HTML5 terminar
                          if (!autoCompleted && currentLesson && !currentLesson.completed) {
                            console.log('✅ Vídeo HTML5 terminou, marcando como concluído...');
                            handleMarkComplete(true);
                          }
                        }}
                        onLoadedMetadata={() => {
                          // Resetar flag quando novo vídeo carregar
                          setAutoCompleted(false);
                          console.log('✅ Metadados do vídeo carregados');
                        }}
                        onCanPlay={(e) => {
                          console.log('✅ Vídeo pode ser reproduzido (tem buffer suficiente)');
                          // Tentar reproduzir automaticamente quando tiver buffer suficiente
                          const video = e.currentTarget;
                          if (video.paused && video.readyState >= 2) {
                            video.play().catch(() => {
                              // Ignorar erro se autoplay for bloqueado pelo navegador
                            });
                          }
                        }}
                        onProgress={(e) => {
                          const video = e.currentTarget;
                          if (video.buffered.length > 0 && video.duration > 0) {
                            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                            const progress = (bufferedEnd / video.duration) * 100;
                            // Log apenas se progresso mudar significativamente
                            if (progress % 10 === 0) {
                              console.log(`📊 Buffer: ${Math.round(progress)}%`);
                            }
                          }
                        }}
                        onError={(e) => {
                          const videoElement = e.currentTarget;
                          const error = videoElement.error;
                          
                          // NÃO usar fallback direto - manter segurança máxima
                          // Se der erro, mostrar mensagem ao usuário
                          console.error('❌ Erro ao carregar vídeo protegido:', error);
                          toast.error('Erro ao carregar vídeo. Verifique sua conexão e tente novamente.');
                          
                          // Log detalhado para debug
                          console.error('Detalhes do erro:', {
                            code: error?.code,
                            message: error?.message,
                            videoUrl: currentLesson?.videoUrl,
                            lessonId: currentLessonId
                          });
                        }}
                      />
                    )
                  ) : (
                    <div className="text-center text-white">
                      <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Vídeo não disponível</p>
                      <p className="text-sm text-gray-400 mt-2">
                        O vídeo desta aula ainda não foi carregado
                      </p>
                    </div>
                  )}
                  
                  {/* Video Controls Overlay - Apenas para vídeos HTML5 (não YouTube) */}
                  {currentLesson?.videoUrl && !isYouTubeUrl(currentLesson.videoUrl) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <Progress 
                        value={currentLesson?.duration ? (watchTime / (parseInt(currentLesson.duration) * 60)) * 100 : 0} 
                        className="mb-2 h-1" 
                      />
                      <div className="flex justify-between text-white text-sm">
                        <span>{formatTime(watchTime)}</span>
                        <span>{currentLesson?.duration || '0min'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{currentLesson?.title || 'Aula sem título'}</h1>
                    <p className="text-gray-600">Duração: {currentLesson?.duration || '0min'}</p>
                    {currentLesson?.completed && (
                      <div className="mt-2 flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Aula concluída automaticamente</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Description */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-lg mb-3">Sobre este Curso</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  {/* Materiais de Apoio do Curso */}
                  {(course.bonuses && course.bonuses.length > 0) && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-md mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Materiais de Apoio
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.bonuses.map((bonus: any, index: number) => (
                          <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {bonus.title || bonus.name || 'Material de Apoio'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // description contém a URL do arquivo no Azure
                                    const downloadUrl = bonus.description || bonus.url;
                                    if (downloadUrl && (downloadUrl.startsWith('http') || downloadUrl.startsWith('https'))) {
                                      // Abrir em nova aba para download
                                      const link = document.createElement('a');
                                      link.href = downloadUrl;
                                      link.download = bonus.title || 'material';
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    } else {
                                      toast.error('URL do material não disponível');
                                    }
                                  }}
                                  className="ml-2 flex-shrink-0"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Materiais da Aula Específica */}
                  {materials.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-md mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Materiais desta Aula
                      </h4>
                      <div className="flex gap-3 flex-wrap">
                        {materials.map((material) => (
                          <Button
                            key={material.id}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Abrir material em nova aba
                              window.open(material.url, '_blank');
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {material.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avaliação do usuário */}
                  {courseProgress >= 50 && (
                    <div className="mt-6 pt-6 border-t">
                      {myReview ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">Sua Avaliação</h4>
                              <div className="flex items-center gap-1 mb-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < myReview.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-gray-700">{myReview.comment}</p>
                            </div>
                            <Button
                              onClick={() => setShowReviewForm(true)}
                              variant="outline"
                              size="sm"
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">Gostou do curso?</h4>
                            <p className="text-sm text-gray-600">Compartilhe sua experiência com outros alunos</p>
                          </div>
                          <Button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Avaliar Curso
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Course Content */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="font-bold text-xl mb-2">Conteúdo do Curso</h2>
                  <p className="text-sm text-gray-600">
                    {completedCount} de {totalLessons} aulas concluídas
                  </p>
                  <Progress value={courseProgress} className="mt-3 h-2" />
                </div>

                {/* Lessons List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {modules.map((module, moduleIndex) => {
                    const isExpanded = expandedModules.includes(moduleIndex);

                    return (
                      <div key={moduleIndex} className="border rounded-lg">
                        <button
                          onClick={() => toggleModule(moduleIndex)}
                          className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-semibold mb-1">
                              Módulo {moduleIndex + 1}: {module.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {module.lessons.length} aulas • {module.duration}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t">
                            {module.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => !lesson.locked && loadLesson(lesson.id)}
                                disabled={lesson.locked}
                                className={`w-full p-3 text-left border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                                  currentLessonId === lesson.id
                                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                                    : lesson.locked
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {lesson.locked ? (
                                    <Lock className="w-5 h-5 text-gray-400" />
                                  ) : lesson.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : currentLessonId === lesson.id ? (
                                    <PlayCircle className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {lesson.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {lesson.duration}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Avaliação */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Avaliar Curso</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewComment("");
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Sua avaliação (1 a 5 estrelas)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewRating(rating)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            rating <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {reviewRating === 5 && "Excelente!"}
                    {reviewRating === 4 && "Muito bom!"}
                    {reviewRating === 3 && "Bom"}
                    {reviewRating === 2 && "Regular"}
                    {reviewRating === 1 && "Ruim"}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
                    Seu comentário * <span className="text-gray-500 font-normal">(mínimo 10 caracteres)</span>
                  </label>
                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Compartilhe sua experiência com este curso... (mínimo 10 caracteres)"
                    className={`w-full min-h-[120px] p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      reviewComment.trim().length > 0 && reviewComment.trim().length < 10
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      reviewComment.trim().length > 0 && reviewComment.trim().length < 10
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                    }`}>
                      {reviewComment.trim().length < 10 
                        ? `Faltam ${10 - reviewComment.trim().length} caracteres (mínimo 10)`
                        : `${reviewComment.length}/500 caracteres`
                      }
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewComment("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!reviewComment.trim() || reviewComment.trim().length < 10}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Enviar Avaliação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
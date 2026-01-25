import { Course } from "../data/courses";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { PlayCircle, Clock, CheckCircle2, BookOpen, ArrowLeft, Headphones } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PurchasedCourse extends Course {
  progress: number; // 0-100
  lastWatched?: string;
  completedLessons: number;
}

interface Podcast {
  id: string;
  title: string;
  description?: string;
  image?: string;
  videoUrl: string;
  duration?: string;
  listens: number;
}

interface MyCoursesProps {
  purchasedCourses: PurchasedCourse[];
  podcasts?: Podcast[];
  onWatchCourse: (course: PurchasedCourse) => void;
  onWatchPodcast?: (podcast: Podcast) => void;
  onBack: () => void;
}

export function MyCourses({ purchasedCourses, podcasts = [], onWatchCourse, onWatchPodcast, onBack }: MyCoursesProps) {
  const hasContent = purchasedCourses.length > 0 || podcasts.length > 0;
  
  if (!hasContent) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Você ainda não tem cursos</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explore nosso catálogo e comece sua jornada de transformação pessoal hoje mesmo!
            </p>
            <Button
              size="lg"
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Explorar Cursos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalProgress = purchasedCourses.length > 0 
    ? purchasedCourses.reduce((acc, course) => acc + course.progress, 0) / purchasedCourses.length 
    : 0;
  const completedCourses = purchasedCourses.filter(c => c.progress === 100).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Header */}
      <section 
        className="relative text-white overflow-hidden pt-24 pb-12"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-primary-light)', opacity: 0.3 }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.3 }}></div>
        
        <div className="relative container mx-auto px-4" style={{ paddingTop: '6rem' }}>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Meus Cursos</h1>
          <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Continue sua jornada de aprendizado e transformação
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-3xl mb-1">{purchasedCourses.length}</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Cursos Adquiridos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-3xl mb-1">{podcasts.length}</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Podcasts</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-3xl mb-1">{completedCourses}</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Cursos Concluídos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-3xl mb-1">{Math.round(totalProgress)}%</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Progresso Médio</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-bold text-3xl mb-1">
                {purchasedCourses.reduce((acc, c) => acc + c.completedLessons, 0)}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Aulas Assistidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course List */}
      <section className="container mx-auto px-4 py-12" style={{ backgroundColor: 'var(--theme-background)' }}>
        {purchasedCourses.length > 0 && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Continue Aprendendo</h2>
              <p className="text-gray-600">Retome de onde parou</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {purchasedCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex flex-col gap-4 h-full">
                      {/* Course Image */}
                      <div className="relative w-full h-40 flex-shrink-0">
                        <ImageWithFallback
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0 flex-1">
                              <span className="text-xs text-blue-600 font-semibold">{course.category}</span>
                              <h3 className="font-bold mt-0.5 line-clamp-1">{course.title}</h3>
                            </div>
                            {course.progress === 100 && (
                              <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                Concluído
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-2 line-clamp-1">{course.description}</p>

                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{course.completedLessons}/{course.lessons} aulas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{course.duration}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Progresso do Curso</span>
                              <span className="text-blue-600 font-bold">{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <Button
                            onClick={() => onWatchCourse(course)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {course.progress === 0 ? "Começar Curso" : "Continuar Assistindo"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {podcasts.length > 0 && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Meus Podcasts</h2>
              <p className="text-gray-600">Assista seus podcasts gratuitos</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast) => (
                <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex flex-col gap-4 h-full">
                      {/* Podcast Image */}
                      <div className="relative w-full h-40 flex-shrink-0">
                        {podcast.image ? (
                          <img
                            src={podcast.image}
                            alt={podcast.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Headphones className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Podcast Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1 line-clamp-2">{podcast.title}</h3>
                          {podcast.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                            {podcast.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{podcast.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Button
                            onClick={() => onWatchPodcast?.(podcast)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Assistir Podcast
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
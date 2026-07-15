import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ImageCarousel } from "./ImageCarousel";
import { apiClient } from "../../services/apiClient";
import { useHomeContent } from "../../hooks/useHomeContent";

interface HomeHeroProps {
  onExplore: () => void;
  onGoToPodcasts?: () => void;
}

export function HomeHero({ onExplore, onGoToPodcasts }: HomeHeroProps) {
  const { content } = useHomeContent();
  const [autoCourses, setAutoCourses] = useState("0");
  const [autoHours, setAutoHours] = useState("0h+");
  const [autoRating, setAutoRating] = useState("0/5");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsResponse = await apiClient.getPublicStats();
        if (statsResponse) {
          setAutoCourses(String(statsResponse.totalCourses));
          setAutoHours(`${statsResponse.totalHours}h+`);
          setAutoRating(`${statsResponse.averageRating}/5`);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    loadStats();
  }, []);

  const heroContent = content?.hero || {
    badge: "🧠 Plataforma de Cursos de Psicologia",
    title: "Transforme Sua Vida com Psicologia Aplicada",
    subtitle: "Descubra cursos criados por especialistas em psicologia para te ajudar a desenvolver inteligência emocional, relacionamentos saudáveis e bem-estar mental.",
    primaryButton: { text: "Explorar Cursos", action: "explore" },
    secondaryButton: { text: "Podcasts", action: "podcasts" },
    showStats: true,
    statsMode: "auto" as const,
    stats: {
      courses: "",
      students: "50.000+",
      rating: "",
      hours: "",
    },
  };

  const manual = heroContent.statsMode === "manual";
  const stats = {
    courses: manual && heroContent.stats?.courses?.trim()
      ? heroContent.stats.courses.trim()
      : autoCourses,
    students: heroContent.stats?.students?.trim() || "50.000+",
    rating: manual && heroContent.stats?.rating?.trim()
      ? heroContent.stats.rating.trim()
      : autoRating,
    hours: manual && heroContent.stats?.hours?.trim()
      ? heroContent.stats.hours.trim()
      : autoHours,
  };

  return (
    <section
      className="relative text-white overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="relative container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 xl:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="inline-block px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 bg-white/20 backdrop-blur-sm rounded-full mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap">{heroContent.badge}</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              {heroContent.title}
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl">
              {heroContent.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => {
                  if (heroContent.primaryButton.action === "explore") {
                    onExplore();
                  }
                }}
                className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2 group text-xs sm:text-sm md:text-base">
                {heroContent.primaryButton.text}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (heroContent.secondaryButton.action === "podcasts" && onGoToPodcasts) {
                    onGoToPodcasts();
                  }
                }}
                className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all text-xs sm:text-sm md:text-base">
                {heroContent.secondaryButton.text}
              </Button>
            </div>

            {heroContent.showStats !== false && (
            <div className="pt-6 sm:pt-8 md:pt-12">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:hidden">
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{stats.courses}</div>
                  <div className="text-[9px] sm:text-[10px] leading-tight px-0.5 sm:px-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cursos Especializados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{stats.students}</div>
                  <div className="text-[9px] sm:text-[10px] leading-tight px-0.5 sm:px-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Alunos Transformados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{stats.rating}</div>
                  <div className="text-[9px] sm:text-[10px] leading-tight px-0.5 sm:px-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Avaliação Média</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{stats.hours}</div>
                  <div className="text-[9px] sm:text-[10px] leading-tight px-0.5 sm:px-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>de Conteúdo</div>
                </div>
              </div>

              <div className="hidden md:flex md:flex-wrap md:items-center md:justify-start gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-6">
                <div className="text-center min-w-[75px] md:min-w-[85px] lg:min-w-[95px] xl:min-w-[105px] 2xl:min-w-[120px]">
                  <div className="font-bold text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl mb-0.5 md:mb-1">{stats.courses}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm leading-tight" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cursos Especializados</div>
                </div>
                <div className="w-px h-6 md:h-7 lg:h-8 xl:h-10 2xl:h-12 bg-white/30"></div>
                <div className="text-center min-w-[75px] md:min-w-[85px] lg:min-w-[95px] xl:min-w-[105px] 2xl:min-w-[120px]">
                  <div className="font-bold text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl mb-0.5 md:mb-1">{stats.students}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm leading-tight" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Alunos Transformados</div>
                </div>
                <div className="w-px h-6 md:h-7 lg:h-8 xl:h-10 2xl:h-12 bg-white/30"></div>
                <div className="text-center min-w-[75px] md:min-w-[85px] lg:min-w-[95px] xl:min-w-[105px] 2xl:min-w-[120px]">
                  <div className="font-bold text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl mb-0.5 md:mb-1">{stats.rating}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm leading-tight" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Avaliação Média</div>
                </div>
                <div className="w-px h-6 md:h-7 lg:h-8 xl:h-10 2xl:h-12 bg-white/30"></div>
                <div className="text-center min-w-[75px] md:min-w-[85px] lg:min-w-[95px] xl:min-w-[105px] 2xl:min-w-[120px]">
                  <div className="font-bold text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl mb-0.5 md:mb-1">{stats.hours}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm leading-tight" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>de Conteúdo</div>
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="hidden xl:block">
            <div className="relative h-[400px] xl:h-[500px]">
              <div className="absolute inset-0 blur-3xl" style={{ background: `linear-gradient(to top right, var(--theme-primary-light), var(--theme-secondary))`, opacity: 0.3 }}></div>
              <div className="relative h-full shadow-2xl">
                <ImageCarousel images={content?.carousel} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

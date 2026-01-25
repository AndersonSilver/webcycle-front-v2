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
  const [totalCourses, setTotalCourses] = useState(6);
  const [totalHours, setTotalHours] = useState("200h+");
  const [averageRating, setAverageRating] = useState("4.9/5");

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Buscar estatísticas públicas do backend
        const statsResponse = await apiClient.getPublicStats();
        if (statsResponse) {
          setTotalCourses(statsResponse.totalCourses);
          setTotalHours(`${statsResponse.totalHours}h+`);
          setAverageRating(`${statsResponse.averageRating}/5`);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        // Manter valores padrão em caso de erro
      }
    };

    loadStats();
  }, []);

  // Valores padrão caso não tenha conteúdo da API
  const heroContent = content?.hero || {
    badge: "🧠 Plataforma de Cursos de Psicologia",
    title: "Transforme Sua Vida com Psicologia Aplicada",
    subtitle: "Descubra cursos criados por especialistas em psicologia para te ajudar a desenvolver inteligência emocional, relacionamentos saudáveis e bem-estar mental.",
    primaryButton: { text: "Explorar Cursos", action: "explore" },
    secondaryButton: { text: "Podcasts", action: "podcasts" },
  };

  return (
    <section
      className="relative text-white overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-primary-light)', opacity: 0.3 }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.3 }}></div>

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4" >
              <span className="text-sm font-semibold">{heroContent.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {heroContent.title}
            </h1>

            <p className="text-base sm:text-lg lg:text-2xl max-w-3xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {heroContent.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                size="lg"
                onClick={() => {
                  if (heroContent.primaryButton.action === "explore") {
                    onExplore();
                  }
                }}
                className="shadow-2xl text-lg px-10 py-6 hover:scale-105 transition-transform text-white"
                style={{ background: 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 65% / 0.9), hsl(280 70% 60% / 0.9))'}
              >
                {heroContent.primaryButton.text}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (heroContent.secondaryButton.action === "podcasts" && onGoToPodcasts) {
                    onGoToPodcasts();
                  }
                }}
                className="shadow-2xl text-lg px-10 py-6 hover:scale-105 transition-transform text-white"
                style={{ background: 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, hsl(250 75% 65% / 0.9), hsl(280 70% 60% / 0.9))'}
              >
                {heroContent.secondaryButton.text}
              </Button>
            </div>

            {/* Stats - Mobile: Grid 2x2, Desktop: Flex horizontal */}
            <div className="pt-12">
              <div className="grid grid-cols-2 gap-6 sm:hidden">
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{totalCourses}</div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cursos Especializados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">50.000+</div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Alunos Transformados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{averageRating}</div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Avaliação Média</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{totalHours}</div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>de Conteúdo</div>
                </div>
              </div>

              <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-start gap-8 text-sm">
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{totalCourses}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cursos Especializados</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">50.000+</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Alunos Transformados</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{averageRating}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Avaliação Média</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{totalHours}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>de Conteúdo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="hidden lg:block">
            <div className="relative h-[500px]">
              <div className="absolute inset-0 blur-3xl" style={{ background: `linear-gradient(to top right, var(--theme-primary-light), var(--theme-secondary))`, opacity: 0.3 }}></div>
              <div className="relative h-full shadow-2xl">
                <ImageCarousel images={content?.carousel} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white to-transparent"></div> */}
    </section>
  );
}
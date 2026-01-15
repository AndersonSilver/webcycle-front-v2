import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { apiClient } from "../../services/apiClient";

interface HomeHeroProps {
  onExplore: () => void;
  onGoToPodcasts?: () => void;
}

export function HomeHero({ onExplore, onGoToPodcasts }: HomeHeroProps) {
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

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-teal-600 to-blue-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl"></div>
      
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-sm font-semibold">🧠 Plataforma de Cursos de Psicologia</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Transforme Sua Vida com Psicologia Aplicada
            </h1>
            
            <p className="text-base sm:text-lg lg:text-2xl text-blue-100 max-w-3xl">
              Descubra cursos criados por especialistas em psicologia para te ajudar a 
              desenvolver inteligência emocional, relacionamentos saudáveis e bem-estar mental.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={onExplore}
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl text-lg px-8 py-6"
              >
                Explorar Cursos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onGoToPodcasts}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-700 bg-transparent text-lg px-8 py-6"
              >
                Podcasts
              </Button>
            </div>
            
            {/* Stats - Mobile: Grid 2x2, Desktop: Flex horizontal */}
            <div className="pt-12">
              <div className="grid grid-cols-2 gap-6 sm:hidden">
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{totalCourses}</div>
                  <div className="text-blue-200 text-xs">Cursos Especializados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">50.000+</div>
                  <div className="text-blue-200 text-xs">Alunos Transformados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{averageRating}</div>
                  <div className="text-blue-200 text-xs">Avaliação Média</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl mb-1">{totalHours}</div>
                  <div className="text-blue-200 text-xs">de Conteúdo</div>
                </div>
              </div>
              
              <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-start gap-8 text-sm">
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{totalCourses}</div>
                  <div className="text-blue-200">Cursos Especializados</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">50.000+</div>
                  <div className="text-blue-200">Alunos Transformados</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{averageRating}</div>
                  <div className="text-blue-200">Avaliação Média</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="font-bold text-3xl mb-1">{totalHours}</div>
                  <div className="text-blue-200">de Conteúdo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="hidden lg:block">
            <div className="relative h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-teal-500/30 blur-3xl"></div>
              <div className="relative h-full shadow-2xl">
                <ImageCarousel />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
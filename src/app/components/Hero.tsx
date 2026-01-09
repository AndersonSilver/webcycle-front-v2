import { Button } from "./ui/button";
import { CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HeroProps {
  onEnrollClick: () => void;
}

export function Hero({ onEnrollClick }: HeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-pink-600 via-rose-700 to-purple-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm">💕 Curso mais transformador de 2025</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Transforme Seus Relacionamentos com Psicologia Aplicada
            </h1>
            
            <p className="text-xl text-pink-100">
              Aprenda técnicas comprovadas da psicologia para construir relacionamentos saudáveis, 
              melhorar a comunicação e desenvolver inteligência emocional.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-300" />
                <span>Certificado por psicólogos especializados</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-300" />
                <span>Exercícios práticos para aplicar no dia a dia</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-300" />
                <span>Sessões de mentoria em grupo</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={onEnrollClick}
                className="bg-white text-pink-700 hover:bg-pink-50 shadow-xl"
              >
                Começar Minha Transformação - R$ 497
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Aula Gratuita
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="font-bold text-2xl">10.000+</div>
                <div className="text-pink-200 text-sm">Vidas Transformadas</div>
              </div>
              <div>
                <div className="font-bold text-2xl">4.9/5</div>
                <div className="text-pink-200 text-sm">Avaliação</div>
              </div>
              <div>
                <div className="font-bold text-2xl">50h</div>
                <div className="text-pink-200 text-sm">de Conteúdo</div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 blur-3xl"></div>
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1759984782106-4b56d0aa05b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHN0dWRlbnR8ZW58MXx8fHwxNzY3MDAyMTk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Aluno aprendendo online"
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
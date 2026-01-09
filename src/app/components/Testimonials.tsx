import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const testimonials = [
  {
    name: "Ana Silva",
    role: "Casada há 8 anos",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "Este curso salvou meu casamento. Aprendi a me comunicar de verdade e entender as necessidades do meu parceiro. Nossa relação nunca esteve tão forte!",
    rating: 5
  },
  {
    name: "Carlos Mendes",
    role: "Solteiro em busca de autoconhecimento",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "Finalmente entendi meus padrões de comportamento. O curso me ajudou a trabalhar meu amor próprio antes de buscar um relacionamento. Transformador!",
    rating: 5
  },
  {
    name: "Mariana Costa",
    role: "Em relacionamento há 3 anos",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    content: "As técnicas de comunicação não-violenta mudaram completamente a forma como eu e meu namorado resolvemos conflitos. Menos brigas, mais conexão!",
    rating: 5
  },
  {
    name: "Roberto Oliveira",
    role: "Divorciado reconstruindo vida",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    content: "Depois do divórcio, precisava me entender melhor. O curso me deu ferramentas práticas para curar e crescer. Hoje estou em um relacionamento muito mais saudável.",
    rating: 5
  },
  {
    name: "Juliana Santos",
    role: "Noiva planejando casamento",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    content: "Fiz o curso com meu noivo antes do casamento. Foi o melhor investimento! Aprendemos a construir uma base sólida para nosso futuro juntos.",
    rating: 5
  },
  {
    name: "Fernando Lima",
    role: "Terapeuta em formação",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
    content: "Conteúdo de altíssima qualidade com base científica real. Uso as técnicas tanto na minha vida pessoal quanto com meus clientes. Recomendo muito!",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            O Que Nossos Alunos Dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mais de 10.000 alunos satisfeitos já transformaram suas carreiras
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
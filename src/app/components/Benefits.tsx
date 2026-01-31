import { Heart, Users, Brain, MessageCircle, Award, Headphones } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const benefits = [
  {
    icon: Heart,
    title: "Relacionamentos Saudáveis",
    description: "Aprenda a construir e manter relacionamentos equilibrados e felizes"
  },
  {
    icon: MessageCircle,
    title: "Comunicação Efetiva",
    description: "Domine técnicas de comunicação não-violenta e escuta ativa"
  },
  {
    icon: Brain,
    title: "Inteligência Emocional",
    description: "Desenvolva autoconsciência e gestão emocional baseada em ciência"
  },
  {
    icon: Users,
    title: "Resolução de Conflitos",
    description: "Aprenda a lidar com divergências de forma construtiva e empática"
  },
  {
    icon: Award,
    title: "Autoconhecimento Profundo",
    description: "Descubra padrões de comportamento e crenças limitantes"
  },
  {
    icon: Headphones,
    title: "Suporte Especializado",
    description: "Tire dúvidas com psicólogos e terapeutas experientes"
  }
];

export function Benefits() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Por Que Escolher Nosso Curso?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Oferecemos uma experiência completa de aprendizado com tudo que você precisa para ter sucesso
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
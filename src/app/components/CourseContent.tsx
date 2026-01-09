import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { PlayCircle, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "./ui/card";

const modules = [
  {
    title: "Módulo 1: Fundamentos da Psicologia dos Relacionamentos",
    lessons: 12,
    duration: "4h 30min",
    topics: [
      "Introdução à Psicologia do Amor e Apego",
      "Teoria do Apego: Como sua infância influencia seus relacionamentos",
      "Os 4 Pilares de Relacionamentos Saudáveis",
      "Identificando Padrões Tóxicos e Saudáveis"
    ]
  },
  {
    title: "Módulo 2: Comunicação e Inteligência Emocional",
    lessons: 15,
    duration: "6h 15min",
    topics: [
      "Comunicação Não-Violenta (CNV) na Prática",
      "Escuta Ativa e Validação Emocional",
      "Como Expressar Necessidades sem Gerar Conflitos",
      "Gestão de Emoções Difíceis no Relacionamento"
    ]
  },
  {
    title: "Módulo 3: Resolução de Conflitos e Limites",
    lessons: 18,
    duration: "8h 45min",
    topics: [
      "Técnicas Avançadas de Resolução de Conflitos",
      "Estabelecendo Limites Saudáveis",
      "Lidando com Ciúmes e Inseguranças",
      "Reconstruindo Confiança após Crises"
    ]
  },
  {
    title: "Módulo 4: Autoconhecimento e Crescimento Pessoal",
    lessons: 10,
    duration: "5h 20min",
    topics: [
      "Identificando Crenças Limitantes sobre Amor",
      "Amor Próprio e Autoestima",
      "Como Atrair e Manter Relacionamentos Saudáveis",
      "Plano de Ação Personalizado para Sua Transformação"
    ]
  }
];

export function CourseContent() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Conteúdo do Curso
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            4 módulos completos com mais de 50 horas de conteúdo prático
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {modules.map((module, index) => (
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
                            {module.lessons} aulas
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
                      {module.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex items-center gap-3 text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl mb-2">Bônus Exclusivos Inclusos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    E-book "50 Perguntas para Aprofundar Conexão"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Workbook de Exercícios de Autoconhecimento
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Sessões de terapia em grupo (mensais)
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-right">
                <div className="text-sm text-gray-600">Valor adicional</div>
                <div className="font-bold text-3xl text-blue-600">R$ 897</div>
                <div className="text-sm text-green-600 font-semibold">GRÁTIS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
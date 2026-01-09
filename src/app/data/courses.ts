export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  instructor: string;
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  modules: Module[];
  benefits: Benefit[];
  bonuses: string[];
  videoUrl?: string;
  aboutCourse?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
  duration: string;
}

export interface Lesson {
  title: string;
  duration: string;
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export const courses: Course[] = [
  {
    id: "relacionamento-consciente",
    title: "Relacionamento Consciente",
    subtitle: "Transforme Seus Relacionamentos com Psicologia Aplicada",
    description: "Aprenda técnicas comprovadas da psicologia para construir relacionamentos saudáveis, melhorar a comunicação e desenvolver inteligência emocional.",
    price: 497,
    originalPrice: 997,
    category: "Relacionamentos",
    image: "https://images.unsplash.com/photo-1514846528774-8de9d4a07023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBoYXBweSUyMHJlbGF0aW9uc2hpcHxlbnwxfHx8fDE3NjcwMzE3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Dra. Ana Paula Silva",
    duration: "50h",
    lessons: 55,
    students: 10234,
    rating: 4.9,
    modules: [
      {
        title: "Módulo 1: Fundamentos da Psicologia dos Relacionamentos",
        lessons: [
          {
            title: "Introdução à Psicologia do Amor e Apego",
            duration: "30min"
          },
          {
            title: "Teoria do Apego: Como sua infância influencia seus relacionamentos",
            duration: "45min"
          },
          {
            title: "Os 4 Pilares de Relacionamentos Saudáveis",
            duration: "30min"
          },
          {
            title: "Identificando Padrões Tóxicos e Saudáveis",
            duration: "45min"
          }
        ],
        duration: "4h 30min"
      },
      {
        title: "Módulo 2: Comunicação e Inteligência Emocional",
        lessons: [
          {
            title: "Comunicação Não-Violenta (CNV) na Prática",
            duration: "45min"
          },
          {
            title: "Escuta Ativa e Validação Emocional",
            duration: "45min"
          },
          {
            title: "Como Expressar Necessidades sem Gerar Conflitos",
            duration: "45min"
          },
          {
            title: "Gestão de Emoções Difíceis no Relacionamento",
            duration: "45min"
          }
        ],
        duration: "6h 15min"
      },
      {
        title: "Módulo 3: Resolução de Conflitos e Limites",
        lessons: [
          {
            title: "Técnicas Avançadas de Resolução de Conflitos",
            duration: "45min"
          },
          {
            title: "Estabelecendo Limites Saudáveis",
            duration: "45min"
          },
          {
            title: "Lidando com Ciúmes e Inseguranças",
            duration: "45min"
          },
          {
            title: "Reconstruindo Confiança após Crises",
            duration: "45min"
          }
        ],
        duration: "8h 45min"
      },
      {
        title: "Módulo 4: Autoconhecimento e Crescimento Pessoal",
        lessons: [
          {
            title: "Identificando Crenças Limitantes sobre Amor",
            duration: "45min"
          },
          {
            title: "Amor Próprio e Autoestima",
            duration: "45min"
          },
          {
            title: "Como Atrair e Manter Relacionamentos Saudáveis",
            duration: "45min"
          },
          {
            title: "Plano de Ação Personalizado para Sua Transformação",
            duration: "45min"
          }
        ],
        duration: "5h 20min"
      }
    ],
    benefits: [
      {
        icon: "Heart",
        title: "Relacionamentos Saudáveis",
        description: "Aprenda a construir e manter relacionamentos equilibrados e felizes"
      },
      {
        icon: "MessageCircle",
        title: "Comunicação Efetiva",
        description: "Domine técnicas de comunicação não-violenta e escuta ativa"
      },
      {
        icon: "Brain",
        title: "Inteligência Emocional",
        description: "Desenvolva autoconsciência e gestão emocional baseada em ciência"
      }
    ],
    bonuses: [
      "E-book '50 Perguntas para Aprofundar Conexão'",
      "Workbook de Exercícios de Autoconhecimento",
      "Sessões de terapia em grupo (mensais)"
    ]
  },
  {
    id: "ansiedade-controle",
    title: "Dominando a Ansiedade",
    subtitle: "Técnicas Cientificamente Comprovadas para Controlar a Ansiedade",
    description: "Aprenda estratégias práticas baseadas em Terapia Cognitivo-Comportamental (TCC) para gerenciar e superar a ansiedade no dia a dia.",
    price: 397,
    originalPrice: 797,
    category: "Ansiedade",
    image: "https://images.unsplash.com/photo-1610740656260-1ea0463dc670?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbnhpZXR5JTIwc3RyZXNzJTIwcmVsaWVmfGVufDF8fHx8MTc2NzA4NDg1MXww&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Dr. Carlos Mendes",
    duration: "35h",
    lessons: 42,
    students: 8567,
    rating: 4.8,
    modules: [
      {
        title: "Módulo 1: Entendendo a Ansiedade",
        lessons: [
          {
            title: "O que é Ansiedade: Aspectos Biológicos e Psicológicos",
            duration: "45min"
          },
          {
            title: "Diferença entre Ansiedade Normal e Transtorno de Ansiedade",
            duration: "45min"
          },
          {
            title: "Sintomas Físicos e Emocionais da Ansiedade",
            duration: "45min"
          },
          {
            title: "Identificando Seus Gatilhos Pessoais",
            duration: "45min"
          }
        ],
        duration: "3h 20min"
      },
      {
        title: "Módulo 2: Técnicas de TCC",
        lessons: [
          {
            title: "Reestruturação Cognitiva",
            duration: "45min"
          },
          {
            title: "Técnicas de Relaxamento e Respiração",
            duration: "45min"
          },
          {
            title: "Exposição Gradual aos Medos",
            duration: "45min"
          },
          {
            title: "Diário de Pensamentos Automáticos",
            duration: "45min"
          }
        ],
        duration: "5h 10min"
      },
      {
        title: "Módulo 3: Mindfulness e Aceitação",
        lessons: [
          {
            title: "Mindfulness para Ansiedade",
            duration: "45min"
          },
          {
            title: "Terapia de Aceitação e Compromisso (ACT)",
            duration: "45min"
          },
          {
            title: "Meditação Guiada",
            duration: "45min"
          },
          {
            title: "Vivendo no Momento Presente",
            duration: "45min"
          }
        ],
        duration: "4h 30min"
      },
      {
        title: "Módulo 4: Hábitos e Estilo de Vida",
        lessons: [
          {
            title: "Sono e Ansiedade",
            duration: "45min"
          },
          {
            title: "Alimentação e Saúde Mental",
            duration: "45min"
          },
          {
            title: "Exercícios Físicos como Tratamento",
            duration: "45min"
          },
          {
            title: "Construindo uma Rotina Antiansiosa",
            duration: "45min"
          }
        ],
        duration: "3h 40min"
      }
    ],
    benefits: [
      {
        icon: "Heart",
        title: "Controle Emocional",
        description: "Aprenda a gerenciar crises de ansiedade no momento em que acontecem"
      },
      {
        icon: "Brain",
        title: "Técnicas de TCC",
        description: "Domine as principais ferramentas da Terapia Cognitivo-Comportamental"
      },
      {
        icon: "Trophy",
        title: "Vida mais Leve",
        description: "Conquiste mais tranquilidade e bem-estar no seu dia a dia"
      }
    ],
    bonuses: [
      "Audio de Meditação Guiada (30 min)",
      "Planner de Controle de Ansiedade",
      "Guia de Respiração para Crises"
    ]
  },
  {
    id: "autoestima-amor-proprio",
    title: "Autoestima e Amor Próprio",
    subtitle: "Desenvolva uma Relação Saudável com Você Mesmo",
    description: "Descubra como construir autoestima sólida, superar autocrítica e desenvolver autocompaixão através de técnicas validadas pela psicologia.",
    price: 347,
    originalPrice: 697,
    category: "Autoestima",
    image: "https://images.unsplash.com/photo-1620715028079-8a2f262eafec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjBoZWFsdGglMjB3ZWxsbmVzc3xlbnwxfHx8fDE3NjcwODQ4NTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Dra. Juliana Costa",
    duration: "30h",
    lessons: 38,
    students: 12456,
    rating: 4.9,
    modules: [
      {
        title: "Módulo 1: Compreendendo a Autoestima",
        lessons: [
          {
            title: "O que é Autoestima e Por que Importa",
            duration: "45min"
          },
          {
            title: "Origens da Baixa Autoestima",
            duration: "45min"
          },
          {
            title: "Autoestima vs Autoconfiança vs Autoimagem",
            duration: "45min"
          },
          {
            title: "Avaliando Sua Autoestima Atual",
            duration: "45min"
          }
        ],
        duration: "2h 50min"
      },
      {
        title: "Módulo 2: Superando a Autocrítica",
        lessons: [
          {
            title: "Identificando Pensamentos Autocríticos",
            duration: "45min"
          },
          {
            title: "O Crítico Interior: De Onde Vem?",
            duration: "45min"
          },
          {
            title: "Técnicas para Desafiar a Autocrítica",
            duration: "45min"
          },
          {
            title: "Desenvolvendo Autocompaixão",
            duration: "45min"
          }
        ],
        duration: "4h 20min"
      },
      {
        title: "Módulo 3: Construindo Amor Próprio",
        lessons: [
          {
            title: "Práticas Diárias de Amor Próprio",
            duration: "45min"
          },
          {
            title: "Estabelecendo Limites Saudáveis",
            duration: "45min"
          },
          {
            title: "Cuidado Pessoal Integral",
            duration: "45min"
          },
          {
            title: "Celebrando Suas Conquistas",
            duration: "45min"
          }
        ],
        duration: "5h 10min"
      },
      {
        title: "Módulo 4: Mantendo a Autoestima Alta",
        lessons: [
          {
            title: "Lidando com Críticas Externas",
            duration: "45min"
          },
          {
            title: "Afirmações Positivas que Funcionam",
            duration: "45min"
          },
          {
            title: "Redes de Apoio e Relacionamentos",
            duration: "45min"
          },
          {
            title: "Plano de Manutenção Contínua",
            duration: "45min"
          }
        ],
        duration: "3h 30min"
      }
    ],
    benefits: [
      {
        icon: "Heart",
        title: "Amor Próprio Genuíno",
        description: "Desenvolva uma relação amorosa e respeitosa consigo mesmo"
      },
      {
        icon: "Shield",
        title: "Resiliência Emocional",
        description: "Torne-se menos afetado por críticas e rejeição"
      },
      {
        icon: "Star",
        title: "Confiança Interior",
        description: "Conquiste segurança que vem de dentro para fora"
      }
    ],
    bonuses: [
      "Diário de Gratidão e Amor Próprio (PDF)",
      "60 Afirmações Poderosas",
      "Meditação de Autocompaixão"
    ]
  },
  {
    id: "mindfulness-meditacao",
    title: "Mindfulness e Meditação",
    subtitle: "O Caminho para a Paz Interior e Clareza Mental",
    description: "Aprenda técnicas de mindfulness e meditação baseadas em evidências científicas para reduzir estresse, aumentar foco e viver o momento presente.",
    price: 297,
    originalPrice: 597,
    category: "Mindfulness",
    image: "https://images.unsplash.com/photo-1603166868295-4ae2cba14063?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwbWluZGZ1bG5lc3N8ZW58MXx8fHwxNjc3MDcxMTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Prof. Roberto Santos",
    duration: "25h",
    lessons: 32,
    students: 9823,
    rating: 4.8,
    modules: [
      {
        title: "Módulo 1: Introdução ao Mindfulness",
        lessons: [
          {
            title: "O que é Mindfulness?",
            duration: "45min"
          },
          {
            title: "Benefícios Científicos da Prática",
            duration: "45min"
          },
          {
            title: "Mindfulness vs Meditação",
            duration: "45min"
          },
          {
            title: "Começando Sua Jornada",
            duration: "45min"
          }
        ],
        duration: "2h 30min"
      },
      {
        title: "Módulo 2: Práticas de Meditação",
        lessons: [
          {
            title: "Meditação Sentada",
            duration: "45min"
          },
          {
            title: "Body Scan (Varredura Corporal)",
            duration: "45min"
          },
          {
            title: "Meditação Caminhando",
            duration: "45min"
          },
          {
            title: "Meditação para Emoções Difíceis",
            duration: "45min"
          }
        ],
        duration: "4h 10min"
      },
      {
        title: "Módulo 3: Mindfulness no Dia a Dia",
        lessons: [
          {
            title: "Comendo com Atenção Plena",
            duration: "45min"
          },
          {
            title: "Comunicação Consciente",
            duration: "45min"
          },
          {
            title: "Trabalhando com Mindfulness",
            duration: "45min"
          },
          {
            title: "Relacionamentos e Presença",
            duration: "45min"
          }
        ],
        duration: "3h 20min"
      },
      {
        title: "Módulo 4: Aprofundamento e Integração",
        lessons: [
          {
            title: "MBSR: Mindfulness-Based Stress Reduction",
            duration: "45min"
          },
          {
            title: "Superando Obstáculos na Prática",
            duration: "45min"
          },
          {
            title: "Retiros e Práticas Intensivas",
            duration: "45min"
          },
          {
            title: "Integrando Mindfulness à Sua Vida",
            duration: "45min"
          }
        ],
        duration: "2h 40min"
      }
    ],
    benefits: [
      {
        icon: "Brain",
        title: "Clareza Mental",
        description: "Desenvolva foco e concentração para o dia a dia"
      },
      {
        icon: "Heart",
        title: "Redução de Estresse",
        description: "Aprenda a lidar com o estresse de forma eficaz"
      },
      {
        icon: "Sparkles",
        title: "Paz Interior",
        description: "Cultive tranquilidade e equilíbrio emocional"
      }
    ],
    bonuses: [
      "30 Meditações Guiadas em Áudio",
      "Aplicativo de Prática Diária",
      "Caderno de Registro de Práticas"
    ]
  },
  {
    id: "psicologia-infantil",
    title: "Psicologia Infantil para Pais",
    subtitle: "Entenda e Apoie o Desenvolvimento Emocional dos Seus Filhos",
    description: "Aprenda sobre desenvolvimento infantil, educação positiva e como lidar com desafios emocionais e comportamentais das crianças.",
    price: 447,
    originalPrice: 897,
    category: "Família",
    image: "https://images.unsplash.com/photo-1761474257877-47bac32b03b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjB0aGVyYXB5JTIwY2hpbGRyZW58ZW58MXx8fHwxNzY3MDg0ODUyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Dra. Marina Oliveira",
    duration: "40h",
    lessons: 48,
    students: 6734,
    rating: 4.9,
    modules: [
      {
        title: "Módulo 1: Desenvolvimento Infantil",
        lessons: [
          {
            title: "Fases do Desenvolvimento Emocional",
            duration: "45min"
          },
          {
            title: "Desenvolvimento Cognitivo por Idade",
            duration: "45min"
          },
          {
            title: "Apego Seguro e Suas Bases",
            duration: "45min"
          },
          {
            title: "Necessidades Emocionais das Crianças",
            duration: "45min"
          }
        ],
        duration: "4h 20min"
      },
      {
        title: "Módulo 2: Educação Positiva",
        lessons: [
          {
            title: "Disciplina Positiva na Prática",
            duration: "45min"
          },
          {
            title: "Limites com Amor e Respeito",
            duration: "45min"
          },
          {
            title: "Alternativas à Punição",
            duration: "45min"
          },
          {
            title: "Reforço Positivo Efetivo",
            duration: "45min"
          }
        ],
        duration: "5h 40min"
      },
      {
        title: "Módulo 3: Desafios Comportamentais",
        lessons: [
          {
            title: "Birras e Explosões Emocionais",
            duration: "45min"
          },
          {
            title: "Agressividade Infantil",
            duration: "45min"
          },
          {
            title: "Medos e Ansiedade em Crianças",
            duration: "45min"
          },
          {
            title: "Dificuldades Escolares",
            duration: "45min"
          }
        ],
        duration: "4h 50min"
      },
      {
        title: "Módulo 4: Comunicação com Crianças",
        lessons: [
          {
            title: "Escuta Ativa com Crianças",
            duration: "45min"
          },
          {
            title: "Validação Emocional",
            duration: "45min"
          },
          {
            title: "Conversas Difíceis por Idade",
            duration: "45min"
          },
          {
            title: "Fortalecendo o Vínculo Familiar",
            duration: "45min"
          }
        ],
        duration: "3h 30min"
      }
    ],
    benefits: [
      {
        icon: "Heart",
        title: "Conexão Familiar",
        description: "Fortaleça o vínculo com seus filhos através da compreensão"
      },
      {
        icon: "Users",
        title: "Educação Consciente",
        description: "Aprenda técnicas de disciplina positiva e respeitosa"
      },
      {
        icon: "Brain",
        title: "Desenvolvimento Saudável",
        description: "Apoie o crescimento emocional e cognitivo das crianças"
      }
    ],
    bonuses: [
      "Guia de Atividades por Idade",
      "Tabela de Desenvolvimento Infantil",
      "Consultoria em Grupo Mensal"
    ]
  },
  {
    id: "inteligencia-emocional",
    title: "Inteligência Emocional Avançada",
    subtitle: "Domine Suas Emoções e Transforme Sua Vida",
    description: "Desenvolva as 5 competências da inteligência emocional e aprenda a usar suas emoções a seu favor em todas as áreas da vida.",
    price: 547,
    originalPrice: 1097,
    category: "Desenvolvimento Pessoal",
    image: "https://images.unsplash.com/photo-1759984782106-4b56d0aa05b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHN0dWRlbnR8ZW58MXx8fHwxNzY3MDAyMTk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Dr. Fernando Lima",
    duration: "60h",
    lessons: 65,
    students: 15234,
    rating: 4.9,
    modules: [
      {
        title: "Módulo 1: Autoconsciência Emocional",
        lessons: [
          {
            title: "Identificando Emoções em Tempo Real",
            duration: "45min"
          },
          {
            title: "O Vocabulário Emocional",
            duration: "45min"
          },
          {
            title: "Gatilhos e Padrões Emocionais",
            duration: "45min"
          },
          {
            title: "Journaling Emocional",
            duration: "45min"
          }
        ],
        duration: "6h 20min"
      },
      {
        title: "Módulo 2: Autorregulação",
        lessons: [
          {
            title: "Técnicas de Regulação Emocional",
            duration: "45min"
          },
          {
            title: "Lidando com Emoções Intensas",
            duration: "45min"
          },
          {
            title: "Impulso vs Resposta Consciente",
            duration: "45min"
          },
          {
            title: "Resiliência Emocional",
            duration: "45min"
          }
        ],
        duration: "7h 40min"
      },
      {
        title: "Módulo 3: Empatia e Consciência Social",
        lessons: [
          {
            title: "Desenvolvendo Empatia Genuína",
            duration: "45min"
          },
          {
            title: "Leitura de Sinais Não-Verbais",
            duration: "45min"
          },
          {
            title: "Inteligência Social",
            duration: "45min"
          },
          {
            title: "Perspectiva e Compreensão",
            duration: "45min"
          }
        ],
        duration: "6h 50min"
      },
      {
        title: "Módulo 4: Gestão de Relacionamentos",
        lessons: [
          {
            title: "Comunicação Emocionalmente Inteligente",
            duration: "45min"
          },
          {
            title: "Liderança com IE",
            duration: "45min"
          },
          {
            title: "Resolução de Conflitos",
            duration: "45min"
          },
          {
            title: "Influência e Persuasão Ética",
            duration: "45min"
          }
        ],
        duration: "7h 10min"
      }
    ],
    benefits: [
      {
        icon: "Brain",
        title: "Autoconhecimento Profundo",
        description: "Entenda suas emoções e como elas influenciam suas decisões"
      },
      {
        icon: "Users",
        title: "Relacionamentos Melhores",
        description: "Desenvolva empatia e habilidades sociais avançadas"
      },
      {
        icon: "Trophy",
        title: "Sucesso Profissional",
        description: "Use IE para avançar na carreira e liderar com eficácia"
      }
    ],
    bonuses: [
      "Teste Completo de IE",
      "Plano de Desenvolvimento Personalizado",
      "Masterclass com Expert Internacional"
    ]
  }
];

export const categories = [
  "Todos",
  "Relacionamentos",
  "Ansiedade",
  "Autoestima",
  "Mindfulness",
  "Família",
  "Desenvolvimento Pessoal"
];
// Função para inicializar dados de exemplo para testes

export function initializeSampleData() {
  // Verificar se já existe dados
  const existingCoupons = localStorage.getItem("coupons");
  const existingReviews = localStorage.getItem("reviews");
  const existingProgress = localStorage.getItem("studentProgress");

  // Adicionar cupons de exemplo se não existirem
  if (!existingCoupons) {
    const sampleCoupons = [
      {
        id: "coupon-1",
        code: "BEMVINDO2024",
        discount: 20,
        type: "percentage",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
        maxUses: 100,
        currentUses: 12,
        applicableCourses: [],
        active: true,
      },
      {
        id: "coupon-2",
        code: "BLACKFRIDAY",
        discount: 50,
        type: "percentage",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        maxUses: 50,
        currentUses: 45,
        applicableCourses: [],
        active: true,
      },
      {
        id: "coupon-3",
        code: "PRIMEIRACOMPRA",
        discount: 50,
        type: "fixed",
        expiresAt: "",
        maxUses: 999999,
        currentUses: 8,
        applicableCourses: [],
        active: true,
      },
      {
        id: "coupon-4",
        code: "ESTUDANTE2024",
        discount: 15,
        type: "percentage",
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expirado
        maxUses: 200,
        currentUses: 156,
        applicableCourses: [],
        active: false,
      },
    ];
    localStorage.setItem("coupons", JSON.stringify(sampleCoupons));
  }

  // Adicionar avaliações de exemplo se não existirem
  if (!existingReviews) {
    const courses = JSON.parse(localStorage.getItem("adminCourses") || "[]");
    const sampleReviews = [
      {
        id: "review-1",
        courseId: courses[0]?.id || "curso-1",
        courseTitle: courses[0]?.title || "Relacionamentos Saudáveis",
        userId: "maria@email.com",
        userName: "Maria Silva",
        userEmail: "maria@email.com",
        rating: 5,
        comment: "Curso excepcional! Aprendi técnicas que transformaram completamente meu relacionamento. A didática é clara e os exemplos práticos são muito úteis.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        approved: true,
      },
      {
        id: "review-2",
        courseId: courses[1]?.id || "curso-2",
        courseTitle: courses[1]?.title || "Controle da Ansiedade",
        userId: "joao@email.com",
        userName: "João Santos",
        userEmail: "joao@email.com",
        rating: 5,
        comment: "Melhor investimento que já fiz! As técnicas de respiração e mindfulness mudaram minha vida. Recomendo muito!",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        approved: true,
      },
      {
        id: "review-3",
        courseId: courses[0]?.id || "curso-1",
        courseTitle: courses[0]?.title || "Relacionamentos Saudáveis",
        userId: "ana@email.com",
        userName: "Ana Costa",
        userEmail: "ana@email.com",
        rating: 4,
        comment: "Curso muito bom, com conteúdo relevante. Apenas senti falta de mais exemplos práticos em algumas aulas.",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        approved: false,
      },
      {
        id: "review-4",
        courseId: courses[2]?.id || "curso-3",
        courseTitle: courses[2]?.title || "Autoestima",
        userId: "pedro@email.com",
        userName: "Pedro Oliveira",
        userEmail: "pedro@email.com",
        rating: 5,
        comment: "Conteúdo transformador! A cada aula me sinto mais confiante e empoderado. Obrigado!",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        approved: true,
      },
      {
        id: "review-5",
        courseId: courses[1]?.id || "curso-2",
        courseTitle: courses[1]?.title || "Controle da Ansiedade",
        userId: "carla@email.com",
        userName: "Carla Mendes",
        userEmail: "carla@email.com",
        rating: 5,
        comment: "Simplesmente incrível! Já consigo controlar minha ansiedade muito melhor. Vale cada centavo!",
        date: new Date().toISOString(),
        approved: false,
      },
    ];
    localStorage.setItem("reviews", JSON.stringify(sampleReviews));
  }

  // Adicionar progresso dos alunos se não existir
  if (!existingProgress) {
    const courses = JSON.parse(localStorage.getItem("adminCourses") || "[]");
    const sampleProgress = [
      {
        userId: "maria@email.com",
        courseId: courses[0]?.id || "curso-1",
        completedLessons: ["aula-1", "aula-2", "aula-3", "aula-4", "aula-5", "aula-6", "aula-7", "aula-8"],
        lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 80,
      },
      {
        userId: "joao@email.com",
        courseId: courses[1]?.id || "curso-2",
        completedLessons: ["aula-1", "aula-2", "aula-3", "aula-4", "aula-5"],
        lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 50,
      },
      {
        userId: "ana@email.com",
        courseId: courses[0]?.id || "curso-1",
        completedLessons: ["aula-1", "aula-2", "aula-3"],
        lastAccessed: new Date().toISOString(),
        progress: 30,
      },
      {
        userId: "pedro@email.com",
        courseId: courses[2]?.id || "curso-3",
        completedLessons: ["aula-1", "aula-2", "aula-3", "aula-4", "aula-5", "aula-6", "aula-7", "aula-8", "aula-9", "aula-10"],
        lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 100,
      },
      {
        userId: "carla@email.com",
        courseId: courses[1]?.id || "curso-2",
        completedLessons: ["aula-1", "aula-2"],
        lastAccessed: new Date().toISOString(),
        progress: 20,
      },
      {
        userId: "joao@email.com",
        courseId: courses[0]?.id || "curso-1",
        completedLessons: ["aula-1", "aula-2", "aula-3", "aula-4"],
        lastAccessed: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 40,
      },
    ];
    localStorage.setItem("studentProgress", JSON.stringify(sampleProgress));
  }
}

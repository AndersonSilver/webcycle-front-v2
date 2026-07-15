import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export interface HomeContent {
  hero?: {
    badge: string;
    title: string;
    subtitle: string;
    primaryButton: { text: string; action: string };
    secondaryButton: { text: string; action: string };
  };
  carousel?: Array<{
    id: string;
    url: string;
    alt: string;
    order: number;
  }>;
  whyChooseUs?: {
    badge: string;
    title: string;
    subtitle: string;
    cards: Array<{
      icon: string;
      title: string;
      description: string;
      gradientColors: { from: string; to: string };
    }>;
  };
  testimonials?: {
    badge: string;
    title: string;
    subtitle: string;
  };
  newsletter?: {
    title: string;
    subtitle: string;
    features: Array<{ text: string }>;
  };
  cta?: {
    badge: string;
    title: string;
    subtitle: string;
    primaryButton: { text: string; action: string };
    secondaryButton: { text: string; action: string };
    benefitCards: Array<{
      icon: string;
      title: string;
      subtitle: string;
      iconColor: string;
    }>;
  };
  landingBanners?: Array<{
    id: string;
    imageUrl: string;
    alt: string;
    link: string;
    order: number;
  }>;
  branding?: {
    logoUrl: string;
    showBrandName: boolean;
  };
}

const defaultHomeContent: HomeContent = {
  hero: {
    badge: "🧠 Plataforma de Cursos de Psicologia",
    title: "Transforme Sua Vida com Psicologia Aplicada",
    subtitle: "Descubra cursos criados por especialistas em psicologia para te ajudar a desenvolver inteligência emocional, relacionamentos saudáveis e bem-estar mental.",
    primaryButton: { text: "Explorar Cursos", action: "explore" },
    secondaryButton: { text: "Podcasts", action: "podcast" },
  },
  carousel: [],
  whyChooseUs: {
    badge: "Por Que Escolher Nós?",
    title: "Transforme Sua Vida com Conhecimento",
    subtitle: "Somos uma plataforma dedicada a democratizar o conhecimento em psicologia, oferecendo cursos de alta qualidade criados por especialistas renomados.",
    cards: [
      { icon: "Brain", title: "Baseado em Ciência", description: "Todo conteúdo é validado por pesquisas e práticas da psicologia moderna", gradientColors: { from: "blue-500", to: "blue-600" } },
      { icon: "Award", title: "Instrutores Especialistas", description: "Aprenda com psicólogos, terapeutas e professores qualificados", gradientColors: { from: "teal-500", to: "teal-600" } },
      { icon: "TrendingUp", title: "Resultados Comprovados", description: "Mais de 50.000 alunos já transformaram suas vidas com nossos cursos", gradientColors: { from: "purple-500", to: "purple-600" } },
    ],
  },
  testimonials: {
    badge: "Depoimentos",
    title: "O Que Nossos Alunos Dizem",
    subtitle: "Histórias reais de transformação e crescimento pessoal",
  },
  newsletter: {
    title: "Receba Conteúdos Exclusivos",
    subtitle: "Cadastre-se e receba dicas, artigos e novidades sobre psicologia aplicada diretamente no seu e-mail",
    features: [
      { text: "Sem spam" },
      { text: "Conteúdo exclusivo" },
      { text: "Cancelar a qualquer momento" },
    ],
  },
  cta: {
    badge: "🚀 Comece Agora",
    title: "Pronto Para Transformar Sua Vida?",
    subtitle: "Escolha o curso ideal para você e comece hoje mesmo sua jornada de autoconhecimento e crescimento pessoal",
    primaryButton: { text: "Explorar Todos os Cursos", action: "explore" },
    secondaryButton: { text: "Ver Aula Grátis", action: "free-class" },
    benefitCards: [
      { icon: "Heart", title: "Acesso Imediato", subtitle: "Comece agora", iconColor: "text-red-400" },
      { icon: "Shield", title: "Garantia de 7 dias", subtitle: "100% seguro", iconColor: "text-green-400" },
      { icon: "MessageCircle", title: "Suporte Especializado", subtitle: "Sempre que precisar", iconColor: "text-blue-400" },
    ],
  },
  branding: {
    logoUrl: "",
    showBrandName: true,
  },
};

export const HOME_CONTENT_UPDATED_EVENT = 'home-content-updated';

/** Notifica consumidores de useHomeContent para recarregar (ex.: após save no admin). */
export function notifyHomeContentUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(HOME_CONTENT_UPDATED_EVENT));
  }
}

export function useHomeContent() {
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener(HOME_CONTENT_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(HOME_CONTENT_UPDATED_EVENT, onUpdated);
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getHomeContent();
        if (cancelled) return;
        setContent({
          ...defaultHomeContent,
          ...response.content,
          branding: response.content.branding ?? defaultHomeContent.branding,
        });
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erro ao carregar conteúdo da home:', err);
        setError(err.message || 'Erro ao carregar conteúdo');
        setContent(defaultHomeContent);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { content, loading, error, refetch };
}

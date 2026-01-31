import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { HomeHero } from "./components/HomeHero";
import { CourseCatalog } from "./components/CourseCatalog";
import { ProductCatalog } from "./components/ProductCatalog";
import { ProductDetail } from "./components/ProductDetail";
import { PodcastSection } from "./components/PodcastSection";
import { CourseDetail } from "./components/CourseDetail";
import { Checkout } from "./components/Checkout";
import { Login } from "./components/Login";
import { MyCourses } from "./components/MyCourses";
import { MyPurchases } from "./components/MyPurchases";
import { MyProfile } from "./components/MyProfile";
import { CoursePlayer } from "./components/CoursePlayer";
import { PodcastPlayer } from "./components/PodcastPlayer";
import { AdminPanel } from "./components/AdminPanel";
import { Cart } from "./components/Cart";
import { SupportChat } from "./components/SupportChat";
import { ImageLandingPage } from "./components/ImageLandingPage";
import { BackendOffline } from "./components/BackendOffline";
import desenvolvasecastImg from "./components/laminas/desenvolvasecast.png";
import livroImg from "./components/laminas/livro.png";
import manualautoconfiancaImg from "./components/laminas/manualautoconfiança.png";
import mentoriaImg from "./components/laminas/mentoria.png";
import iconImg from "./components/laminas/icon.png";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Menu, X, BookOpen, Mail, Phone, User, LogOut, Settings, Award, TrendingUp, Sparkles, Star, Quote, Send, CheckCircle2, Brain, Heart, Shield, ArrowRight, Loader2, Package } from "lucide-react";
import { Course } from "./data/courses";
import { toast } from "sonner";
import { apiClient } from "../services/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { useHomeContent } from "../hooks/useHomeContent";
import { useTheme } from "../hooks/useTheme";

type View = "home" | "detail" | "checkout" | "my-courses" | "my-purchases" | "my-profile" | "player" | "podcast-player" | "admin" | "newsletter-unsubscribe" | "purchase-success" | "purchase-failure" | "purchase-pending" | "image-landing" | "products" | "product-detail";

interface UserData {
  name: string;
  email: string;
  avatar?: string;
  role?: "student" | "admin";
}

interface PurchasedCourse extends Course {
  progress: number;
  lastWatched?: string;
  completedLessons: number;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Determinar view atual baseado na URL
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/checkout") return "checkout";
    if (path === "/meus-cursos") return "my-courses";
    if (path === "/minhas-compras") return "my-purchases";
    if (path === "/meu-perfil") return "my-profile";
    if (path === "/admin") return "admin";
    if (path === "/produtos") return "products";
    if (path.startsWith("/produto/")) return "product-detail";
    if (path === "/purchase/success") return "purchase-success";
    if (path === "/purchase/failure") return "purchase-failure";
    if (path === "/purchase/pending") return "purchase-pending";
    if (path.startsWith("/curso/") && path.endsWith("/assistir")) return "player";
    if (path.startsWith("/curso/")) return "detail";
    if (path.startsWith("/podcast/") && path.endsWith("/assistir")) return "podcast-player";
    if (path === "/newsletter/unsubscribe") return "newsletter-unsubscribe";
    if (path === "/landing" || path === "/image-landing") return "image-landing";
    return "home";
  };

  const [currentView, setCurrentView] = useState<View>(getCurrentView());

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [myPodcasts, setMyPodcasts] = useState<any[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Course[]>([]);
  const [cartProducts, setCartProducts] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [publicReviews, setPublicReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    userName: string;
    userInitial: string;
    courseTitle: string;
    createdAt: string;
  }>>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<"loading" | "success" | "error" | null>(null);
  const [footerCourses, setFooterCourses] = useState<Course[]>([]);
  const [footerProducts, setFooterProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [backendOffline, setBackendOffline] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const userDataLoadingRef = useRef(false); // Flag para evitar múltiplas chamadas simultâneas
  const { content: homeContent } = useHomeContent();
  useTheme(); // Carregar e aplicar tema dinâmico (aplica CSS variables automaticamente)

  // Escutar atualizações do carrinho de produtos
  useEffect(() => {
    const handleCartUpdate = () => {
      try {
        const cartProductsData = JSON.parse(localStorage.getItem('CART_PRODUCTS') || '[]');
        setCartProducts(cartProductsData);
      } catch (error) {
        console.error("Erro ao carregar produtos do carrinho:", error);
      }
    };

    // Carregar produtos do carrinho na montagem
    handleCartUpdate();

    // Escutar evento de atualização
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Verificar se o backend está online
  useEffect(() => {
    // @ts-ignore - Vite environment variables
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // O endpoint /health está na raiz, não em /api
    const BASE_URL = API_BASE_URL.replace('/api', '');

    const checkBackendHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos

        const response = await fetch(`${BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setBackendOffline(false);
        } else {
          setBackendOffline(true);
        }
      } catch (error: any) {
        // Erro de rede - backend está offline
        if (error.name !== 'AbortError') {
          setBackendOffline(true);
        }
      }
    };

    // Verificar imediatamente
    checkBackendHealth();

    // Verificar a cada 5 segundos
    const interval = setInterval(checkBackendHealth, 5000);

    return () => clearInterval(interval);
  }, []);

  // Helper function para renderizar ícones dinamicamente
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Brain,
      Award,
      TrendingUp,
      Heart,
      Shield,
      Star,
      Sparkles,
      CheckCircle2,
      Send,
      ArrowRight,
    };
    return iconMap[iconName] || Brain; // Default para Brain se não encontrar
  };

  // Atualizar view quando a URL mudar
  useEffect(() => {
    const newView = getCurrentView();
    console.log('🔄 useEffect - Rota mudou:', location.pathname, '-> View:', newView);
    setCurrentView(newView);

    // Carregar curso se necessário
    if ((newView === "detail" || newView === "player") && params.id) {
      loadCourseById(params.id);
    }

    // Processar descadastro da newsletter
    if (newView === "newsletter-unsubscribe") {
      const urlParams = new URLSearchParams(location.search);
      const email = urlParams.get('email');
      // token está no link mas não é necessário para o descadastro

      if (email && !unsubscribeStatus) {
        setUnsubscribeStatus("loading");
        apiClient.unsubscribeNewsletter(email)
          .then(() => {
            setUnsubscribeStatus("success");
            toast.success("Descadastro realizado com sucesso!");
          })
          .catch((error: any) => {
            console.error("Erro ao descadastrar:", error);
            setUnsubscribeStatus("error");
            toast.error(error.message || "Erro ao realizar descadastro");
          });
      } else if (!email) {
        setUnsubscribeStatus("error");
      }
    }
  }, [location.pathname, params.id]); // Removido location.search para evitar loops infinitos

  // Verificar retorno do Mercado Pago (Checkout Pro)
  // Suporta tanto query params quanto rotas específicas
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const prefId = urlParams.get('pref_id') || urlParams.get('preference_id');
    const paymentId = urlParams.get('payment_id');

    // Verificar se está em uma rota de retorno do pagamento
    const isPurchaseRoute = location.pathname.startsWith('/purchase/');

    // Se está em rota de purchase, extrair status da rota
    let finalPaymentStatus = paymentStatus;
    if (isPurchaseRoute && !paymentStatus) {
      if (location.pathname === '/purchase/success') {
        finalPaymentStatus = 'success';
      } else if (location.pathname === '/purchase/failure') {
        finalPaymentStatus = 'failure';
      } else if (location.pathname === '/purchase/pending') {
        finalPaymentStatus = 'pending';
      }
    }

    if (finalPaymentStatus && (prefId || paymentId || isPurchaseRoute)) {
      console.log('🔔 Retorno do Mercado Pago:', {
        paymentStatus: finalPaymentStatus,
        prefId,
        paymentId,
        route: location.pathname
      });

      // Remover parâmetros da URL se existirem
      if (paymentStatus) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (finalPaymentStatus === 'success' || finalPaymentStatus === 'approved') {
        // Buscar compras do usuário para verificar o tipo de compra mais recente
        apiClient.getMyPurchases()
          .then(response => {
            const purchases = response.purchases || [];
            // Encontrar a compra mais recente que corresponde ao paymentId ou prefId
            const matchingPurchase = purchases.find((p: any) =>
              p.paymentId === paymentId || p.paymentId === prefId
            ) || purchases[0]; // Se não encontrar, usar a mais recente

            if (matchingPurchase) {
              const hasCourses = matchingPurchase.courses && matchingPurchase.courses.length > 0;
              const hasProducts = matchingPurchase.products && matchingPurchase.products.length > 0;

              let redirectPath = "/meus-cursos";
              let redirectMessage = "Redirecionando para seus cursos...";

              if (hasCourses && !hasProducts) {
                redirectPath = "/meus-cursos";
                redirectMessage = "Redirecionando para seus cursos...";
              } else if (hasProducts && !hasCourses) {
                redirectPath = "/minhas-compras";
                redirectMessage = "Redirecionando para suas compras...";
              } else if (hasCourses && hasProducts) {
                redirectPath = "/meus-cursos";
                redirectMessage = "Redirecionando para seus cursos...";
              }

              toast.success("Pagamento aprovado!", {
                description: redirectMessage,
              });

              // Recarregar cursos comprados
              handlePurchaseComplete();

              setTimeout(() => {
                navigate(redirectPath);
              }, 2000);
            } else {
              // Fallback: redirecionar para meus-cursos
              toast.success("Pagamento aprovado!", {
                description: "Redirecionando...",
              });
              handlePurchaseComplete();
              setTimeout(() => {
                navigate("/meus-cursos");
              }, 2000);
            }
          })
          .catch(() => {
            // Em caso de erro, redirecionar para meus-cursos por padrão
            toast.success("Pagamento aprovado!", {
              description: "Redirecionando...",
            });
            handlePurchaseComplete();
            setTimeout(() => {
              navigate("/meus-cursos");
            }, 2000);
          });
      } else if (finalPaymentStatus === 'failure' || finalPaymentStatus === 'rejected') {
        toast.error("Pagamento não aprovado", {
          description: "Tente novamente ou escolha outra forma de pagamento.",
        });
        // Redirecionar para home após 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else if (finalPaymentStatus === 'pending') {
        // Para pending, também verificar o tipo de compra
        apiClient.getMyPurchases()
          .then(response => {
            const purchases = response.purchases || [];
            const matchingPurchase = purchases.find((p: any) =>
              p.paymentId === paymentId || p.paymentId === prefId
            ) || purchases[0];

            let redirectPath = "/meus-cursos";
            if (matchingPurchase) {
              const hasCourses = matchingPurchase.courses && matchingPurchase.courses.length > 0;
              const hasProducts = matchingPurchase.products && matchingPurchase.products.length > 0;

              if (hasProducts && !hasCourses) {
                redirectPath = "/minhas-compras";
              }
            }

            toast.info("Pagamento pendente", {
              description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
            });

            setTimeout(() => {
              navigate(redirectPath);
            }, 2000);
          })
          .catch(() => {
            toast.info("Pagamento pendente", {
              description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
            });
            setTimeout(() => {
              navigate("/meus-cursos");
            }, 2000);
          });
      }
    }
  }, [navigate, location.pathname]);

  // Verificar token na URL (callback do Google OAuth)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenFromHash = hashParams.get('token');
    const finalToken = token || tokenFromHash;

    if (finalToken) {
      // Token recebido do callback do Google OAuth
      // Salvar token na SESSION IMEDIATAMENTE
      const session = JSON.parse(localStorage.getItem('SESSION') || '{}');
      session.token = finalToken;
      localStorage.setItem('SESSION', JSON.stringify(session));

      // Remover token da URL imediatamente (sem navegar ainda)
      const cleanPath = location.pathname === '/auth/callback' ? '/' : location.pathname;
      window.history.replaceState({}, document.title, cleanPath);

      // Carregar dados do usuário
      const loadUserFromToken = async () => {
        try {
          const userResponse = await apiClient.getCurrentUser();

          if (userResponse?.user) {
            const userData = {
              name: userResponse.user.name || "",
              email: userResponse.user.email || "",
              avatar: userResponse.user.avatar || userResponse.user.picture || undefined,
              role: userResponse.user.role || "student",
            };
            // Salvar usuário na SESSION
            const updatedSession = JSON.parse(localStorage.getItem('SESSION') || '{}');
            updatedSession.user = userData;
            localStorage.setItem('SESSION', JSON.stringify(updatedSession));
            setUser(userData);
            toast.success("Login realizado com sucesso!");

            // Navegar para home após salvar usuário
            navigate('/');
            window.scrollTo(0, 0);

            // Carregar dados adicionais
            try {
              const cartResponse = await apiClient.getCart();
              if (cartResponse?.items) {
                setCartItems(cartResponse.items.map((item: any) => item.course).filter(Boolean));
              }
            } catch (cartError) {
              console.log("Carrinho vazio ou erro ao carregar:", cartError);
            }

            try {
              const myCoursesResponse = await apiClient.getMyCourses();
              if (myCoursesResponse?.courses) {
                // Mapear cursos e remover duplicatas usando Map
                const coursesMap = new Map<string, PurchasedCourse>();
                myCoursesResponse.courses.forEach((item: any) => {
                  if (item.course && item.course.id) {
                    // Se o curso já existe, manter o que tem maior progresso
                    const existing = coursesMap.get(item.course.id);
                    if (!existing || (item.progress || 0) > (existing.progress || 0)) {
                      coursesMap.set(item.course.id, {
                        ...item.course,
                        progress: item.progress || 0,
                        completedLessons: item.completedLessons || 0,
                      });
                    }
                  }
                });
                setPurchasedCourses(Array.from(coursesMap.values()));
              }

              // Carregar podcasts do usuário
              try {
                const myPodcastsResponse = await apiClient.getMyPodcasts();
                setMyPodcasts(myPodcastsResponse?.podcasts || []);
              } catch (podcastsError) {
                console.log("Nenhum podcast adicionado ou erro ao carregar:", podcastsError);
              }
            } catch (coursesError) {
              console.log("Nenhum curso comprado ou erro ao carregar:", coursesError);
            }
          }
        } catch (error: any) {
          console.error("Erro ao carregar dados do usuário após login Google:", error);
          toast.error("Erro ao carregar dados do usuário");

          // Mesmo com erro, navegar para home
          navigate('/');
        }
      };

      loadUserFromToken();
      return;
    }
  }, [navigate, location.pathname, location.search]);

  // Carregar avaliações públicas para depoimentos
  useEffect(() => {
    const loadPublicReviews = async () => {
      try {
        const response = await apiClient.getPublicReviews(6);
        if (response?.reviews) {
          setPublicReviews(response.reviews);
        }
      } catch (error) {
        console.error("Erro ao carregar avaliações públicas:", error);
        // Manter array vazio em caso de erro
      }
    };

    if (currentView === "home") {
      loadPublicReviews();
    }
  }, [currentView]);

  // Carregar cursos para o footer
  useEffect(() => {
    const loadFooterCourses = async () => {
      try {
        const response = await apiClient.getCourses({ page: 1, limit: 10 });
        if (response?.courses) {
          setFooterCourses(response.courses);
        }
      } catch (error) {
        console.error("Erro ao carregar cursos para o footer:", error);
        // Manter array vazio em caso de erro
      }
    };

    loadFooterCourses();
  }, []);

  // Carregar produtos para o footer
  useEffect(() => {
    const loadFooterProducts = async () => {
      try {
        const response = await apiClient.getProducts({ page: 1, limit: 5, active: true });
        if (response?.products) {
          setFooterProducts(response.products.map((p: any) => ({
            id: p.id,
            title: p.title
          })));
        }
      } catch (error) {
        console.error("Erro ao carregar produtos para o footer:", error);
        // Manter array vazio em caso de erro
      }
    };

    loadFooterProducts();
  }, []);

  // Verificar se há usuário logado e carregar dados da API
  useEffect(() => {
    // Evitar múltiplas chamadas simultâneas
    if (userDataLoadingRef.current) {
      return;
    }

    const loadUserData = async () => {
      // Buscar dados da SESSION
      const sessionData = localStorage.getItem('SESSION');
      if (!sessionData) {
        return;
      }

      const session = JSON.parse(sessionData);
      const token = session?.token;
      const savedUser = session?.user;

      // Só tentar carregar dados se houver token
      if (!token) {
        return;
      }

      // Se já tem usuário salvo, usar ele imediatamente (evita piscar)
      if (savedUser && !user) {
        setUser(savedUser);
      }

      // Marcar como carregando
      userDataLoadingRef.current = true;

      try {
        // Carregar dados do usuário da API
        const userResponse = await apiClient.getCurrentUser();
        if (userResponse?.user) {
          const userData = {
            name: userResponse.user.name || "",
            email: userResponse.user.email || "",
            avatar: userResponse.user.avatar || userResponse.user.picture || undefined,
            role: userResponse.user.role || "student",
          };
          // Atualizar SESSION com dados atualizados
          const updatedSession = JSON.parse(localStorage.getItem('SESSION') || '{}');
          updatedSession.user = userData;
          localStorage.setItem('SESSION', JSON.stringify(updatedSession));
          setUser(userData);
        }

        // Carregar carrinho da API
        try {
          const cartResponse = await apiClient.getCart();
          if (cartResponse?.items) {
            setCartItems(cartResponse.items.map((item: any) => item.course).filter(Boolean));
          }
        } catch (cartError: any) {
          // Se for erro 401, limpar sessão e parar
          if (cartError?.status === 401 || cartError?.message?.includes('401') || cartError?.message?.includes('expirada')) {
            localStorage.removeItem('SESSION');
            setUser(null);
            userDataLoadingRef.current = false;
            return;
          }
          // Carrinho pode estar vazio ou não existir ainda
          console.log("Carrinho vazio ou erro ao carregar:", cartError);
        }

        // Carregar cursos comprados da API
        try {
          const myCoursesResponse = await apiClient.getMyCourses();
          if (myCoursesResponse?.courses) {
            // Mapear cursos e remover duplicatas usando Map
            const coursesMap = new Map<string, PurchasedCourse>();
            myCoursesResponse.courses.forEach((item: any) => {
              if (item.course && item.course.id) {
                // Se o curso já existe, manter o que tem maior progresso
                const existing = coursesMap.get(item.course.id);
                if (!existing || (item.progress || 0) > (existing.progress || 0)) {
                  coursesMap.set(item.course.id, {
                    ...item.course,
                    progress: item.progress || 0,
                    completedLessons: item.completedLessons || 0,
                  });
                }
              }
            });
            setPurchasedCourses(Array.from(coursesMap.values()));
          }

          // Carregar podcasts do usuário
          try {
            const myPodcastsResponse = await apiClient.getMyPodcasts();
            setMyPodcasts(myPodcastsResponse?.podcasts || []);
          } catch (podcastsError) {
            console.log("Nenhum podcast adicionado ou erro ao carregar:", podcastsError);
          }
        } catch (coursesError: any) {
          // Se for erro 401, limpar sessão e parar
          if (coursesError?.status === 401 || coursesError?.message?.includes('401') || coursesError?.message?.includes('expirada')) {
            localStorage.removeItem('SESSION');
            setUser(null);
            userDataLoadingRef.current = false;
            return;
          }
          // Usuário pode não ter cursos ainda
          console.log("Nenhum curso comprado ou erro ao carregar:", coursesError);
        }
      } catch (error: any) {
        // Se erro 401, token expirado - limpar sessão
        if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('expirada')) {
          localStorage.removeItem('SESSION');
          setUser(null);
          userDataLoadingRef.current = false;
          return;
        }
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        userDataLoadingRef.current = false;
      }
    };

    loadUserData();
  }, []); // Executar apenas uma vez na montagem

  const loadCourseById = async (courseId: string) => {
    try {
      const response = await apiClient.getCourseById(courseId);
      setSelectedCourse(response.course);
    } catch (error) {
      toast.error("Erro ao carregar detalhes do curso");
      console.error(error);
    }
  };

  const handleViewDetails = async (courseId: string) => {
    navigate(`/curso/${courseId}`);
    window.scrollTo(0, 0);
  };

  const handleEnroll = (course: Course) => {
    // Verificar se o usuário está logado antes de permitir compra
    if (!user) {
      setShowLogin(true);
      setSelectedCourse(course);
      return;
    }

    setSelectedCourse(course);
    navigate("/checkout");
  };

  const handleBackToHome = () => {
    navigate("/");
    setSelectedCourse(null);
    window.scrollTo(0, 0);
  };

  const handleGoToMyCourses = () => {
    navigate("/meus-cursos");
    setSelectedCourse(null);
    window.scrollTo(0, 0);
  };

  const handleGoToPodcasts = () => {
    if (currentView !== "home") {
      navigate("/");
      setTimeout(() => {
        const podcastsSection = document.getElementById("podcasts");
        if (podcastsSection) {
          podcastsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const podcastsSection = document.getElementById("podcasts");
      if (podcastsSection) {
        podcastsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleExplore = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCloseCheckout = () => {
    if (selectedCourse) {
      navigate(`/curso/${selectedCourse.id}`);
    } else {
      navigate("/");
    }
  };

  const handleLoginSuccess = (userData: UserData) => {
    setUser(userData);
    // Se tinha um curso selecionado, ir para checkout
    if (selectedCourse) {
      navigate("/checkout");
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    // Limpar todo o localStorage
    localStorage.clear();
    // Limpar estado do componente
    setUser(null);
    setCartItems([]);
    setPurchasedCourses([]);
    setMyPodcasts([]);
    navigate("/");
    window.scrollTo(0, 0);
    toast.success("Logout realizado com sucesso");
  };

  const handlePurchaseComplete = async () => {
    try {
      // Recarregar cursos comprados da API
      const myCoursesResponse = await apiClient.getMyCourses();
      // Mapear cursos e remover duplicatas usando Map
      const coursesMap = new Map<string, PurchasedCourse>();
      myCoursesResponse.courses.forEach((item: any) => {
        if (item.course && item.course.id) {
          // Se o curso já existe, manter o que tem maior progresso
          const existing = coursesMap.get(item.course.id);
          if (!existing || (item.progress || 0) > (existing.progress || 0)) {
            coursesMap.set(item.course.id, {
              ...item.course,
              progress: item.progress || 0,
              completedLessons: item.completedLessons || 0,
            });
          }
        }
      });
      setPurchasedCourses(Array.from(coursesMap.values()));

      // Carregar podcasts do usuário
      try {
        const myPodcastsResponse = await apiClient.getMyPodcasts();
        setMyPodcasts(myPodcastsResponse?.podcasts || []);
      } catch (podcastsError) {
        console.log("Nenhum podcast adicionado ou erro ao carregar:", podcastsError);
      }

      // Limpar o carrinho após compra
      await apiClient.clearCart();
      setCartItems([]);

      navigate("/meus-cursos");
      window.scrollTo(0, 0);
      toast.success("Compra realizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar compra");
      console.error(error);
    }
  };

  const handleWatchPodcast = (podcast: any) => {
    navigate(`/podcast/${podcast.id}/assistir`);
    window.scrollTo(0, 0);
  };

  const handleWatchCourse = (course: PurchasedCourse) => {
    setSelectedCourse(course);
    navigate(`/curso/${course.id}/assistir`);
    window.scrollTo(0, 0);
  };

  const handleBackToMyCourses = () => {
    navigate("/meus-cursos");
    window.scrollTo(0, 0);
  };

  const handleOpenAdminPanel = () => {
    navigate("/admin");
  };

  // Cart functions
  const handleAddToCart = async (course: Course) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    // Verificar se já está no carrinho
    if (cartItems.find(item => item.id === course.id)) {
      toast.info("Este curso já está no carrinho");
      return;
    }

    // Verificar se já foi comprado
    if (purchasedCourses.find(item => item.id === course.id)) {
      toast.error("Você já possui este curso. Acesse em 'Meus Cursos'.");
      return;
    }

    try {
      await apiClient.addToCart(course.id);
      // Recarregar carrinho da API
      const cartResponse = await apiClient.getCart();
      setCartItems(cartResponse.items.map((item: any) => item.course));
      toast.success(`${course.title} adicionado ao carrinho!`);
    } catch (error: any) {
      // Verificar se é erro de curso já comprado
      if (error?.response?.data?.alreadyOwned || error?.response?.data?.message?.includes('já possui')) {
        toast.error("Você já possui este curso. Acesse em 'Meus Cursos'.");
        return;
      }
      toast.error("Erro ao adicionar curso ao carrinho");
      console.error(error);
    }
  };

  const handleRemoveFromCart = async (courseId: string) => {
    try {
      await apiClient.removeFromCart(courseId);
      // Recarregar carrinho da API
      const cartResponse = await apiClient.getCart();
      setCartItems(cartResponse.items.map((item: any) => item.course));
      toast.success("Curso removido do carrinho");
    } catch (error) {
      toast.error("Erro ao remover curso do carrinho");
      console.error(error);
    }
  };

  const handleCartCheckout = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (cartItems.length === 0 && cartProducts.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    // Navegar para checkout com produtos do carrinho se houver
    navigate("/checkout", {
      state: cartProducts.length > 0 ? {
        products: cartProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      } : undefined
    });
  };

  const handleContinueShopping = () => {
    navigate("/");
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Se o backend estiver offline, mostrar apenas a página de erro
  if (backendOffline) {
    return <BackendOffline />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Header */}
      {currentView !== "image-landing" && (
        <header
          className="fixed top-0 left-0 right-0 backdrop-blur-md z-40 transition-all duration-300 bg-slate-900"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between" style={{ minHeight: '80px', height: '80px' }}>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 transition-all duration-300 hover:scale-105 group"
              >
                <div className="relative">
                  <img src={iconImg} alt="Icon" width={50} height={50} className="object-contain transition-transform duration-300 group-hover:rotate-6" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span
                  className="font-bold text-2xl bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent transition-all duration-300"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.95))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(59, 130, 246, 0.9), rgba(139, 92, 246, 0.9))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.95))';
                  }}
                >
                  Culture Builders
                </span>
              </button>

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-4">
                <Cart
                  items={cartItems}
                  onRemoveItem={handleRemoveFromCart}
                  onCheckout={handleCartCheckout}
                  onContinueShopping={handleContinueShopping}
                  open={isCartOpen}
                  onOpenChange={setIsCartOpen}
                />

                {user ? (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="gap-2 text-white hover:bg-white/10 transition-all duration-300 rounded-lg px-3 py-2"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Avatar className="w-7 h-7 ring-2 ring-white/20 transition-all duration-300 hover:ring-white/40">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-white border border-white/20">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{user.name}</span>
                    </Button>

                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div
                          className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl border py-2 z-20 backdrop-blur-xl transition-all duration-300 bg-slate-900 overflow-hidden"
                          style={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Avatar className="w-9 h-9 ring-2 ring-white/20 transition-all duration-300 hover:ring-white/40">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-white border border-white/20">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate text-white">{user.name}</p>
                              <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigate("/meus-cursos");
                              setUserMenuOpen(false);
                              window.scrollTo(0, 0);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg mx-1 group"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <BookOpen className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            <span className="font-medium">Meus Cursos</span>
                          </button>
                          <button
                            onClick={() => {
                              console.log('🔗 Clicou em Minhas Compras (desktop)');
                              setUserMenuOpen(false);
                              navigate("/minhas-compras");
                              setTimeout(() => {
                                window.scrollTo(0, 0);
                              }, 100);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg mx-1 group"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <Package className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            <span className="font-medium">Minhas Compras</span>
                          </button>
                          <button
                            onClick={() => {
                              navigate("/meu-perfil");
                              setUserMenuOpen(false);
                              window.scrollTo(0, 0);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg mx-1 group"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            <span className="font-medium">Meu Perfil</span>
                          </button>
                          {user.role === "admin" && (
                            <button
                              onClick={() => {
                                handleOpenAdminPanel();
                                setUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg mx-1 group"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <Settings className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                              <span className="font-medium">Painel Admin</span>
                            </button>
                          )}
                          <div className="border-t my-1 mx-2" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                          <button
                            onClick={() => {
                              handleLogout();
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-lg mx-1 group"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.color = 'rgb(248, 113, 113)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.color = 'rgb(251, 146, 60)';
                            }}
                          >
                            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                            <span className="font-medium">Sair</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowLogin(true)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 rounded-lg px-6 font-medium backdrop-blur-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Entrar
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
                ) : (
                  <Menu className="w-6 h-6 transition-transform duration-300" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <nav className="flex flex-col gap-4">
                  {user && (
                    <>
                      <div className="px-2 py-3 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Avatar className="w-11 h-11 ring-2 ring-white/20 transition-all duration-300">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-white border border-white/20">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-white">{user.name}</p>
                          <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/meus-cursos");
                          setMobileMenuOpen(false);
                          window.scrollTo(0, 0);
                        }}
                        className="transition-all duration-200 text-left flex items-center gap-2 text-white hover:bg-white/10 py-2.5 px-3 rounded-lg group"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <BookOpen className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium">Meus Cursos</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/minhas-compras");
                          setMobileMenuOpen(false);
                          window.scrollTo(0, 0);
                        }}
                        className="transition-all duration-200 text-left flex items-center gap-2 text-white hover:bg-white/10 py-2.5 px-3 rounded-lg group"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <Package className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium">Minhas Compras</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/meu-perfil");
                          setMobileMenuOpen(false);
                          window.scrollTo(0, 0);
                        }}
                        className="transition-all duration-200 text-left flex items-center gap-2 text-white hover:bg-white/10 py-2.5 px-3 rounded-lg group"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium">Meu Perfil</span>
                      </button>
                      {user.role === "admin" && (
                        <button
                          onClick={() => {
                            handleOpenAdminPanel();
                            setMobileMenuOpen(false);
                          }}
                          className="transition-all duration-200 text-left flex items-center gap-2 text-white hover:bg-white/10 py-2.5 px-3 rounded-lg group"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <Settings className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                          <span className="font-medium">Painel Admin</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="transition-all duration-200 text-left flex items-center gap-2 text-red-400 hover:bg-red-500/10 py-2.5 px-3 rounded-lg group"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.color = 'rgb(248, 113, 113)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.color = 'rgb(251, 146, 60)';
                        }}
                      >
                        <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium">Sair</span>
                      </button>
                    </>
                  )}

                  {!user && (
                    <Button
                      onClick={() => {
                        setShowLogin(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 rounded-lg font-medium backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Entrar
                    </Button>
                  )}
                </nav>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main style={{ paddingTop: currentView !== "admin" ? '45px' : '0' }}>
        {currentView === "home" && (
          <div
            className="relative"
            style={{
              background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
              minHeight: '100vh'
            }}
          >
            <HomeHero onExplore={handleExplore} onGoToPodcasts={handleGoToPodcasts} />
            <div ref={catalogRef}>
              <CourseCatalog onViewDetails={handleViewDetails} />
            </div>

            {/* Products Section */}
            <div
              className="relative"
              style={{
                background: 'transparent'
              }}
            >
              <ProductCatalog
                onViewDetails={(productId) => navigate(`/produto/${productId}`)}
              />
            </div>

            {/* Podcasts Section */}
            <PodcastSection />

            {/* About Section */}
            {homeContent?.whyChooseUs && (
              <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 relative overflow-hidden">
                {/* Background decorative elements - apenas azul */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 backdrop-blur-sm">
                      {homeContent.whyChooseUs.badge}
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                      {homeContent.whyChooseUs.title}
                    </h2>
                    <p className="text-lg text-slate-300 mb-16 max-w-3xl mx-auto leading-relaxed">
                      {homeContent.whyChooseUs.subtitle}
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                      {homeContent.whyChooseUs.cards.map((card, index) => {
                        const IconComponent = getIconComponent(card.icon);
                        // Mapear cores para classes Tailwind válidas
                        const gradientClasses: { [key: string]: string } = {
                          'blue-500': 'from-blue-500',
                          'blue-600': 'to-blue-600',
                          'teal-500': 'from-teal-500',
                          'teal-600': 'to-teal-600',
                          'purple-500': 'from-purple-500',
                          'purple-600': 'to-purple-600',
                        };
                        const fromClass = gradientClasses[card.gradientColors.from] || 'from-blue-500';
                        const toClass = gradientClasses[card.gradientColors.to] || 'to-blue-600';
                        return (
                          <div 
                            key={index} 
                            className="group p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/10 hover:border-white/20 backdrop-blur-sm" 
                            style={{ backgroundColor: 'rgba(30, 20, 50, 0.6)', animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
                          >
                            <div className={`w-20 h-20 bg-gradient-to-br ${fromClass} ${toClass} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                              <IconComponent className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-white">{card.title}</h3>
                            <p className="leading-relaxed text-slate-300">
                              {card.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Testimonials Section */}
            {homeContent?.testimonials && (
              <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 relative overflow-hidden">
                {/* Background decorative elements - apenas azul */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                  <div className="text-center space-y-6">
                    <div className="text-center mb-16">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 backdrop-blur-sm">
                        🧠 {homeContent.testimonials.badge}
                      </div>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                        {homeContent.testimonials.title}
                      </h2>
                      <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {homeContent.testimonials.subtitle}
                      </p>
                    </div>

                    {publicReviews.length > 0 ? (
                      <div className="grid md:grid-cols-3 gap-8">
                        {publicReviews.slice(0, 3).map((review, index) => {
                          const colors = [
                            { border: "rgba(59, 130, 246, 0.3)", quote: "rgba(59, 130, 246, 0.5)", avatar: "from-blue-400 to-blue-600" },
                            { border: "rgba(20, 184, 166, 0.3)", quote: "rgba(20, 184, 166, 0.5)", avatar: "from-teal-400 to-teal-600" },
                            { border: "rgba(59, 130, 246, 0.3)", quote: "rgba(59, 130, 246, 0.5)", avatar: "from-blue-400 to-blue-600" },
                          ];
                          const colorScheme = colors[index % colors.length];
                          const reviewDate = new Date(review.createdAt);
                          const year = reviewDate.getFullYear();

                          return (
                            <div 
                              key={review.id} 
                              className="p-8 rounded-2xl shadow-lg border backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2" 
                              style={{ backgroundColor: 'rgba(30, 20, 50, 0.6)', borderColor: colorScheme.border, animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
                            >
                              <div className="flex items-center gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-600 text-gray-600'}`}
                                  />
                                ))}
                              </div>
                              <Quote className="w-8 h-8 mb-4" style={{ color: colorScheme.quote }} />
                              <p className="mb-6 leading-relaxed italic text-white/90">
                                "{review.comment}"
                              </p>
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${colorScheme.avatar} rounded-full flex items-center justify-center text-white font-bold`}>
                                  {review.userInitial}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{review.userName}</div>
                                  <div className="text-sm text-white/60">Aluno desde {year}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl shadow-lg border backdrop-blur-sm" style={{ backgroundColor: 'rgba(30, 20, 50, 0.6)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Quote className="w-8 h-8 mb-4" style={{ color: 'rgba(59, 130, 246, 0.5)' }} />
                          <p className="mb-6 leading-relaxed italic text-white/90">
                            "Os cursos mudaram completamente minha forma de lidar com ansiedade.
                            Aprendi técnicas práticas que uso no dia a dia."
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              M
                            </div>
                            <div>
                              <div className="font-semibold text-white">Maria Silva</div>
                              <div className="text-sm text-white/60">Aluna desde 2023</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 rounded-2xl shadow-lg border backdrop-blur-sm" style={{ backgroundColor: 'rgba(30, 20, 50, 0.6)', borderColor: 'rgba(20, 184, 166, 0.3)' }}>
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Quote className="w-8 h-8 mb-4" style={{ color: 'rgba(20, 184, 166, 0.5)' }} />
                          <p className="mb-6 leading-relaxed italic text-white/90">
                            "Conteúdo de altíssima qualidade! Os professores são excepcionais e
                            o material é muito bem estruturado."
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                              J
                            </div>
                            <div>
                              <div className="font-semibold text-white">João Santos</div>
                              <div className="text-sm text-white/60">Aluno desde 2022</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 rounded-2xl shadow-lg border backdrop-blur-sm" style={{ backgroundColor: 'rgba(30, 20, 50, 0.6)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Quote className="w-8 h-8 mb-4" style={{ color: 'rgba(139, 92, 246, 0.5)' }} />
                          <p className="mb-6 leading-relaxed italic text-white/90">
                            "Recomendo para todos que querem desenvolver inteligência emocional.
                            Mudou minha vida pessoal e profissional!"
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              A
                            </div>
                            <div>
                              <div className="font-semibold text-white">Ana Costa</div>
                              <div className="text-sm text-white/60">Aluna desde 2024</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* CTA & Newsletter Section */}
            {(homeContent?.cta || homeContent?.newsletter) && (
              <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>

                <div className="container mx-auto px-4 text-center relative z-10">
                  {/* CTA Section */}
                  {homeContent?.cta && (
                    <div className="max-w-4xl mx-auto mb-20">
                      <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full mb-8">
                        <span className="text-lg font-semibold">{homeContent.cta?.badge}</span>
                      </div>
                      <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                        {homeContent.cta?.title}
                      </h2>
                      <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed">
                        {homeContent.cta?.subtitle}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Button
                          size="lg"
                          onClick={() => {
                            if (homeContent.cta?.primaryButton?.action === "explore") {
                              handleExplore();
                            }
                          }}
                          className="shadow-2xl text-lg px-10 py-6 hover:scale-105 transition-transform text-white"
                          style={{ background: '#9333ea', color: 'white' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#7e22ce';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#9333ea';
                            e.currentTarget.style.color = 'white';
                          }}
                        >
                          {homeContent.cta?.primaryButton?.text}
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {homeContent.cta?.benefitCards?.map((benefit, index) => {
                          const IconComponent = getIconComponent(benefit.icon);
                          // Mapear cores para classes Tailwind válidas
                          const iconColorClasses: { [key: string]: string } = {
                            'red-400': 'text-red-400',
                            'green-400': 'text-green-400',
                            'yellow-400': 'text-yellow-400',
                            'blue-400': 'text-blue-400',
                            'purple-400': 'text-purple-400',
                            'teal-400': 'text-teal-400',
                          };
                          const iconColorClass = iconColorClasses[benefit.iconColor] || 'text-red-400';
                          return (
                            <div key={index} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                              <IconComponent className={`w-6 h-6 ${iconColorClass}`} />
                              <div className="text-left">
                                <div className="font-semibold">{benefit.title}</div>
                                <div className="text-sm text-gray-300">{benefit.subtitle}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Newsletter Section */}
                  {homeContent?.newsletter && (
                    <div className="max-w-3xl mx-auto">
                      {homeContent?.cta && (
                        <div className="border-t border-white/20 pt-20 mt-20">
                        </div>
                      )}
                      <Sparkles className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
                      <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                        {homeContent.newsletter.title}
                      </h2>
                      <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {homeContent.newsletter.subtitle}
                      </p>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!newsletterEmail || newsletterLoading) return;

                          setNewsletterLoading(true);
                          try {
                            await apiClient.subscribeNewsletter(newsletterEmail, user?.name);
                            toast.success("Inscrição realizada com sucesso! Verifique seu email.");
                            setNewsletterEmail("");
                          } catch (error: any) {
                            if (error.message?.includes("já está inscrito")) {
                              toast.info("Este email já está inscrito na newsletter!");
                            } else {
                              toast.error("Erro ao se inscrever. Tente novamente.");
                            }
                          } finally {
                            setNewsletterLoading(false);
                          }
                        }}
                        className="flex flex-col gap-4 max-w-xl mx-auto w-full px-4 sm:px-0"
                      >
                        <div className="relative w-full">
                          <input
                            type="email"
                            placeholder="Seu melhor e-mail"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            required
                            disabled={newsletterLoading}
                            className="w-full px-5 py-4 text-base rounded-xl text-white placeholder-gray-400 bg-white/10 backdrop-blur-sm border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 shadow-lg disabled:opacity-50 transition-all"
                            style={{
                              backgroundColor: 'rgba(30, 20, 50, 0.8)',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              minHeight: '56px',
                              fontSize: '16px', // Previne zoom no iOS
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={newsletterLoading || !newsletterEmail}
                          className="w-full h-14 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          {newsletterLoading ? "Enviando..." : "Inscrever-se"}
                        </Button>
                      </form>

                      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {homeContent.newsletter.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                            <span>{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {currentView === "detail" && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onBack={handleBackToHome}
            onEnroll={handleEnroll}
            onAddToCart={handleAddToCart}
            onGoToMyCourses={handleGoToMyCourses}
          />
        )}

        {currentView === "checkout" && (
          <Checkout
            courses={cartItems.length > 0 ? cartItems : (selectedCourse ? [selectedCourse] : [])}
            onBack={handleCloseCheckout}
          />
        )}

        {currentView === "my-courses" && (
          <MyCourses
            purchasedCourses={purchasedCourses}
            podcasts={myPodcasts}
            onWatchCourse={handleWatchCourse}
            onWatchPodcast={handleWatchPodcast}
            onBack={handleBackToHome}
          />
        )}

        {currentView === "my-purchases" && (
          <>
            {console.log('✅ Renderizando MyPurchases, currentView:', currentView, 'pathname:', location.pathname)}
            <MyPurchases
              onBack={handleBackToHome}
            />
          </>
        )}

        {currentView === "my-profile" && (
          <MyProfile
            onBack={handleBackToHome}
          />
        )}

        {currentView === "products" && (
          <ProductCatalog
            onViewDetails={(productId) => navigate(`/produto/${productId}`)}
          />
        )}

        {currentView === "product-detail" && (
          <ProductDetail />
        )}

        {currentView === "player" && selectedCourse && (
          <CoursePlayer
            course={selectedCourse}
            onBack={handleBackToMyCourses}
            progress={purchasedCourses.find(c => c.id === selectedCourse.id)?.progress}
            completedLessons={purchasedCourses.find(c => c.id === selectedCourse.id)?.completedLessons}
          />
        )}

        {currentView === "podcast-player" && params.id && (
          <PodcastPlayer
            podcastId={params.id}
            onBack={() => navigate("/meus-cursos")}
          />
        )}

        {currentView === "admin" && (
          <AdminPanel onBack={handleBackToHome} />
        )}

        {currentView === "image-landing" && (
          <ImageLandingPage
            images={[
              {
                imageUrl: mentoriaImg,
                alt: "Mentoria",
                link: "https://docs.google.com/forms/d/e/1FAIpQLSeSevLGG9YrdEB998dPOgCWKVBsi1AO202N7MXrBruKpyVrYw/viewform?usp=sharing&ouid=103268253360823373307",
              },
              {
                imageUrl: desenvolvasecastImg,
                alt: "Desenvolva-se Cast",
                link: "https://www.youtube.com/@DesenvolvaseCast",
              },
              {
                imageUrl: livroImg,
                alt: "Livro",
                link: "https://culturebuilders.webcycle.com.br/produto/e015e207-407e-460e-a564-24e7f408f27f",
              },
              {
                imageUrl: manualautoconfiancaImg,
                alt: "Manual de Autoconfiança",
                link: "https://culturebuilders.webcycle.com.br/produto/983c2fd0-7df9-4753-89a7-e95cf85aa7ae",
              },
            ]}
          />
        )}

        {currentView === "purchase-success" && (
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h2>
                <p className="text-gray-600 mb-6">
                  Seu pagamento foi processado com sucesso. Você será redirecionado para seus cursos em instantes.
                </p>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "purchase-failure" && (
          <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Não Aprovado</h2>
                <p className="text-gray-600 mb-6">
                  Não foi possível processar seu pagamento. Tente novamente ou escolha outra forma de pagamento.
                </p>
                <div className="space-y-3">
                  <Button onClick={handleBackToHome} className="w-full">
                    Voltar para a página inicial
                  </Button>
                  <Button onClick={() => navigate("/checkout")} variant="outline" className="w-full">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "purchase-pending" && (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Pendente</h2>
                <p className="text-gray-600 mb-6">
                  Seu pagamento está sendo processado. Você será notificado assim que a confirmação for recebida.
                  Você será redirecionado para seus cursos em instantes.
                </p>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "newsletter-unsubscribe" && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                {unsubscribeStatus === "loading" && (
                  <>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Processando descadastro...</h2>
                    <p className="text-gray-600">Aguarde um momento</p>
                  </>
                )}

                {unsubscribeStatus === "success" && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Descadastro realizado!</h2>
                    <p className="text-gray-600 mb-6">
                      Você foi removido da nossa newsletter com sucesso. Você não receberá mais emails nossos.
                    </p>
                    <Button onClick={handleBackToHome} className="w-full">
                      Voltar para a página inicial
                    </Button>
                  </>
                )}

                {unsubscribeStatus === "error" && (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao descadastrar</h2>
                    <p className="text-gray-600 mb-6">
                      Não foi possível processar seu descadastro. O link pode estar inválido ou expirado.
                    </p>
                    <div className="space-y-3">
                      <Button onClick={handleBackToHome} variant="outline" className="w-full">
                        Voltar para a página inicial
                      </Button>
                      <p className="text-sm text-gray-500">
                        Se o problema persistir, entre em contato conosco através do email de suporte.
                      </p>
                    </div>
                  </>
                )}

                {!unsubscribeStatus && (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h2>
                    <p className="text-gray-600 mb-6">
                      O link de descadastro não contém as informações necessárias.
                    </p>
                    <Button onClick={handleBackToHome} className="w-full">
                      Voltar para a página inicial
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {currentView !== "image-landing" && (
        <footer id="contato" className="bg-slate-900 text-gray-300 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="font-bold text-xl text-white mb-4 flex items-center gap-2">
                  <img src={iconImg} alt="Icon" width={50} height={50} className="object-contain" />
                  <span>Culture Builders</span>
                </div>
                <p className="text-sm">
                  Transformando vidas através do conhecimento em psicologia aplicada.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Cursos</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleBackToHome();
                        setTimeout(() => {
                          catalogRef.current?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Todos os Cursos
                    </a>
                  </li>
                  {footerCourses.map((course) => (
                    <li key={course.id}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewDetails(course.id);
                        }}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        {course.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Produtos Exclusivos</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/produtos");
                        window.scrollTo(0, 0);
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Todos os Produtos
                    </a>
                  </li>
                  {footerProducts.map((product) => (
                    <li key={product.id}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/produto/${product.id}`);
                          window.scrollTo(0, 0);
                        }}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        {product.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Suporte</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="mailto:contato@psicoedu.com" className="hover:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      tiago.bonifacio@culturebuilders.com.br
                    </a>
                  </li>
                  <li>
                    <a href="tel:+5511999999999" className="hover:text-white flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      (11) 9 7984-9146
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              <p>© 2025 Culture Builders. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Login Modal */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Toast Notifications */}
      <Toaster />

      {/* Support Chat */}
      {currentView !== "image-landing" && <SupportChat />}
    </div>
  );
}
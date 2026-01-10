import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { HomeHero } from "./components/HomeHero";
import { CourseCatalog } from "./components/CourseCatalog";
import { PodcastSection } from "./components/PodcastSection";
import { CourseDetail } from "./components/CourseDetail";
import { Checkout } from "./components/Checkout";
import { Login } from "./components/Login";
import { MyCourses } from "./components/MyCourses";
import { CoursePlayer } from "./components/CoursePlayer";
import { PodcastPlayer } from "./components/PodcastPlayer";
import { AdminPanel } from "./components/AdminPanel";
import { Cart } from "./components/Cart";
import { SupportChat } from "./components/SupportChat";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Menu, X, BookOpen, Mail, Phone, User, LogOut, Settings, Award, Users, TrendingUp, Sparkles, Star, Quote, Send, CheckCircle2, Brain, Heart, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Course } from "./data/courses";
import { toast } from "sonner";
import { apiClient } from "../services/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";

type View = "home" | "detail" | "checkout" | "my-courses" | "player" | "podcast-player" | "admin" | "newsletter-unsubscribe" | "purchase-success" | "purchase-failure" | "purchase-pending";

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
    if (path === "/admin") return "admin";
    if (path === "/purchase/success") return "purchase-success";
    if (path === "/purchase/failure") return "purchase-failure";
    if (path === "/purchase/pending") return "purchase-pending";
    if (path.startsWith("/curso/") && path.endsWith("/assistir")) return "player";
    if (path.startsWith("/curso/")) return "detail";
    if (path.startsWith("/podcast/") && path.endsWith("/assistir")) return "podcast-player";
    if (path === "/newsletter/unsubscribe") return "newsletter-unsubscribe";
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
  const catalogRef = useRef<HTMLDivElement>(null);
  const userDataLoadingRef = useRef(false); // Flag para evitar múltiplas chamadas simultâneas

  // Atualizar view quando a URL mudar
  useEffect(() => {
    const newView = getCurrentView();
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
        toast.success("Pagamento aprovado!", {
          description: "Redirecionando para seus cursos...",
        });
        // Recarregar cursos comprados
        handlePurchaseComplete();
        // Redirecionar para meus cursos após 2 segundos
        setTimeout(() => {
          navigate("/meus-cursos");
        }, 2000);
      } else if (finalPaymentStatus === 'failure' || finalPaymentStatus === 'rejected') {
        toast.error("Pagamento não aprovado", {
          description: "Tente novamente ou escolha outra forma de pagamento.",
        });
        // Redirecionar para home após 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else if (finalPaymentStatus === 'pending') {
        toast.info("Pagamento pendente", {
          description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
        });
        // Redirecionar para meus cursos após 2 segundos
        setTimeout(() => {
          navigate("/meus-cursos");
        }, 2000);
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

    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    // Criar um array de cursos para checkout
    // Por enquanto vamos processar todos de uma vez
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    navigate("/");
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/")}
              className="font-bold text-2xl text-blue-600 hover:text-blue-700 transition-colors"
            >
              WebCycle
            </button>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={handleBackToHome}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Cursos
              </button>
              <a href="#sobre" className="text-gray-700 hover:text-blue-600 transition-colors">
                Sobre
              </a>
              <a href="#contato" className="text-gray-700 hover:text-blue-600 transition-colors">
                Contato
              </a>
            </nav>

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
                    className="gap-2"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </Button>
                  
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigate("/meus-cursos");
                            setUserMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          Meus Cursos
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Meu Perfil
                        </button>
                        {user.role === "admin" && (
                          <button
                            onClick={() => {
                              handleOpenAdminPanel();
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Painel Admin
                          </button>
                        )}
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button onClick={() => setShowLogin(true)} variant="outline">
                  Entrar
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    handleBackToHome();
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-700 hover:text-blue-600 transition-colors text-left"
                >
                  Cursos
                </button>
                <a
                  href="#sobre"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sobre
                </a>
                <a
                  href="#contato"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contato
                </a>

                {user && (
                  <>
                    <div className="px-2 py-3 border-b border-gray-200 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/meus-cursos");
                        setMobileMenuOpen(false);
                        window.scrollTo(0, 0);
                      }}
                      className="text-gray-700 hover:text-blue-600 transition-colors text-left flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Meus Cursos
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-700 hover:text-blue-600 transition-colors text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
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
                    className="w-full justify-start"
                  >
                    Entrar
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === "home" && (
          <>
            <HomeHero onExplore={handleExplore} onGoToPodcasts={handleGoToPodcasts} />
            <div ref={catalogRef}>
              <CourseCatalog onViewDetails={handleViewDetails} />
            </div>

            {/* Podcasts Section */}
            <PodcastSection />

            {/* About Section */}
            <section id="sobre" className="py-20 bg-gradient-to-b from-white to-gray-50">
              <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto text-center">
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                    Por Que Escolher Nós?
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Transforme Sua Vida com Conhecimento
                  </h2>
                  <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
                    Somos uma plataforma dedicada a democratizar o conhecimento em psicologia, 
                    oferecendo cursos de alta qualidade criados por especialistas renomados.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-gray-900">Baseado em Ciência</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Todo conteúdo é validado por pesquisas e práticas da psicologia moderna
                      </p>
                    </div>
                    <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-gray-900">Instrutores Especialistas</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Aprenda com psicólogos, terapeutas e professores certificados
                      </p>
                    </div>
                    <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-gray-900">Resultados Comprovados</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Mais de 50.000 alunos já transformaram suas vidas com nossos cursos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold mb-6">
                      Depoimentos
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                      O Que Nossos Alunos Dizem
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Histórias reais de transformação e crescimento pessoal
                    </p>
                  </div>
                  
                  {publicReviews.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8">
                      {publicReviews.slice(0, 3).map((review, index) => {
                        const colors = [
                          { bg: "from-blue-50 to-white", border: "border-blue-100", quote: "text-blue-200", avatar: "from-blue-400 to-blue-600" },
                          { bg: "from-teal-50 to-white", border: "border-teal-100", quote: "text-teal-200", avatar: "from-teal-400 to-teal-600" },
                          { bg: "from-purple-50 to-white", border: "border-purple-100", quote: "text-purple-200", avatar: "from-purple-400 to-purple-600" },
                        ];
                        const colorScheme = colors[index % colors.length];
                        const reviewDate = new Date(review.createdAt);
                        const year = reviewDate.getFullYear();
                        
                        return (
                          <div key={review.id} className={`bg-gradient-to-br ${colorScheme.bg} p-8 rounded-2xl shadow-lg border ${colorScheme.border}`}>
                            <div className="flex items-center gap-1 mb-4">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                                />
                              ))}
                            </div>
                            <Quote className={`w-8 h-8 ${colorScheme.quote} mb-4`} />
                            <p className="text-gray-700 mb-6 leading-relaxed italic">
                              "{review.comment}"
                            </p>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 bg-gradient-to-br ${colorScheme.avatar} rounded-full flex items-center justify-center text-white font-bold`}>
                                {review.userInitial}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{review.userName}</div>
                                <div className="text-sm text-gray-500">Aluno desde {year}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg border border-blue-100">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Quote className="w-8 h-8 text-blue-200 mb-4" />
                        <p className="text-gray-700 mb-6 leading-relaxed italic">
                          "Os cursos mudaram completamente minha forma de lidar com ansiedade. 
                          Aprendi técnicas práticas que uso no dia a dia."
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            M
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Maria Silva</div>
                            <div className="text-sm text-gray-500">Aluna desde 2023</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl shadow-lg border border-teal-100">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Quote className="w-8 h-8 text-teal-200 mb-4" />
                        <p className="text-gray-700 mb-6 leading-relaxed italic">
                          "Conteúdo de altíssima qualidade! Os professores são excepcionais e 
                          o material é muito bem estruturado."
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                            J
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">João Santos</div>
                            <div className="text-sm text-gray-500">Aluno desde 2022</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg border border-purple-100">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Quote className="w-8 h-8 text-purple-200 mb-4" />
                        <p className="text-gray-700 mb-6 leading-relaxed italic">
                          "Recomendo para todos que querem desenvolver inteligência emocional. 
                          Mudou minha vida pessoal e profissional!"
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            A
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Ana Costa</div>
                            <div className="text-sm text-gray-500">Aluna desde 2024</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-teal-600 to-blue-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
                  <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                    Receba Conteúdos Exclusivos
                  </h2>
                  <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                    Cadastre-se e receba dicas, artigos e novidades sobre psicologia aplicada diretamente no seu e-mail
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
                    className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto items-stretch"
                  >
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      disabled={newsletterLoading}
                      className="flex-1 px-6 h-14 rounded-lg text-gray-900 placeholder-gray-500 bg-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 shadow-md text-base disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={newsletterLoading || !newsletterEmail}
                      className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-xl px-8 h-14 whitespace-nowrap font-semibold disabled:opacity-50"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {newsletterLoading ? "Enviando..." : "Inscrever-se"}
                    </Button>
                  </form>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-blue-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                      <span>Sem spam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                      <span>Conteúdo exclusivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                      <span>Cancelar a qualquer momento</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
              
              <div className="container mx-auto px-4 text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                  <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full mb-8">
                    <span className="text-lg font-semibold">🚀 Comece Agora</span>
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                    Pronto Para Transformar Sua Vida?
                  </h2>
                  <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Escolha o curso ideal para você e comece hoje mesmo sua jornada de autoconhecimento e crescimento pessoal
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Button
                      size="lg"
                      onClick={handleExplore}
                      className="bg-white text-blue-700 hover:bg-blue-50 shadow-2xl text-lg px-10 py-6 hover:scale-105 transition-transform"
                    >
                      Explorar Todos os Cursos
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white hover:text-blue-700 bg-transparent text-lg px-10 py-6"
                    >
                      Ver Aula Grátis
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <Heart className="w-6 h-6 text-red-400" />
                      <div className="text-left">
                        <div className="font-semibold">Acesso Imediato</div>
                        <div className="text-sm text-gray-300">Comece agora</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <Shield className="w-6 h-6 text-green-400" />
                      <div className="text-left">
                        <div className="font-semibold">Garantia de 7 dias</div>
                        <div className="text-sm text-gray-300">100% seguro</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <Award className="w-6 h-6 text-yellow-400" />
                      <div className="text-left">
                        <div className="font-semibold">Certificados</div>
                        <div className="text-sm text-gray-300">Reconhecidos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
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
      <footer id="contato" className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-xl text-white mb-4">WebCycle</div>
              <p className="text-sm">
                Transformando vidas através do conhecimento em psicologia aplicada.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Cursos</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={handleBackToHome} className="hover:text-white">Todos os Cursos</button></li>
                <li><a href="#" className="hover:text-white">Relacionamentos</a></li>
                <li><a href="#" className="hover:text-white">Ansiedade</a></li>
                <li><a href="#" className="hover:text-white">Autoestima</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li>
                  <a href="mailto:contato@psicoedu.com" className="hover:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    contato@psicoedu.com
                  </a>
                </li>
                <li>
                  <a href="tel:+5511999999999" className="hover:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    (11) 99999-9999
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Política de Reembolso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2025 WebCycle. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

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
      <SupportChat />
    </div>
  );
}
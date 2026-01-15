import { useState, useEffect, useRef } from "react";
import { Course, Benefit } from "../data/courses";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  BookOpen,
  DollarSign,
  Users,
  Clock,
  Upload,
  ShoppingCart,
  TrendingUp,
  Mail,
  Calendar,
  Ticket,
  Download,
  Star,
  MessageSquare,
  BarChart3,
  Percent,
  Copy,
  Check,
  CheckCircle2,
  Headphones,
  MessageCircle,
  Send,
  AlertCircle,
  Sparkles,
  Ban,
  User,
  Mail as MailIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiClient } from "../../services/apiClient";
import { handleApiError, extractValidationErrors } from "../../utils/errorHandler";
import { Loader2 } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";

interface AdminPanelProps {
  onBack: () => void;
}

interface FormErrors {
  [key: string]: string;
}

interface LessonForm {
  id?: string; // ID da aula se já existe
  title: string;
  duration: string;
  videoUrl?: string;
  videoFile?: string;
}

interface ModuleForm {
  id?: string; // ID do módulo se já existe
  title: string;
  lessons: LessonForm[];
  duration: string;
}

interface Purchase {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  price: number;
  date: string;
  paymentStatus?: string; // Status do pagamento: 'paid', 'pending', 'cancelled', etc.
}

interface User {
  email: string;
  name: string;
  registeredAt: string;
  purchasedCourses: string[];
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  applicableCourses: string[]; // empty array = all courses
  active: boolean;
}

interface Review {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

interface StudentProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  lastAccessed: string;
  progress: number; // 0-100
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentTab, setCurrentTab] = useState<"info" | "content" | "modules">("info");
  const [mainView, setMainView] = useState<"dashboard" | "courses" | "students" | "revenue" | "coupons" | "reviews" | "podcasts" | "newsletter" | "support">("dashboard");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterTotal, setNewsletterTotal] = useState(0);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterCtaText, setNewsletterCtaText] = useState("");
  const [newsletterCtaLink, setNewsletterCtaLink] = useState("");
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [showNewsletterConfirmDialog, setShowNewsletterConfirmDialog] = useState(false);
  const [studentProgress] = useState<StudentProgress[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Support Chat
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportTicketFilter, setSupportTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Socket.io para atualizações em tempo real
  const sessionData = localStorage.getItem('SESSION');
  const token = sessionData ? JSON.parse(sessionData)?.token : null;
  const socket = useSocket(token);
  const [_chartsData, setChartsData] = useState<any>({
    sales: { labels: [], datasets: [] },
    revenue: { labels: [], datasets: [], total: 0 },
    students: { labels: [], datasets: [] },
    paymentMethods: { labels: [], datasets: [], total: 0 },
  });

  // Coupon form
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
  const [couponExpires, setCouponExpires] = useState("");
  const [couponMaxUses, setCouponMaxUses] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [deleteCouponDialogOpen, setDeleteCouponDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Form fields - Informações Básicas
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [lessons, setLessons] = useState("");
  const [students, setStudents] = useState("");
  const [rating, setRating] = useState("5");
  
  // Form fields - Conteúdo
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [aboutCourse, setAboutCourse] = useState("");
  const [supportMaterials, setSupportMaterials] = useState<{ name: string; url: string }[]>([]);
  
  // Form fields - Módulos
  const [modules, setModules] = useState<ModuleForm[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  const [loading, setLoading] = useState(true);

  // Carregar dados da API
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        
        // Carregar dashboard
        try {
          const dashboardData = await apiClient.getAdminDashboard();
          setDashboardData(dashboardData || {});
        } catch (error) {
          console.error("Erro ao carregar dashboard:", error);
          setDashboardData({});
        }

        // Carregar cursos
        try {
          const coursesResponse = await apiClient.getCourses({ page: 1, limit: 100 });
          setCourses(coursesResponse?.courses || []);
        } catch (error) {
          console.error("Erro ao carregar cursos:", error);
          setCourses([]);
        }

        // Carregar compras
        try {
          const purchasesResponse = await apiClient.getAdminPurchases({ page: 1, limit: 100 });
          if (purchasesResponse?.purchases) {
            // Expandir compras: cada curso de uma compra vira um item separado
            const expandedPurchases: any[] = [];
            
            purchasesResponse.purchases.forEach((p: any) => {
              // Converter finalAmount para número
              const finalAmount = typeof p.finalAmount === 'string' 
                ? parseFloat(p.finalAmount.replace(',', '.')) 
                : (typeof p.finalAmount === 'number' ? p.finalAmount : 0);
              
              // Se a compra tem cursos associados
              if (p.courses && p.courses.length > 0) {
                // Criar um item para cada curso da compra
                p.courses.forEach((pc: any) => {
                  expandedPurchases.push({
                    id: p.id,
                    userId: p.userId,
                    userName: p.user?.name || "Usuário",
                    userEmail: p.user?.email || "",
                    courseId: pc.courseId || "",
                    courseTitle: pc.course?.title || "",
                    price: isNaN(finalAmount) ? 0 : finalAmount,
                    date: p.createdAt,
                    paymentStatus: p.paymentStatus,
                  });
                });
              } else {
                // Se não tem cursos, criar um item genérico
                expandedPurchases.push({
                  id: p.id,
                  userId: p.userId,
                  userName: p.user?.name || "Usuário",
                  userEmail: p.user?.email || "",
                  courseId: "",
                  courseTitle: "Curso não encontrado",
                  price: isNaN(finalAmount) ? 0 : finalAmount,
                  date: p.createdAt,
                  paymentStatus: p.paymentStatus,
                });
              }
            });
            
            setPurchases(expandedPurchases);
          }
        } catch (error) {
          console.error("Erro ao carregar compras:", error);
          setPurchases([]);
        }

        // Carregar alunos
        try {
          const studentsResponse = await apiClient.getAdminStudents({ page: 1, limit: 100 });
          if (studentsResponse?.students) {
            setUsers(studentsResponse.students.map((s: any) => ({
              email: s.email || "",
              name: s.name || "",
              registeredAt: s.createdAt || new Date().toISOString(),
              purchasedCourses: [],
            })));
          }
        } catch (error) {
          console.error("Erro ao carregar alunos:", error);
          setUsers([]);
        }

        // Carregar cupons
        try {
          const couponsResponse = await apiClient.getAdminCoupons({ page: 1, limit: 100 });
          setCoupons(couponsResponse?.coupons || []);
        } catch (error) {
          console.error("Erro ao carregar cupons:", error);
          setCoupons([]);
        }

        // Carregar todas as avaliações por padrão
        try {
          const reviewsResponse = await apiClient.getAdminReviews({ page: 1, limit: 100 });
          if (reviewsResponse?.reviews) {
            setReviews(reviewsResponse.reviews.map((r: any) => ({
              id: r.id,
              courseId: r.courseId,
              courseTitle: r.course?.title || "Curso não encontrado",
              userId: r.userId,
              userName: r.user?.name || "Usuário",
              userEmail: r.user?.email || "",
              rating: r.rating,
              comment: r.comment || "",
              date: r.createdAt,
              approved: r.approved,
            })));
          }
        } catch (error) {
          console.error("Erro ao carregar avaliações:", error);
          setReviews([]);
        }

        // Carregar gráficos
        try {
          const salesChart = await apiClient.getAdminSalesChart("30d");
          const revenueChart = await apiClient.getAdminRevenueChart();
          const studentsChart = await apiClient.getAdminStudentsChart("30d");
          const paymentChart = await apiClient.getAdminPaymentMethodsChart();

          setChartsData({
            sales: salesChart || { labels: [], datasets: [] },
            revenue: revenueChart || { labels: [], datasets: [], total: 0 },
            students: studentsChart || { labels: [], datasets: [] },
            paymentMethods: paymentChart || { labels: [], datasets: [], total: 0 },
          });
        } catch (error) {
          console.error("Erro ao carregar gráficos:", error);
          setChartsData({
            sales: { labels: [], datasets: [] },
            revenue: { labels: [], datasets: [], total: 0 },
            students: { labels: [], datasets: [] },
            paymentMethods: { labels: [], datasets: [], total: 0 },
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do admin:", error);
        toast.error("Erro ao carregar dados do painel administrativo");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Carregar podcasts quando a aba for selecionada
  useEffect(() => {
    if (mainView === "podcasts") {
      const loadPodcasts = async () => {
        try {
          const podcastsResponse = await apiClient.getPodcasts({ page: 1, limit: 100 });
          setPodcasts(podcastsResponse?.podcasts || []);
        } catch (error) {
          console.error("Erro ao carregar podcasts:", error);
          setPodcasts([]);
        }
      };
      loadPodcasts();
    }

    // Carregar newsletter quando a aba for selecionada
    if (mainView === "newsletter") {
      const loadNewsletterSubscribers = async () => {
        try {
          const response = await apiClient.getNewsletterSubscribers({ page: 1, limit: 100, active: true });
          if (response?.subscribers) {
            setNewsletterSubscribers(response.subscribers);
            setNewsletterTotal(response.total);
          }
        } catch (error) {
          console.error("Erro ao carregar inscritos da newsletter:", error);
        }
      };
      loadNewsletterSubscribers();
    }
    if (mainView === "support") {
      loadSupportTickets();
    }
  }, [mainView]);

  // Socket.io listeners para atualizações em tempo real do suporte
  useEffect(() => {
    if (!socket || mainView !== "support") return;

    // Escutar novas mensagens
    socket.on('new_message', (data: { ticketId: string; message: any }) => {
      // Se o ticket está selecionado, atualizar mensagens
      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket((prev: any) => {
          if (!prev) return null;
          
          // Verificar se a mensagem já existe para evitar duplicação
          const messageExists = prev.messages?.some((msg: any) => msg.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        });
        // Scroll automático quando recebe nova mensagem
        setTimeout(() => scrollToBottom(), 100);
      }
      
      // Sempre atualizar lista de tickets
      loadSupportTickets();
    });

    // Escutar novos tickets
    socket.on('new_ticket', () => {
      loadSupportTickets();
    });

    // Escutar ticket atribuído
    socket.on('ticket_assigned', (ticket: any) => {
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(ticket);
      }
      loadSupportTickets();
    });

    // Escutar ticket fechado
    socket.on('ticket_closed', (ticket: any) => {
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(ticket);
      }
      loadSupportTickets();
    });

    // Escutar quando mensagens são marcadas como lidas
    socket.on('messages_read', async (data: { ticketId: string }) => {
      console.log(`✅ Evento messages_read recebido para ticket ${data.ticketId}`);
      // Atualizar lista de tickets para remover badge de não lidas
      await loadSupportTickets();
      // Se o ticket está selecionado, recarregar do servidor para garantir dados atualizados
      if (selectedTicket?.id === data.ticketId) {
        try {
          const updatedResponse = await apiClient.getSupportTicket(data.ticketId);
          setSelectedTicket(updatedResponse.ticket);
        } catch (err) {
          console.error("Erro ao recarregar ticket após messages_read:", err);
        }
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('new_ticket');
      socket.off('ticket_assigned');
      socket.off('ticket_closed');
      socket.off('messages_read');
    };
  }, [socket, mainView, selectedTicket]);

  // Scroll automático quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const scrollToBottom = () => {
    // Scroll apenas do container de mensagens, não da página inteira
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const loadSupportTickets = async () => {
    try {
      setSupportLoading(true);
      const response = await apiClient.getAdminSupportTickets();
      setSupportTickets(response.tickets || []);
    } catch (error: any) {
      console.error("Erro ao carregar tickets:", error);
      toast.error(error.message || "Erro ao carregar tickets de suporte");
    } finally {
      setSupportLoading(false);
    }
  };

  const openSupportTicket = async (ticketId: string) => {
    try {
      setSupportLoading(true);
      const response = await apiClient.getSupportTicket(ticketId);
      setSelectedTicket(response.ticket);
      
      // Marcar mensagens como lidas quando o admin abre o ticket
      if (socket) {
        console.log(`📖 Marcando mensagens como lidas para ticket ${ticketId}`);
        socket.emit('mark_read', { ticketId });
        
        // Aguardar um pouco e recarregar tanto o ticket quanto a lista
        setTimeout(async () => {
          try {
            // Recarregar o ticket atualizado
            const updatedResponse = await apiClient.getSupportTicket(ticketId);
            setSelectedTicket(updatedResponse.ticket);
            // Recarregar a lista de tickets para atualizar badges
            await loadSupportTickets();
          } catch (err) {
            console.error("Erro ao recarregar ticket após marcar como lido:", err);
          }
        }, 300);
      }
    } catch (error: any) {
      console.error("Erro ao abrir ticket:", error);
      toast.error(error.message || "Erro ao carregar ticket");
    } finally {
      setSupportLoading(false);
    }
  };

  const sendSupportMessage = async () => {
    if (!supportMessage.trim() || !selectedTicket) return;

    const messageContent = supportMessage.trim();
    setSupportMessage(""); // Limpar campo imediatamente

    try {
      setSupportLoading(true);
      // Enviar via API (o backend já emite via Socket.io)
      await apiClient.sendSupportMessage(selectedTicket.id, {
        content: messageContent,
      });
      
      // Não precisa recarregar manualmente - Socket.io atualizará automaticamente
      // O scroll será feito automaticamente pelo useEffect quando a mensagem chegar
      setTimeout(() => scrollToBottom(), 200);
      toast.success("Mensagem enviada");
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
      // Restaurar mensagem em caso de erro
      setSupportMessage(messageContent);
    } finally {
      setSupportLoading(false);
    }
  };


  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (currentTab === "info") {
      if (!title.trim()) newErrors.title = "Título é obrigatório";
      if (!subtitle.trim()) newErrors.subtitle = "Subtítulo é obrigatório";
      if (!description.trim()) newErrors.description = "Descrição é obrigatória";
      if (!price || parseFloat(price) <= 0) newErrors.price = "Preço deve ser maior que zero";
      if (!category.trim()) newErrors.category = "Categoria é obrigatória";
      if (!image.trim()) {
        newErrors.image = "Imagem é obrigatória. Por favor, faça o upload de uma imagem.";
      } else if (!image.startsWith('http://') && !image.startsWith('https://')) {
        newErrors.image = "A imagem deve ser uma URL válida. Aguarde o upload concluir.";
      }
      if (!instructor.trim()) newErrors.instructor = "Instrutor é obrigatório";
      if (!duration.trim()) newErrors.duration = "Duração é obrigatória";
      if (!lessons || parseInt(lessons) <= 0) newErrors.lessons = "Número de aulas deve ser maior que zero";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Verificar se ainda está fazendo upload
    if (imageUploading) {
      toast.error("Aguarde o upload da imagem concluir antes de salvar.");
      return;
    }

    // Verificar se a imagem foi enviada antes de salvar (apenas ao criar novo curso)
    const hasValidImage = image && image.trim() && (image.startsWith('http://') || image.startsWith('https://'));
    if (!editingCourse && !hasValidImage) {
      toast.error("Por favor, faça o upload da imagem antes de salvar o curso.");
      setCurrentTab("info");
      return;
    }

    // Preparar campo de imagem (só enviar se for URL válida)
    const imageUrl = image && image.trim() && (image.startsWith('http://') || image.startsWith('https://')) 
      ? image.trim() 
      : undefined;

    try {
      // Preparar dados do curso
      const courseData: any = {
        title,
        subtitle,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        category,
        instructor,
        duration,
        // Imagem (só enviar se for URL válida do Azure)
        ...(imageUrl ? { image: imageUrl } : {}),
        // Campos de conteúdo
        videoUrl: videoUrl && videoUrl.trim() && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) ? videoUrl.trim() : undefined,
        aboutCourse: aboutCourse || undefined,
        // Campos numéricos
        lessons: lessons ? parseInt(lessons) : undefined,
        students: students ? parseInt(students) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        // Materiais de apoio (bonuses) - formato: { icon, title, description }
        bonuses: supportMaterials.length > 0 
          ? supportMaterials.map(m => ({
              icon: 'FileText',
              title: m.name || 'Material de Apoio',
              description: m.url || undefined,
            }))
          : undefined,
        // Benefícios (O que você vai aprender) - sempre enviar array, mesmo que vazio
        benefits: benefits || [],
      };

      // Incluir level apenas ao criar novo curso
      // Ao editar, não incluir level se o backend não suportar esse campo na entidade
      if (!editingCourse) {
        // Ao criar novo curso, sempre incluir level
        courseData.level = "iniciante";
      }
      // Se estiver editando, não incluir level no payload para evitar erro do backend
      // se o campo não existir na entidade Course do TypeORM

      if (editingCourse) {
        // Atualizar curso existente
        await apiClient.updateCourse(editingCourse.id, courseData);
        toast.success("Curso atualizado com sucesso!");
        
        // Se há módulos para criar/atualizar
        console.log("📦 Módulos para processar na atualização:", modules);
        if (modules && modules.length > 0) {
          // Buscar módulos existentes do curso
          const existingModulesResponse = await apiClient.getCourseModules(editingCourse.id);
          const existingModules = existingModulesResponse?.modules || [];
          const existingModuleIds = new Set(existingModules.map((m: any) => m.id));
          
          let modulesCreated = 0;
          let modulesUpdated = 0;
          let lessonsCreated = 0;
          let lessonsUpdated = 0;
          let hasErrors = false;
          
          try {
            console.log(`🚀 Iniciando processamento de ${modules.length} módulo(s) na atualização...`);
            for (let i = 0; i < modules.length; i++) {
              const module = modules[i];
              console.log(`📚 Processando módulo ${i + 1}/${modules.length}: "${module.title}"`);
              
              // Validar se o módulo tem título
              if (!module.title || module.title.trim() === "") {
                console.warn(`⚠️ Módulo ${i + 1} não tem título, pulando...`);
                continue;
              }
              
              try {
                let moduleId: string;
                
                // Verificar se o módulo já existe
                if (module.id && existingModuleIds.has(module.id)) {
                  // Atualizar módulo existente
                  console.log(`  🔄 Atualizando módulo existente "${module.title}"...`);
                  await apiClient.updateModule(editingCourse.id, module.id, {
                    title: module.title.trim(),
                    duration: module.duration || "0h",
                    order: i,
                  });
                  moduleId = module.id;
                  modulesUpdated++;
                } else {
                  // Criar novo módulo
                  console.log(`  ➕ Criando novo módulo "${module.title}"...`);
                  const moduleResponse = await apiClient.createModule(editingCourse.id, {
                    title: module.title.trim(),
                    duration: module.duration || "0h",
                    order: i,
                  });
                  
                  if (!moduleResponse?.module?.id) {
                    console.error(`  ❌ Erro ao criar módulo ${i + 1}: resposta inválida`, moduleResponse);
                    toast.error(`Erro ao criar módulo "${module.title}"`);
                    hasErrors = true;
                    continue;
                  }
                  
                  moduleId = moduleResponse.module.id;
                  modulesCreated++;
                }
                
                // Processar aulas do módulo
                console.log(`  📝 Módulo tem ${module.lessons?.length || 0} aula(s) para processar`);
                if (module.lessons && module.lessons.length > 0) {
                  // Buscar aulas existentes do módulo
                  const moduleLessonsResponse = await apiClient.getModuleLessons(moduleId);
                  const existingLessons = moduleLessonsResponse?.lessons || [];
                  const existingLessonIds = new Set(existingLessons.map((l: any) => l.id));
                  
                  for (let j = 0; j < module.lessons.length; j++) {
                    const lesson = module.lessons[j];
                    console.log(`    📖 Processando aula ${j + 1}/${module.lessons.length}: "${lesson.title}"`);
                    
                    // Validar se a aula tem título antes de criar
                    if (!lesson.title || lesson.title.trim() === "") {
                      console.warn(`    ⚠️ Aula ${j + 1} do módulo "${module.title}" não tem título, pulando...`);
                      continue;
                    }
                    
                    // Validar se a aula tem URL do vídeo
                    if (!lesson.videoUrl || lesson.videoUrl.trim() === "") {
                      console.error(`    ❌ Aula "${lesson.title}" não tem URL do vídeo`);
                      toast.error(`Aula "${lesson.title}" do módulo "${module.title}" precisa ter uma URL do vídeo`);
                      hasErrors = true;
                      continue;
                    }
                    
                    try {
                      // Verificar se a aula já existe
                      if (lesson.id && existingLessonIds.has(lesson.id)) {
                        // Atualizar aula existente
                        console.log(`    🔄 Atualizando aula existente "${lesson.title}"...`);
                        await apiClient.updateLesson(moduleId, lesson.id, {
                          title: lesson.title.trim(),
                          duration: lesson.duration || "30min",
                          videoUrl: lesson.videoUrl.trim(),
                          order: j,
                          free: false,
                        });
                        lessonsUpdated++;
                      } else {
                        // Criar nova aula
                        console.log(`    ➕ Criando nova aula "${lesson.title}"...`);
                        await apiClient.createLesson(moduleId, {
                          title: lesson.title.trim(),
                          duration: lesson.duration || "30min",
                          videoUrl: lesson.videoUrl.trim(),
                          order: j,
                          free: false,
                        });
                        lessonsCreated++;
                      }
                    } catch (lessonError: any) {
                      console.error(`    ❌ Erro ao processar aula "${lesson.title}":`, lessonError);
                      toast.error(`Erro ao processar aula "${lesson.title}": ${lessonError?.message || 'Erro desconhecido'}`);
                      hasErrors = true;
                    }
                  }
                  
                  // Deletar aulas que foram removidas
                  const currentLessonIds = new Set(module.lessons.filter(l => l.id).map(l => l.id!));
                  for (const existingLesson of existingLessons) {
                    if (!currentLessonIds.has(existingLesson.id)) {
                      console.log(`    🗑️ Deletando aula removida "${existingLesson.title}"...`);
                      try {
                        await apiClient.deleteLesson(moduleId, existingLesson.id);
                      } catch (deleteError) {
                        console.error(`    ❌ Erro ao deletar aula:`, deleteError);
                      }
                    }
                  }
                } else {
                  console.log(`    ⚠️ Módulo "${module.title}" não tem aulas`);
                }
              } catch (moduleError: any) {
                console.error(`  ❌ Erro ao processar módulo "${module.title}":`, moduleError);
                toast.error(`Erro ao processar módulo "${module.title}": ${moduleError?.message || 'Erro desconhecido'}`);
                hasErrors = true;
              }
            }
            
            // Deletar módulos que foram removidos
            const currentModuleIds = new Set(modules.filter(m => m.id).map(m => m.id!));
            for (const existingModule of existingModules) {
              if (!currentModuleIds.has(existingModule.id)) {
                console.log(`🗑️ Deletando módulo removido "${existingModule.title}"...`);
                try {
                  await apiClient.deleteModule(editingCourse.id, existingModule.id);
                } catch (deleteError) {
                  console.error(`❌ Erro ao deletar módulo:`, deleteError);
                }
              }
            }
            
            console.log(`✅ Processo concluído: ${modulesCreated} criado(s), ${modulesUpdated} atualizado(s), ${lessonsCreated} aula(s) criada(s), ${lessonsUpdated} aula(s) atualizada(s)`);
            if (hasErrors) {
              toast.warning(`Curso atualizado! Mas houve alguns erros no processamento de módulos/aulas.`);
            } else if (modulesCreated > 0 || modulesUpdated > 0 || lessonsCreated > 0 || lessonsUpdated > 0) {
              toast.success(`Curso atualizado! ${modulesCreated + modulesUpdated} módulo(s) e ${lessonsCreated + lessonsUpdated} aula(s) processados.`);
            }
          } catch (error: any) {
            console.error("❌ Erro geral ao processar módulos na atualização:", error);
            toast.error(`Curso atualizado, mas houve erro ao processar módulos: ${error?.message || 'Erro desconhecido'}`);
          }
        }
      } else {
        // Criar novo curso
        const response = await apiClient.createCourse(courseData);
        
        if (!response || !response.course) {
          throw new Error("Resposta inválida da API ao criar curso");
        }
        
        toast.success("Curso criado com sucesso!");
        
        // Se o curso foi criado com sucesso e há módulos, criar módulos
        console.log("📦 Módulos para criar:", modules);
        if (modules && modules.length > 0 && response.course.id) {
          let modulesCreated = 0;
          let lessonsCreated = 0;
          let hasErrors = false;
          
          try {
            console.log(`🚀 Iniciando criação de ${modules.length} módulo(s)...`);
            for (let i = 0; i < modules.length; i++) {
              const module = modules[i];
              console.log(`📚 Processando módulo ${i + 1}/${modules.length}: "${module.title}"`);
              
              // Validar se o módulo tem título
              if (!module.title || module.title.trim() === "") {
                console.warn(`⚠️ Módulo ${i + 1} não tem título, pulando...`);
                continue;
              }
              
              try {
                console.log(`  ➕ Criando módulo "${module.title}"...`);
                const moduleResponse = await apiClient.createModule(response.course.id, {
                  title: module.title.trim(),
                  duration: module.duration || "0h",
                  order: i,
                });
                
                console.log(`  ✅ Módulo criado:`, moduleResponse);
                
                if (!moduleResponse?.module?.id) {
                  console.error(`  ❌ Erro ao criar módulo ${i + 1}: resposta inválida`, moduleResponse);
                  toast.error(`Erro ao criar módulo "${module.title}"`);
                  hasErrors = true;
                  continue;
                }
                
                modulesCreated++;
                
                // Criar aulas do módulo
                console.log(`  📝 Módulo tem ${module.lessons?.length || 0} aula(s) para criar`);
                if (module.lessons && module.lessons.length > 0) {
                  for (let j = 0; j < module.lessons.length; j++) {
                    const lesson = module.lessons[j];
                    console.log(`    📖 Processando aula ${j + 1}/${module.lessons.length}: "${lesson.title}"`);
                    
                    // Validar se a aula tem título antes de criar
                    if (!lesson.title || lesson.title.trim() === "") {
                      console.warn(`    ⚠️ Aula ${j + 1} do módulo "${module.title}" não tem título, pulando...`);
                      continue;
                    }
                    
                    // Validar se a aula tem URL do vídeo
                    if (!lesson.videoUrl || lesson.videoUrl.trim() === "") {
                      console.error(`    ❌ Aula "${lesson.title}" não tem URL do vídeo`);
                      toast.error(`Aula "${lesson.title}" do módulo "${module.title}" precisa ter uma URL do vídeo`);
                      hasErrors = true;
                      continue;
                    }
                    
                    try {
                      console.log(`    ➕ Criando aula "${lesson.title}"...`);
                      const lessonResponse = await apiClient.createLesson(moduleResponse.module.id, {
                        title: lesson.title.trim(),
                        duration: lesson.duration || "30min",
                        videoUrl: lesson.videoUrl.trim(),
                        order: j,
                        free: false,
                      });
                      console.log(`    ✅ Aula criada:`, lessonResponse);
                      lessonsCreated++;
                    } catch (lessonError: any) {
                      console.error(`    ❌ Erro ao criar aula "${lesson.title}":`, lessonError);
                      toast.error(`Erro ao criar aula "${lesson.title}": ${lessonError?.message || 'Erro desconhecido'}`);
                      hasErrors = true;
                    }
                  }
                } else {
                  console.log(`    ⚠️ Módulo "${module.title}" não tem aulas`);
                }
              } catch (moduleError: any) {
                console.error(`  ❌ Erro ao criar módulo "${module.title}":`, moduleError);
                toast.error(`Erro ao criar módulo "${module.title}": ${moduleError?.message || 'Erro desconhecido'}`);
                hasErrors = true;
              }
            }
            
            console.log(`✅ Processo concluído: ${modulesCreated} módulo(s) e ${lessonsCreated} aula(s) criados`);
            if (hasErrors) {
              toast.warning(`Curso criado! ${modulesCreated} módulo(s) e ${lessonsCreated} aula(s) criados, mas houve alguns erros.`);
            } else {
              toast.success(`Curso criado com sucesso! ${modulesCreated} módulo(s) e ${lessonsCreated} aula(s) criados.`);
            }
          } catch (error: any) {
            console.error("❌ Erro geral ao criar módulos:", error);
            toast.error(`Curso criado, mas houve erro ao criar módulos: ${error?.message || 'Erro desconhecido'}`);
          }
        } else {
          if (modules && modules.length === 0) {
            console.warn("⚠️ Nenhum módulo foi adicionado ao curso");
          } else {
            console.warn("⚠️ Não há módulos ou curso não foi criado corretamente");
          }
        }
      }

      // Recarregar cursos da API
      const coursesResponse = await apiClient.getCourses({ page: 1, limit: 100 });
      setCourses(coursesResponse?.courses || []);

      setIsDialogOpen(false);
      setEditingCourse(null);
      resetForm();
    } catch (error: any) {
      // Tratar erros de validação da API
      if (error?.errors && Array.isArray(error.errors)) {
        // Atualizar erros do formulário
        const formErrors = extractValidationErrors(error);
        setErrors(formErrors as FormErrors);
      }
      
      // Exibir mensagens de erro ao usuário
      handleApiError(error, "Erro ao salvar curso");
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSubtitle(course.subtitle);
    setDescription(course.description);
    setPrice(course.price.toString());
    setOriginalPrice(course.originalPrice?.toString() || "");
    setCategory(course.category);
    setImage(course.image);
    setInstructor(course.instructor);
    setDuration(course.duration);
    setLessons(course.lessons.toString());
    setStudents(course.students.toString());
    setRating(course.rating.toString());
    // Carregar campos de conteúdo
    setVideoUrl((course as any).videoUrl || "");
    setAboutCourse((course as any).aboutCourse || "");
    // Carregar materiais de apoio (bonuses) - formato: { icon, title, description }
    setSupportMaterials(
      course.bonuses?.map((bonus: any) => ({
        name: bonus.title || bonus.name || '',
        url: bonus.description || bonus.url || '',
      })) || []
    );
    setModules(course.modules?.map(m => ({
      id: (m as any).id, // Incluir ID do módulo (se existir)
      title: m.title,
      duration: m.duration,
      lessons: m.lessons.map(l => ({
        id: (l as any).id, // Incluir ID da aula (se existir)
        title: l.title,
        duration: l.duration,
        videoUrl: (l as any).videoUrl,
        videoFile: (l as any).videoFile,
      }))
    })) || []);
    const courseBenefits = Array.isArray(course.benefits) ? course.benefits : (course.benefits ? [course.benefits] : []);
    setBenefits(courseBenefits);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este curso?")) {
      try {
        await apiClient.deleteCourse(id);
        toast.success("Curso excluído com sucesso!");
        
        // Recarregar cursos
        const coursesResponse = await apiClient.getCourses({ page: 1, limit: 100 });
        setCourses(coursesResponse.courses);
      } catch (error) {
        toast.error("Erro ao excluir curso");
        console.error(error);
      }
    }
  };

  const handleNewCourse = () => {
    resetForm();
    setEditingCourse(null);
    setIsDialogOpen(true);
  };

  // Função para fazer upload de imagem
  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true);
      console.log('📤 Iniciando upload de imagem:', file.name);
      const result = await apiClient.uploadImage(file);
      console.log('✅ Upload concluído. URL recebida:', result.url);
      
      if (!result.url || !result.url.trim()) {
        throw new Error('URL da imagem não foi retornada pelo servidor');
      }
      
      setImage(result.url);
      setImageFile(null);
      console.log('✅ Estado image atualizado para:', result.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error('❌ Erro no upload de imagem:', error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
      setImageFile(null);
    } finally {
      setImageUploading(false);
    }
  };

  // Função para fazer upload de vídeo
  const handleVideoUpload = async (file: File) => {
    try {
      setVideoUploading(true);
      const result = await apiClient.uploadVideo(file);
      setVideoUrl(result.url);
      setVideoFile(null);
      toast.success("Vídeo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload do vídeo");
    } finally {
      setVideoUploading(false);
    }
  };

  // Função para fazer upload de vídeo de aula
  const handleLessonVideoUpload = async (file: File, moduleIndex: number, lessonIndex: number) => {
    try {
      // Criar um estado temporário para mostrar loading
      const newModules = [...modules];
      newModules[moduleIndex].lessons[lessonIndex].videoUrl = 'uploading...';
      setModules(newModules);
      
      const result = await apiClient.uploadVideo(file);
      newModules[moduleIndex].lessons[lessonIndex].videoUrl = result.url;
      setModules(newModules);
      toast.success("Vídeo da aula enviado com sucesso!");
    } catch (error: any) {
      // Reverter em caso de erro
      const newModules = [...modules];
      newModules[moduleIndex].lessons[lessonIndex].videoUrl = '';
      setModules(newModules);
      toast.error(error.message || "Erro ao fazer upload do vídeo");
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setCategory("");
    setImage("");
    setImageFile(null);
    setImageUploading(false);
    setInstructor("");
    setDuration("");
    setLessons("");
    setStudents("");
    setRating("5");
    setErrors({});
    setVideoUrl("");
    setVideoFile(null);
    setVideoUploading(false);
    setAboutCourse("");
    setSupportMaterials([]);
    setModules([]);
    setBenefits([]);
    setCurrentTab("info");
  };

  // Coupon functions
  const handleSaveCoupon = async () => {
    if (!couponCode.trim() || !couponDiscount || parseFloat(couponDiscount) <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const couponData = {
        code: couponCode.toUpperCase(),
        discount: parseFloat(couponDiscount),
        type: couponType,
        expiresAt: couponExpires || undefined,
        maxUses: couponMaxUses ? parseInt(couponMaxUses) : undefined,
        active: true,
      };

      if (editingCoupon) {
        await apiClient.updateCoupon(editingCoupon.id, couponData);
        toast.success("Cupom atualizado!");
      } else {
        await apiClient.createCoupon(couponData);
        toast.success("Cupom criado com sucesso!");
      }

      // Recarregar cupons
      const couponsResponse = await apiClient.getAdminCoupons({ page: 1, limit: 100 });
      setCoupons(couponsResponse.coupons);

      setIsCouponDialogOpen(false);
      resetCouponForm();
    } catch (error: any) {
      handleApiError(error, "Erro ao salvar cupom");
    }
  };

  const resetCouponForm = () => {
    setCouponCode("");
    setCouponDiscount("");
    setCouponType("percentage");
    setCouponExpires("");
    setCouponMaxUses("");
    setEditingCoupon(null);
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await apiClient.deleteCoupon(id);
      toast.success("Cupom excluído!");
      
      // Recarregar cupons
      const couponsResponse = await apiClient.getAdminCoupons({ page: 1, limit: 100 });
      setCoupons(couponsResponse.coupons);
      setDeleteCouponDialogOpen(false);
      setCouponToDelete(null);
    } catch (error) {
      toast.error("Erro ao excluir cupom");
      console.error(error);
    }
  };

  const openDeleteCouponDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteCouponDialogOpen(true);
  };

  const toggleCouponStatus = async (id: string) => {
    try {
      await apiClient.toggleCoupon(id);
      toast.success("Status atualizado!");
      
      // Recarregar cupons
      const couponsResponse = await apiClient.getAdminCoupons({ page: 1, limit: 100 });
      setCoupons(couponsResponse.coupons);
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Review functions
  const handleApproveReview = async (id: string) => {
    try {
      await apiClient.approveReview(id);
      toast.success("Avaliação aprovada!");
      
      // Atualizar apenas a avaliação aprovada no estado local, mantendo todas as outras
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === id 
            ? { ...review, approved: true }
            : review
        )
      );
    } catch (error) {
      toast.error("Erro ao aprovar avaliação");
      console.error(error);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm("Deseja excluir esta avaliação?")) {
      try {
        await apiClient.deleteReview(id);
        toast.success("Avaliação excluída!");
        
        // Remover apenas a avaliação deletada do estado local
        setReviews(prevReviews => prevReviews.filter(review => review.id !== id));
      } catch (error) {
        toast.error("Erro ao excluir avaliação");
        console.error(error);
      }
    }
  };

  // Export functions
  const exportPurchases = async () => {
    try {
      await apiClient.exportPurchases('csv');
      toast.success("Exportação iniciada!");
    } catch (error) {
      toast.error("Erro ao exportar compras");
      console.error(error);
    }
  };

  const exportStudents = async () => {
    try {
      await apiClient.exportStudents('csv');
      toast.success("Exportação iniciada!");
    } catch (error) {
      toast.error("Erro ao exportar alunos");
      console.error(error);
    }
  };

  const exportCourses = async () => {
    try {
      await apiClient.exportCourses('csv');
      toast.success("Exportação iniciada!");
    } catch (error) {
      toast.error("Erro ao exportar cursos");
      console.error(error);
    }
  };

  // Usar dados do dashboard do backend (mais preciso, inclui todas as compras)
  // Fallback para cálculo local se dashboardData não estiver disponível
  const totalRevenue = dashboardData?.totalRevenue !== undefined 
    ? Number(dashboardData.totalRevenue) 
    : purchases.reduce((acc, p) => {
        const price = typeof p.price === 'string' 
          ? parseFloat(String(p.price).replace(',', '.')) || 0 
          : (typeof p.price === 'number' ? p.price : 0);
        return acc + Number(price);
      }, 0);
  
  const totalSales = dashboardData?.totalSales !== undefined 
    ? Number(dashboardData.totalSales) 
    : purchases.length;
  
  const averageTicket = dashboardData?.averageTicket !== undefined
    ? Number(dashboardData.averageTicket)
    : (totalSales > 0 ? totalRevenue / totalSales : 0);
  
  // Usar dados do dashboard para alunos e cursos também
  const totalStudents = dashboardData?.totalStudents !== undefined
    ? Number(dashboardData.totalStudents)
    : users.length;
  
  const totalCourses = dashboardData?.totalCourses !== undefined
    ? Number(dashboardData.totalCourses)
    : courses.length;

  // ✅ Filtrar apenas compras PAGAS para cálculos de faturamento
  const paidPurchases = purchases.filter(p => p.paymentStatus === 'paid');
  
  const revenuePerCourse = courses.map(course => {
    // Filtrar apenas compras pagas deste curso
    const coursePurchases = paidPurchases.filter(p => p.courseId === course.id);
    return {
      courseTitle: course.title,
      sales: coursePurchases.length,
      revenue: coursePurchases.reduce((acc, p) => {
        // Usar finalAmount (valor pago) em vez de price
        const finalAmount = typeof p.price === 'string' ? parseFloat(p.price) || 0 : (p.price || 0);
        // Garantir que o valor seja positivo
        return acc + Math.max(0, Number(finalAmount));
      }, 0)
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Dados para gráficos
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const salesByDay = last7Days.map(date => {
    const daySales = purchases.filter(p => p.date.split('T')[0] === date);
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      vendas: daySales.length,
      receita: daySales.reduce((acc, p) => acc + p.price, 0),
    };
  });

  const courseColors = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-teal-700 text-white pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 sm:mb-4">
                Painel Administrativo
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-blue-100">
                Gerencie sua plataforma de forma completa
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 sm:gap-3 mt-8 mb-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setMainView("dashboard")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "dashboard"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setMainView("courses")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "courses"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              Cursos
            </button>
            <button
              onClick={() => setMainView("students")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "students"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Alunos
            </button>
            <button
              onClick={() => setMainView("revenue")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "revenue"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Faturamento
            </button>
            <button
              onClick={() => setMainView("coupons")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "coupons"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
              Cupons
            </button>
            <button
              onClick={() => setMainView("reviews")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "reviews"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              Avaliações
            </button>
            <button
              onClick={() => setMainView("podcasts")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "podcasts"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              Podcasts
            </button>
            <button
              onClick={() => setMainView("newsletter")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "newsletter"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              Newsletter
            </button>
            <button
              onClick={() => setMainView("support")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                mainView === "support"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Suporte
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 break-words">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs sm:text-sm text-blue-100">Faturamento Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1">{totalSales}</div>
              <div className="text-xs sm:text-sm text-blue-100">Total de Vendas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1">{totalStudents}</div>
              <div className="text-xs sm:text-sm text-blue-100">Alunos Cadastrados</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1">{totalCourses}</div>
              <div className="text-xs sm:text-sm text-blue-100">Cursos Ativos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Dialog - Outside header section */}
      {mainView === "courses" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-[75vw] xl:!max-w-[65vw] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
            <DialogHeader className="pb-4 sm:pb-6 border-b mb-4 sm:mb-6">
              <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {editingCourse ? "Editar Curso" : "Criar Novo Curso"}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base lg:text-lg mt-2 sm:mt-3">
                {editingCourse ? "Edite as informações do curso abaixo" : "Preencha os dados para criar um novo curso"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-4 sm:mb-6 lg:mb-8">
                <button
                  type="button"
                  className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${
                    currentTab === "info" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setCurrentTab("info")}
                >
                  Informações Básicas
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${
                    currentTab === "content" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setCurrentTab("content")}
                >
                  Conteúdo
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${
                    currentTab === "modules" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setCurrentTab("modules")}
                >
                  Módulos
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 pb-6 space-y-8 sm:space-y-10 lg:space-y-12">
                {currentTab === "info" && (
                  <>
                    {/* Seção: Informações Principais */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="border-b border-gray-200 pb-2 sm:pb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Informações Principais</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Dados básicos do curso</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label htmlFor="title" className="text-sm sm:text-base font-medium">Título *</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nome do curso"
                            className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                          />
                          {errors.title && (
                            <p className="text-xs sm:text-sm text-red-500 mt-1">
                              {errors.title}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="subtitle" className="text-sm sm:text-base font-medium">Subtítulo *</Label>
                          <Input
                            id="subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Breve descrição"
                            className="mt-2 h-10 sm:h-11 text-sm sm:text-base"
                          />
                          {errors.subtitle && (
                            <p className="text-xs sm:text-sm text-red-500 mt-1">
                              {errors.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm sm:text-base font-medium">Descrição *</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Descrição completa do curso"
                          rows={4}
                          className="mt-2 resize-none text-sm sm:text-base"
                        />
                        {errors.description && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1">
                            {errors.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Seção: Preços e Categoria */}
                    <div className="space-y-6 sm:space-y-8 bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg border">
                      <div className="border-b border-gray-200 pb-4 sm:pb-5">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Preços e Categoria</h3>
                        <p className="text-sm sm:text-base text-gray-500 mt-2">Configure os valores e classificação</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-base sm:text-lg font-medium">Preço (R$) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="297.00"
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                          {errors.price && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.price}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="originalPrice" className="text-base sm:text-lg font-medium">Preço Original (R$)</Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            step="0.01"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="497.00"
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                          <Label htmlFor="category" className="text-base sm:text-lg font-medium">Categoria *</Label>
                          <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Relacionamentos, Ansiedade, etc."
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                          {errors.category && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seção: Mídia e Instrutor */}
                    <div className="space-y-6 sm:space-y-8 bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg border">
                      <div className="border-b border-gray-200 pb-4 sm:pb-5">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Mídia e Instrutor</h3>
                        <p className="text-sm sm:text-base text-gray-500 mt-2">Imagem e informações do instrutor</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="image" className="text-base sm:text-lg font-medium">Imagem do Curso *</Label>
                          <div className="mt-2 space-y-3">
                            <input
                              type="file"
                              id="image"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setImageFile(file);
                                  handleImageUpload(file);
                                }
                              }}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('image')?.click()}
                              disabled={imageUploading}
                              className="w-full h-12 sm:h-14 text-base sm:text-lg"
                            >
                              {imageUploading ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 mr-2" />
                                  {imageFile ? (imageFile.name.length > 25 ? imageFile.name.substring(0, 25) + '...' : imageFile.name) : 'Selecionar Imagem'}
                                </>
                              )}
                            </Button>
                            {image && image.trim() && (image.startsWith('http://') || image.startsWith('https://')) && (
                              <div className="mt-3">
                                <img 
                                  src={image} 
                                  alt="Preview" 
                                  className="w-full h-40 sm:h-48 lg:h-56 object-cover rounded-lg border"
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', image);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log('Imagem carregada com sucesso:', image);
                                  }}
                                />
                                <p className="text-sm text-gray-500 mt-2">Imagem atual</p>
                                <p className="text-xs text-blue-500 mt-1 break-all">{image}</p>
                              </div>
                            )}
                            {image && image.trim() && !image.startsWith('http://') && !image.startsWith('https://') && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm text-yellow-700">Aguardando URL da imagem...</p>
                              </div>
                            )}
                          </div>
                          {errors.image && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.image}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instructor" className="text-base sm:text-lg font-medium">Instrutor *</Label>
                          <Input
                            id="instructor"
                            value={instructor}
                            onChange={(e) => setInstructor(e.target.value)}
                            placeholder="Nome do instrutor"
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                          {errors.instructor && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.instructor}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="duration" className="text-base sm:text-lg font-medium">Duração *</Label>
                          <Input
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="Ex: 20h, 30h"
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                          {errors.duration && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.duration}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lessons" className="text-base sm:text-lg font-medium">Número de Aulas *</Label>
                          <Input
                            id="lessons"
                            type="number"
                            value={lessons}
                            onChange={(e) => setLessons(e.target.value)}
                            placeholder="Ex: 10, 20"
                            className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
                          />
                          {errors.lessons && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.lessons}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                        </>
                      )}

                      {currentTab === "content" && (
                        <>
                          {/* Seção: Conteúdo do Curso */}
                          <div className="space-y-6 sm:space-y-8">
                            <div className="border-b border-gray-200 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Conteúdo do Curso</h3>
                              <p className="text-sm sm:text-base text-gray-500 mt-2">Vídeo de apresentação e informações adicionais</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="videoUrl" className="text-base sm:text-lg font-medium">Vídeo de Apresentação do Curso</Label>
                              <div className="mt-2 space-y-3">
                                <input
                                  type="file"
                                  id="videoUrl"
                                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Verificar tamanho do arquivo
                                      const fileSizeMB = file.size / (1024 * 1024);
                                      if (fileSizeMB > 100) {
                                        const shouldContinue = window.confirm(
                                          `⚠️ ATENÇÃO: O vídeo é muito grande (${fileSizeMB.toFixed(1)} MB).\n\n` +
                                          `Vídeos grandes demoram muito para carregar para os alunos.\n\n` +
                                          `Recomendação: Comprima o vídeo para menos de 50 MB antes de fazer upload.\n\n` +
                                          `Deseja continuar mesmo assim?`
                                        );
                                        if (!shouldContinue) {
                                          e.target.value = '';
                                          return;
                                        }
                                      }
                                      setVideoFile(file);
                                      handleVideoUpload(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('videoUrl')?.click()}
                                  disabled={videoUploading}
                                  className="w-full h-12 sm:h-14 text-base sm:text-lg"
                                >
                                  {videoUploading ? (
                                    <>
                                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                      Enviando vídeo...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5 mr-2" />
                                      {videoFile ? (videoFile.name.length > 30 ? videoFile.name.substring(0, 30) + '...' : videoFile.name) : 'Selecionar Vídeo'}
                                    </>
                                  )}
                                </Button>
                                {videoFile && !videoUploading && (
                                  <p className="text-sm text-gray-500">
                                    Tamanho: {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                    {videoFile.size > 50 * 1024 * 1024 && (
                                      <span className="text-orange-600 ml-2">
                                        ⚠️ Recomendado: menos de 50 MB para melhor performance
                                      </span>
                                    )}
                                  </p>
                                )}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                  <p className="text-sm text-blue-800 font-semibold mb-1">💡 Dica de Performance:</p>
                                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Vídeos menores carregam mais rápido para os alunos</li>
                                    <li>Recomendado: máximo 50 MB para vídeos de apresentação</li>
                                    <li>Use ferramentas como HandBrake ou FFmpeg para comprimir</li>
                                    <li>Resolução recomendada: 720p ou 1080p (não 4K)</li>
                                  </ul>
                                </div>
                                {videoUrl && (
                                  <div className="mt-3">
                                    <video src={videoUrl} controls className="w-full rounded-lg border max-h-64" />
                                    <p className="text-sm text-gray-500 mt-2">Vídeo atual</p>
                                    <p className="text-xs text-blue-500 mt-1 break-all">{videoUrl}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="aboutCourse" className="text-base sm:text-lg font-medium">Sobre o Curso</Label>
                              <Textarea
                                id="aboutCourse"
                                value={aboutCourse}
                                onChange={(e) => setAboutCourse(e.target.value)}
                                placeholder="Informações detalhadas sobre o curso..."
                                rows={8}
                                className="mt-2 resize-none text-base sm:text-lg"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {currentTab === "modules" && (
                        <>
                          {/* Seção: Módulos e Aulas */}
                          <div className="space-y-6 sm:space-y-8">
                            <div className="border-b border-gray-200 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Módulos e Aulas</h3>
                              <p className="text-sm sm:text-base text-gray-500 mt-2">Organize o conteúdo em módulos e aulas</p>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                              {modules.map((module, moduleIndex) => (
                                <div key={moduleIndex} className="border border-gray-200 rounded-lg p-5 sm:p-6 lg:p-8 bg-gray-50">
                                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                                    <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">Módulo {moduleIndex + 1}</h4>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const newModules = modules.filter((_, i) => i !== moduleIndex);
                                        setModules(newModules);
                                      }}
                                      className="h-10 sm:h-11 w-10 sm:w-11 p-0"
                                    >
                                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                  </div>

                                  <div className="space-y-4 sm:space-y-5">
                                    <Input
                                      placeholder="Título do módulo"
                                      value={module.title}
                                      onChange={(e) => {
                                        const newModules = [...modules];
                                        newModules[moduleIndex].title = e.target.value;
                                        setModules(newModules);
                                      }}
                                      className="h-12 sm:h-14 text-base sm:text-lg"
                                    />

                                    <div className="space-y-4 sm:space-y-5">
                                      {module.lessons.map((lesson, lessonIndex) => (
                                        <div key={lessonIndex} className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Input
                                              placeholder="Título da aula"
                                              value={lesson.title}
                                              onChange={(e) => {
                                                const newModules = [...modules];
                                                newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                                                setModules(newModules);
                                              }}
                                              className="h-12 sm:h-14 text-base sm:text-lg"
                                            />
                                            <Input
                                              placeholder="Duração (ex: 10min)"
                                              value={lesson.duration}
                                              onChange={(e) => {
                                                const newModules = [...modules];
                                                newModules[moduleIndex].lessons[lessonIndex].duration = e.target.value;
                                                setModules(newModules);
                                              }}
                                              className="h-12 sm:h-14 text-base sm:text-lg"
                                            />
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label className="text-sm sm:text-base font-medium">Vídeo da Aula <span className="text-red-500">*</span></Label>
                                            <div className="space-y-2">
                                              <input
                                                type="file"
                                                id={`lesson-video-${moduleIndex}-${lessonIndex}`}
                                                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    handleLessonVideoUpload(file, moduleIndex, lessonIndex);
                                                  }
                                                }}
                                                className="hidden"
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById(`lesson-video-${moduleIndex}-${lessonIndex}`)?.click()}
                                                className="w-full h-12 sm:h-14 text-base sm:text-lg"
                                                disabled={lesson.videoUrl === 'uploading...'}
                                              >
                                                {lesson.videoUrl === 'uploading...' ? (
                                                  <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Enviando...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Upload className="w-5 h-5 mr-2" />
                                                    {lesson.videoUrl && lesson.videoUrl !== 'uploading...' ? 'Trocar Vídeo' : 'Selecionar Vídeo'}
                                                  </>
                                                )}
                                              </Button>
                                              {lesson.videoUrl && lesson.videoUrl !== 'uploading...' && (
                                                <div className="mt-2">
                                                  <video src={lesson.videoUrl} controls className="w-full rounded-lg border max-h-48" />
                                                  <p className="text-xs text-gray-500 mt-1">Vídeo atual</p>
                                                </div>
                                              )}
                                              {lesson.videoUrl === 'uploading...' && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                  <p className="text-sm text-blue-600 flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Enviando vídeo...
                                                  </p>
                                                </div>
                                              )}
                                              {(!lesson.videoUrl || lesson.videoUrl.trim() === "") && lesson.videoUrl !== 'uploading...' && (
                                                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                                                  <span className="font-semibold">⚠️</span> Vídeo da aula é obrigatório
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex justify-end pt-2 border-t">
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                const newModules = [...modules];
                                                newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                                                setModules(newModules);
                                              }}
                                              className="h-10 sm:h-11 text-sm sm:text-base"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Remover Aula
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newModules = [...modules];
                                          newModules[moduleIndex].lessons.push({ title: "", duration: "", videoUrl: "" });
                                          setModules(newModules);
                                        }}
                                        className="w-full h-12 sm:h-14 text-base sm:text-lg"
                                      >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Adicionar Aula
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setModules([...modules, { title: "", lessons: [{ title: "", duration: "", videoUrl: "" }], duration: "" }]);
                                }}
                                className="w-full h-12 sm:h-14 text-base sm:text-lg"
                              >
                                <Plus className="w-5 h-5 mr-2" />
                                Adicionar Módulo
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingCourse(null);
                          setCurrentTab("info");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Curso
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {mainView === "coupons" && (
              <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[600px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
                  <DialogHeader className="pb-4 sm:pb-6 border-b mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                          {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                          {editingCoupon ? "Edite as informações do cupom abaixo" : "Preencha os dados para criar um novo cupom de desconto"}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-6 sm:space-y-8">
                    {/* Código do Cupom */}
                    <div className="space-y-2">
                      <Label htmlFor="couponCode" className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Código do Cupom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="BLACKFRIDAY2024"
                        className="h-12 sm:h-14 text-base sm:text-lg font-mono"
                      />
                      <p className="text-xs sm:text-sm text-gray-500">
                        O código será convertido automaticamente para maiúsculas
                      </p>
                    </div>

                    {/* Desconto e Tipo */}
                    <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-4 sm:p-6 rounded-lg border border-blue-200 space-y-4 sm:space-y-6">
                      <div className="border-b border-blue-200 pb-2 sm:pb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          Configuração de Desconto
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="couponDiscount" className="text-sm sm:text-base font-medium">
                            Valor do Desconto <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="couponDiscount"
                              type="number"
                              step="0.01"
                              value={couponDiscount}
                              onChange={(e) => setCouponDiscount(e.target.value)}
                              placeholder={couponType === "percentage" ? "20" : "50.00"}
                              className="h-12 sm:h-14 text-base sm:text-lg pr-12"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                              {couponType === "percentage" ? "%" : "R$"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="couponType" className="text-sm sm:text-base font-medium">
                            Tipo de Desconto
                          </Label>
                          <select
                            id="couponType"
                            value={couponType}
                            onChange={(e) => setCouponType(e.target.value as "percentage" | "fixed")}
                            className="w-full h-12 sm:h-14 px-4 rounded-md border border-gray-300 bg-white text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          >
                            <option value="percentage">Percentual (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Validade e Usos */}
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border space-y-4 sm:space-y-6">
                      <div className="border-b border-gray-200 pb-2 sm:pb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                          Validade e Limites
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="couponExpires" className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Data de Expiração
                          </Label>
                          <Input
                            id="couponExpires"
                            type="date"
                            value={couponExpires}
                            onChange={(e) => setCouponExpires(e.target.value)}
                            className="h-12 sm:h-14 text-base sm:text-lg"
                          />
                          <p className="text-xs sm:text-sm text-gray-500">
                            Deixe em branco para não expirar
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="couponMaxUses" className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            Usos Máximos
                          </Label>
                          <Input
                            id="couponMaxUses"
                            type="number"
                            value={couponMaxUses}
                            onChange={(e) => setCouponMaxUses(e.target.value)}
                            placeholder="Ilimitado"
                            className="h-12 sm:h-14 text-base sm:text-lg"
                          />
                          <p className="text-xs sm:text-sm text-gray-500">
                            Deixe em branco para uso ilimitado
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCouponDialogOpen(false);
                        resetCouponForm();
                      }}
                      className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveCoupon}
                      className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Salvar Cupom
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

      {/* Delete Coupon Confirmation Dialog */}
      {mainView === "coupons" && (
        <Dialog open={deleteCouponDialogOpen} onOpenChange={setDeleteCouponDialogOpen}>
          <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[500px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
            <DialogHeader className="pb-4 sm:pb-6 border-b mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    Confirmar Exclusão
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                    Esta ação não pode ser desfeita
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-4 sm:space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  Tem certeza que deseja excluir o cupom <span className="font-bold text-gray-900">{couponToDelete?.code}</span>?
                </p>
                
                {couponToDelete && (
                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Código:</span>
                      <span className="text-sm sm:text-base font-mono font-bold text-gray-900">{couponToDelete.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Desconto:</span>
                      <span className="text-sm sm:text-base font-bold text-blue-600">
                        {couponToDelete.type === "percentage" 
                          ? `${couponToDelete.discount}%` 
                          : `R$ ${couponToDelete.discount.toFixed(2)}`}
                      </span>
                    </div>
                    {couponToDelete.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Expira em:</span>
                        <span className="text-sm sm:text-base text-gray-900">
                          {new Date(couponToDelete.expiresAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Usos:</span>
                      <span className="text-sm sm:text-base text-gray-900">
                        {couponToDelete.currentUses} / {couponToDelete.maxUses === 999999 ? '∞' : couponToDelete.maxUses}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Esta ação é permanente. Todos os dados relacionados a este cupom serão removidos.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteCouponDialogOpen(false);
                  setCouponToDelete(null);
                }}
                className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => couponToDelete && handleDeleteCoupon(couponToDelete.id)}
                className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Excluir Cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dashboard View */}
      {mainView === "dashboard" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dashboard de Vendas</h2>
              <p className="text-gray-600">Análise visual do desempenho da plataforma</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={exportPurchases} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exportar Vendas
              </Button>
              <Button variant="outline" onClick={exportCourses} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exportar Cursos
              </Button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart - Vendas por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas nos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} name="Vendas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart - Receita por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Receita nos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="receita" fill="#14b8a6" name="Receita (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart - Vendas por Curso */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Vendas por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={revenuePerCourse.filter(c => c.sales > 0)}
                    dataKey="sales"
                    nameKey="courseTitle"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.courseTitle}: ${entry.sales}`}
                  >
                    {revenuePerCourse.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={courseColors[index % courseColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Courses View */}
      {mainView === "courses" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Gerenciar Cursos</h2>
              <p className="text-gray-600">
                Edite ou exclua os cursos existentes
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  onClick={handleNewCourse}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Curso
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nenhum curso cadastrado</h3>
                <p className="text-gray-600 mb-6">
                  Crie seu primeiro curso para começar
                </p>
                <Button onClick={handleNewCourse} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="w-full sm:w-48 h-48 sm:h-32 flex-shrink-0">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                              {course.category}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold mt-2 break-words">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 break-words">{course.subtitle}</p>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(course)}
                              className="flex-1 sm:flex-none"
                            >
                              <Edit className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(course.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-600 mt-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-bold text-green-600">R$ {(typeof course.price === 'string' ? parseFloat(course.price) : course.price).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.lessons} aulas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.students} alunos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">★</span>
                            <span>{course.rating}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Instrutor:</span>{" "}
                            {course.instructor}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Students View */}
      {mainView === "students" && (
        <section className="container mx-auto px-4 py-6 sm:py-12">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Gerenciar Alunos</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Visualize todos os alunos e seu progresso nos cursos
              </p>
            </div>
            <Button variant="outline" onClick={exportStudents} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar Alunos
            </Button>
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-12 sm:py-20 text-center px-4">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Nenhum aluno cadastrado</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Os alunos aparecerão aqui quando se cadastrarem na plataforma
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {users.map((user, index) => {
                // Filtrar apenas compras pagas do usuário (comparar emails em lowercase)
                const userPurchases = purchases.filter(p => {
                  const emailMatch = p.userEmail?.toLowerCase() === user.email?.toLowerCase();
                  // PaymentStatus.PAID = 'paid' (minúsculo)
                  const isPaid = p.paymentStatus === 'paid';
                  return emailMatch && isPaid;
                });
                const userProgressData = studentProgress.filter(p => p.userId === user.email);
                const avgProgress = userProgressData.length > 0
                  ? userProgressData.reduce((acc, p) => acc + p.progress, 0) / userProgressData.length
                  : 0;

                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold break-words">{user.name}</h3>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="break-all">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>Cadastrado em: {new Date(user.registeredAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">{userPurchases.length}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Cursos</div>
                          {userProgressData.length > 0 && (
                            <div className="text-xs sm:text-sm text-teal-600 font-semibold mt-1">
                              {avgProgress.toFixed(0)}% concluído
                            </div>
                          )}
                        </div>
                      </div>

                      {userPurchases.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Cursos e Progresso:</p>
                          <div className="space-y-2 sm:space-y-3">
                            {userPurchases.map((purchase, idx) => {
                              const progress = userProgressData.find(p => p.courseId === purchase.courseId);
                              return (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{purchase.courseTitle}</span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">R$ {(typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price).toFixed(2)}</span>
                                  </div>
                                  {progress && (
                                    <>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-teal-500 h-2 rounded-full transition-all"
                                          style={{ width: `${progress.progress}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1 text-xs text-gray-600">
                                        <span>{progress.completedLessons.length} aulas concluídas</span>
                                        <span>{progress.progress.toFixed(0)}%</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Revenue View */}
      {mainView === "revenue" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Análise de Faturamento</h2>
            <p className="text-gray-600">
              Acompanhe as vendas e o desempenho financeiro da plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Faturamento Total</p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Vendas</p>
                    <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                    <p className="text-3xl font-bold text-teal-600">
                      R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              {revenuePerCourse.length === 0 || totalSales === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>Nenhuma venda realizada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revenuePerCourse.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.courseTitle}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.sales} {item.sales === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.revenue / totalRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {purchases.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Últimas Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paidPurchases.slice(0, 10).reverse().map((purchase) => {
                    const finalAmount = typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price;
                    // Garantir que o valor seja positivo (não mostrar valores negativos)
                    const displayAmount = Math.max(0, finalAmount || 0);
                    
                    return (
                      <div key={purchase.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{purchase.userName}</p>
                            <p className="text-sm text-gray-600">{purchase.courseTitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R$ {displayAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(purchase.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Coupons View */}
      {mainView === "coupons" && (
        <section className="container mx-auto px-4 py-6 sm:py-12">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Cupons de Desconto</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Crie e gerencie cupons promocionais
              </p>
            </div>
            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  onClick={() => {
                    resetCouponForm();
                    setIsCouponDialogOpen(true);
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Cupom
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {coupons.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nenhum cupom criado</h3>
                <p className="text-gray-600 mb-6">
                  Crie cupons de desconto para atrair mais alunos
                </p>
                <Button onClick={() => setIsCouponDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Cupom
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const usagePercent = (coupon.currentUses / coupon.maxUses) * 100;

                return (
                  <Card key={coupon.id} className={`overflow-hidden ${!coupon.active || isExpired ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-bold font-mono break-all">{coupon.code}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCouponCode(coupon.code)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              {copiedCoupon === coupon.code ? (
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xl sm:text-2xl font-bold text-blue-600">
                              {coupon.type === "percentage" ? `${coupon.discount}%` : `R$ ${coupon.discount.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setCouponCode(coupon.code);
                              setCouponDiscount(coupon.discount.toString());
                              setCouponType(coupon.type);
                              // Converter data para formato YYYY-MM-DD para o input type="date"
                              if (coupon.expiresAt) {
                                const date = new Date(coupon.expiresAt);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setCouponExpires(`${year}-${month}-${day}`);
                              } else {
                                setCouponExpires("");
                              }
                              setCouponMaxUses(coupon.maxUses.toString());
                              setIsCouponDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteCouponDialog(coupon)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        {coupon.expiresAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Expira em:</span>
                            <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                              {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">Uso:</span>
                            <span className="font-medium text-gray-900">
                              {coupon.currentUses} / {coupon.maxUses === 999999 ? '∞' : coupon.maxUses}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id)}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                              coupon.active && !isExpired
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {coupon.active && !isExpired ? '✓ Ativo' : '✕ Inativo'}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Reviews View */}
      {mainView === "reviews" && (
        <section className="container mx-auto px-4 py-6 sm:py-12">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Avaliações dos Cursos</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Gerencie as avaliações e comentários dos alunos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant={reviews.filter(r => !r.approved).length > 0 ? "default" : "outline"}
                onClick={async () => {
                  try {
                    const pendingResponse = await apiClient.getPendingReviews();
                    if (pendingResponse?.reviews) {
                      setReviews(pendingResponse.reviews.map((r: any) => ({
                        id: r.id,
                        courseId: r.courseId,
                        courseTitle: r.course?.title || "Curso não encontrado",
                        userId: r.userId,
                        userName: r.user?.name || "Usuário",
                        userEmail: r.user?.email || "",
                        comment: r.comment || "",
                        date: r.createdAt,
                        rating: r.rating,
                        approved: r.approved,
                      })));
                    }
                  } catch (error) {
                    console.error("Erro ao carregar avaliações pendentes:", error);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Ver Pendentes ({reviews.filter(r => !r.approved).length})
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const reviewsResponse = await apiClient.getAdminReviews({ page: 1, limit: 100 });
                    if (reviewsResponse?.reviews) {
                      setReviews(reviewsResponse.reviews.map((r: any) => ({
                        id: r.id,
                        courseId: r.courseId,
                        courseTitle: r.course?.title || "Curso não encontrado",
                        userId: r.userId,
                        userName: r.user?.name || "Usuário",
                        userEmail: r.user?.email || "",
                        comment: r.comment || "",
                        date: r.createdAt,
                        rating: r.rating,
                        approved: r.approved,
                      })));
                    }
                  } catch (error) {
                    console.error("Erro ao carregar todas as avaliações:", error);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Ver Todas
              </Button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 sm:py-20 text-center px-4">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Nenhuma avaliação ainda</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  As avaliações dos alunos aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className={`overflow-hidden ${!review.approved ? 'border-l-4 border-l-yellow-500' : ''}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold break-words">{review.userName}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">{review.userEmail}</p>
                          <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1 break-words">{review.courseTitle}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        
                        {!review.approved && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveReview(review.id)}
                            className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-gray-700 mb-3 break-words">{review.comment}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 border-t">
                      <span className="text-xs sm:text-sm text-gray-500 break-words">
                        {new Date(review.date).toLocaleDateString('pt-BR')} às {new Date(review.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {!review.approved && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap">
                            Aguardando aprovação
                          </span>
                        )}
                        {review.approved && (
                          <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap">
                            Aprovado
                          </span>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="h-8 sm:h-9 w-8 sm:w-9 p-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Podcasts View */}
      {mainView === "podcasts" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Gerenciar Podcasts</h2>
              <p className="text-gray-600">Cadastre e gerencie podcasts gratuitos</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingCourse(null);
                    setTitle("");
                    setDescription("");
                    setImage("");
                    setVideoUrl("");
                    setDuration("");
                    setErrors({});
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Podcast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Editar Podcast" : "Novo Podcast"}</DialogTitle>
                  <DialogDescription>
                    {editingCourse ? "Atualize as informações do podcast" : "Preencha os dados para criar um novo podcast"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="podcast-title">Título *</Label>
                    <Input
                      id="podcast-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Entendendo a Ansiedade"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="podcast-description">Descrição</Label>
                    <Textarea
                      id="podcast-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrição do podcast..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-image">URL da Imagem</Label>
                    <Input
                      id="podcast-image"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-video">URL do Vídeo *</Label>
                    <Input
                      id="podcast-video"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl}</p>}
                  </div>

                  <div>
                    <Label htmlFor="podcast-duration">Duração</Label>
                    <Input
                      id="podcast-duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ex: 45min"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="podcast-active"
                      checked={editingCourse ? (editingCourse as any).active !== false : true}
                      onChange={(e) => {
                        if (editingCourse) {
                          setEditingCourse({ ...editingCourse, active: e.target.checked } as any);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="podcast-active" className="cursor-pointer">
                      Podcast ativo
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={async () => {
                      if (!title || !videoUrl) {
                        setErrors({
                          title: !title ? "Título é obrigatório" : "",
                          videoUrl: !videoUrl ? "URL do vídeo é obrigatória" : "",
                        });
                        return;
                      }

                      try {
                        const podcastData = {
                          title,
                          description: description || undefined,
                          image: image || undefined,
                          videoUrl: videoUrl,
                          duration: duration || undefined,
                          active: editingCourse ? (editingCourse as any).active !== false : true,
                        };

                        if (editingCourse) {
                          await apiClient.updatePodcast(editingCourse.id, podcastData);
                          toast.success("Podcast atualizado com sucesso!");
                        } else {
                          await apiClient.createPodcast(podcastData);
                          toast.success("Podcast criado com sucesso!");
                        }

                        setIsDialogOpen(false);
                        // Recarregar podcasts
                        const podcastsResponse = await apiClient.getPodcasts({ page: 1, limit: 100 });
                        setPodcasts(podcastsResponse?.podcasts || []);
                      } catch (error: any) {
                        const validationErrors = extractValidationErrors(error);
                        if (Object.keys(validationErrors).length > 0) {
                          setErrors(validationErrors);
                        } else {
                          toast.error(handleApiError(error));
                        }
                      }
                    }}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingCourse ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {podcasts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold mb-2">Nenhum podcast cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece criando seu primeiro podcast gratuito</p>
                <Button onClick={() => {
                  setEditingCourse(null);
                  setTitle("");
                  setDescription("");
                  setImage("");
                  setVideoUrl("");
                  setDuration("");
                  setIsDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Podcast
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast) => (
                <Card key={podcast.id}>
                  <CardContent className="p-6">
                    {podcast.image && (
                      <img
                        src={podcast.image}
                        alt={podcast.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg mb-2">{podcast.title}</h3>
                    {podcast.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{podcast.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      {podcast.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {podcast.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Headphones className="w-4 h-4" />
                        {podcast.listens || 0} reproduções
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCourse(podcast as any);
                          setTitle(podcast.title);
                          setDescription(podcast.description || "");
                          setImage(podcast.image || "");
                          setVideoUrl(podcast.videoUrl);
                          setDuration(podcast.duration || "");
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm("Tem certeza que deseja excluir este podcast?")) {
                            try {
                              await apiClient.deletePodcast(podcast.id);
                              toast.success("Podcast excluído com sucesso!");
                              const podcastsResponse = await apiClient.getPodcasts({ page: 1, limit: 100 });
                              setPodcasts(podcastsResponse?.podcasts || []);
                            } catch (error) {
                              toast.error("Erro ao excluir podcast");
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Newsletter View */}
      {mainView === "newsletter" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Gerenciar Newsletter</h2>
            <p className="text-gray-600">Envie atualizações para todos os inscritos na newsletter</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Inscritos</p>
                    <p className="text-3xl font-bold text-blue-600">{newsletterTotal}</p>
                  </div>
                  <Mail className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Inscritos Ativos</p>
                    <p className="text-3xl font-bold text-green-600">{newsletterSubscribers.length}</p>
                  </div>
                  <CheckCircle2 className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Última Atualização</p>
                    <p className="text-sm font-semibold text-gray-800">-</p>
                  </div>
                  <Calendar className="w-12 h-12 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário para Enviar Atualização */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enviar Atualização da Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newsletter-subject">Assunto do Email *</Label>
                  <Input
                    id="newsletter-subject"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Ex: Novidades e Dicas de Psicologia"
                  />
                </div>

                <div>
                  <Label htmlFor="newsletter-content">Conteúdo *</Label>
                  <Textarea
                    id="newsletter-content"
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    placeholder="Escreva o conteúdo da newsletter aqui..."
                    rows={10}
                    className="font-sans"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode usar HTML básico para formatação (negrito, itálico, links, etc.)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newsletter-cta-text">Texto do Botão (opcional)</Label>
                    <Input
                      id="newsletter-cta-text"
                      value={newsletterCtaText}
                      onChange={(e) => setNewsletterCtaText(e.target.value)}
                      placeholder="Ex: Ver Mais"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletter-cta-link">Link do Botão (opcional)</Label>
                    <Input
                      id="newsletter-cta-link"
                      value={newsletterCtaLink}
                      onChange={(e) => setNewsletterCtaLink(e.target.value)}
                      placeholder="Ex: https://seusite.com/artigo"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold mb-2">📧 Esta atualização será enviada para:</p>
                  <p className="text-lg font-bold text-blue-900">{newsletterTotal} inscrito(s) ativo(s)</p>
                </div>

                <Button
                  onClick={() => {
                    if (!newsletterSubject || !newsletterContent) {
                      toast.error("Preencha o assunto e o conteúdo da newsletter");
                      return;
                    }

                    if (newsletterTotal === 0) {
                      toast.error("Não há inscritos ativos na newsletter");
                      return;
                    }

                    setShowNewsletterConfirmDialog(true);
                  }}
                  disabled={newsletterSending || !newsletterSubject || !newsletterContent || newsletterTotal === 0}
                  className="w-full"
                  size="lg"
                >
                  {newsletterSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Enviar Newsletter para {newsletterTotal} Inscrito(s)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Inscritos */}
          <Card>
            <CardHeader>
              <CardTitle>Inscritos na Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              {newsletterSubscribers.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Nenhum inscrito encontrado</h3>
                  <p className="text-gray-600">
                    Os inscritos aparecerão aqui quando se cadastrarem na newsletter
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {newsletterSubscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{subscriber.name || "Sem nome"}</p>
                          <p className="text-sm text-gray-600">{subscriber.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(subscriber.subscribedAt).toLocaleDateString("pt-BR")}
                        </p>
                        {subscriber.active && (
                          <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Confirmação de Envio */}
          <Dialog open={showNewsletterConfirmDialog} onOpenChange={setShowNewsletterConfirmDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Confirmar Envio</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Newsletter será enviada para todos os inscritos
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-6">
                {/* Card de Detalhes */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Assunto do Email</p>
                        <p className="text-base font-semibold text-gray-900">{newsletterSubject}</p>
                      </div>
                      <div className="pt-3 border-t border-blue-200">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Destinatários</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-lg font-bold text-gray-900">{newsletterTotal} inscrito(s) ativo(s)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Aviso */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    <strong className="font-semibold">Atenção:</strong> Esta ação não pode ser desfeita. Todos os inscritos ativos receberão este email imediatamente.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowNewsletterConfirmDialog(false)}
                  disabled={newsletterSending}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    setShowNewsletterConfirmDialog(false);
                    setNewsletterSending(true);
                    try {
                      const result = await apiClient.sendNewsletterUpdate({
                        subject: newsletterSubject,
                        content: newsletterContent,
                        ctaText: newsletterCtaText || undefined,
                        ctaLink: newsletterCtaLink || undefined,
                      });

                      toast.success(
                        `Newsletter enviada! ${result.stats.sent} email(s) enviado(s) com sucesso.`
                      );
                      
                      if (result.stats.failed > 0) {
                        toast.warning(`${result.stats.failed} email(s) falharam ao enviar.`);
                      }

                      // Limpar formulário
                      setNewsletterSubject("");
                      setNewsletterContent("");
                      setNewsletterCtaText("");
                      setNewsletterCtaLink("");
                    } catch (error: any) {
                      console.error("Erro ao enviar newsletter:", error);
                      toast.error(error.message || "Erro ao enviar newsletter");
                    } finally {
                      setNewsletterSending(false);
                    }
                  }}
                  disabled={newsletterSending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-lg hover:shadow-xl transition-all"
                >
                  {newsletterSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Confirmar e Enviar
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      )}

      {/* Support View */}
      {mainView === "support" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chat de Suporte</h2>
                <p className="text-gray-600 text-sm">Gerencie e responda aos tickets de suporte dos alunos</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Tickets */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between mb-4">
                    <span>Tickets</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSupportTickets()}
                      disabled={supportLoading}
                    >
                      <Loader2 className={`w-4 h-4 ${supportLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </CardTitle>
                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant={supportTicketFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('all')}
                      className={`text-xs ${
                        supportTicketFilter === 'all' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'open' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('open')}
                      className={`text-xs ${
                        supportTicketFilter === 'open' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      Aberto
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'in_progress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('in_progress')}
                      className={`text-xs ${
                        supportTicketFilter === 'in_progress' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      Em Atendimento
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'closed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('closed')}
                      className={`text-xs ${
                        supportTicketFilter === 'closed' 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      Fechado
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto p-1">
                    {(() => {
                      const filteredTickets = supportTicketFilter === 'all' 
                        ? supportTickets 
                        : supportTickets.filter((ticket: any) => ticket.status === supportTicketFilter);
                      
                      if (filteredTickets.length === 0) {
                        return (
                          <div className="text-center py-12 text-gray-400">
                            <div className="relative inline-block mb-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                                <MessageCircle className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="absolute -top-1 -right-1">
                                <Sparkles className="w-5 h-5 text-gray-300 animate-pulse" />
                              </div>
                            </div>
                            <p className="text-base font-semibold text-gray-600 mb-1">Nenhum ticket encontrado</p>
                            {supportTicketFilter !== 'all' && (
                              <p className="text-sm text-gray-500">para o filtro selecionado</p>
                            )}
                          </div>
                        );
                      }
                      
                      return filteredTickets.map((ticket: any) => {
                        const unreadMessages = ticket.messages?.filter((msg: any) => 
                          msg.senderType === 'user' && !msg.read
                        ) || [];
                        const unreadCount = unreadMessages.length;
                        
                        return (
                          <Card
                            key={ticket.id}
                            className={`cursor-pointer transition-all hover:shadow-xl relative group ${
                              selectedTicket?.id === ticket.id 
                                ? 'ring-2 ring-blue-500 ring-offset-2 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => openSupportTicket(ticket.id)}
                          >
                            {/* Indicador de mensagens não lidas */}
                            {unreadCount > 0 && selectedTicket?.id !== ticket.id && (
                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xl animate-pulse border-2 border-white">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                <span>{unreadCount}</span>
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3 mb-3">
                                {/* Ícone de status */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                                  ticket.status === 'open'
                                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                                    : ticket.status === 'in_progress'
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                                }`}>
                                  {ticket.status === 'open' && <AlertCircle className="w-5 h-5 text-white" />}
                                  {ticket.status === 'in_progress' && <Headphones className="w-5 h-5 text-white" />}
                                  {ticket.status === 'closed' && <CheckCircle2 className="w-5 h-5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 mb-1 truncate pr-8 group-hover:text-blue-700 transition-colors">
                                    {ticket.subject}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="truncate">{ticket.user?.name || ticket.user?.email || 'Usuário'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
                                    ticket.status === 'open'
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : ticket.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                                  }`}
                                >
                                  {ticket.status === 'open' && (
                                    <>
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span>Aberto</span>
                                    </>
                                  )}
                                  {ticket.status === 'in_progress' && (
                                    <>
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      <span>Em atendimento</span>
                                    </>
                                  )}
                                  {ticket.status === 'closed' && (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Fechado</span>
                                    </>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {(() => {
                                    const dateStr = String(ticket.createdAt);
                                    const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                                    const utcDate = new Date(utcDateStr);
                                    const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                                    return brDate.toLocaleDateString('pt-BR');
                                  })()}
                                </span>
                              </div>
                              {ticket.messages && ticket.messages.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2 pt-2 border-t border-gray-200">
                                  <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{ticket.messages.length} mensagem(ns)</span>
                                  {unreadCount > 0 && (
                                    <span className="text-red-600 font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área de Mensagens */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card className="h-[700px] flex flex-col shadow-xl border-0 overflow-hidden">
                  {/* Header melhorado com gradiente */}
                  <CardHeader className="border-b bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-5 shadow-xl relative overflow-hidden">
                    {/* Efeito de brilho */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl font-bold mb-3 flex items-center gap-3">
                          <div className="relative">
                            <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-green-300 rounded-full animate-ping opacity-75"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 drop-shadow-lg" />
                            <span className="drop-shadow-md">{selectedTicket.subject}</span>
                          </div>
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm flex items-center justify-center text-base font-bold border-2 border-white/40 shadow-lg ring-2 ring-white/20">
                            {(selectedTicket.user?.name || selectedTicket.user?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-blue-200" />
                              <p className="text-sm text-blue-100 font-semibold">
                                {selectedTicket.user?.name || selectedTicket.user?.email}
                              </p>
                            </div>
                            {selectedTicket.user?.email && selectedTicket.user?.name && (
                              <div className="flex items-center gap-2">
                                <MailIcon className="w-3.5 h-3.5 text-blue-200" />
                                <p className="text-xs text-blue-200 opacity-90">
                                  {selectedTicket.user.email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedTicket.status !== 'closed' && !selectedTicket.adminId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await apiClient.assignSupportTicket(selectedTicket.id);
                                await loadSupportTickets();
                                await openSupportTicket(selectedTicket.id);
                                toast.success('Ticket atribuído a você');
                              } catch (error: any) {
                                toast.error(error.message || 'Erro ao atribuir ticket');
                              }
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            <span>Atribuir</span>
                          </Button>
                        )}
                        {selectedTicket.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await apiClient.closeSupportTicket(selectedTicket.id);
                                await loadSupportTickets();
                                await openSupportTicket(selectedTicket.id);
                                toast.success('Ticket fechado');
                              } catch (error: any) {
                                toast.error(error.message || 'Erro ao fechar ticket');
                              }
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Fechar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col overflow-hidden p-0 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                    {/* Mensagens com design melhorado */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-5">
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        <>
                          {selectedTicket.messages.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                                msg.senderType === 'admin' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {msg.senderType !== 'admin' && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-white">
                                  {(msg.sender?.name || msg.sender?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-lg transition-all hover:shadow-xl ${
                                  msg.senderType === 'admin'
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-md'
                                }`}
                              >
                                <div className={`text-xs font-bold mb-2 ${
                                  msg.senderType === 'admin' ? 'text-blue-100' : 'text-gray-600'
                                }`}>
                                  {msg.sender?.name || msg.sender?.email}
                                </div>
                                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                  msg.senderType === 'admin' ? 'text-white' : 'text-gray-800'
                                }`}>
                                  {msg.content}
                                </div>
                                <div className={`text-xs mt-2.5 ${
                                  msg.senderType === 'admin' ? 'text-blue-100 opacity-80' : 'text-gray-500'
                                }`}>
                                  {(() => {
                                    // Converter data UTC para horário do Brasil
                                    const dateStr = String(msg.createdAt);
                                    // Se não tem Z, adicionar para forçar UTC
                                    const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                                    const utcDate = new Date(utcDateStr);
                                    
                                    // Converter UTC para horário do Brasil (UTC-3)
                                    // Criar uma nova data ajustando o offset
                                    const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                                    
                                    return brDate.toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                                  })()}
                                </div>
                              </div>
                              {msg.senderType === 'admin' && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-white">
                                  {(msg.sender?.name || msg.sender?.email || 'A').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center shadow-xl">
                              <MessageSquare className="w-10 h-10 text-blue-500" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                            </div>
                          </div>
                          <p className="text-lg font-bold text-gray-700 mb-2">Nenhuma mensagem ainda</p>
                          <p className="text-sm text-gray-500 text-center">Inicie a conversa enviando uma mensagem abaixo</p>
                        </div>
                      )}
                    </div>

                    {/* Input melhorado */}
                    {selectedTicket.status !== 'closed' && (
                      <div className="p-5 bg-white border-t border-gray-200 shadow-2xl">
                        <div className="flex gap-3 items-end">
                          <div className="flex-1 relative">
                            <Input
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  sendSupportMessage();
                                }
                              }}
                              placeholder="Digite sua resposta..."
                              disabled={supportLoading}
                              className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                            />
                          </div>
                          <Button
                            onClick={sendSupportMessage}
                            disabled={supportLoading || !supportMessage.trim()}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed h-auto min-w-[60px]"
                          >
                            {supportLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedTicket.status === 'closed' && (
                      <div className="p-5 bg-gradient-to-r from-gray-100 to-gray-50 border-t border-gray-200 text-center">
                        <div className="inline-flex items-center gap-3 text-gray-600 bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                          <span className="text-sm font-semibold">Esta conversa foi fechada</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[700px] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
                  <div className="text-center text-gray-400">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 via-blue-200 to-blue-100 flex items-center justify-center shadow-xl animate-pulse">
                      <MessageCircle className="w-14 h-14 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-600 mb-2">Selecione um ticket</p>
                    <p className="text-sm text-gray-500">Escolha uma conversa para começar</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

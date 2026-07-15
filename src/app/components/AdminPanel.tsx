import { useState, useEffect, useRef, useMemo } from "react";
import { Course, Benefit } from "../data/courses";
import * as LucideIcons from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
  User,
  Mail as MailIcon,
  Brain,
  ArrowRight,
  Search,
  ArrowUpDown,
  Grid3x3,
  List,
  Activity,
  Eye,
  FileText,
  X,
  Heart,
  Palette,
  Package,
  Images,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import defaultLogoImg from "./laminas/icon.png";
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
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LANDING_BANNER_DEFAULTS } from "../../constants/landingBannersDefaults";
import { normalizeLandingBannerLink } from "../../utils/landingBannerLink";
import { serializeLandingBanners } from "../../utils/landingBannerSnapshot";
import { notifyHomeContentUpdated } from "../../hooks/useHomeContent";
import { ImagePositionEditor } from "./ImagePositionEditor";

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
  const [mainView, setMainView] = useState<"dashboard" | "courses" | "students" | "revenue" | "coupons" | "reviews" | "podcasts" | "newsletter" | "support" | "home-content" | "landing" | "theme" | "products" | "sales" | "sale-email">("dashboard");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<"all" | "physical" | "digital">("all");
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [allPurchases, setAllPurchases] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  // Sales filters and sorting
  const [salesSearch, setSalesSearch] = useState("");
  const [salesStatusFilter, setSalesStatusFilter] = useState<"all" | "with-proof" | "without-proof">("all");
  const [salesDateFilter, setSalesDateFilter] = useState<"all" | "7d" | "30d" | "90d" | "month" | "year">("all");
  const [salesSortBy, setSalesSortBy] = useState<"date" | "total" | "customer" | "products">("date");
  const [salesSortOrder, setSalesSortOrder] = useState<"asc" | "desc">("desc");
  const [salesViewMode, setSalesViewMode] = useState<"cards" | "table">("cards");
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedProductPurchase, setSelectedProductPurchase] = useState<any | null>(null);
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<any | null>(null);
  const [purchaseDetailDialogOpen, setPurchaseDetailDialogOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({});
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterTotal, setNewsletterTotal] = useState(0);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterCtaText, setNewsletterCtaText] = useState("");
  const [newsletterCtaLink, setNewsletterCtaLink] = useState("");
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [showNewsletterConfirmDialog, setShowNewsletterConfirmDialog] = useState(false);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);

  // Newsletter subscriber filters and sorting
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [subscriberSortBy, setSubscriberSortBy] = useState<"name" | "email" | "date">("date");
  const [subscriberSortOrder, setSubscriberSortOrder] = useState<"asc" | "desc">("desc");
  const [subscriberViewMode, setSubscriberViewMode] = useState<"cards" | "table">("cards");
  const [studentProgress] = useState<StudentProgress[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d" | "month" | "year">("7d");

  // Course management filters and sorting
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>("all");
  const [courseSortBy, setCourseSortBy] = useState<"name" | "price" | "students" | "rating" | "sales" | "revenue">("name");
  const [courseSortOrder, setCourseSortOrder] = useState<"asc" | "desc">("asc");
  const [courseViewMode, setCourseViewMode] = useState<"cards" | "table">("cards");

  // Student management filters and sorting
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<"all" | "with-courses" | "without-courses">("all");
  const [studentDateFilter, setStudentDateFilter] = useState<"all" | "7d" | "30d" | "90d" | "month" | "year">("all");
  const [studentSortBy, setStudentSortBy] = useState<"name" | "email" | "date" | "courses" | "progress" | "spent">("name");
  const [studentSortOrder, setStudentSortOrder] = useState<"asc" | "desc">("asc");
  const [studentViewMode, setStudentViewMode] = useState<"cards" | "table">("cards");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  // Coupon management filters and sorting
  const [couponSearch, setCouponSearch] = useState("");
  const [couponStatusFilter, setCouponStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [couponTypeFilter, setCouponTypeFilter] = useState<"all" | "percentage" | "fixed">("all");
  const [couponSortBy, setCouponSortBy] = useState<"code" | "discount" | "uses" | "expires" | "created">("code");
  const [couponSortOrder, setCouponSortOrder] = useState<"asc" | "desc">("asc");
  const [couponViewMode, setCouponViewMode] = useState<"cards" | "table">("cards");

  // Review management filters and sorting
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [reviewSortBy, setReviewSortBy] = useState<"date" | "rating" | "course" | "user">("date");
  const [reviewSortOrder, setReviewSortOrder] = useState<"asc" | "desc">("desc");
  const [reviewViewMode, setReviewViewMode] = useState<"cards" | "table">("cards");

  // Podcast management filters and sorting
  const [podcastSearch, setPodcastSearch] = useState("");
  const [podcastSortBy, setPodcastSortBy] = useState<"title" | "date" | "duration">("date");
  const [podcastSortOrder, setPodcastSortOrder] = useState<"asc" | "desc">("desc");
  const [podcastViewMode, setPodcastViewMode] = useState<"cards" | "table">("cards");
  
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

  // Home Content Management
  const [homeContentTab, setHomeContentTab] = useState<"logos" | "hero" | "carousel" | "whyChooseUs" | "testimonials" | "newsletter" | "cta">("logos");
  const [homeContentLoading, setHomeContentLoading] = useState(false);
  const [homeContentSaving, setHomeContentSaving] = useState(false);

  // Branding (logo)
  const [brandingLogoUrl, setBrandingLogoUrl] = useState("");
  const [brandingShowBrandName, setBrandingShowBrandName] = useState(true);
  const [brandingLogoUploading, setBrandingLogoUploading] = useState(false);

  // Hero Section
  const [heroBadge, setHeroBadge] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroPrimaryButtonText, setHeroPrimaryButtonText] = useState("");
  const [heroPrimaryButtonAction, setHeroPrimaryButtonAction] = useState("explore");
  const [heroSecondaryButtonText, setHeroSecondaryButtonText] = useState("");
  const [heroSecondaryButtonAction, setHeroSecondaryButtonAction] = useState("podcasts");
  const [heroShowStats, setHeroShowStats] = useState(true);
  const [heroStatsMode, setHeroStatsMode] = useState<"auto" | "manual">("auto");
  const [heroStats, setHeroStats] = useState({
    courses: "",
    students: "50.000+",
    rating: "",
    hours: "",
  });

  // Carousel
  const [carouselImages, setCarouselImages] = useState<Array<{ id?: string; url: string; alt: string; order: number }>>([]);
  const [carouselImageUploading, setCarouselImageUploading] = useState<{ [index: number]: boolean }>({});

  // Why Choose Us
  const [whyChooseUsBadge, setWhyChooseUsBadge] = useState("");
  const [whyChooseUsTitle, setWhyChooseUsTitle] = useState("");
  const [whyChooseUsSubtitle, setWhyChooseUsSubtitle] = useState("");
  const [whyChooseUsCards, setWhyChooseUsCards] = useState<Array<{ icon: string; title: string; description: string; gradientColors: { from: string; to: string } }>>([]);

  // Testimonials
  const [testimonialsBadge, setTestimonialsBadge] = useState("");
  const [testimonialsTitle, setTestimonialsTitle] = useState("");
  const [testimonialsSubtitle, setTestimonialsSubtitle] = useState("");

  // Newsletter
  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterSubtitle, setNewsletterSubtitle] = useState("");
  const [newsletterFeatures, setNewsletterFeatures] = useState<Array<{ text: string }>>([]);

  // CTA
  const [ctaBadge, setCtaBadge] = useState("");
  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaSubtitle, setCtaSubtitle] = useState("");
  const [ctaPrimaryButtonText, setCtaPrimaryButtonText] = useState("");
  const [ctaPrimaryButtonAction, setCtaPrimaryButtonAction] = useState("explore");
  const [ctaSecondaryButtonText, setCtaSecondaryButtonText] = useState("");
  const [ctaSecondaryButtonAction, setCtaSecondaryButtonAction] = useState("free-class");
  const [ctaBenefitCards, setCtaBenefitCards] = useState<Array<{ icon: string; title: string; subtitle: string; iconColor: string }>>([]);

  // Landing (/landing)
  const [landingBanners, setLandingBanners] = useState<Array<{ id?: string; imageUrl: string; alt: string; link: string; order: number }>>([]);
  const [landingBannersLoading, setLandingBannersLoading] = useState(false);
  const [landingBannersSaving, setLandingBannersSaving] = useState(false);
  const [landingBannersPublishedSnapshot, setLandingBannersPublishedSnapshot] = useState<string | null>(null);
  const [landingBannersLastPublishedAt, setLandingBannersLastPublishedAt] = useState<Date | null>(null);
  const [landingModalOpen, setLandingModalOpen] = useState(false);
  const [landingEditingIndex, setLandingEditingIndex] = useState<number | null>(null);
  const [landingDraft, setLandingDraft] = useState<{
    id?: string;
    imageUrl: string;
    alt: string;
    link: string;
    order: number;
  }>({ imageUrl: "", alt: "", link: "", order: 0 });
  const [landingModalUploading, setLandingModalUploading] = useState(false);

  // Theme Management
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [saleEmailLoading, setSaleEmailLoading] = useState(false);
  const [saleEmailSaving, setSaleEmailSaving] = useState(false);
  const [saleEmailActive, setSaleEmailActive] = useState(true);
  const [saleEmailRaw, setSaleEmailRaw] = useState("");
  const [saleEmailList, setSaleEmailList] = useState<Array<{ email: string; createdAt: string }>>([]);
  const [saleEmailFilter, setSaleEmailFilter] = useState("");
  const [themeColors, setThemeColors] = useState<{
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    textPrimary: string;
    textSecondary: string;
    background: string;
    backgroundSecondary: string;
    border: string;
    accent: string;
    danger: string;
    success: string;
    info: string;
  }>({
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#10B981',
    secondaryDark: '#059669',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#E5E7EB',
    accent: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    info: '#6366F1',
  });

  // Form fields - Informações Básicas
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [imagePosition, setImagePosition] = useState("50% 50%");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [_podcastImageFile, setPodcastImageFile] = useState<File | null>(null);
  const [podcastImageUploading, setPodcastImageUploading] = useState(false);
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
  
  // Estados para adicionar benefícios
  const [benefitTitle, setBenefitTitle] = useState("");
  const [benefitDescription, setBenefitDescription] = useState("");
  const [benefitIcon, setBenefitIcon] = useState("Heart");
  
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
                    courseTitle: pc.course?.title || "Curso não encontrado",
                    price: isNaN(finalAmount) ? 0 : finalAmount,
                    date: p.createdAt,
                    paymentStatus: p.paymentStatus,
                    type: 'course',
                  });
                });
              }
              
              // Se a compra tem produtos associados
              if (p.products && p.products.length > 0) {
                // Criar um item para cada produto da compra
                p.products.forEach((pp: any) => {
                  const productPrice = typeof pp.priceAtPurchase === 'string' 
                    ? parseFloat(pp.priceAtPurchase.replace(',', '.')) 
                    : (typeof pp.priceAtPurchase === 'number' ? pp.priceAtPurchase : 0);
                  
                expandedPurchases.push({
                  id: p.id,
                  userId: p.userId,
                  userName: p.user?.name || "Usuário",
                  userEmail: p.user?.email || "",
                  courseId: "",
                    courseTitle: pp.product?.title || "Produto não encontrado",
                    price: productPrice * (pp.quantity || 1),
                    date: p.createdAt,
                    paymentStatus: p.paymentStatus,
                    type: 'product',
                    productId: pp.productId,
                  });
                });
              }
              
              // Se não tem cursos nem produtos, criar um item genérico
              if ((!p.courses || p.courses.length === 0) && (!p.products || p.products.length === 0)) {
                expandedPurchases.push({
                  id: p.id,
                  userId: p.userId,
                  userName: p.user?.name || "Usuário",
                  userEmail: p.user?.email || "",
                  courseId: "",
                  courseTitle: "Compra sem itens",
                  price: isNaN(finalAmount) ? 0 : finalAmount,
                  date: p.createdAt,
                  paymentStatus: p.paymentStatus,
                  type: 'unknown',
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

    if (mainView === "landing") {
      loadLandingBanners();
    }

    if (mainView === "home-content") {
      loadHomeContent();
    }
    if (mainView === "products") {
      loadProducts();
    }
    if (mainView === "sales") {
      loadSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView]);

  // Carregar produtos
  const loadProducts = async () => {
    try {
      const response = await apiClient.getProducts({ page: 1, limit: 100 });
      setProducts(response?.products || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
      setProducts([]);
    }
  };

  // Função para fazer upload de imagem de produto
  const handleProductImageUpload = async (file: File) => {
    try {
      setProductImageUploading(true);
      console.log('📤 Iniciando upload de imagem do produto:', file.name);
      const result = await apiClient.uploadImage(file);
      console.log('✅ Upload concluído. URL recebida:', result.url);
      
      if (!result.url || !result.url.trim()) {
        throw new Error('URL da imagem não foi retornada pelo servidor');
      }
      
      setEditingProduct({ ...editingProduct, image: result.url, imagePosition: "50% 50%" });
      setProductImageFile(null);
      console.log('✅ Estado image atualizado para:', result.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error('❌ Erro no upload de imagem:', error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
      setProductImageFile(null);
    } finally {
      setProductImageUploading(false);
    }
  };

  // Carregar vendas com produtos físicos
  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const response = await apiClient.getAdminPurchases({ page: 1, limit: 100 });
      const purchasesList = response?.purchases || [];
      
      console.log('📦 Compras recebidas:', purchasesList.length);
      console.log('📦 Primeira compra (exemplo):', purchasesList[0]);
      
      // Filtrar apenas compras pagas que têm produtos físicos
      // O backend retorna 'products' não 'productPurchases'
      const salesWithPhysicalProducts = purchasesList
        .filter((p: any) => {
          const hasPaid = p.paymentStatus === 'paid' || p.paymentStatus === 'PAID';
          const hasProducts = (p.products && p.products.length > 0) || (p.productPurchases && p.productPurchases.length > 0);
          return hasPaid && hasProducts;
        })
        .map((p: any) => {
          // Usar 'products' ou 'productPurchases' dependendo do que vier do backend
          const productList = p.products || p.productPurchases || [];
          return {
          ...p,
            physicalProducts: productList.filter((pp: any) => {
              const product = pp.product || pp;
              return product?.type === 'physical' || product?.type === 'PHYSICAL';
            }),
          };
        })
        .filter((p: any) => p.physicalProducts.length > 0);
      
      console.log('📦 Vendas com produtos físicos:', salesWithPhysicalProducts.length);
      setAllPurchases(salesWithPhysicalProducts);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      toast.error("Erro ao carregar vendas");
      setAllPurchases([]);
    } finally {
      setSalesLoading(false);
    }
  };

  // Adicionar comprovante de envio
  const handleAddProof = async () => {
    if (!selectedProductPurchase || !proofFile) {
      toast.error("Selecione um arquivo de comprovante");
      return;
    }

    try {
      setSalesLoading(true);
      
      // Verificar se já existe tracking para este produto
      const existingTracking = selectedProductPurchase.tracking || selectedProductPurchase.shippingTracking;
      
      if (existingTracking) {
        // Se já existe tracking, apenas fazer upload do comprovante
        await apiClient.uploadProofOfDelivery(existingTracking.id, proofFile);
        toast.success("Comprovante de envio adicionado com sucesso!");
      } else {
        // Se não existe tracking, criar um tracking básico primeiro
        const response = await apiClient.addTrackingCode(selectedProductPurchase.id, {});
        
        if (response?.id) {
          await apiClient.uploadProofOfDelivery(response.id, proofFile);
          toast.success("Comprovante de envio adicionado com sucesso!");
        } else {
          toast.error("Erro ao criar registro de envio");
          return;
        }
      }
      
      setProofDialogOpen(false);
      setProofFile(null);
      setSelectedProductPurchase(null);
      loadSales();
    } catch (error: any) {
      console.error("Erro ao adicionar comprovante:", error);
      toast.error(error.message || "Erro ao adicionar comprovante de envio");
    } finally {
      setSalesLoading(false);
    }
  };

  // Fazer upload do comprovante de envio
  const handleUploadProof = async (trackingId: string) => {
    const proofFile = proofFiles[trackingId];
    if (!proofFile) {
      toast.error("Selecione um arquivo para fazer upload");
      return;
    }

    try {
      setUploadingProof(trackingId);
      await apiClient.uploadProofOfDelivery(trackingId, proofFile);
      toast.success("Comprovante de envio enviado com sucesso!");
      setProofFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[trackingId];
        return newFiles;
      });
      loadSales();
    } catch (error: any) {
      console.error("Erro ao fazer upload do comprovante:", error);
      toast.error(error.message || "Erro ao fazer upload do comprovante");
    } finally {
      setUploadingProof(null);
    }
  };

  // Carregar conteúdo da home
  const loadHomeContent = async () => {
    try {
      setHomeContentLoading(true);
      const response = await apiClient.getAdminHomeContent();
      const content = response.content;

      // Preencher formulários com dados existentes
      if (content.branding) {
        setBrandingLogoUrl(content.branding.logoUrl || "");
        setBrandingShowBrandName(content.branding.showBrandName !== false);
      } else {
        setBrandingLogoUrl("");
        setBrandingShowBrandName(true);
      }

      if (content.hero) {
        setHeroBadge(content.hero.badge || "");
        setHeroTitle(content.hero.title || "");
        setHeroSubtitle(content.hero.subtitle || "");
        setHeroPrimaryButtonText(content.hero.primaryButton?.text || "");
        setHeroPrimaryButtonAction(content.hero.primaryButton?.action || "explore");
        setHeroSecondaryButtonText(content.hero.secondaryButton?.text || "");
        setHeroSecondaryButtonAction(content.hero.secondaryButton?.action || "podcasts");
        setHeroShowStats(content.hero.showStats !== false);
        setHeroStatsMode(content.hero.statsMode === "manual" ? "manual" : "auto");
        setHeroStats({
          courses: content.hero.stats?.courses || "",
          students: content.hero.stats?.students || "50.000+",
          rating: content.hero.stats?.rating || "",
          hours: content.hero.stats?.hours || "",
        });
      }

      if (content.carousel) {
        setCarouselImages(content.carousel || []);
      }

      if (content.whyChooseUs) {
        setWhyChooseUsBadge(content.whyChooseUs.badge || "");
        setWhyChooseUsTitle(content.whyChooseUs.title || "");
        setWhyChooseUsSubtitle(content.whyChooseUs.subtitle || "");
        setWhyChooseUsCards(content.whyChooseUs.cards || []);
      }

      if (content.testimonials) {
        setTestimonialsBadge(content.testimonials.badge || "");
        setTestimonialsTitle(content.testimonials.title || "");
        setTestimonialsSubtitle(content.testimonials.subtitle || "");
      }

      if (content.newsletter) {
        setNewsletterTitle(content.newsletter.title || "");
        setNewsletterSubtitle(content.newsletter.subtitle || "");
        setNewsletterFeatures(content.newsletter.features || []);
      }

      if (content.cta) {
        setCtaBadge(content.cta.badge || "");
        setCtaTitle(content.cta.title || "");
        setCtaSubtitle(content.cta.subtitle || "");
        setCtaPrimaryButtonText(content.cta.primaryButton?.text || "");
        setCtaPrimaryButtonAction(content.cta.primaryButton?.action || "explore");
        setCtaSecondaryButtonText(content.cta.secondaryButton?.text || "");
        setCtaSecondaryButtonAction(content.cta.secondaryButton?.action || "free-class");
        setCtaBenefitCards(content.cta.benefitCards || []);
      }
    } catch (error) {
      console.error("Erro ao carregar conteúdo da home:", error);
      toast.error("Erro ao carregar conteúdo da página inicial");
    } finally {
      setHomeContentLoading(false);
    }
  };

  const applyLandingPublishedSnapshot = (
    banners: Array<{ id?: string; imageUrl: string; alt: string; link: string; order: number }>,
    publishedAt?: Date
  ) => {
    setLandingBannersPublishedSnapshot(serializeLandingBanners(banners));
    if (publishedAt) {
      setLandingBannersLastPublishedAt(publishedAt);
    }
  };

  const landingBannersHasUnsavedChanges = useMemo(() => {
    if (landingBannersPublishedSnapshot === null) return false;
    return serializeLandingBanners(landingBanners) !== landingBannersPublishedSnapshot;
  }, [landingBanners, landingBannersPublishedSnapshot]);

  const loadLandingBanners = async () => {
    try {
      setLandingBannersLoading(true);
      const response = await apiClient.getAdminHomeContent();
      const raw = response.content.landingBanners;
      let next: Array<{ id?: string; imageUrl: string; alt: string; link: string; order: number }>;
      if (raw && raw.length > 0) {
        next = [...raw].sort((a, b) => a.order - b.order);
      } else {
        next = LANDING_BANNER_DEFAULTS.map((d, i) => ({
          id: `default-slot-${i}`,
          imageUrl: "",
          alt: d.alt,
          link: d.link,
          order: d.order,
        }));
      }
      setLandingBanners(next);
      applyLandingPublishedSnapshot(next);
    } catch (error) {
      console.error("Erro ao carregar landing:", error);
      toast.error("Erro ao carregar banners da landing");
    } finally {
      setLandingBannersLoading(false);
    }
  };

  const saveLandingBanners = async () => {
    try {
      setLandingBannersSaving(true);
      await apiClient.updateHomeContent({
        landingBanners: landingBanners.map((b, index) => ({
          id: b.id,
          imageUrl: (b.imageUrl || "").trim(),
          alt: b.alt || `Banner ${index + 1}`,
          link: normalizeLandingBannerLink((b.link || "").trim()) || "#",
          order: b.order ?? index,
        })),
      });
      toast.success("Landing publicada com sucesso!");
      applyLandingPublishedSnapshot(landingBanners, new Date());
      await loadLandingBanners();
    } catch (error: any) {
      console.error("Erro ao salvar landing:", error);
      toast.error(error.message || "Erro ao salvar landing");
    } finally {
      setLandingBannersSaving(false);
    }
  };

  const openLandingCreateModal = () => {
    const nextOrder =
      landingBanners.length > 0 ? Math.max(...landingBanners.map((b) => b.order), 0) + 1 : 0;
    setLandingEditingIndex(null);
    setLandingDraft({
      id: `new-${Date.now()}`,
      imageUrl: "",
      alt: `Banner ${landingBanners.length + 1}`,
      link: "",
      order: nextOrder,
    });
    setLandingModalOpen(true);
  };

  const openLandingEditModal = (index: number) => {
    const b = landingBanners[index];
    if (!b) return;
    setLandingEditingIndex(index);
    setLandingDraft({ ...b });
    setLandingModalOpen(true);
  };

  const applyLandingModal = () => {
    const draft = {
      ...landingDraft,
      link: normalizeLandingBannerLink(landingDraft.link) || landingDraft.link.trim(),
    };
    if (landingEditingIndex === null) {
      setLandingBanners((prev) => [...prev, draft]);
    } else {
      setLandingBanners((prev) => {
        const next = [...prev];
        next[landingEditingIndex] = draft;
        return next;
      });
    }
    setLandingModalOpen(false);
    toast.success(
      landingEditingIndex === null ? "Banner adicionado à lista" : "Banner atualizado na lista"
    );
  };

  const deleteLandingFromModal = () => {
    if (landingEditingIndex !== null) {
      setLandingBanners((prev) => prev.filter((_, i) => i !== landingEditingIndex));
      setLandingModalOpen(false);
      toast.success("Banner removido");
    }
  };

  const formatLandingLinkLabel = (link: string) => {
    const t = link.trim();
    if (!t) return "—";
    try {
      if (t.startsWith("http://") || t.startsWith("https://")) {
        const u = new URL(t);
        const path = u.pathname === "/" ? "" : u.pathname;
        const s = `${u.hostname}${path}${u.search ? "…" : ""}`;
        return s.length > 48 ? `${s.slice(0, 45)}…` : s;
      }
    } catch {
      /* URL inválida */
    }
    return t.length > 48 ? `${t.slice(0, 45)}…` : t;
  };

  // Salvar conteúdo da home
  const saveHomeContent = async () => {
    try {
      setHomeContentSaving(true);

      const updateData: any = {};

      if (homeContentTab === "logos") {
        updateData.branding = {
          logoUrl: brandingLogoUrl || "",
          showBrandName: brandingShowBrandName,
        };
      } else if (homeContentTab === "hero") {
        updateData.hero = {
          badge: heroBadge,
          title: heroTitle,
          subtitle: heroSubtitle,
          primaryButton: {
            text: heroPrimaryButtonText,
            action: heroPrimaryButtonAction,
          },
          secondaryButton: {
            text: heroSecondaryButtonText,
            action: heroSecondaryButtonAction,
          },
          showStats: heroShowStats,
          statsMode: heroStatsMode,
          stats: heroStats,
        };
      } else if (homeContentTab === "carousel") {
        updateData.carousel = carouselImages;
      } else if (homeContentTab === "whyChooseUs") {
        updateData.whyChooseUs = {
          badge: whyChooseUsBadge,
          title: whyChooseUsTitle,
          subtitle: whyChooseUsSubtitle,
          cards: whyChooseUsCards,
        };
      } else if (homeContentTab === "testimonials") {
        updateData.testimonials = {
          badge: testimonialsBadge,
          title: testimonialsTitle,
          subtitle: testimonialsSubtitle,
        };
      } else if (homeContentTab === "newsletter") {
        updateData.newsletter = {
          title: newsletterTitle,
          subtitle: newsletterSubtitle,
          features: newsletterFeatures,
        };
      } else if (homeContentTab === "cta") {
        updateData.cta = {
          badge: ctaBadge,
          title: ctaTitle,
          subtitle: ctaSubtitle,
          primaryButton: {
            text: ctaPrimaryButtonText,
            action: ctaPrimaryButtonAction,
          },
          secondaryButton: {
            text: ctaSecondaryButtonText,
            action: ctaSecondaryButtonAction,
          },
          benefitCards: ctaBenefitCards,
        };
      }

      await apiClient.updateHomeContent(updateData);
      toast.success("Conteúdo atualizado com sucesso!");
      await loadHomeContent();
      notifyHomeContentUpdated();
    } catch (error: any) {
      console.error("Erro ao salvar conteúdo:", error);
      toast.error(error.message || "Erro ao salvar conteúdo");
    } finally {
      setHomeContentSaving(false);
    }
  };

  // Função helper para normalizar cores hexadecimais (remove alpha se houver)
  const normalizeHexColor = (color: string): string => {
    if (!color) return color;
    // Remove espaços e converte para maiúsculas
    const cleaned = color.trim().toUpperCase();
    // Se começa com #, remove
    const hex = cleaned.startsWith('#') ? cleaned.slice(1) : cleaned;
    // Se tem 8 caracteres (inclui alpha), remove os últimos 2
    if (hex.length === 8) {
      return `#${hex.slice(0, 6)}`;
    }
    // Se tem 6 caracteres, adiciona #
    if (hex.length === 6) {
      return `#${hex}`;
    }
    // Se tem 3 caracteres (formato curto), expande para 6
    if (hex.length === 3) {
      return `#${hex.split('').map(c => c + c).join('')}`;
    }
    // Retorna como está se não corresponder a nenhum formato conhecido
    return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  };

  // Função helper para atualizar cor com normalização automática
  const updateColor = (key: keyof typeof themeColors, value: string) => {
    const normalized = normalizeHexColor(value);
    setThemeColors({ ...themeColors, [key]: normalized });
  };

  // Carregar tema
  const loadTheme = async () => {
    try {
      setThemeLoading(true);
      const themeData = await apiClient.getAdminTheme();
      setThemeColors({
        primary: themeData.primary,
        primaryDark: themeData.primaryDark,
        primaryLight: themeData.primaryLight,
        secondary: themeData.secondary,
        secondaryDark: themeData.secondaryDark,
        textPrimary: themeData.textPrimary,
        textSecondary: themeData.textSecondary,
        background: themeData.background,
        backgroundSecondary: themeData.backgroundSecondary,
        border: themeData.border,
        accent: themeData.accent,
        danger: themeData.danger,
        success: themeData.success,
        info: themeData.info,
      });
    } catch (error: any) {
      console.error("Erro ao carregar tema:", error);
      toast.error("Erro ao carregar tema");
    } finally {
      setThemeLoading(false);
    }
  };

  // Salvar tema
  const saveTheme = async () => {
    try {
      setThemeSaving(true);
      await apiClient.updateTheme(themeColors);
      toast.success("Cores atualizadas com sucesso!");
      // Aplicar cores imediatamente via CSS variables
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', themeColors.primary);
      root.style.setProperty('--theme-primary-dark', themeColors.primaryDark);
      root.style.setProperty('--theme-primary-light', themeColors.primaryLight);
      root.style.setProperty('--theme-secondary', themeColors.secondary);
      root.style.setProperty('--theme-secondary-dark', themeColors.secondaryDark);
      root.style.setProperty('--theme-text-primary', themeColors.textPrimary);
      root.style.setProperty('--theme-text-secondary', themeColors.textSecondary);
      root.style.setProperty('--theme-background', themeColors.background);
      root.style.setProperty('--theme-background-secondary', themeColors.backgroundSecondary);
      root.style.setProperty('--theme-border', themeColors.border);
      root.style.setProperty('--theme-accent', themeColors.accent);
      root.style.setProperty('--theme-danger', themeColors.danger);
      root.style.setProperty('--theme-success', themeColors.success);
      root.style.setProperty('--theme-info', themeColors.info);
      // Recarregar tema para sincronizar
      await loadTheme();
    } catch (error: any) {
      console.error("Erro ao salvar tema:", error);
      toast.error(error.message || "Erro ao salvar cores");
    } finally {
      setThemeSaving(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const normalizeSaleEmail = (email: string) => email.trim().toLowerCase();

  const formatSaleEmailDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredSaleEmails = saleEmailList.filter((item) =>
    item.email.toLowerCase().includes(saleEmailFilter.trim().toLowerCase())
  );

  const addSaleEmail = () => {
    const email = normalizeSaleEmail(saleEmailRaw);
    if (!email) return;
    if (!isValidEmail(email)) {
      toast.error(`Email inválido: ${saleEmailRaw}`);
      return;
    }
    if (saleEmailList.some((item) => item.email === email)) {
      toast.info("Este email já foi adicionado.");
      setSaleEmailRaw("");
      return;
    }
    setSaleEmailList([
      ...saleEmailList,
      { email, createdAt: new Date().toISOString() },
    ]);
    setSaleEmailRaw("");
  };

  const removeSaleEmail = (email: string) => {
    setSaleEmailList(saleEmailList.filter((item) => item.email !== email));
  };

  const loadSaleEmailSettings = async () => {
    try {
      setSaleEmailLoading(true);
      const settings = await apiClient.getSaleEmailSettings();
      setSaleEmailActive(settings.active);
      setSaleEmailList(settings.recipients || []);
      setSaleEmailRaw("");
    } catch (error: any) {
      console.error("Erro ao carregar emails de venda:", error);
      toast.error(error.message || "Erro ao carregar emails de venda");
    } finally {
      setSaleEmailLoading(false);
    }
  };

  const saveSaleEmailSettings = async () => {
    try {
      setSaleEmailSaving(true);
      await apiClient.updateSaleEmailSettings({
        active: saleEmailActive,
        recipientEmails: saleEmailList.map((item) => item.email),
      });
      toast.success("Emails de venda atualizados com sucesso!");
      await loadSaleEmailSettings();
    } catch (error: any) {
      console.error("Erro ao salvar emails de venda:", error);
      toast.error(error.message || "Erro ao salvar emails de venda");
    } finally {
      setSaleEmailSaving(false);
    }
  };

  // Carregar tema quando a view mudar para theme
  useEffect(() => {
    if (mainView === "theme") {
      loadTheme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView]);

  useEffect(() => {
    if (mainView === "sale-email") {
      loadSaleEmailSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        imagePosition: imagePosition || "50% 50%",
        // Campos de conteúdo
        videoUrl: videoUrl && videoUrl.trim() && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) ? videoUrl.trim() : undefined,
        aboutCourse: aboutCourse || undefined,
        // Campos numéricos
        lessons: lessons ? parseInt(lessons) : undefined,
        students: students ? parseInt(students) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        // Materiais de apoio (bonuses) - formato: { icon, title, description }
        // Só enviar se houver materiais válidos (com nome)
        ...(supportMaterials.length > 0 && supportMaterials.some(m => m.name?.trim())
          ? {
              bonuses: supportMaterials
                .filter(m => m.name?.trim()) // Filtrar apenas materiais com nome válido
                .map(m => ({
              icon: 'FileText',
                  title: (m.name || '').trim() || 'Material de Apoio',
                  description: (typeof m.url === 'string' ? m.url.trim() : undefined) || undefined,
                })),
            }
          : {}),
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

  const handleEdit = async (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSubtitle(course.subtitle);
    setDescription(course.description);
    setPrice(course.price.toString());
    setOriginalPrice(course.originalPrice?.toString() || "");
    setCategory(course.category);
    setImage(course.image);
    setImagePosition((course as any).imagePosition || "50% 50%");
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
    const courseBenefits = Array.isArray(course.benefits) ? course.benefits : (course.benefits ? [course.benefits] : []);
    setBenefits(courseBenefits);
    setIsDialogOpen(true);

    // Listagem pública omite videoUrl por segurança — buscar módulos completos (admin autenticado)
    try {
      const modulesResponse = await apiClient.getCourseModules(course.id);
      const fullModules = modulesResponse?.modules || [];
      setModules(
        fullModules.map((m: any) => ({
          id: m.id,
          title: m.title,
          duration: m.duration || "",
          lessons: (m.lessons || [])
            .slice()
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
            .map((l: any) => ({
              id: l.id,
              title: l.title,
              duration: l.duration || "",
              videoUrl: l.videoUrl || "",
              videoFile: undefined,
            })),
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar módulos do curso:", error);
      setModules(
        course.modules?.map((m) => ({
          id: (m as any).id,
          title: m.title,
          duration: m.duration,
          lessons: m.lessons.map((l) => ({
            id: (l as any).id,
            title: l.title,
            duration: l.duration,
            videoUrl: (l as any).videoUrl || "",
            videoFile: (l as any).videoFile,
          })),
        })) || []
      );
      toast.error("Não foi possível carregar os vídeos das aulas. Recarregue e tente de novo.");
    }
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

  // Função para fazer upload de imagem de podcast
  const handlePodcastImageUpload = async (file: File) => {
    try {
      setPodcastImageUploading(true);
      console.log('📤 Iniciando upload de imagem do podcast:', file.name);
      const result = await apiClient.uploadImage(file);
      console.log('✅ Upload concluído. URL recebida:', result.url);
      
      if (!result.url || !result.url.trim()) {
        throw new Error('URL da imagem não foi retornada pelo servidor');
      }
      
      setImage(result.url);
      setPodcastImageFile(null);
      console.log('✅ Estado image atualizado para:', result.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error('❌ Erro no upload de imagem:', error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
      setPodcastImageFile(null);
    } finally {
      setPodcastImageUploading(false);
    }
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
      setImagePosition("50% 50%");
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
    setImagePosition("50% 50%");
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
    setBenefitTitle("");
    setBenefitDescription("");
    setBenefitIcon("Heart");
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
      courseId: course.id,
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

  // Função para obter estatísticas de um curso
  const getCourseStats = (courseId: string) => {
    const stats = revenuePerCourse.find(c => c.courseId === courseId);
    return {
      sales: stats?.sales || 0,
      revenue: stats?.revenue || 0,
    };
  };

  // Obter categorias únicas dos cursos
  const courseCategories = Array.from(new Set(courses.map(c => c.category))).sort();

  // Função para calcular estatísticas de um aluno
  const getStudentStats = (user: User) => {
    const userPurchases = purchases.filter(p => {
      const emailMatch = p.userEmail?.toLowerCase() === user.email?.toLowerCase();
      const isPaid = p.paymentStatus === 'paid';
      return emailMatch && isPaid;
    });
    const userProgressData = studentProgress.filter(p => p.userId === user.email);
    const avgProgress = userProgressData.length > 0
      ? userProgressData.reduce((acc, p) => acc + p.progress, 0) / userProgressData.length
      : 0;
    const totalSpent = userPurchases.reduce((acc, p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0);
      return acc + Math.max(0, price);
    }, 0);
    const registeredDate = new Date(user.registeredAt);
    const daysSinceRegistration = Math.floor((Date.now() - registeredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Último acesso seria o último progresso registrado
    const lastAccess = userProgressData.length > 0
      ? new Date(Math.max(...userProgressData.map(p => new Date(p.lastAccessed).getTime())))
      : null;

    return {
      purchases: userPurchases,
      progressData: userProgressData,
      avgProgress,
      totalSpent,
      daysSinceRegistration,
      lastAccess,
      coursesCount: userPurchases.length,
    };
  };

  // Filtrar e ordenar alunos
  const filteredAndSortedStudents = users
    .map(user => ({
      ...user,
      ...getStudentStats(user),
    }))
    .filter(student => {
      // Busca por nome ou email
      if (studentSearch) {
        const searchLower = studentSearch.toLowerCase();
        if (!student.name.toLowerCase().includes(searchLower) && 
            !student.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por status
      if (studentStatusFilter === "with-courses" && student.coursesCount === 0) {
        return false;
      }
      if (studentStatusFilter === "without-courses" && student.coursesCount > 0) {
        return false;
      }
      
      // Filtro por data de cadastro
      if (studentDateFilter !== "all") {
        const registeredDate = new Date(student.registeredAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - registeredDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (studentDateFilter) {
          case "7d":
            if (daysDiff > 7) return false;
            break;
          case "30d":
            if (daysDiff > 30) return false;
            break;
          case "90d":
            if (daysDiff > 90) return false;
            break;
          case "month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            if (registeredDate < monthStart) return false;
            break;
          case "year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            if (registeredDate < yearStart) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (studentSortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "date":
          comparison = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
          break;
        case "courses":
          comparison = a.coursesCount - b.coursesCount;
          break;
        case "progress":
          comparison = a.avgProgress - b.avgProgress;
          break;
        case "spent":
          comparison = a.totalSpent - b.totalSpent;
          break;
      }
      return studentSortOrder === "asc" ? comparison : -comparison;
    });

  // Filtrar e ordenar cursos
  const filteredAndSortedCourses = courses
    .filter(course => {
      // Busca por título
      if (courseSearch && !course.title.toLowerCase().includes(courseSearch.toLowerCase())) {
        return false;
      }
      // Filtro por categoria
      if (courseCategoryFilter !== "all" && course.category !== courseCategoryFilter) {
        return false;
      }
      // Filtro por status (assumindo que cursos sempre estão ativos por enquanto)
      // Você pode adicionar um campo 'active' no curso depois
      return true;
    })
    .map(course => ({
      ...course,
      ...getCourseStats(course.id),
    }))
    .sort((a, b) => {
      let comparison = 0;
      switch (courseSortBy) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "price":
          const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          comparison = priceA - priceB;
          break;
        case "students":
          comparison = a.students - b.students;
          break;
        case "rating":
          comparison = parseFloat(a.rating.toString()) - parseFloat(b.rating.toString());
          break;
        case "sales":
          comparison = a.sales - b.sales;
          break;
        case "revenue":
          comparison = a.revenue - b.revenue;
          break;
      }
      return courseSortOrder === "asc" ? comparison : -comparison;
    });

  // Função para calcular estatísticas de um cupom
  const getCouponStats = (coupon: Coupon) => {
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
    const usagePercent = (coupon.currentUses / coupon.maxUses) * 100;
    const daysUntilExpiry = coupon.expiresAt 
      ? Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Calcular receita gerada (precisaria de dados de compras com cupom)
    // Por enquanto, vamos usar um placeholder
    const revenueGenerated = 0; // Poderia ser calculado se tivermos dados de compras

    return {
      isExpired,
      usagePercent,
      daysUntilExpiry,
      revenueGenerated,
      usageRate: coupon.maxUses > 0 ? (coupon.currentUses / coupon.maxUses) * 100 : 0,
    };
  };

  // Filtrar e ordenar cupons
  const filteredAndSortedCoupons = coupons
    .map(coupon => ({
      ...coupon,
      ...getCouponStats(coupon),
    }))
    .filter(coupon => {
      // Busca por código
      if (couponSearch && !coupon.code.toLowerCase().includes(couponSearch.toLowerCase())) {
        return false;
      }
      
      // Filtro por status
      if (couponStatusFilter === "active" && (!coupon.active || coupon.isExpired)) {
        return false;
      }
      if (couponStatusFilter === "inactive" && coupon.active && !coupon.isExpired) {
        return false;
      }
      if (couponStatusFilter === "expired" && !coupon.isExpired) {
        return false;
      }
      
      // Filtro por tipo
      if (couponTypeFilter !== "all" && coupon.type !== couponTypeFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (couponSortBy) {
        case "code":
          comparison = a.code.localeCompare(b.code);
          break;
        case "discount":
          comparison = a.discount - b.discount;
          break;
        case "uses":
          comparison = a.currentUses - b.currentUses;
          break;
        case "expires":
          if (!a.expiresAt && !b.expiresAt) comparison = 0;
          else if (!a.expiresAt) comparison = 1;
          else if (!b.expiresAt) comparison = -1;
          else comparison = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          break;
        case "created":
          // Assumindo que há um campo createdAt, senão usar id como fallback
          comparison = (a as any).createdAt 
            ? new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
            : 0;
          break;
      }
      return couponSortOrder === "asc" ? comparison : -comparison;
    });

  // Filtrar e ordenar vendas
  const filteredAndSortedSales = allPurchases
    .filter((purchase: any) => {
      // Busca por cliente, email ou ID da compra
      if (salesSearch) {
        const searchLower = salesSearch.toLowerCase();
        const customerName = purchase.user?.name?.toLowerCase() || '';
        const customerEmail = purchase.user?.email?.toLowerCase() || '';
        const purchaseId = purchase.id.toLowerCase();
        
        if (!customerName.includes(searchLower) && 
            !customerEmail.includes(searchLower) &&
            !purchaseId.includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por status de comprovante
      if (salesStatusFilter === "with-proof") {
        const hasProof = purchase.physicalProducts?.some((pp: any) => {
          const tracking = pp.tracking || pp.shippingTracking;
          return tracking && tracking.proofOfDeliveryUrl;
        });
        if (!hasProof) return false;
      }
      if (salesStatusFilter === "without-proof") {
        const hasProof = purchase.physicalProducts?.some((pp: any) => {
          const tracking = pp.tracking || pp.shippingTracking;
          return tracking && tracking.proofOfDeliveryUrl;
        });
        if (hasProof) return false;
      }
      
      // Filtro por data
      if (salesDateFilter !== "all") {
        const purchaseDate = new Date(purchase.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (salesDateFilter) {
          case "7d":
            if (daysDiff > 7) return false;
            break;
          case "30d":
            if (daysDiff > 30) return false;
            break;
          case "90d":
            if (daysDiff > 90) return false;
            break;
          case "month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            if (purchaseDate < monthStart) return false;
            break;
          case "year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            if (purchaseDate < yearStart) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      switch (salesSortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "total":
          const totalA = typeof a.finalAmount === 'string' ? parseFloat(a.finalAmount) : a.finalAmount || 0;
          const totalB = typeof b.finalAmount === 'string' ? parseFloat(b.finalAmount) : b.finalAmount || 0;
          comparison = totalA - totalB;
          break;
        case "customer":
          const nameA = a.user?.name || '';
          const nameB = b.user?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case "products":
          const productsA = a.physicalProducts?.length || 0;
          const productsB = b.physicalProducts?.length || 0;
          comparison = productsA - productsB;
          break;
      }
      return salesSortOrder === "asc" ? comparison : -comparison;
    });

  // Filtrar e ordenar avaliações
  const filteredAndSortedReviews = reviews
    .filter(review => {
      // Busca por nome do usuário, email, curso ou comentário
      if (reviewSearch) {
        const searchLower = reviewSearch.toLowerCase();
        if (!review.userName.toLowerCase().includes(searchLower) &&
            !review.userEmail.toLowerCase().includes(searchLower) &&
            !review.courseTitle.toLowerCase().includes(searchLower) &&
            !review.comment.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por status
      if (reviewStatusFilter === "approved" && !review.approved) {
        return false;
      }
      if (reviewStatusFilter === "pending" && review.approved) {
        return false;
      }
      
      // Filtro por avaliação
      if (reviewRatingFilter !== "all" && review.rating !== parseInt(reviewRatingFilter)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (reviewSortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "rating":
          comparison = a.rating - b.rating;
          break;
        case "course":
          comparison = a.courseTitle.localeCompare(b.courseTitle);
          break;
        case "user":
          comparison = a.userName.localeCompare(b.userName);
          break;
      }
      return reviewSortOrder === "asc" ? comparison : -comparison;
    });

  // Filtrar e ordenar podcasts
  const filteredAndSortedPodcasts = podcasts
    .filter(podcast => {
      // Busca por título ou descrição
      if (podcastSearch) {
        const searchLower = podcastSearch.toLowerCase();
        const title = (podcast.title || "").toLowerCase();
        const description = (podcast.description || "").toLowerCase();
        if (!title.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (podcastSortBy) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "date":
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "duration":
          const durationA = parseInt(a.duration?.replace(/\D/g, "") || "0");
          const durationB = parseInt(b.duration?.replace(/\D/g, "") || "0");
          comparison = durationA - durationB;
          break;
      }
      return podcastSortOrder === "asc" ? comparison : -comparison;
    });

  // Filtrar e ordenar inscritos da newsletter
  const filteredAndSortedSubscribers = newsletterSubscribers
    .filter(subscriber => {
      // Busca por nome ou email
      if (subscriberSearch) {
        const searchLower = subscriberSearch.toLowerCase();
        if (!(subscriber.name || "").toLowerCase().includes(searchLower) &&
            !subscriber.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por status
      if (subscriberStatusFilter === "active" && !subscriber.active) {
        return false;
      }
      if (subscriberStatusFilter === "inactive" && subscriber.active) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (subscriberSortBy) {
        case "name":
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "date":
          comparison = new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime();
          break;
      }
      return subscriberSortOrder === "asc" ? comparison : -comparison;
    });

  // Obter última campanha para exibir no card
  const lastCampaign = newsletterCampaigns.length > 0 ? newsletterCampaigns[0] : null;

  // Função para calcular período baseado na seleção
  const getPeriodDates = (period: "7d" | "30d" | "90d" | "month" | "year") => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 6);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 29);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 89);
        break;
      case "month":
        startDate.setDate(1);
        break;
      case "year":
        startDate.setMonth(0, 1);
        break;
    }
    
    return { startDate, endDate };
  };

  // Dados para gráficos baseado no período selecionado
  const { startDate: periodStartDate, endDate: periodEndDate } = getPeriodDates(selectedPeriod);
  const daysDiff = Math.ceil((periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const periodDays = Array.from({ length: daysDiff + 1 }, (_, i) => {
    const date = new Date(periodStartDate);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const salesByDay = periodDays.map(date => {
    const daySales = paidPurchases.filter(p => {
      const purchaseDate = p.date.split('T')[0];
      return purchaseDate === date;
    });
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      vendas: daySales.length,
      receita: daySales.reduce((acc, p) => {
        const price = typeof p.price === 'string' ? parseFloat(p.price) || 0 : (p.price || 0);
        return acc + Math.max(0, Number(price));
      }, 0),
    };
  });

  // Dados para gráfico de crescimento de alunos
  const studentsGrowthByDay = periodDays.map(date => {
    const studentsUntilDate = users.filter(u => {
      // Usar data de registro se disponível
      const userDate = u.registeredAt ? new Date(u.registeredAt).toISOString().split('T')[0] : null;
      return !userDate || userDate <= date;
    });
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      alunos: studentsUntilDate.length,
    };
  });

  // Filtrar compras do período selecionado
  const periodPurchases = paidPurchases.filter(p => {
    const purchaseDate = new Date(p.date);
    return purchaseDate >= periodStartDate && purchaseDate <= periodEndDate;
  });

  // Calcular métricas do período
  const periodRevenue = periodPurchases.reduce((acc, p) => {
    const price = typeof p.price === 'string' ? parseFloat(p.price) || 0 : (p.price || 0);
    return acc + Math.max(0, Number(price));
  }, 0);

  const periodSales = periodPurchases.length;
  const periodAverageTicket = periodSales > 0 ? periodRevenue / periodSales : 0;

  // Taxa de conversão (simplificada - vendas / total de usuários)
  const conversionRate = totalStudents > 0 ? ((periodSales / totalStudents) * 100) : 0;

  // Últimas vendas (ordenadas por data, mais recentes primeiro)
  const latestPurchases = [...paidPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const courseColors = ['#3b82f6', '#14b8a6', '#2563eb', '#f59e0b', '#ef4444', '#10b981'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 scroll-smooth">
      {/* Mobile Header & Navigation */}
      <div className="lg:hidden">
        <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white pt-24 pb-6 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
              className="text-white hover:bg-gray-800/10 mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
            <h1 className="text-2xl font-bold mb-2">
                Painel Administrativo
              </h1>
            <p className="text-sm text-gray-300">
                Gerencie sua plataforma de forma completa
              </p>
            </div>
        </section>

        {/* Mobile Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 sticky top-[200px] z-20">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 px-4 py-3 min-w-max">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "courses", label: "Cursos", icon: BookOpen },
                { id: "products", label: "Produtos", icon: Package },
                { id: "sales", label: "Vendas", icon: ShoppingCart },
                { id: "students", label: "Alunos", icon: Users },
                { id: "revenue", label: "Faturamento", icon: TrendingUp },
                { id: "coupons", label: "Cupons", icon: Ticket },
                { id: "reviews", label: "Avaliações", icon: MessageSquare },
                { id: "podcasts", label: "Podcasts", icon: Headphones },
                { id: "newsletter", label: "Newsletter", icon: Mail },
                { id: "support", label: "Suporte", icon: MessageCircle },
                { id: "landing", label: "Landing", icon: Images },
                { id: "home-content", label: "Conteúdo", icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = mainView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMainView(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] lg:mt-16">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-gray-800 border-r border-gray-700 shadow-sm min-h-[calc(120vh-4rem)] sticky top-16 self-start">
          <div className="p-6 border-b border-gray-700 flex-shrink-0 bg-gray-800">
                  <Button
              variant="ghost"
              className="text-gray-300 hover:bg-gray-700 -ml-2 w-full justify-start"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
                  </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "courses", label: "Cursos", icon: BookOpen },
              { id: "products", label: "Produtos", icon: Package },
              { id: "sales", label: "Vendas", icon: ShoppingCart },
              { id: "students", label: "Alunos", icon: Users },
              { id: "revenue", label: "Faturamento", icon: TrendingUp },
              { id: "coupons", label: "Cupons", icon: Ticket },
              { id: "reviews", label: "Avaliações", icon: MessageSquare },
              { id: "podcasts", label: "Podcasts", icon: Headphones },
              { id: "newsletter", label: "Newsletter", icon: Mail },
              { id: "sale-email", label: "Email de Vendas", icon: Mail },
              { id: "support", label: "Suporte", icon: MessageCircle },
              { id: "landing", label: "Landing", icon: Images },
              { id: "home-content", label: "Conteúdo", icon: Sparkles },
              { id: "theme", label: "Tema", icon: Palette },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = mainView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMainView(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                      ? "bg-blue-600 text-white border-l-4 border-blue-400 font-semibold"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full lg:w-auto overflow-y-auto bg-gray-900">
          <div className="container mx-auto px-4 lg:px-8 pt-6 pb-4 sm:pt-8 sm:pb-6 lg:pt-12">
            {/* Stats - Only show on Dashboard and Revenue pages */}
            {(mainView === "dashboard" || mainView === "revenue") && (
              <>
                {/* Filtro de Período */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <Button
                    variant={selectedPeriod === "7d" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("7d")}
                    className={selectedPeriod === "7d" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                  >
                    7 Dias
                  </Button>
                  <Button
                    variant={selectedPeriod === "30d" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("30d")}
                    className={selectedPeriod === "30d" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                  >
                    30 Dias
                  </Button>
                  <Button
                    variant={selectedPeriod === "90d" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("90d")}
                    className={selectedPeriod === "90d" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                  >
                    90 Dias
                  </Button>
                  <Button
                    variant={selectedPeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("month")}
                    className={selectedPeriod === "month" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                  >
                    Mês Atual
                  </Button>
                  <Button
                    variant={selectedPeriod === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("year")}
                    className={selectedPeriod === "year" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"}
                  >
                    Ano Atual
                  </Button>
                </div>

                {/* Cards de Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white break-words">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Faturamento Total</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white">{totalSales}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Total de Vendas</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white">{totalStudents}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Alunos Cadastrados</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white">{totalCourses}</div>
                    <div className="text-xs sm:text-sm text-gray-400">Cursos Ativos</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white">
                      R$ {periodAverageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Ticket Médio</div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-bold text-xl sm:text-2xl lg:text-3xl mb-1 text-white">
                      {conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Taxa de Conversão</div>
                  </div>
                </div>
              </>
            )}

            {/* Course Dialog - Outside header section */}
            {mainView === "courses" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-[75vw] xl:!max-w-[65vw] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-800 border-gray-700">
                  <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-700 mb-4 sm:mb-6">
                    <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      {editingCourse ? "Editar Curso" : "Criar Novo Curso"}
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 text-gray-400">
                      {editingCourse ? "Edite as informações do curso abaixo" : "Preencha os dados para criar um novo curso"}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-700 rounded-lg mb-4 sm:mb-6 lg:mb-8">
                      <button
                        type="button"
                        className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${currentTab === "info"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-300 hover:bg-gray-600"
                        }`}
                        onClick={() => setCurrentTab("info")}
                      >
                        Informações Básicas
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${currentTab === "content"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-300 hover:bg-gray-600"
                        }`}
                        onClick={() => setCurrentTab("content")}
                      >
                        Conteúdo
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-md transition-all font-medium text-sm sm:text-base ${currentTab === "modules"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-300 hover:bg-gray-600"
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
                            <div className="border-b border-gray-700 pb-2 sm:pb-3">
                              <h3 className="text-base sm:text-lg font-semibold text-white">Informações Principais</h3>
                              <p className="text-xs sm:text-sm text-gray-400 mt-1">Dados básicos do curso</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <Label htmlFor="title" className="text-sm sm:text-base font-medium text-gray-300">Título *</Label>
                                <Input
                                  id="title"
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                  placeholder="Nome do curso"
                                  className="mt-2 h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                {errors.title && (
                                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                                    {errors.title}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="subtitle" className="text-sm sm:text-base font-medium text-gray-300">Subtítulo *</Label>
                                <Input
                                  id="subtitle"
                                  value={subtitle}
                                  onChange={(e) => setSubtitle(e.target.value)}
                                  placeholder="Breve descrição"
                                  className="mt-2 h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                {errors.subtitle && (
                                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                                    {errors.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-300">Descrição *</Label>
                              <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descrição completa do curso"
                                rows={4}
                                className="mt-2 resize-none text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              />
                              {errors.description && (
                                <p className="text-xs sm:text-sm text-red-500 mt-1">
                                  {errors.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Seção: Preços e Categoria */}
                          <div className="space-y-6 sm:space-y-8 bg-gray-900 p-6 sm:p-8 lg:p-10 rounded-lg border">
                            <div className="border-b border-gray-700 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Preços e Categoria</h3>
                              <p className="text-sm sm:text-base text-gray-400 mt-2">Configure os valores e classificação</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                              <div className="space-y-2">
                                <Label htmlFor="price" className="text-base sm:text-lg font-medium text-white">Preço (R$) *</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  value={price}
                                  onChange={(e) => setPrice(e.target.value)}
                                  placeholder="297.00"
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                {errors.price && (
                                  <p className="text-sm text-red-500 mt-2">
                                    {errors.price}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="originalPrice" className="text-base sm:text-lg font-medium text-white">Preço Original (R$)</Label>
                                <Input
                                  id="originalPrice"
                                  type="number"
                                  step="0.01"
                                  value={originalPrice}
                                  onChange={(e) => setOriginalPrice(e.target.value)}
                                  placeholder="497.00"
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>

                              <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                                <Label htmlFor="category" className="text-base sm:text-lg font-medium text-white">Categoria *</Label>
                                <Input
                                  id="category"
                                  value={category}
                                  onChange={(e) => setCategory(e.target.value)}
                                  placeholder="Relacionamentos, Ansiedade, etc."
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                          <div className="space-y-6 sm:space-y-8 bg-gray-900 p-6 sm:p-8 lg:p-10 rounded-lg border">
                            <div className="border-b border-gray-700 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Mídia e Instrutor</h3>
                              <p className="text-sm sm:text-base text-gray-400 mt-2">Imagem e informações do instrutor</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                              <div className="space-y-2">
                                <Label htmlFor="image" className="text-base sm:text-lg font-medium text-white">Imagem do Curso *</Label>
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
                                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                                    <div className="mt-3 space-y-2">
                                      <ImagePositionEditor
                                        src={image}
                                        alt="Preview da capa do curso"
                                        position={imagePosition}
                                        onChange={setImagePosition}
                                      />
                                      <p className="text-sm text-gray-400">Arraste a imagem para mostrar o enquadramento desejado</p>
                                    </div>
                                  )}
                                  {image && image.trim() && !image.startsWith('http://') && !image.startsWith('https://') && (
                                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                                      <p className="text-sm text-yellow-400">Aguardando URL da imagem...</p>
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
                                <Label htmlFor="instructor" className="text-base sm:text-lg font-medium text-white">Instrutor *</Label>
                                <Input
                                  id="instructor"
                                  value={instructor}
                                  onChange={(e) => setInstructor(e.target.value)}
                                  placeholder="Nome do instrutor"
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                                <Label htmlFor="duration" className="text-base sm:text-lg font-medium text-white">Duração *</Label>
                                <Input
                                  id="duration"
                                  value={duration}
                                  onChange={(e) => setDuration(e.target.value)}
                                  placeholder="Ex: 20h, 30h"
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                {errors.duration && (
                                  <p className="text-sm text-red-500 mt-2">
                                    {errors.duration}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="lessons" className="text-base sm:text-lg font-medium text-white">Número de Aulas *</Label>
                                <Input
                                  id="lessons"
                                  type="number"
                                  value={lessons}
                                  onChange={(e) => setLessons(e.target.value)}
                                  placeholder="Ex: 10, 20"
                                  className="mt-2 h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                            <div className="border-b border-gray-700 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Conteúdo do Curso</h3>
                              <p className="text-sm sm:text-base text-gray-400 mt-2">Vídeo de apresentação e informações adicionais</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="videoUrl" className="text-base sm:text-lg font-medium text-white">Vídeo de Apresentação do Curso</Label>
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
                                  className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                                  <p className="text-sm text-gray-400">
                                  Tamanho: {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                  {videoFile.size > 50 * 1024 * 1024 && (
                                    <span className="text-orange-600 ml-2">
                                      ⚠️ Recomendado: menos de 50 MB para melhor performance
                                    </span>
                                  )}
                                </p>
                              )}
                                <div className="rounded-lg p-3 mt-2" style={{ backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)', borderColor: 'var(--theme-primary-light)' }}>
                                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-primary-dark)' }}>💡 Dica de Performance:</p>
                                  <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--theme-primary)' }}>
                                  <li>Vídeos menores carregam mais rápido para os alunos</li>
                                  <li>Recomendado: máximo 50 MB para vídeos de apresentação</li>
                                  <li>Use ferramentas como HandBrake ou FFmpeg para comprimir</li>
                                  <li>Resolução recomendada: 720p ou 1080p (não 4K)</li>
                                </ul>
                              </div>
                              {videoUrl && (
                                  <div className="mt-3 space-y-2">
                                    <div className="rounded-lg border border-gray-600 bg-black overflow-hidden">
                                      <video
                                        src={videoUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full aspect-video max-h-64 object-contain bg-black"
                                      />
                                    </div>
                                    <p className="text-sm text-gray-400">Vídeo atual</p>
                                    <p className="text-xs break-all" style={{ color: 'var(--theme-primary-light)' }}>{videoUrl}</p>
                                </div>
                              )}
                            </div>
                          </div>

                            <div className="space-y-2">
                              <Label htmlFor="aboutCourse" className="text-base sm:text-lg font-medium text-white">Sobre o Curso</Label>
                            <Textarea
                              id="aboutCourse"
                              value={aboutCourse}
                              onChange={(e) => setAboutCourse(e.target.value)}
                              placeholder="Informações detalhadas sobre o curso..."
                                rows={8}
                                className="mt-2 resize-none text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>

                            {/* Seção: Materiais de Apoio */}
                            <div className="space-y-4 sm:space-y-6 border-t border-gray-700 pt-6 sm:pt-8">
                              <div className="border-b border-gray-700 pb-4 sm:pb-5">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Materiais de Apoio</h3>
                                <p className="text-sm sm:text-base text-gray-400 mt-2">Adicione arquivos PDF, DOC, XLS para download pelos alunos</p>
                              </div>

                              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 sm:p-8 text-center transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--theme-primary-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                              >
                                <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm sm:text-base text-gray-400 mb-2">
                                  Arraste e solte arquivos aqui ou
                                </p>
                            <input
                              type="file"
                                  id="materialUpload"
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                                  multiple
                              onChange={async (e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      for (const file of Array.from(files)) {
                                        // Verificar tamanho (10MB)
                                if (file.size > 10 * 1024 * 1024) {
                                          toast.error(`${file.name} excede 10MB`);
                                          continue;
                                        }
                                        try {
                                          const url = await apiClient.uploadDocument(file);
                                          setSupportMaterials([...supportMaterials, { name: file.name, url }]);
                                          toast.success(`${file.name} enviado com sucesso!`);
                                } catch (error: any) {
                                          toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
                                        }
                                      }
                                      e.target.value = '';
                                    }
                                  }}
                                  className="hidden"
                                />
                                    <Button
                                      type="button"
                                      variant="outline"
                                  onClick={() => document.getElementById('materialUpload')?.click()}
                                  className="mt-3 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Selecionar Arquivos
                                    </Button>
                                <p className="text-xs sm:text-sm text-gray-400 mt-3">
                                  PDF, DOC, XLS até 10MB
                                </p>
                            </div>

                            {supportMaterials.length > 0 && (
                              <div className="space-y-2">
                                {supportMaterials.map((material, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                                        <span className="text-sm sm:text-base text-white truncate">{material.name}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSupportMaterials(supportMaterials.filter((_, i) => i !== index));
                                      }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                            {/* Seção: O Que Você Vai Aprender (Benefícios) */}
                            <div className="space-y-4 sm:space-y-6 border-t border-gray-700 pt-6 sm:pt-8">
                              <div className="border-b border-gray-700 pb-4 sm:pb-5">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">O Que Você Vai Aprender (Benefícios)</h3>
                                <p className="text-sm sm:text-base text-gray-400 mt-2">Adicione os principais benefícios e aprendizados do curso</p>
                              </div>

                              <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                                  <div className="sm:col-span-5">
                                <Input
                                  placeholder="Título do benefício"
                                  value={benefitTitle}
                                  onChange={(e) => setBenefitTitle(e.target.value)}
                                      className="text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                  </div>
                                  <div className="sm:col-span-5">
                                    <Input
                                  placeholder="Descrição do benefício"
                                  value={benefitDescription}
                                  onChange={(e) => setBenefitDescription(e.target.value)}
                                      className="text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                                  </div>
                                  <div className="sm:col-span-2">
                                  <select
                                    value={benefitIcon}
                                    onChange={(e) => setBenefitIcon(e.target.value)}
                                      className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm sm:text-base"
                                    style={{ colorScheme: 'dark' }}
                                  >
                                    <option value="Heart" className="bg-gray-700 text-white">Coração</option>
                                    <option value="Brain" className="bg-gray-700 text-white">Cérebro</option>
                                      <option value="Award" className="bg-gray-700 text-white">Troféu</option>
                                      <option value="Target" className="bg-gray-700 text-white">Alvo</option>
                                      <option value="Sparkles" className="bg-gray-700 text-white">Estrela</option>
                                      <option value="CheckCircle2" className="bg-gray-700 text-white">Check</option>
                                  </select>
                                  </div>
                                </div>
                                  <Button
                                    type="button"
                                  variant="outline"
                                    onClick={() => {
                                    if (benefitTitle.trim()) {
                                      setBenefits([...benefits, { icon: benefitIcon || 'Heart', title: benefitTitle, description: benefitDescription }]);
                                      setBenefitTitle('');
                                      setBenefitDescription('');
                                      setBenefitIcon('Heart');
                                    }
                                  }}
                                  className="w-full sm:w-auto bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Benefício
                                  </Button>
                              </div>

                              {benefits.length > 0 && (
                                <div className="space-y-2">
                                  {benefits.map((benefit, index) => {
                                    const IconComponent = (LucideIcons as any)[benefit.icon] || Heart;
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700"
                                      >
                                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm sm:text-base font-semibold text-white">{benefit.title}</p>
                                          {benefit.description && (
                                            <p className="text-xs sm:text-sm text-gray-400 mt-1">{benefit.description}</p>
                                          )}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setBenefits(benefits.filter((_, i) => i !== index));
                                          }}
                                          className="text-red-400 hover:text-red-500 hover:bg-red-900/20"
                                        >
                                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {currentTab === "modules" && (
                        <>
                          {/* Seção: Módulos e Aulas */}
                          <div className="space-y-6 sm:space-y-8">
                            <div className="border-b border-gray-700 pb-4 sm:pb-5">
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Módulos e Aulas</h3>
                              <p className="text-sm sm:text-base text-gray-400 mt-2">Organize o conteúdo em módulos e aulas</p>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                              {modules.map((module, moduleIndex) => (
                                <div key={moduleIndex} className="border border-gray-700 rounded-lg p-5 sm:p-6 lg:p-8 bg-gray-900">
                                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                                    <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white">Módulo {moduleIndex + 1}</h4>
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
                                      className="h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />

                                    <div className="space-y-4 sm:space-y-5">
                                          {module.lessons.map((lesson, lessonIndex) => (
                                        <div key={lessonIndex} className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Input
                                              placeholder="Título da aula"
                                                      value={lesson.title}
                                                      onChange={(e) => {
                                                        const newModules = [...modules];
                                                        newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                                                        setModules(newModules);
                                                      }}
                                              className="h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                            />
                                                      <Input
                                              placeholder="Duração (ex: 10min)"
                                                        value={lesson.duration}
                                                        onChange={(e) => {
                                                          const newModules = [...modules];
                                                          newModules[moduleIndex].lessons[lessonIndex].duration = e.target.value;
                                                          setModules(newModules);
                                                        }}
                                              className="h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                                      />
                                                    </div>

                                          <div className="space-y-2">
                                            <Label className="text-sm sm:text-base font-medium text-gray-300">Vídeo da Aula <span className="text-red-500">*</span></Label>
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
                                                className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                                                          <div className="mt-2 rounded-lg border border-gray-600 bg-black overflow-hidden">
                                                            <video
                                                              src={lesson.videoUrl}
                                                              controls
                                                              playsInline
                                                              preload="metadata"
                                                              className="w-full aspect-video max-h-64 object-contain bg-black"
                                                            />
                                                            <p className="text-xs text-gray-400 px-2 py-1.5 bg-gray-900">Vídeo atual</p>
                                                          </div>
                                                        )}
                                                        {lesson.videoUrl === 'uploading...' && (
                                                <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)', borderColor: 'var(--theme-primary-light)' }}>
                                                  <p className="text-sm flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
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

                                          <div className="flex justify-end pt-2 border-t border-gray-700">
                                                <Button
                                                  type="button"
                                              variant="destructive"
                                                  size="sm"
                                                  onClick={() => {
                                                    const newModules = [...modules];
                                                newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                                                    setModules(newModules);
                                                  }}
                                              className="h-10 sm:h-11 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
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
                                        className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                                className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                              >
                                <Plus className="w-5 h-5 mr-2" />
                                Adicionar Módulo
                              </Button>
                            </div>
                        </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingCourse(null);
                          setCurrentTab("info");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[600px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-800 border-gray-700">
                  <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-700 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))` }}>
                        <Ticket className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                    </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2 text-gray-400">
                      {editingCoupon ? "Edite as informações do cupom abaixo" : "Preencha os dados para criar um novo cupom de desconto"}
                    </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-6 sm:space-y-8">
                    {/* Código do Cupom */}
                    <div className="space-y-2">
                      <Label htmlFor="couponCode" className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
                        <Ticket className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--theme-primary)' }} />
                        Código do Cupom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="BLACKFRIDAY2024"
                        className="h-12 sm:h-14 text-base sm:text-lg font-mono bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <p className="text-xs sm:text-sm text-gray-400">
                        O código será convertido automaticamente para maiúsculas
                      </p>
                    </div>

                    {/* Desconto e Tipo */}
                    <div className="p-4 sm:p-6 rounded-lg border space-y-4 sm:space-y-6" style={{ background: `linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.1), rgba(var(--theme-secondary-rgb), 0.1))`, borderColor: 'var(--theme-primary-light)' }}>
                      <div className="border-b pb-2 sm:pb-3" style={{ borderColor: 'var(--theme-primary-light)' }}>
                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
                          <Percent className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--theme-primary)' }} />
                          Configuração de Desconto
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="couponDiscount" className="text-sm sm:text-base font-medium text-white">
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
                              className="h-12 sm:h-14 text-base sm:text-lg pr-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 font-semibold">
                              {couponType === "percentage" ? "%" : "R$"}
                            </div>
                          </div>
                      </div>

                        <div className="space-y-2">
                          <Label htmlFor="couponType" className="text-sm sm:text-base font-medium text-white">
                            Tipo de Desconto
                          </Label>
                        <select
                          id="couponType"
                          value={couponType}
                          onChange={(e) => setCouponType(e.target.value as "percentage" | "fixed")}
                            className="w-full h-12 sm:h-14 px-4 rounded-md border border-gray-600 bg-gray-700 text-white text-base sm:text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = 'var(--theme-primary)';
                              e.currentTarget.style.boxShadow = '0 0 0 2px var(--theme-primary-light)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#4B5563';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                          <option value="percentage" className="bg-gray-700">Percentual (%)</option>
                          <option value="fixed" className="bg-gray-700">Valor Fixo (R$)</option>
                        </select>
                        </div>
                      </div>
                    </div>

                    {/* Validade e Usos */}
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 space-y-4 sm:space-y-6">
                      <div className="border-b border-gray-700 pb-2 sm:pb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          Validade e Limites
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="couponExpires" className="text-sm sm:text-base font-medium flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Data de Expiração
                          </Label>
                        <Input
                          id="couponExpires"
                          type="date"
                          value={couponExpires}
                          onChange={(e) => setCouponExpires(e.target.value)}
                            className="h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white"
                        />
                          <p className="text-xs sm:text-sm text-gray-400">
                            Deixe em branco para não expirar
                          </p>
                      </div>

                        <div className="space-y-2">
                          <Label htmlFor="couponMaxUses" className="text-sm sm:text-base font-medium flex items-center gap-2 text-white">
                            <Users className="w-4 h-4 text-gray-400" />
                            Usos Máximos
                          </Label>
                        <Input
                          id="couponMaxUses"
                          type="number"
                          value={couponMaxUses}
                          onChange={(e) => setCouponMaxUses(e.target.value)}
                          placeholder="Ilimitado"
                            className="h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                          <p className="text-xs sm:text-sm text-gray-400">
                            Deixe em branco para uso ilimitado
                          </p>
                        </div>
                      </div>
                      </div>
                    </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-700 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCouponDialogOpen(false);
                          resetCouponForm();
                        }}
                      className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Cancelar
                      </Button>
                    <Button
                      onClick={handleSaveCoupon}
                      className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[500px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-800 border-gray-700">
                  <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-700 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-white" />
          </div>
                      <div className="flex-1">
                        <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                          Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2 text-gray-400">
                          Esta ação não pode ser desfeita
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-4 sm:space-y-6">
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 sm:p-6">
                      <p className="text-sm sm:text-base text-gray-300 mb-4">
                        Tem certeza que deseja excluir o cupom <span className="font-bold text-white">{couponToDelete?.code}</span>?
                      </p>

                      {couponToDelete && (
                        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Código:</span>
                            <span className="text-sm sm:text-base font-mono font-bold text-white">{couponToDelete.code}</span>
              </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Desconto:</span>
                            <span className="text-sm sm:text-base font-bold text-blue-400">
                              {couponToDelete.type === "percentage"
                                ? `${couponToDelete.discount}%`
                                : `R$ ${couponToDelete.discount.toFixed(2)}`}
                            </span>
            </div>
                          {couponToDelete.expiresAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-400">Expira em:</span>
                              <span className="text-sm sm:text-base text-white">
                                {new Date(couponToDelete.expiresAt).toLocaleDateString('pt-BR')}
                              </span>
            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Usos:</span>
                            <span className="text-sm sm:text-base text-white">
                              {couponToDelete.currentUses} / {couponToDelete.maxUses === 999999 ? '∞' : couponToDelete.maxUses}
                            </span>
            </div>
            </div>
                      )}

                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <p className="text-xs sm:text-sm text-yellow-300 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Esta ação é permanente. Todos os dados relacionados a este cupom serão removidos.</span>
                        </p>
          </div>
        </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-700 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDeleteCouponDialogOpen(false);
                        setCouponToDelete(null);
                      }}
                      className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
              <h2 className="text-2xl font-bold mb-2 text-white">Dashboard de Vendas</h2>
              <p className="text-gray-400">Análise visual do desempenho da plataforma</p>
            </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={exportPurchases} 
                      className="w-full sm:w-auto bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                <Download className="w-4 h-4 mr-2" />
                Exportar Vendas
              </Button>
                    <Button 
                      variant="outline" 
                      onClick={exportCourses} 
                      className="w-full sm:w-auto bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                <Download className="w-4 h-4 mr-2" />
                Exportar Cursos
              </Button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart - Vendas por Dia */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                      <CardTitle className="text-white">Vendas no Período Selecionado</CardTitle>
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                      <CardTitle className="text-white">Receita no Período Selecionado</CardTitle>
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

                {/* Gráfico de Crescimento de Alunos */}
                <Card className="mb-8 bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Crescimento de Alunos ao Longo do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={studentsGrowthByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="alunos" stroke="#2563eb" strokeWidth={2} name="Total de Alunos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

          {/* Pie Chart - Vendas por Curso */}
                <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Vendas por Curso</CardTitle>
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

                {/* Lista de Últimas Vendas */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Últimas Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestPurchases.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p>Nenhuma venda realizada ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {latestPurchases.map((purchase, idx) => {
                          const purchaseDate = new Date(purchase.date);
                          const displayTitle = purchase.courseTitle || "Item não encontrado";
                          return (
                            <div key={`${purchase.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600/20">
                                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white truncate">
                                      {displayTitle}
                                    </h4>
                                    <p className="text-sm text-gray-400">
                                      {purchaseDate.toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-bold text-lg text-green-400">
                                    R$ {(typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded ${
                                    purchase.paymentStatus === 'paid' 
                                      ? 'bg-green-900/50 text-green-400 border border-green-700' 
                                      : purchase.paymentStatus === 'pending'
                                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                                      : 'bg-red-900/50 text-red-400 border border-red-700'
                                  }`}>
                                    {purchase.paymentStatus === 'paid' ? 'Pago' : purchase.paymentStatus === 'pending' ? 'Pendente' : 'Cancelado'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
        </section>
      )}

      {/* Courses View */}
      {mainView === "courses" && (
        <section className="container mx-auto px-4 py-12">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
            <h2 className="text-2xl font-bold mb-2 text-white">Gerenciar Cursos</h2>
            <p className="text-gray-400">
              Edite ou exclua os cursos existentes
            </p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="text-white w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        onClick={handleNewCourse}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Curso
                      </Button>
                    </DialogTrigger>
                  </Dialog>
          </div>

                {/* Busca, Filtros e Ordenação */}
                {courses.length > 0 && (
                  <Card className="mb-6 bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar curso por nome..."
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Filtro por Categoria */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Categoria</Label>
                            <select
                              value={courseCategoryFilter}
                              onChange={(e) => setCourseCategoryFilter(e.target.value)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todas as categorias</option>
                              {courseCategories.map(cat => (
                                <option key={cat} value={cat} className="bg-gray-700">{cat}</option>
                              ))}
                            </select>
                          </div>

                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={courseSortBy}
                              onChange={(e) => setCourseSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="name" className="bg-gray-700">Nome</option>
                              <option value="price" className="bg-gray-700">Preço</option>
                              <option value="students" className="bg-gray-700">Alunos</option>
                              <option value="rating" className="bg-gray-700">Avaliação</option>
                              <option value="sales" className="bg-gray-700">Vendas</option>
                              <option value="revenue" className="bg-gray-700">Receita</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setCourseSortOrder(courseSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {courseSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={courseViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setCourseViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  courseViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={courseViewMode === "table" ? "default" : "outline"}
                                onClick={() => setCourseViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  courseViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedCourses.length} de {courses.length} cursos
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

          {courses.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-20 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Nenhum curso cadastrado</h3>
                <p className="text-gray-400 mb-6">
                  Crie seu primeiro curso para começar
                </p>
                      <Button onClick={handleNewCourse} style={{ backgroundColor: 'var(--theme-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-primary-dark)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-primary)'}
                      >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              </CardContent>
            </Card>
                ) : filteredAndSortedCourses.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-20 text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-white">Nenhum curso encontrado</h3>
                      <p className="text-gray-400 mb-6">
                        Tente ajustar os filtros de busca
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCourseSearch("");
                          setCourseCategoryFilter("all");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Limpar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                ) : courseViewMode === "cards" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredAndSortedCourses.map((course) => {
                      const stats = getCourseStats(course.id);
                      return (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-gray-800 border-gray-700">
                        <div className="w-full h-48 overflow-hidden">
                        <img
                          src={course.image}
                          alt={course.title}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: (course as any).imagePosition || "50% 50%" }}
                        />
                      </div>
                        <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold px-2 py-1 rounded inline-block mb-2 bg-blue-600/20 text-blue-300 border border-blue-500/30">
                              {course.category}
                            </span>
                              <h3 className="text-lg font-bold mt-2 break-words text-white">{course.title}</h3>
                              <p className="text-sm text-gray-400 mt-1 break-words line-clamp-2">{course.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300 mt-auto">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="font-bold text-green-400">R$ {(typeof course.price === 'string' ? parseFloat(course.price) : course.price).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="text-gray-300">{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="text-gray-300">{course.lessons} aulas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="text-gray-300">{course.students}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-gray-300">{course.rating}</span>
                            </div>
                          </div>

                          {/* Estatísticas do Curso */}
                          {(stats.sales > 0 || stats.revenue > 0) && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-400">Vendas:</span>
                                  <span className="font-semibold text-white ml-1">{stats.sales}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Receita:</span>
                                  <span className="font-semibold text-green-400 ml-1">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-xs text-gray-300 mb-3">
                              <span className="font-semibold text-white">Instrutor:</span>{" "}
                              {course.instructor}
                            </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(course)}
                              className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
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
                        </CardContent>
                      </Card>
                      );
                    })}
                          </div>
                ) : (
                  /* Visualização em Tabela */
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Curso</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Preço</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alunos</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avaliação</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendas</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receita</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedCourses.map((course) => {
                              const stats = getCourseStats(course.id);
                              return (
                                <tr key={course.id} className="hover:bg-gray-900 transition-colors">
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        style={{ objectPosition: (course as any).imagePosition || "50% 50%" }}
                                      />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-white break-words">{course.title}</div>
                                        <div className="text-sm text-gray-400 truncate">{course.subtitle}</div>
                          </div>
                          </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {course.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="font-semibold text-green-600">
                                      R$ {(typeof course.price === 'string' ? parseFloat(course.price) : course.price).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4 text-gray-400" />
                                      <span>{course.students}</span>
                          </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{course.rating}</span>
                          </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="font-semibold text-white">{stats.sales}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="font-semibold text-green-600">
                                      R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(course)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(course.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                        </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                    </div>
                  </CardContent>
                </Card>
          )}
        </section>
      )}

      {/* Students View */}
      {mainView === "students" && (
              <section className="container mx-auto px-4 py-6 sm:py-12">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Gerenciar Alunos</h2>
                    <p className="text-sm sm:text-base text-gray-400">
                Visualize todos os alunos e seu progresso nos cursos
              </p>
            </div>
                  <Button variant="outline" onClick={exportStudents} className="w-full sm:w-auto bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar Alunos
            </Button>
          </div>

                {/* Busca, Filtros e Ordenação */}
                {users.length > 0 && (
                  <Card className="mb-6 bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar aluno por nome ou email..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Filtro por Status */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Status</Label>
                            <select
                              value={studentStatusFilter}
                              onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="with-courses" className="bg-gray-700">Com Cursos</option>
                              <option value="without-courses" className="bg-gray-700">Sem Cursos</option>
                            </select>
                          </div>

                          {/* Filtro por Data */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Período</Label>
                            <select
                              value={studentDateFilter}
                              onChange={(e) => setStudentDateFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="7d" className="bg-gray-700">Últimos 7 dias</option>
                              <option value="30d" className="bg-gray-700">Últimos 30 dias</option>
                              <option value="90d" className="bg-gray-700">Últimos 90 dias</option>
                              <option value="month" className="bg-gray-700">Este mês</option>
                              <option value="year" className="bg-gray-700">Este ano</option>
                            </select>
                          </div>

                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={studentSortBy}
                              onChange={(e) => setStudentSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="name" className="bg-gray-700">Nome</option>
                              <option value="email" className="bg-gray-700">Email</option>
                              <option value="date" className="bg-gray-700">Data de Cadastro</option>
                              <option value="courses" className="bg-gray-700">Nº de Cursos</option>
                              <option value="progress" className="bg-gray-700">Progresso</option>
                              <option value="spent" className="bg-gray-700">Total Gasto</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setStudentSortOrder(studentSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {studentSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={studentViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setStudentViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  studentViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={studentViewMode === "table" ? "default" : "outline"}
                                onClick={() => setStudentViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  studentViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedStudents.length} de {users.length} alunos
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

          {users.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 sm:py-20 text-center px-4">
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">Nenhum aluno cadastrado</h3>
                      <p className="text-sm sm:text-base text-gray-400">
                  Os alunos aparecerão aqui quando se cadastrarem na plataforma
                </p>
              </CardContent>
            </Card>
                ) : filteredAndSortedStudents.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-20 text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-white">Nenhum aluno encontrado</h3>
                      <p className="text-gray-400 mb-6">
                        Tente ajustar os filtros de busca
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStudentSearch("");
                          setStudentStatusFilter("all");
                          setStudentDateFilter("all");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Limpar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                ) : studentViewMode === "cards" ? (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAndSortedStudents.map((student, index) => {
                      const stats = getStudentStats(student);
                      const isActive = stats.lastAccess && (Date.now() - stats.lastAccess.getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 dias

                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow bg-gray-800 border-gray-700">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 relative">
                                  {student.name.charAt(0).toUpperCase()}
                                  {isActive && (
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                                  )}
                          </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base sm:text-lg font-bold break-words text-white">{student.name}</h3>
                                    {isActive ? (
                                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">Ativo</span>
                                    ) : (
                                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full font-medium">Inativo</span>
                                    )}
                            </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 mt-1">
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />
                                    <span className="break-all">{student.email}</span>
                            </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 mt-1">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />
                                    <span>Cadastrado em: {new Date(student.registeredAt).toLocaleDateString('pt-BR')}</span>
                                    <span className="text-gray-500">•</span>
                                    <span>{stats.daysSinceRegistration} dias</span>
                          </div>
                                  {stats.lastAccess && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 mt-1">
                                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />
                                      <span>Último acesso: {stats.lastAccess.toLocaleDateString('pt-BR')}</span>
                        </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right flex-shrink-0">
                                <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.coursesCount}</div>
                                <div className="text-xs sm:text-sm text-gray-400">Cursos</div>
                                {stats.avgProgress > 0 && (
                                  <div className="text-xs sm:text-sm text-teal-400 font-semibold mt-1">
                                    {stats.avgProgress.toFixed(0)}% concluído
                            </div>
                          )}
                                {stats.totalSpent > 0 && (
                                  <div className="text-xs sm:text-sm text-green-400 font-semibold mt-1">
                                    R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                        </div>
                      </div>

                            {/* Ações Rápidas */}
                            <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-gray-700">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentDetails(true);
                                }}
                                className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`mailto:${student.email}`, '_blank')}
                                className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                              >
                                <MailIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Enviar Email
                              </Button>
                            </div>

                            {stats.purchases.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-xs sm:text-sm font-semibold text-white mb-3">Cursos e Progresso:</p>
                                <div className="space-y-2 sm:space-y-3">
                                  {stats.purchases.map((purchase, idx) => {
                                    const progress = stats.progressData.find(p => p.courseId === purchase.courseId);
                              return (
                                <div key={idx} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                          <span className="text-xs sm:text-sm font-medium text-white break-words">{purchase.courseTitle}</span>
                                          <span className="text-xs text-green-400 flex-shrink-0 font-semibold">R$ {(typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price).toFixed(2)}</span>
                                  </div>
                                  {progress && (
                                    <>
                                      <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div
                                          className="bg-teal-400 h-2 rounded-full transition-all"
                                          style={{ width: `${progress.progress}%` }}
                                        ></div>
                                      </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1 text-xs text-gray-300">
                                        <span>{progress.completedLessons.length} aulas concluídas</span>
                                        <span className="text-teal-400 font-semibold">{progress.progress.toFixed(0)}%</span>
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
                ) : (
                  /* Visualização em Tabela */
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aluno</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cadastro</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cursos</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Progresso</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Gasto</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedStudents.map((student) => {
                              const stats = getStudentStats(student);
                              const isActive = stats.lastAccess && (Date.now() - stats.lastAccess.getTime()) < 30 * 24 * 60 * 60 * 1000;
                              return (
                                <tr key={student.email} className="hover:bg-gray-900 transition-colors">
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative" style={{ background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))` }}>
                                        {student.name.charAt(0).toUpperCase()}
                                        {isActive && (
                                          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-white break-words">{student.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-sm text-white break-all">{student.email}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-sm text-white">
                                      {new Date(student.registeredAt).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-xs text-gray-400">{stats.daysSinceRegistration} dias</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="w-4 h-4 text-gray-400" />
                                      <span className="font-semibold text-white">{stats.coursesCount}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    {stats.avgProgress > 0 ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-600 rounded-full h-2">
                                          <div
                                            className="bg-teal-400 h-2 rounded-full"
                                            style={{ width: `${stats.avgProgress}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-semibold text-teal-400">{stats.avgProgress.toFixed(0)}%</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {stats.totalSpent > 0 ? (
                                      <span className="font-semibold text-green-400">
                                        R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {isActive ? (
                                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Ativo</span>
                                    ) : (
                                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full font-medium">Inativo</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedStudent(student);
                                          setShowStudentDetails(true);
                                        }}
                                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Modal de Detalhes do Aluno */}
                <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                    {selectedStudent && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))` }}>
                              {selectedStudent.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white">{selectedStudent.name}</div>
                              <div className="text-sm font-normal text-gray-400 break-all">{selectedStudent.email}</div>
                            </div>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          {/* Informações Gerais */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3 text-white">Informações Gerais</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm text-gray-400">Data de Cadastro</Label>
                                <p className="font-medium text-white">{new Date(selectedStudent.registeredAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-400">Tempo desde Cadastro</Label>
                                <p className="font-medium text-white">{getStudentStats(selectedStudent).daysSinceRegistration} dias</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-400">Total de Cursos</Label>
                                <p className="font-medium text-blue-400">{getStudentStats(selectedStudent).coursesCount}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-400">Total Gasto</Label>
                                <p className="font-medium text-green-400">
                                  R$ {getStudentStats(selectedStudent).totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              {getStudentStats(selectedStudent).lastAccess && (
                                <div>
                                  <Label className="text-sm text-gray-400">Último Acesso</Label>
                                  <p className="font-medium text-white">
                                    {getStudentStats(selectedStudent).lastAccess?.toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm text-gray-400">Progresso Médio</Label>
                                <p className="font-medium text-teal-400">
                                  {getStudentStats(selectedStudent).avgProgress.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Histórico de Compras */}
                          {getStudentStats(selectedStudent).purchases.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-3 text-white">Histórico de Compras</h3>
                              <div className="space-y-3">
                                {getStudentStats(selectedStudent).purchases.map((purchase, idx) => {
                                  const progress = getStudentStats(selectedStudent).progressData.find(p => p.courseId === purchase.courseId);
                                  return (
                                    <Card key={idx} className="bg-gray-700 border-gray-600">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-white">{purchase.courseTitle}</h4>
                                            <p className="text-sm text-gray-300 mt-1">
                                              Comprado em: {new Date(purchase.date).toLocaleDateString('pt-BR')}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold text-green-400">
                                              R$ {(typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price).toFixed(2)}
                                            </p>
                                            <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                                              purchase.paymentStatus === 'paid' 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-yellow-600 text-white'
                                            }`}>
                                              {purchase.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                            </p>
                                          </div>
                                        </div>
                                        {progress && (
                                          <div>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm text-gray-300">Progresso</span>
                                              <span className="text-sm font-semibold text-teal-400">{progress.progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-600 rounded-full h-2">
                                              <div
                                                className="bg-teal-400 h-2 rounded-full"
                                                style={{ width: `${progress.progress}%` }}
                                              ></div>
                                            </div>
                                            <p className="text-xs text-gray-300 mt-2">
                                              {progress.completedLessons.length} aulas concluídas
                                            </p>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
        </section>
      )}

      {/* Revenue View */}
      {mainView === "revenue" && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-white">Análise de Faturamento</h2>
            <p className="text-gray-400">
              Acompanhe as vendas e o desempenho financeiro da plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Faturamento Total</p>
                    <p className="text-3xl font-bold text-green-400">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Vendas</p>
                    <p className="text-3xl font-bold text-blue-400">{totalSales}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Ticket Médio</p>
                    <p className="text-3xl font-bold text-teal-400">
                      R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-teal-600/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Faturamento por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              {revenuePerCourse.length === 0 || totalSales === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">Nenhuma venda realizada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revenuePerCourse.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{item.courseTitle}</h4>
                        <p className="text-sm text-gray-300 mt-1">
                          {item.sales} {item.sales === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">
                          R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-400 h-2 rounded-full transition-all"
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
            <Card className="mt-8 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Últimas Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paidPurchases.slice(0, 10).reverse().map((purchase) => {
                    const finalAmount = typeof purchase.price === 'string' ? parseFloat(purchase.price) : purchase.price;
                    // Garantir que o valor seja positivo (não mostrar valores negativos)
                    const displayAmount = Math.max(0, finalAmount || 0);
                    
                    return (
                      <div key={purchase.id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{purchase.userName}</p>
                            <p className="text-sm text-gray-300">{purchase.courseTitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">R$ {displayAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">
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
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Cupons de Desconto</h2>
                    <p className="text-sm sm:text-base text-gray-400">
              Crie e gerencie cupons promocionais
            </p>
                  </div>
                  <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
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

                {/* Busca, Filtros e Ordenação */}
                {coupons.length > 0 && (
                  <Card className="mb-6 bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar cupom por código..."
                            value={couponSearch}
                            onChange={(e) => setCouponSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Filtro por Status */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Status</Label>
                            <select
                              value={couponStatusFilter}
                              onChange={(e) => setCouponStatusFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="active" className="bg-gray-700">Ativos</option>
                              <option value="inactive" className="bg-gray-700">Inativos</option>
                              <option value="expired" className="bg-gray-700">Expirados</option>
                            </select>
                          </div>

                          {/* Filtro por Tipo */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Tipo</Label>
                            <select
                              value={couponTypeFilter}
                              onChange={(e) => setCouponTypeFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="percentage" className="bg-gray-700">Percentual</option>
                              <option value="fixed" className="bg-gray-700">Valor Fixo</option>
                            </select>
                          </div>

                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={couponSortBy}
                              onChange={(e) => setCouponSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="code" className="bg-gray-700">Código</option>
                              <option value="discount" className="bg-gray-700">Desconto</option>
                              <option value="uses" className="bg-gray-700">Uso</option>
                              <option value="expires" className="bg-gray-700">Expiração</option>
                              <option value="created" className="bg-gray-700">Data de Criação</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setCouponSortOrder(couponSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {couponSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={couponViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setCouponViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  couponViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={couponViewMode === "table" ? "default" : "outline"}
                                onClick={() => setCouponViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  couponViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedCoupons.length} de {coupons.length} cupons
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

          {coupons.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-20 text-center">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Nenhum cupom criado</h3>
                <p className="text-gray-400 mb-6">
                  Crie cupons de desconto para atrair mais alunos
                </p>
                      <Button onClick={() => setIsCouponDialogOpen(true)} style={{ backgroundColor: 'var(--theme-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-primary-dark)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-primary)'}
                        className="text-white"
                      >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Cupom
                </Button>
              </CardContent>
            </Card>
                ) : filteredAndSortedCoupons.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-20 text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-white">Nenhum cupom encontrado</h3>
                      <p className="text-gray-400 mb-6">
                        Tente ajustar os filtros de busca
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCouponSearch("");
                          setCouponStatusFilter("all");
                          setCouponTypeFilter("all");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Limpar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                ) : couponViewMode === "cards" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredAndSortedCoupons.map((coupon) => {
                      const stats = getCouponStats(coupon);

                return (
                        <Card key={coupon.id} className={`overflow-hidden bg-gray-800 border-gray-700 ${!coupon.active || stats.isExpired ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4 gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                                  <h3 className="text-lg sm:text-xl font-bold font-mono break-all text-white">{coupon.code}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCouponCode(coupon.code)}
                                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-700"
                            >
                              {copiedCoupon === coupon.code ? (
                                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                              ) : (
                                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                                  <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-xl sm:text-2xl font-bold text-blue-400">
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
                                  className="h-8 w-8 p-0 hover:bg-gray-700"
                          >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                                  onClick={() => openDeleteCouponDialog(coupon)}
                                  className="h-8 w-8 p-0 hover:bg-gray-700"
                          >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>

                            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        {coupon.expiresAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Expira em:</span>
                                  <span className={`font-medium ${stats.isExpired ? 'text-red-400' : 'text-white'}`}>
                              {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                                    {stats.daysUntilExpiry !== null && stats.daysUntilExpiry > 0 && (
                                      <span className="text-gray-400 ml-1">({stats.daysUntilExpiry} dias)</span>
                                    )}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400">Uso:</span>
                            <span className="font-medium text-white">
                              {coupon.currentUses} / {coupon.maxUses === 999999 ? '∞' : coupon.maxUses}
                            </span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-400 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
                            ></div>
                          </div>
                                <div className="text-xs text-gray-300 mt-1">
                                  Taxa de uso: {stats.usageRate.toFixed(1)}%
                                </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id)}
                                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${coupon.active && !stats.isExpired
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                                  {coupon.active && !stats.isExpired ? '✓ Ativo' : '✕ Inativo'}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
                ) : (
                  /* Visualização em Tabela */
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Código</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Desconto</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Uso</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiração</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedCoupons.map((coupon) => {
                              const stats = getCouponStats(coupon);
                              return (
                                <tr key={coupon.id} className="hover:bg-gray-900 transition-colors">
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                      <Ticket className="w-4 h-4 text-blue-400" />
                                      <span className="font-mono font-semibold text-white">{coupon.code}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyCouponCode(coupon.code)}
                                        className="h-6 w-6 p-0 hover:bg-gray-700"
                                      >
                                        {copiedCoupon === coupon.code ? (
                                          <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                          <Copy className="w-3 h-3 text-gray-300" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="font-bold text-blue-400">
                                      {coupon.type === "percentage" ? `${coupon.discount}%` : `R$ ${coupon.discount.toFixed(2)}`}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-sm text-gray-300">
                                      {coupon.type === "percentage" ? "Percentual" : "Valor Fixo"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-gray-600 rounded-full h-2">
                                        <div
                                          className="bg-blue-400 h-2 rounded-full"
                                          style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-semibold text-white">
                                        {coupon.currentUses}/{coupon.maxUses === 999999 ? '∞' : coupon.maxUses}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    {coupon.expiresAt ? (
                                      <div>
                                        <div className={`text-sm font-medium ${stats.isExpired ? 'text-red-400' : 'text-white'}`}>
                                          {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                                        </div>
                                        {stats.daysUntilExpiry !== null && stats.daysUntilExpiry > 0 && (
                                          <div className="text-xs text-gray-400">{stats.daysUntilExpiry} dias</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">Sem expiração</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {coupon.active && !stats.isExpired ? (
                                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Ativo</span>
                                    ) : stats.isExpired ? (
                                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-medium">Expirado</span>
                                    ) : (
                                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full font-medium">Inativo</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingCoupon(coupon);
                                          setCouponCode(coupon.code);
                                          setCouponDiscount(coupon.discount.toString());
                                          setCouponType(coupon.type);
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
                                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => openDeleteCouponDialog(coupon)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
          )}
        </section>
      )}

      {/* Reviews View */}
      {mainView === "reviews" && (
              <section className="container mx-auto px-4 py-6 sm:py-12">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Avaliações dos Cursos</h2>
                    <p className="text-sm sm:text-base text-gray-400">
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
                      className={`w-full sm:w-auto ${
                        reviews.filter(r => !r.approved).length > 0 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
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
                      className="w-full sm:w-auto bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Ver Todas
              </Button>
            </div>
          </div>

                {/* Busca, Filtros e Ordenação */}
                {reviews.length > 0 && (
                  <Card className="mb-6 bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar por usuário, curso ou comentário..."
                            value={reviewSearch}
                            onChange={(e) => setReviewSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Filtro por Status */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Status</Label>
                            <select
                              value={reviewStatusFilter}
                              onChange={(e) => setReviewStatusFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="approved" className="bg-gray-700">Aprovados</option>
                              <option value="pending" className="bg-gray-700">Pendentes</option>
                            </select>
                          </div>

                          {/* Filtro por Avaliação */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Avaliação</Label>
                            <select
                              value={reviewRatingFilter}
                              onChange={(e) => setReviewRatingFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todas</option>
                              <option value="5" className="bg-gray-700">5 estrelas</option>
                              <option value="4" className="bg-gray-700">4 estrelas</option>
                              <option value="3" className="bg-gray-700">3 estrelas</option>
                              <option value="2" className="bg-gray-700">2 estrelas</option>
                              <option value="1" className="bg-gray-700">1 estrela</option>
                            </select>
                          </div>

                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={reviewSortBy}
                              onChange={(e) => setReviewSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="date" className="bg-gray-700">Data</option>
                              <option value="rating" className="bg-gray-700">Avaliação</option>
                              <option value="course" className="bg-gray-700">Curso</option>
                              <option value="user" className="bg-gray-700">Usuário</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setReviewSortOrder(reviewSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {reviewSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={reviewViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setReviewViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  reviewViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={reviewViewMode === "table" ? "default" : "outline"}
                                onClick={() => setReviewViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  reviewViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedReviews.length} de {reviews.length} avaliações
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

          {reviews.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 sm:py-20 text-center px-4">
                      <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">Nenhuma avaliação ainda</h3>
                      <p className="text-sm sm:text-base text-gray-400">
                  As avaliações dos alunos aparecerão aqui
                </p>
              </CardContent>
            </Card>
                ) : filteredAndSortedReviews.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-20 text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-white">Nenhuma avaliação encontrada</h3>
                      <p className="text-gray-400 mb-6">
                        Tente ajustar os filtros de busca
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewSearch("");
                          setReviewStatusFilter("all");
                          setReviewRatingFilter("all");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Limpar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                ) : reviewViewMode === "cards" ? (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAndSortedReviews.map((review) => (
                <Card key={review.id} className={`overflow-hidden bg-gray-800 border-gray-700 ${!review.approved ? 'border-l-4 border-l-yellow-500' : ''}`}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-bold break-words text-white">{review.userName}</h3>
                                <p className="text-xs sm:text-sm text-gray-300 break-all">{review.userEmail}</p>
                                <p className="text-xs sm:text-sm text-blue-400 font-medium mt-1 break-words">{review.courseTitle}</p>
                        </div>
                      </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        
                          {!review.approved && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveReview(review.id)}
                                  className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-xs sm:text-sm text-white"
                            >
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Aprovar
                            </Button>
                          )}
                      </div>
                    </div>

                          <p className="text-sm sm:text-base text-gray-300 mb-3 break-words">{review.comment}</p>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 border-t border-gray-700">
                            <span className="text-xs sm:text-sm text-gray-400 break-words">
                              {new Date(review.date).toLocaleDateString('pt-BR')} às {new Date(review.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {!review.approved && (
                                <span className="bg-yellow-600 text-white px-2 sm:px-3 py-1 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap">
                          Aguardando aprovação
                        </span>
                      )}
                      {review.approved && (
                                <span className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap">
                          Aprovado
                        </span>
                      )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteReview(review.id)}
                                className="h-8 sm:h-9 w-8 sm:w-9 p-0 bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
                ) : (
                  /* Visualização em Tabela */
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Curso</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avaliação</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comentário</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedReviews.map((review) => (
                              <tr key={review.id} className="hover:bg-gray-900 transition-colors">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-white break-words">{review.userName}</div>
                                      <div className="text-xs text-gray-400 break-all">{review.userEmail}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-white break-words">{review.courseTitle}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                                      />
                                    ))}
                                    <span className="ml-1 text-sm font-semibold text-white">{review.rating}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-300 break-words max-w-xs">{review.comment}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-white">
                                    {new Date(review.date).toLocaleDateString('pt-BR')}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(review.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {review.approved ? (
                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Aprovado</span>
                                  ) : (
                                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-medium">Pendente</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {!review.approved && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleApproveReview(review.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteReview(review.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
          )}
        </section>
      )}

      {/* Podcasts View */}
      {mainView === "podcasts" && (
        <section className="container mx-auto px-4 py-12">

                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">Gerenciar Podcasts</h2>
              <p className="text-gray-400">Cadastre e gerencie podcasts gratuitos</p>
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
                  setPodcastImageFile(null);
                  setPodcastImageUploading(false);
                        }}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Podcast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">{editingCourse ? "Editar Podcast" : "Novo Podcast"}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingCourse ? "Atualize as informações do podcast" : "Preencha os dados para criar um novo podcast"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="podcast-title" className="text-white">Título *</Label>
                    <Input
                      id="podcast-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Entendendo a Ansiedade"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="podcast-description" className="text-white">Descrição</Label>
                    <Textarea
                      id="podcast-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrição do podcast..."
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-image">Imagem do Podcast</Label>
                    <div className="space-y-2">
                      {image && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-700">
                          <img
                            src={image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImage("");
                              setPodcastImageFile(null);
                            }}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <label
                          htmlFor="podcast-image-upload"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/20 transition-colors bg-gray-700">
                            {podcastImageUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                                <span className="text-sm text-gray-300">Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-gray-300" />
                                <span className="text-sm text-gray-300">
                                  {image ? "Trocar Imagem" : "Fazer Upload da Imagem"}
                                </span>
                              </>
                            )}
                          </div>
                        </label>
                        <input
                          id="podcast-image-upload"
                          type="file"
                          accept="image/*"
                          disabled={podcastImageUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validar tipo de arquivo
                              if (!file.type.startsWith('image/')) {
                                toast.error("Por favor, selecione apenas arquivos de imagem");
                                return;
                              }
                              // Validar tamanho (máximo 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("A imagem deve ter no máximo 5MB");
                                return;
                              }
                              setPodcastImageFile(file);
                              handlePodcastImageUpload(file);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                      {podcastImageUploading && (
                        <div className="flex items-center gap-2 text-sm text-yellow-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <p>Aguardando upload da imagem...</p>
                        </div>
                      )}
                      {image && !podcastImageUploading && (
                        <p className="text-xs text-gray-400">Imagem carregada com sucesso</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="podcast-video" className="text-white">URL do Vídeo *</Label>
                    <Input
                      id="podcast-video"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    {errors.videoUrl && <p className="text-red-400 text-sm mt-1">{errors.videoUrl}</p>}
                  </div>

                  <div>
                    <Label htmlFor="podcast-duration" className="text-white">Duração</Label>
                    <Input
                      id="podcast-duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ex: 45min"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                      className="w-4 h-4 accent-blue-600"
                    />
                    <Label htmlFor="podcast-active" className="cursor-pointer text-white">
                      Podcast ativo
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
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
                    }} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      {editingCourse ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

                {/* Busca, Filtros e Ordenação */}
                {podcasts.length > 0 && (
                  <Card className="mb-6 bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar podcast por título ou descrição..."
                            value={podcastSearch}
                            onChange={(e) => setPodcastSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={podcastSortBy}
                              onChange={(e) => setPodcastSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="title" className="bg-gray-700">Título</option>
                              <option value="date" className="bg-gray-700">Data</option>
                              <option value="duration" className="bg-gray-700">Duração</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setPodcastSortOrder(podcastSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {podcastSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={podcastViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setPodcastViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  podcastViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={podcastViewMode === "table" ? "default" : "outline"}
                                onClick={() => setPodcastViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  podcastViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedPodcasts.length} de {podcasts.length} podcasts
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

          {podcasts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold mb-2 text-white">Nenhum podcast cadastrado</h3>
                <p className="text-gray-400 mb-4">Comece criando seu primeiro podcast gratuito</p>
                <Button onClick={() => {
                  setEditingCourse(null);
                  setTitle("");
                  setDescription("");
                  setImage("");
                  setVideoUrl("");
                  setDuration("");
                  setIsDialogOpen(true);
                }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Podcast
                </Button>
              </CardContent>
            </Card>
                ) : filteredAndSortedPodcasts.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-20 text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-white">Nenhum podcast encontrado</h3>
                      <p className="text-gray-400 mb-6">
                        Tente ajustar os filtros de busca
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPodcastSearch("");
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Limpar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                ) : podcastViewMode === "cards" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedPodcasts.map((podcast) => (
                <Card key={podcast.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    {podcast.image && (
                      <img
                        src={podcast.image}
                        alt={podcast.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg mb-2 text-white">{podcast.title}</h3>
                    {podcast.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{podcast.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
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
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
                ) : (
                  /* Visualização em Tabela */
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Podcast</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duração</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reproduções</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedPodcasts.map((podcast) => (
                              <tr key={podcast.id} className="hover:bg-gray-900 transition-colors">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    {podcast.image && (
                                      <img
                                        src={podcast.image}
                                        alt={podcast.title}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                      />
                                    )}
                                    <div className="min-w-0">
                                      <div className="font-semibold text-white break-words">{podcast.title}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-300 break-words max-w-xs line-clamp-2">
                                    {podcast.description || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {podcast.duration ? (
                                    <div className="flex items-center gap-1 text-sm text-gray-300">
                                      <Clock className="w-4 h-4" />
                                      <span>{podcast.duration}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1 text-sm text-gray-300">
                                    <Headphones className="w-4 h-4" />
                                    <span>{podcast.listens || 0}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {podcast.createdAt ? (
                                    <div className="text-sm text-white">
                                      {new Date(podcast.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
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
                                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
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
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
          )}
        </section>
      )}

      {/* Newsletter View */}
      {mainView === "newsletter" && (
        <section className="container mx-auto px-4 py-12">

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-white">Gerenciar Newsletter</h2>
            <p className="text-gray-400">Envie atualizações para todos os inscritos na newsletter</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Inscritos</p>
                    <p className="text-3xl font-bold text-blue-400">{newsletterTotal}</p>
                  </div>
                  <Mail className="w-12 h-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Inscritos Ativos</p>
                    <p className="text-3xl font-bold text-green-400">{newsletterSubscribers.length}</p>
                  </div>
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Última Atualização</p>
                          {lastCampaign ? (
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {new Date(lastCampaign.sentAt).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-300 mt-1">
                                {lastCampaign.sentCount} enviados
                              </p>
                            </div>
                          ) : (
                    <p className="text-sm font-semibold text-white">-</p>
                          )}
                  </div>
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário para Enviar Atualização */}
          <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Enviar Atualização da Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newsletter-subject" className="text-white mb-2 block">Assunto do Email *</Label>
                  <Input
                    id="newsletter-subject"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Ex: Novidades e Dicas de Psicologia"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="newsletter-content" className="text-white mb-2 block">Conteúdo *</Label>
                  <Textarea
                    id="newsletter-content"
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    placeholder="Escreva o conteúdo da newsletter aqui..."
                    rows={10}
                    className="font-sans bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Você pode usar HTML básico para formatação (negrito, itálico, links, etc.)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newsletter-cta-text" className="text-white mb-2 block">Texto do Botão (opcional)</Label>
                    <Input
                      id="newsletter-cta-text"
                      value={newsletterCtaText}
                      onChange={(e) => setNewsletterCtaText(e.target.value)}
                      placeholder="Ex: Ver Mais"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletter-cta-link" className="text-white mb-2 block">Link do Botão (opcional)</Label>
                    <Input
                      id="newsletter-cta-link"
                      value={newsletterCtaLink}
                      onChange={(e) => setNewsletterCtaLink(e.target.value)}
                      placeholder="Ex: https://seusite.com/artigo"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <p className="text-sm text-blue-300 font-semibold mb-2">📧 Esta atualização será enviada para:</p>
                  <p className="text-lg font-bold text-blue-400">{newsletterTotal} inscrito(s) ativo(s)</p>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400"
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

                {/* Histórico de Campanhas */}
                {newsletterCampaigns.length > 0 && (
                  <Card className="mb-8 bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Histórico de Campanhas Enviadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {newsletterCampaigns.slice(0, 5).map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors bg-gray-800"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowCampaignDetails(true);
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white break-words">{campaign.subject}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                <span>{new Date(campaign.sentAt).toLocaleDateString('pt-BR')}</span>
                                <span>•</span>
                                <span>{campaign.sentCount} enviados</span>
                                {campaign.failedCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-red-400">{campaign.failedCount} falharam</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                          </div>
                        ))}
                      </div>
                      {newsletterCampaigns.length > 5 && (
                        <p className="text-sm text-gray-400 mt-4 text-center">
                          Mostrando 5 de {newsletterCampaigns.length} campanhas
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

          {/* Lista de Inscritos */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Inscritos na Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
                    {newsletterSubscribers.length > 0 && (
                      <div className="mb-6 space-y-4">
                        {/* Busca */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={subscriberSearch}
                            onChange={(e) => setSubscriberSearch(e.target.value)}
                            className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Filtros e Ordenação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Filtro por Status */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Status</Label>
                            <select
                              value={subscriberStatusFilter}
                              onChange={(e) => setSubscriberStatusFilter(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all" className="bg-gray-700">Todos</option>
                              <option value="active" className="bg-gray-700">Ativos</option>
                              <option value="inactive" className="bg-gray-700">Inativos</option>
                            </select>
                          </div>

                          {/* Ordenar por */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                            <select
                              value={subscriberSortBy}
                              onChange={(e) => setSubscriberSortBy(e.target.value as any)}
                              className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="date" className="bg-gray-700">Data</option>
                              <option value="name" className="bg-gray-700">Nome</option>
                              <option value="email" className="bg-gray-700">Email</option>
                            </select>
                          </div>

                          {/* Ordem */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                            <Button
                              variant="outline"
                              onClick={() => setSubscriberSortOrder(subscriberSortOrder === "asc" ? "desc" : "asc")}
                              className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              {subscriberSortOrder === "asc" ? "Crescente" : "Decrescente"}
                            </Button>
                          </div>

                          {/* Visualização */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={subscriberViewMode === "cards" ? "default" : "outline"}
                                onClick={() => setSubscriberViewMode("cards")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  subscriberViewMode === "cards" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <Grid3x3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={subscriberViewMode === "table" ? "default" : "outline"}
                                onClick={() => setSubscriberViewMode("table")}
                                className={`flex-1 h-10 sm:h-11 ${
                                  subscriberViewMode === "table" 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                              >
                                <List className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-sm text-gray-400">
                          Mostrando {filteredAndSortedSubscribers.length} de {newsletterSubscribers.length} inscritos
                        </div>
                      </div>
                    )}

              {newsletterSubscribers.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">Nenhum inscrito encontrado</h3>
                  <p className="text-gray-400">
                    Os inscritos aparecerão aqui quando se cadastrarem na newsletter
                  </p>
                </div>
                    ) : filteredAndSortedSubscribers.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2 text-white">Nenhum inscrito encontrado</h3>
                        <p className="text-gray-400 mb-6">
                          Tente ajustar os filtros de busca
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSubscriberSearch("");
                            setSubscriberStatusFilter("all");
                          }}
                          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    ) : subscriberViewMode === "cards" ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredAndSortedSubscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-700 bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{subscriber.name || "Sem nome"}</p>
                                <p className="text-sm text-gray-300 break-all">{subscriber.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(subscriber.subscribedAt).toLocaleDateString("pt-BR")}
                        </p>
                              {subscriber.active ? (
                          <span className="inline-block mt-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            Ativo
                          </span>
                              ) : (
                                <span className="inline-block mt-1 bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                                  Inativo
                                </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                    ) : (
                      /* Visualização em Tabela */
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Inscrito</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data de Inscrição</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedSubscribers.map((subscriber) => (
                              <tr key={subscriber.id} className="hover:bg-gray-900 transition-colors">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                                      <Mail className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="font-semibold text-white">{subscriber.name || "Sem nome"}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-300 break-all">{subscriber.email}</td>
                                <td className="px-4 py-4 text-sm text-gray-300">
                                  {new Date(subscriber.subscribedAt).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-4 py-4">
                                  {subscriber.active ? (
                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Ativo</span>
                                  ) : (
                                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full font-medium">Inativo</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
              )}
            </CardContent>
          </Card>

                {/* Modal de Detalhes da Campanha */}
                <Dialog open={showCampaignDetails} onOpenChange={setShowCampaignDetails}>
                  <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[700px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
                    <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-700 mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                            Detalhes da Campanha
                          </DialogTitle>
                          <DialogDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                            {selectedCampaign?.subject}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    {selectedCampaign && (
                      <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-6 sm:space-y-8">
                        {/* Informações Gerais */}
                        <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border space-y-4">
                          <div className="border-b border-gray-700 pb-2 sm:pb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              Informações da Campanha
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-400">Assunto</p>
                              <p className="font-medium text-white break-words">{selectedCampaign.subject}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Data de Envio</p>
                              <p className="font-medium text-white">{new Date(selectedCampaign.sentAt).toLocaleDateString('pt-BR')} às {new Date(selectedCampaign.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Total de Destinatários</p>
                              <p className="font-medium text-white">{selectedCampaign.totalRecipients}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Enviados com Sucesso</p>
                              <p className="font-medium text-green-600">{selectedCampaign.sentCount}</p>
                            </div>
                            {selectedCampaign.failedCount > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">Falharam</p>
                                <p className="font-medium text-red-600">{selectedCampaign.failedCount}</p>
                              </div>
                            )}
                            {selectedCampaign.sentByUser && (
                              <div>
                                <p className="text-xs text-gray-400">Enviado por</p>
                                <p className="font-medium text-white">{selectedCampaign.sentByUser.name}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200 space-y-4">
                          <div className="border-b border-blue-200 pb-2 sm:pb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                              Conteúdo do Email
                            </h3>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: selectedCampaign.content }} />
                          </div>
                          {selectedCampaign.ctaText && selectedCampaign.ctaLink && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <p className="text-xs text-gray-400 mb-1">Botão CTA</p>
                              <a
                                href={selectedCampaign.ctaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {selectedCampaign.ctaText} →
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Lista de Destinatários */}
                        {selectedCampaign.recipientEmails && selectedCampaign.recipientEmails.length > 0 && (
                          <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200 space-y-4">
                            <div className="border-b border-green-200 pb-2 sm:pb-3">
                              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                Emails Enviados ({selectedCampaign.recipientEmails.length})
                              </h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {selectedCampaign.recipientEmails.map((email: string, idx: number) => (
                                <div key={idx} className="text-sm text-gray-300 break-all bg-gray-800 p-2 rounded border">
                                  {email}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lista de Falhas */}
                        {selectedCampaign.failedEmails && selectedCampaign.failedEmails.length > 0 && (
                          <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200 space-y-4">
                            <div className="border-b border-red-200 pb-2 sm:pb-3">
                              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                Emails que Falharam ({selectedCampaign.failedEmails.length})
                              </h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {selectedCampaign.failedEmails.map((email: string, idx: number) => (
                                <div key={idx} className="text-sm text-red-700 break-all bg-gray-800 p-2 rounded border border-red-200">
                                  {email}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

          {/* Modal de Confirmação de Envio */}
          <Dialog open={showNewsletterConfirmDialog} onOpenChange={setShowNewsletterConfirmDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white">Confirmar Envio</DialogTitle>
                    <DialogDescription className="text-gray-400 mt-1">
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
                        <p className="text-base font-semibold text-white">{newsletterSubject}</p>
                      </div>
                      <div className="pt-3 border-t border-blue-200">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Destinatários</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-lg font-bold text-white">{newsletterTotal} inscrito(s) ativo(s)</p>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
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

                            // Recarregar campanhas para atualizar histórico
                            try {
                              const campaignsResponse = await apiClient.getNewsletterCampaigns({ page: 1, limit: 100 });
                              if (campaignsResponse?.campaigns) {
                                setNewsletterCampaigns(campaignsResponse.campaigns);
                              }
                            } catch (campaignError) {
                              console.error("Erro ao recarregar campanhas:", campaignError);
                            }
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
              <section className="container mx-auto px-2 sm:px-4 py-1 sm:py-2 lg:py-6 flex flex-col lg:h-auto" style={{ height: 'calc(100vh - 6rem)', minHeight: 'calc(100vh - 6rem)' }}>
                {/* Header melhorado - Ultra compacto no mobile */}
                <div className="mb-1 sm:mb-2 lg:mb-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 mb-1 lg:mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-16 lg:h-16 rounded-md lg:rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-sm lg:shadow-lg flex-shrink-0">
                      <Headphones className="w-3 h-3 sm:w-4 sm:h-4 lg:w-8 lg:h-8 text-white" />
              </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-lg lg:text-3xl font-bold text-white leading-tight">Central de Atendimento</h2>
                      <p className="text-gray-400 text-[10px] sm:text-xs lg:text-base hidden sm:block">Gerencie e responda aos tickets de suporte</p>
              </div>
            </div>

                  {/* Estatísticas rápidas - Ultra compactas no mobile */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5 lg:gap-4 mb-1 lg:mb-2">
                    <Card className="border-l-2 border-l-green-500 bg-gray-800 border-gray-700">
                      <CardContent className="p-1 sm:p-1.5 lg:p-3">
                        <div className="flex flex-col items-center text-center">
                          <p className="text-[8px] sm:text-[9px] lg:text-xs text-gray-400 mb-0.5">Abertos</p>
                          <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-400 leading-none">
                            {supportTickets.filter((t: any) => t.status === 'open').length}
                          </p>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 bg-green-600/20 rounded flex items-center justify-center mt-0.5 mx-auto">
                            <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-4 lg:h-4 text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-blue-500 bg-gray-800 border-gray-700">
                      <CardContent className="p-1 sm:p-1.5 lg:p-3">
                        <div className="flex flex-col items-center text-center">
                          <p className="text-[8px] sm:text-[9px] lg:text-xs text-gray-400 mb-0.5">Atendimento</p>
                          <p className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-400 leading-none">
                            {supportTickets.filter((t: any) => t.status === 'in_progress').length}
                          </p>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 bg-blue-600/20 rounded flex items-center justify-center mt-0.5 mx-auto">
                            <Headphones className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-4 lg:h-4 text-blue-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-gray-500 bg-gray-800 border-gray-700">
                      <CardContent className="p-1 sm:p-1.5 lg:p-3">
                        <div className="flex flex-col items-center text-center">
                          <p className="text-[8px] sm:text-[9px] lg:text-xs text-gray-400 mb-0.5">Fechados</p>
                          <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-300 leading-none">
                            {supportTickets.filter((t: any) => t.status === 'closed').length}
                          </p>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 bg-gray-700 rounded flex items-center justify-center mt-0.5 mx-auto">
                            <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-4 lg:h-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-2 border-l-blue-500 bg-gray-800 border-gray-700">
                      <CardContent className="p-1 sm:p-1.5 lg:p-3">
                        <div className="flex flex-col items-center text-center">
                          <p className="text-[8px] sm:text-[9px] lg:text-xs text-gray-400 mb-0.5">Total</p>
                          <p className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-400 leading-none">
                            {supportTickets.length}
                          </p>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 bg-blue-600/20 rounded flex items-center justify-center mt-0.5 mx-auto">
                            <MessageSquare className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-4 lg:h-4 text-blue-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
          </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-6 flex-1 min-h-0 lg:h-auto" style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}>
            {/* Lista de Tickets */}
                  <div className="lg:col-span-1 flex flex-col h-full min-h-0">
                    <Card className="shadow-md border-0 flex flex-col h-full bg-gray-800 border-gray-700">
                      <CardHeader className="bg-gray-800 border-b border-gray-700 flex-shrink-0 p-2 sm:p-3 lg:p-6">
                        <div className="flex items-center justify-between mb-2 lg:mb-4">
                          <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1.5 lg:gap-2">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex-shrink-0 text-blue-400" />
                    <span>Tickets</span>
                          </CardTitle>
                    <Button
                            variant="ghost"
                      size="sm"
                      onClick={() => loadSupportTickets()}
                      disabled={supportLoading}
                            className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 p-0 hover:bg-gray-700 flex-shrink-0"
                    >
                            <Loader2 className={`w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 ${supportLoading ? 'animate-spin' : ''} text-gray-300`} />
                    </Button>
                        </div>
                        {/* Filtros melhorados */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-2 mb-2 lg:mb-4">
                    <Button
                      variant={supportTicketFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('all')}
                            className={`text-[10px] sm:text-xs font-medium transition-all px-1.5 sm:px-3 py-1 sm:py-1.5 sm:py-2 h-auto ${supportTicketFilter === 'all'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'open' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('open')}
                            className={`text-[10px] sm:text-xs font-medium transition-all px-1.5 sm:px-3 py-1 sm:py-1.5 sm:py-2 h-auto ${supportTicketFilter === 'open'
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Aberto
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'in_progress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('in_progress')}
                            className={`text-[10px] sm:text-xs font-medium transition-all px-1.5 sm:px-3 py-1 sm:py-1.5 sm:py-2 h-auto ${supportTicketFilter === 'in_progress'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              }`}
                          >
                            <span className="hidden sm:inline">Em Atendimento</span>
                            <span className="sm:hidden">Atend.</span>
                    </Button>
                    <Button
                      variant={supportTicketFilter === 'closed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSupportTicketFilter('closed')}
                            className={`text-[10px] sm:text-xs font-medium transition-all px-1.5 sm:px-3 py-1 sm:py-1.5 sm:py-2 h-auto ${supportTicketFilter === 'closed'
                              ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-md'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Fechado
                    </Button>
                  </div>
                </CardHeader>
                      <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Busca de tickets */}
                        <div className="p-2 sm:p-3 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="Buscar tickets..."
                              className="pl-10 h-9 sm:h-10 text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-3 space-y-2 lg:space-y-2 min-h-0 lg:h-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
                    {(() => {
                      const filteredTickets = supportTicketFilter === 'all' 
                        ? supportTickets 
                        : supportTickets.filter((ticket: any) => ticket.status === supportTicketFilter);
                      
                      if (filteredTickets.length === 0) {
                        return (
                          <div className="text-center py-12 text-gray-400">
                            <div className="relative inline-block mb-4">
                              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                                <MessageCircle className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="absolute -top-1 -right-1">
                                <Sparkles className="w-5 h-5 text-gray-500 animate-pulse" />
                              </div>
                            </div>
                            <p className="text-base font-semibold text-gray-300 mb-1">Nenhum ticket encontrado</p>
                            {supportTicketFilter !== 'all' && (
                              <p className="text-sm text-gray-400">para o filtro selecionado</p>
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
                                <div
                            key={ticket.id}
                                  className={`cursor-pointer transition-all rounded-md sm:rounded-lg lg:rounded-xl p-1.5 sm:p-2 lg:p-4 border-2 relative group ${
                              selectedTicket?.id === ticket.id 
                                      ? 'border-blue-500 bg-blue-900/20 shadow-sm sm:shadow-md ring-1 sm:ring-2 ring-blue-500/50'
                                      : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-700 hover:shadow-sm bg-gray-800'
                            }`}
                            onClick={() => openSupportTicket(ticket.id)}
                          >
                            {/* Indicador de mensagens não lidas */}
                            {unreadCount > 0 && selectedTicket?.id !== ticket.id && (
                                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 lg:top-3 lg:right-3 flex items-center gap-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[9px] sm:text-[10px] lg:text-xs font-bold px-1 sm:px-1.5 lg:px-2.5 py-0.5 rounded-full shadow-md animate-pulse border border-white z-10">
                                      <div className="w-1 h-1 bg-gray-800 rounded-full animate-ping"></div>
                                <span>{unreadCount}</span>
                              </div>
                            )}
                                  
                                  <div className="flex items-start gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-3">
                                    {/* Avatar do usuário */}
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] lg:text-sm font-bold shadow-sm flex-shrink-0 ring-1 ring-white">
                                      {(ticket.user?.name || ticket.user?.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-5 sm:pr-6 lg:pr-0">
                                      <div className="flex items-start justify-between gap-1 mb-0.5">
                                        <h3 className="font-bold text-white text-[10px] sm:text-[11px] lg:text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                                          {ticket.subject}
                                        </h3>
                                {/* Ícone de status */}
                                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-6 lg:h-6 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${ticket.status === 'open'
                                          ? 'bg-green-600/20'
                                    : ticket.status === 'in_progress'
                                            ? 'bg-blue-600/20'
                                            : 'bg-gray-700'
                                          }`}>
                                          {ticket.status === 'open' && <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3.5 lg:h-3.5 text-green-400" />}
                                          {ticket.status === 'in_progress' && <Headphones className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3.5 lg:h-3.5 text-blue-400" />}
                                          {ticket.status === 'closed' && <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3.5 lg:h-3.5 text-gray-400" />}
                                </div>
                                  </div>
                                      <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-300 mb-0.5 sm:mb-1 line-clamp-1">
                                        {ticket.user?.name || ticket.user?.email || 'Usuário'}
                                      </p>
                                  </div>
                                </div>
                                  
                                  <div className="flex items-center justify-between pt-1 sm:pt-1.5 lg:pt-2 border-t border-gray-700">
                                <span
                                      className={`px-1 sm:px-1.5 lg:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-semibold flex items-center gap-0.5 ${
                                    ticket.status === 'open'
                                          ? 'bg-green-600 text-white'
                                      : ticket.status === 'in_progress'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-600 text-gray-300'
                                  }`}
                                >
                                  {ticket.status === 'open' && (
                                    <>
                                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                      <span>Aberto</span>
                                    </>
                                  )}
                                  {ticket.status === 'in_progress' && (
                                    <>
                                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                          <span className="hidden lg:inline">Em atendimento</span>
                                          <span className="lg:hidden">Atend.</span>
                                    </>
                                  )}
                                  {ticket.status === 'closed' && (
                                    <>
                                          <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                                      <span>Fechado</span>
                                    </>
                                  )}
                                </span>
                                    <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-400 flex items-center gap-0.5">
                                      <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                                  {(() => {
                                    const dateStr = String(ticket.createdAt);
                                    const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                                    const utcDate = new Date(utcDateStr);
                                    const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                                        return brDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                  })()}
                                </span>
                              </div>
                                </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área de Mensagens */}
                  <div className="lg:col-span-2 flex flex-col h-full min-h-0">
              {selectedTicket ? (
                      <Card className="h-full flex flex-col shadow-xl border-0 overflow-hidden lg:h-auto bg-gray-800 border-gray-700" style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}>
                        {/* Header melhorado com gradiente - Compacto no mobile */}
                        <CardHeader className="border-b bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-1.5 sm:p-3 lg:p-4 shadow-lg sm:shadow-xl relative overflow-hidden flex-shrink-0">
                          {/* Efeito de brilho animado */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 animate-shimmer"></div>
                          <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 relative z-10">
                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2 lg:mb-3">
                              {/* Título à esquerda */}
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md sm:rounded-lg lg:rounded-xl bg-gray-800/20 backdrop-blur-sm flex items-center justify-center border border-white/30 sm:border-2 shadow-md sm:shadow-lg flex-shrink-0">
                                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-white text-sm sm:text-base lg:text-xl font-bold line-clamp-2 drop-shadow-md mb-0.5 sm:mb-1">
                                    {selectedTicket.subject}
                                  </CardTitle>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    {selectedTicket.status !== 'closed' && (
                          <div className="relative">
                                        <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-md shadow-green-300/50"></div>
                                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-300 rounded-full animate-ping opacity-75"></div>
                          </div>
                                    )}
                                    <span className="text-[10px] sm:text-xs text-blue-100">
                                      {selectedTicket.status === 'open' ? 'Aberto' : selectedTicket.status === 'in_progress' ? 'Em Atendimento' : 'Fechado'}
                                    </span>
                          </div>
                                </div>
                              </div>
                              {/* Cliente à direita */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] sm:text-xs lg:text-base font-bold border border-white/40 sm:border-2 shadow-md sm:shadow-lg ring-1 sm:ring-2 ring-white/20 flex-shrink-0">
                            {(selectedTicket.user?.name || selectedTicket.user?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                                <div className="flex flex-col items-end min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-blue-200 flex-shrink-0" />
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-blue-100 font-semibold truncate">
                                {selectedTicket.user?.name || selectedTicket.user?.email}
                              </p>
                            </div>
                            {selectedTicket.user?.email && selectedTicket.user?.name && (
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                      <MailIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-blue-200 flex-shrink-0" />
                                      <p className="text-[9px] sm:text-xs text-blue-200 opacity-90 truncate">
                                  {selectedTicket.user.email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                            {selectedTicket.status !== 'closed' && (
                              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0 pt-1.5 sm:pt-2 border-t border-white/20">
                                {!selectedTicket.adminId && (
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
                                    className="bg-gray-800/10 hover:bg-gray-800/20 text-white border-white/30 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 h-auto"
                          >
                                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            <span>Atribuir</span>
                          </Button>
                        )}
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
                                  className="bg-gray-800/10 hover:bg-gray-800/20 text-white border-white/30 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 h-auto"
                          >
                                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            <span>Fechar</span>
                          </Button>
                              </div>
                        )}
                    </div>
                  </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden p-0 bg-gray-800 min-h-0">
                    {/* Mensagens com design melhorado */}
                          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 sm:space-5 lg:space-y-5 min-h-0 lg:h-auto" style={{ height: 'calc(100vh - 380px)', minHeight: '450px' }}>
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        <>
                          {selectedTicket.messages.map((msg: any) => (
                            <div
                              key={msg.id}
                                    className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {msg.senderType !== 'admin' && (
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-gray-700">
                                  {(msg.sender?.name || msg.sender?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                      className={`max-w-[80%] sm:max-w-[85%] lg:max-w-[75%] rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 shadow-lg transition-all hover:shadow-xl ${msg.senderType === 'admin'
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                                    : 'bg-gray-700 text-white border border-gray-600 rounded-bl-md shadow-md'
                                }`}
                              >
                                      <div className={`text-xs font-bold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 ${msg.senderType === 'admin' ? 'text-blue-100' : 'text-gray-300'
                                }`}>
                                        {msg.senderType === 'admin' && (
                                          <div className="w-1.5 h-1.5 bg-blue-200 rounded-full"></div>
                                        )}
                                        <span className="truncate">{msg.sender?.name || msg.sender?.email}</span>
                                </div>
                                      <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${msg.senderType === 'admin' ? 'text-white' : 'text-white'
                                }`}>
                                  {msg.content}
                                </div>
                                      <div className={`text-xs mt-2 sm:mt-2.5 flex items-center gap-1.5 sm:gap-2 ${msg.senderType === 'admin' ? 'text-blue-100 opacity-80' : 'text-gray-400'
                                }`}>
                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                  {(() => {
                                    const dateStr = String(msg.createdAt);
                                    const utcDateStr = dateStr.endsWith('Z') ? dateStr : (dateStr.match(/[+-]\d{2}:?\d{2}$/) ? dateStr : dateStr + 'Z');
                                    const utcDate = new Date(utcDateStr);
                                    const brDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                                    return brDate.toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                                  })()}
                                </div>
                              </div>
                              {msg.senderType === 'admin' && (
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg flex-shrink-0 ring-2 ring-gray-700">
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
                            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center shadow-xl">
                              <MessageSquare className="w-10 h-10 text-gray-400" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                              <Sparkles className="w-6 h-6 text-gray-500 animate-pulse" />
                            </div>
                          </div>
                          <p className="text-lg font-bold text-gray-300 mb-2">Nenhuma mensagem ainda</p>
                          <p className="text-sm text-gray-400 text-center">Inicie a conversa enviando uma mensagem abaixo</p>
                        </div>
                      )}
                    </div>

                    {/* Input melhorado */}
                    {selectedTicket.status !== 'closed' && (
                            <div className="p-1.5 sm:p-3 lg:p-4 bg-gray-800 border-t border-gray-700 sm:border-t-2 shadow-lg sm:shadow-2xl flex-shrink-0">
                              <div className="flex gap-1.5 sm:gap-2 lg:gap-3 items-end">
                          <div className="flex-1 relative">
                                  <Textarea
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                  sendSupportMessage();
                                }
                              }}
                              placeholder="Digite sua resposta..."
                              disabled={supportLoading}
                                    rows={1}
                                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-600 sm:border-2 focus:border-blue-500 focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm lg:text-base resize-none min-h-[38px] sm:min-h-[42px] lg:min-h-[48px] max-h-32 bg-gray-700 text-white placeholder-gray-400"
                            />
                          </div>
                          <Button
                            onClick={sendSupportMessage}
                            disabled={supportLoading || !supportMessage.trim()}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-2.5 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 rounded-md sm:rounded-lg lg:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed h-auto min-w-[38px] sm:min-w-[42px] lg:min-w-[60px] flex-shrink-0"
                          >
                            {supportLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-spin" />
                            ) : (
                                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                            )}
                          </Button>
                        </div>
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 ml-0.5 hidden sm:block">
                                Pressione Enter para enviar • Shift+Enter para nova linha
                              </p>
                      </div>
                    )}

                    {selectedTicket.status === 'closed' && (
                      <div className="p-5 bg-gray-800 border-t border-gray-700 text-center">
                        <div className="inline-flex items-center gap-3 text-gray-300 bg-gray-700 px-6 py-3 rounded-full shadow-md border border-gray-600">
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                          <span className="text-sm font-semibold">Esta conversa foi fechada</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                      <Card className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 shadow-xl border-0 border-gray-700">
                        <div className="text-center px-4 sm:px-6 max-w-md">
                          <div className="relative inline-block mb-4 sm:mb-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-700 flex items-center justify-center shadow-2xl ring-2 sm:ring-4 ring-gray-600 animate-pulse">
                              <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-gray-400" />
                    </div>
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-400 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -left-1">
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-600/50 rounded-full animate-ping opacity-75"></div>
                            </div>
                          </div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">Selecione um ticket</h3>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-400 mb-3 sm:mb-4 px-2">Escolha uma conversa na lista ao lado para começar o atendimento</p>
                          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600/20 rounded-lg text-xs text-blue-300 font-medium border border-blue-700">
                              💬 Chat em tempo real
                            </div>
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600/20 rounded-lg text-xs text-green-300 font-medium border border-green-700">
                              ⚡ Resposta rápida
                            </div>
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600/20 rounded-lg text-xs text-blue-300 font-medium border border-blue-700">
                              📊 Histórico completo
                            </div>
                          </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

            {/* Editor da landing (/landing) */}
            {mainView === "landing" && (
              <section className="relative mx-auto max-w-6xl px-4 py-6 sm:py-10">
                <header className="mb-8 flex flex-col gap-4 border-b border-gray-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        Banners da landing
                      </h2>
                      {!landingBannersLoading && landingBannersPublishedSnapshot !== null && (
                        landingBannersHasUnsavedChanges ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                          >
                            Alterações pendentes
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          >
                            <CheckCircle2 className="mr-1 inline h-3 w-3" aria-hidden />
                            Publicado
                          </Badge>
                        )
                      )}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                      Clique num item para editar; use <span className="text-gray-400">Salvar alterações</span> ao final para
                      publicar.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openLandingCreateModal}
                    className="h-9 shrink-0 bg-blue-600 px-4 text-white hover:bg-blue-600/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo banner
                  </Button>
                </header>

                {landingBannersLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800 bg-gray-950/40 py-24">
                    <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500">Carregando…</p>
                  </div>
                ) : (
                  <>
                    {landingBanners.length > 0 && (
                      <p className="mb-4 text-xs text-gray-500">
                        {landingBanners.length} {landingBanners.length === 1 ? "item" : "itens"} · ordem crescente na página
                      </p>
                    )}

                    {landingBanners.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950/30 py-16 text-center">
                        <p className="mb-4 text-sm text-gray-500">Nenhum banner configurado.</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={openLandingCreateModal}
                          className="bg-blue-600 text-white hover:bg-blue-600/90"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar banner
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {[...landingBanners]
                          .map((banner, originalIndex) => ({ banner, originalIndex }))
                          .sort(
                            (a, b) =>
                              a.banner.order - b.banner.order || a.originalIndex - b.originalIndex
                          )
                          .map(({ banner, originalIndex }, sortedIndex) => (
                            <div
                              key={banner.id || `landing-tile-${originalIndex}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => openLandingEditModal(originalIndex)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openLandingEditModal(originalIndex);
                                }
                              }}
                              className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-950/50 transition-colors hover:border-gray-700 hover:bg-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-gray-800/90 px-2.5 py-2 sm:px-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="font-mono text-[11px] font-semibold tabular-nums text-gray-500">
                                    {String(sortedIndex + 1).padStart(2, "0")}
                                  </span>
                                  <span className="truncate text-[11px] text-gray-500">
                                    Ordem {banner.order}
                                    {!banner.imageUrl && (
                                      <span className="text-amber-600/90"> · sem imagem</span>
                                    )}
                                    {!banner.link?.trim() && (
                                      <span className="text-gray-600"> · sem link</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex shrink-0 gap-0.5">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                                    aria-label="Editar"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openLandingEditModal(originalIndex);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-gray-500 hover:bg-red-950/50 hover:text-red-400"
                                    aria-label="Remover"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLandingBanners((prev) =>
                                        prev.filter((_, i) => i !== originalIndex)
                                      );
                                      toast.success("Banner removido");
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex h-[6.5rem] w-full items-center justify-center bg-zinc-950 sm:h-[7.25rem]">
                                {banner.imageUrl ? (
                                  <img
                                    src={banner.imageUrl}
                                    alt={banner.alt || "Pré-visualização do banner"}
                                    className="max-h-full max-w-full object-contain px-2 py-1.5"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-gray-600">
                                    <Upload className="h-6 w-6 opacity-40" aria-hidden />
                                    <span className="text-[10px]">Sem mídia</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-1 flex-col gap-1 border-t border-gray-800/80 px-2.5 py-2.5 sm:px-3">
                                <p className="truncate text-left text-sm font-medium text-gray-100">
                                  {banner.alt?.trim() || `Banner ${originalIndex + 1}`}
                                </p>
                                <div className="flex min-h-[1.25rem] items-center gap-1.5">
                                  <ExternalLink className="h-3 w-3 shrink-0 text-gray-600" aria-hidden />
                                  <span
                                    className="truncate text-left font-mono text-[11px] text-gray-500"
                                    title={banner.link?.trim() || undefined}
                                  >
                                    {formatLandingLinkLabel(banner.link || "")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    <div
                      className="sticky bottom-4 z-10 mt-10"
                      role="region"
                      aria-label="Publicar alterações da landing"
                    >
                      <div
                        className={`overflow-hidden rounded-xl border bg-gray-900/95 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] backdrop-blur-md ${
                          landingBannersHasUnsavedChanges
                            ? "border-amber-500/30"
                            : "border-emerald-500/30"
                        }`}
                      >
                        <div
                          className={`h-0.5 bg-gradient-to-r from-transparent to-transparent ${
                            landingBannersHasUnsavedChanges
                              ? "via-amber-500/70"
                              : "via-emerald-500/70"
                          }`}
                          aria-hidden
                        />
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
                          <div className="flex min-w-0 items-start gap-3 sm:items-center">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${
                                landingBannersHasUnsavedChanges
                                  ? "bg-amber-500/10 text-amber-400 ring-amber-500/25"
                                  : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25"
                              }`}
                              aria-hidden
                            >
                              {landingBannersHasUnsavedChanges ? (
                                <AlertCircle className="h-5 w-5" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              {landingBannersHasUnsavedChanges ? (
                                <>
                                  <p className="text-sm font-medium text-gray-100">
                                    Alterações pendentes — ainda não publicadas
                                  </p>
                                  <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                                    Use{" "}
                                    <span className="font-medium text-gray-300">Salvar alterações</span> para publicar.
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-medium text-emerald-100">
                                  Publicado
                                  {landingBannersLastPublishedAt && (
                                    <span className="mt-0.5 block text-xs font-normal text-gray-400">
                                      {landingBannersLastPublishedAt.toLocaleString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full border-gray-600 bg-gray-800/60 text-gray-200 hover:border-gray-500 hover:bg-gray-800 hover:text-white sm:w-auto"
                              onClick={() => window.open("/landing", "_blank", "noopener,noreferrer")}
                            >
                              <Eye className="mr-2 h-4 w-4 opacity-80" />
                              Pré-visualizar
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-50" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              onClick={saveLandingBanners}
                              disabled={landingBannersSaving || !landingBannersHasUnsavedChanges}
                              className={`h-10 w-full px-6 sm:w-auto ${
                                landingBannersHasUnsavedChanges
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                                  : "border border-emerald-600/50 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-950/60"
                              } disabled:opacity-60`}
                            >
                              {landingBannersSaving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Publicando…
                                </>
                              ) : landingBannersHasUnsavedChanges ? (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Salvar alterações
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Tudo publicado
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Dialog open={landingModalOpen} onOpenChange={setLandingModalOpen}>
                      <DialogContent className="max-h-[min(90vh,720px)] w-[min(100vw-1rem,42rem)] gap-0 overflow-hidden border-gray-700 bg-gray-800 p-0 text-white sm:max-w-2xl">
                        <DialogHeader className="space-y-1 border-b border-gray-700 px-6 pb-4 pt-2 pr-12">
                          <DialogTitle className="text-left text-lg text-white">
                            {landingEditingIndex === null ? "Novo banner" : "Editar banner"}
                          </DialogTitle>
                          <DialogDescription className="text-left text-sm text-gray-400">
                            Ajuste imagem, texto e link. Use <strong className="text-gray-300">Aplicar à lista</strong> para
                            guardar neste painel; depois confirme com <strong className="text-gray-300">Salvar alterações</strong>{" "}
                            para publicar.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[calc(min(90vh,720px)-200px)] space-y-5 overflow-y-auto px-6 py-5">
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Pré-visualização
                            </p>
                            <div className="overflow-hidden rounded-xl border border-gray-600/50 bg-[#0a0d12] p-1 ring-1 ring-black/40">
                              <div className="relative flex min-h-[140px] items-center justify-center rounded-lg bg-gradient-to-b from-gray-900/90 to-black/80 sm:min-h-[180px]">
                                <div
                                  className="pointer-events-none absolute inset-0 opacity-[0.1]"
                                  style={{
                                    backgroundImage:
                                      "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)",
                                    backgroundSize: "14px 14px",
                                  }}
                                  aria-hidden
                                />
                                <div className="relative z-[1] flex w-full items-center justify-center px-2 py-3">
                                  {landingModalUploading ? (
                                    <div className="flex flex-col items-center gap-2 py-8">
                                      <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                                      <span className="text-xs text-gray-400">Enviando…</span>
                                    </div>
                                  ) : landingDraft.imageUrl ? (
                                    <img
                                      src={landingDraft.imageUrl}
                                      alt={landingDraft.alt || "Preview"}
                                      className="max-h-48 w-full object-contain drop-shadow-md"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-1 py-8 text-center text-gray-500">
                                      <Upload className="h-8 w-8 opacity-50" />
                                      <span className="text-xs">Sem imagem</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="border-t border-white/[0.06] bg-black/30 p-3">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={landingModalUploading}
                                  className="w-full rounded-lg border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                                  onClick={() => {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = "image/*";
                                    input.onchange = async (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (!file) return;
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast.error("A imagem deve ter no máximo 5MB");
                                        return;
                                      }
                                      try {
                                        setLandingModalUploading(true);
                                        const result = await apiClient.uploadImage(file);
                                        setLandingDraft((d) => ({ ...d, imageUrl: result.url }));
                                        toast.success("Imagem enviada!");
                                      } catch (err: any) {
                                        toast.error(err.message || "Erro ao enviar imagem");
                                      } finally {
                                        setLandingModalUploading(false);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  {landingDraft.imageUrl ? "Trocar arquivo" : "Enviar arquivo"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 rounded-xl border border-gray-700/50 bg-black/20 p-4 ring-1 ring-inset ring-white/[0.03]">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <div className="sm:col-span-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                  Texto alternativo (alt)
                                </Label>
                                <Input
                                  value={landingDraft.alt}
                                  onChange={(e) =>
                                    setLandingDraft((d) => ({ ...d, alt: e.target.value }))
                                  }
                                  placeholder="Descrição para acessibilidade"
                                  className="mt-2 rounded-lg border-gray-600 bg-gray-950/80 text-white placeholder:text-gray-600"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                  Ordem
                                </Label>
                                <Input
                                  type="number"
                                  value={landingDraft.order}
                                  onChange={(e) =>
                                    setLandingDraft((d) => ({
                                      ...d,
                                      order: parseInt(e.target.value, 10) || 0,
                                    }))
                                  }
                                  className="mt-2 rounded-lg border-gray-600 bg-gray-950/80 text-white tabular-nums"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                                Link ao clicar
                              </Label>
                              <Input
                                value={landingDraft.link}
                                onChange={(e) =>
                                  setLandingDraft((d) => ({ ...d, link: e.target.value }))
                                }
                                placeholder="https://wa.me/… ou /produto/id"
                                className="mt-2 rounded-lg border-gray-600 bg-gray-950/80 font-mono text-sm text-white placeholder:text-gray-600"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-gray-700 bg-gray-900/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                              onClick={() => setLandingModalOpen(false)}
                            >
                              Cancelar
                            </Button>
                            {landingEditingIndex !== null && (
                              <Button
                                type="button"
                                variant="destructive"
                                className="bg-red-600/90 hover:bg-red-600"
                                onClick={deleteLandingFromModal}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            )}
                          </div>
                          <Button
                            type="button"
                            className="bg-blue-600 text-white hover:bg-blue-500"
                            onClick={applyLandingModal}
                          >
                            Aplicar à lista
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </section>
            )}

            {mainView === "home-content" && (
              <section className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Conteúdo da Home</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Personalize a página inicial · alterações por aba
                    </p>
                  </div>
                </div>

                {homeContentLoading ? (
                  <div className="flex items-center justify-center py-24 rounded-2xl border border-white/5 bg-gradient-to-b from-gray-800/80 to-gray-900/80">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800 to-gray-850 overflow-hidden shadow-2xl shadow-black/40" style={{ background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)' }}>
                      {/* Tabs */}
                      <div className="px-2 sm:px-3 pt-2 bg-black/25 border-b border-white/10">
                        <div className="flex gap-0.5 overflow-x-auto">
                        {[
                          { id: "logos", label: "Logos", icon: ImageIcon },
                          { id: "hero", label: "Hero", icon: Sparkles },
                          { id: "carousel", label: "Carrossel", icon: Upload },
                          { id: "whyChooseUs", label: "Por Que Escolher", icon: Brain },
                          { id: "testimonials", label: "Depoimentos", icon: MessageSquare },
                          { id: "newsletter", label: "Newsletter", icon: Mail },
                          { id: "cta", label: "CTA Final", icon: ArrowRight },
                        ].map((tab) => {
                          const IconComponent = tab.icon;
                          const active = homeContentTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setHomeContentTab(tab.id as any)}
                              className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2.5 whitespace-nowrap text-sm font-medium transition-all ${
                                active
                                  ? 'text-white'
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <IconComponent className={`w-3.5 h-3.5 ${active ? 'text-blue-400' : ''}`} />
                              {tab.label}
                              <span
                                className={`absolute left-2 right-2 bottom-0 h-[2px] rounded-full transition-opacity ${
                                  active ? 'bg-blue-500 opacity-100' : 'opacity-0'
                                }`}
                              />
                            </button>
                          );
                        })}
                        </div>
                      </div>

                      <div className="p-5 sm:p-7 min-h-[380px]">
                      {/* Logos / Branding */}
                      {homeContentTab === "logos" && (
                        <div className="space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-white">Identidade visual</h3>
                              <p className="text-sm text-gray-400 mt-0.5">
                                Logo única no header e no rodapé do site público.
                              </p>
                            </div>
                            <span
                              className={`inline-flex self-start items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                brandingLogoUrl
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : 'bg-white/5 text-gray-400 border-white/10'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${brandingLogoUrl ? 'bg-blue-400' : 'bg-gray-500'}`} />
                              {brandingLogoUrl ? 'Logo personalizada' : 'Ícone padrão'}
                            </span>
                          </div>

                          {/* Browser-style live mock */}
                          <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0b1220] shadow-inner">
                            <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border-b border-white/5">
                              <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                              </div>
                              <div className="flex-1 mx-2">
                                <div className="h-6 rounded-md bg-white/5 border border-white/5 flex items-center px-3">
                                  <span className="text-[11px] text-gray-500 truncate">culturebuilders.com</span>
                                </div>
                              </div>
                            </div>

                            {/* Header mock */}
                            <div className="px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-900/90 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                {brandingLogoUploading ? (
                                  <div className="w-11 h-11 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                  </div>
                                ) : (
                                  <img
                                    src={brandingLogoUrl || defaultLogoImg}
                                    alt="Preview da logo"
                                    className="w-11 h-11 object-contain shrink-0"
                                  />
                                )}
                                {brandingShowBrandName && (
                                  <span className="font-bold text-base sm:text-lg text-white truncate">
                                    Culture Builders
                                  </span>
                                )}
                              </div>
                              <div className="hidden sm:flex items-center gap-2 opacity-40">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                <div className="w-20 h-3 rounded bg-white/10" />
                              </div>
                            </div>

                            {/* Page body placeholder */}
                            <div className="px-4 sm:px-6 py-6 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
                              <div className="h-3 w-2/5 rounded-full bg-white/10" />
                              <div className="h-3 w-3/5 rounded-full bg-white/[0.06]" />
                              <div className="h-3 w-1/2 rounded-full bg-white/[0.06]" />
                              <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="h-16 rounded-lg bg-white/[0.04] border border-white/5" />
                                <div className="h-16 rounded-lg bg-white/[0.04] border border-white/5" />
                                <div className="h-16 rounded-lg bg-white/[0.04] border border-white/5" />
                              </div>
                            </div>

                            {/* Footer mock */}
                            <div className="px-4 sm:px-6 py-5 border-t border-white/5 bg-slate-950">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={brandingLogoUrl || defaultLogoImg}
                                  alt=""
                                  className="w-9 h-9 object-contain"
                                />
                                {brandingShowBrandName && (
                                  <span className="text-sm font-semibold text-gray-200">Culture Builders</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 mt-3">© Culture Builders · rodapé do site</p>
                            </div>
                          </div>

                          {/* Controls row */}
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                            <input
                              id="branding-logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("A imagem deve ter no máximo 5MB");
                                  e.target.value = "";
                                  return;
                                }
                                try {
                                  setBrandingLogoUploading(true);
                                  const result = await apiClient.uploadImage(file);
                                  setBrandingLogoUrl(result.url);
                                  toast.success("Logo enviada com sucesso");
                                } catch (error: any) {
                                  console.error("Erro no upload da logo:", error);
                                  toast.error(error.message || "Erro ao fazer upload da logo");
                                } finally {
                                  setBrandingLogoUploading(false);
                                  e.target.value = "";
                                }
                              }}
                            />

                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">Arquivo da logo</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  PNG, JPG ou WebP · até 5MB · alterações aparecem no preview acima
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                <Button
                                  type="button"
                                  disabled={brandingLogoUploading}
                                  className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/20"
                                  onClick={() => document.getElementById("branding-logo-upload")?.click()}
                                >
                                  {brandingLogoUploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  {brandingLogoUploading
                                    ? "Enviando..."
                                    : brandingLogoUrl
                                      ? "Trocar imagem"
                                      : "Fazer upload"}
                                </Button>
                                {brandingLogoUrl && (
                                  <Button
                                    type="button"
                                    disabled={brandingLogoUploading}
                                    className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50"
                                    onClick={() => setBrandingLogoUrl("")}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Usar padrão
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                              <label
                                htmlFor="branding-show-name"
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <input
                                  id="branding-show-name"
                                  type="checkbox"
                                  checked={brandingShowBrandName}
                                  onChange={(e) => setBrandingShowBrandName(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                  Exibir nome <span className="text-white font-medium">Culture Builders</span> ao lado da logo
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hero Section */}
                      {homeContentTab === "hero" && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">Seção Hero</h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Título principal e CTAs da primeira dobra da home.
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <Label htmlFor="heroBadge" className="text-sm font-medium text-gray-300">Badge</Label>
                              <Input id="heroBadge" value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="🧠 Plataforma de Cursos de Psicologia" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                            </div>
                            <div>
                              <Label htmlFor="heroTitle" className="text-sm font-medium text-gray-300">Título</Label>
                              <Input id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Transforme Sua Vida com Psicologia Aplicada" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                            </div>
                            <div>
                              <Label htmlFor="heroSubtitle" className="text-sm font-medium text-gray-300">Subtítulo</Label>
                              <Textarea id="heroSubtitle" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Descubra cursos criados por especialistas..." rows={3} className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                            </div>
                            <label
                              htmlFor="hero-show-stats"
                              className="flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-1 border border-white/5 hover:bg-white/[0.03] transition-colors"
                            >
                              <input
                                id="hero-show-stats"
                                type="checkbox"
                                checked={heroShowStats}
                                onChange={(e) => setHeroShowStats(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                              />
                              <span>
                                <span className="block text-sm text-white font-medium">
                                  Exibir estatísticas no Hero
                                </span>
                                <span className="block text-xs text-gray-400 mt-0.5">
                                  Cursos, alunos, avaliação média e horas de conteúdo
                                </span>
                              </span>
                            </label>

                            {heroShowStats && (
                              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-white">Valores das estatísticas</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Automático: cursos, avaliação e horas vêm do sistema. Alunos Transformados você define aqui.
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                      type="button"
                                      onClick={() => setHeroStatsMode("auto")}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        heroStatsMode === "auto"
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-transparent text-gray-300 border-white/15 hover:bg-white/5"
                                      }`}
                                    >
                                      Automático
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setHeroStatsMode("manual")}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        heroStatsMode === "manual"
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "bg-transparent text-gray-300 border-white/15 hover:bg-white/5"
                                      }`}
                                    >
                                      Manual
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-400">Cursos Especializados</Label>
                                    <Input
                                      value={heroStats.courses}
                                      onChange={(e) => setHeroStats((s) => ({ ...s, courses: e.target.value }))}
                                      placeholder={heroStatsMode === "auto" ? "Vem do sistema" : "Ex: 12"}
                                      disabled={heroStatsMode === "auto"}
                                      className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500 disabled:opacity-50"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-400">Alunos Transformados</Label>
                                    <Input
                                      value={heroStats.students}
                                      onChange={(e) => setHeroStats((s) => ({ ...s, students: e.target.value }))}
                                      placeholder="Ex: 50.000+"
                                      className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-400">Avaliação Média</Label>
                                    <Input
                                      value={heroStats.rating}
                                      onChange={(e) => setHeroStats((s) => ({ ...s, rating: e.target.value }))}
                                      placeholder={heroStatsMode === "auto" ? "Vem do sistema" : "Ex: 4.8/5"}
                                      disabled={heroStatsMode === "auto"}
                                      className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500 disabled:opacity-50"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-400">Horas de Conteúdo</Label>
                                    <Input
                                      value={heroStats.hours}
                                      onChange={(e) => setHeroStats((s) => ({ ...s, hours: e.target.value }))}
                                      placeholder={heroStatsMode === "auto" ? "Vem do sistema" : "Ex: 120h+"}
                                      disabled={heroStatsMode === "auto"}
                                      className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500 disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <p className="text-sm font-medium text-white">Botões de ação</p>
                              <p className="text-xs text-gray-400 mt-0.5">Texto exibido e ação interna (ex.: explore, podcasts)</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="heroPrimaryText" className="text-sm font-medium text-gray-300">Botão primário — texto</Label>
                                <Input id="heroPrimaryText" value={heroPrimaryButtonText} onChange={(e) => setHeroPrimaryButtonText(e.target.value)} placeholder="Explorar Cursos" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                              </div>
                              <div>
                                <Label htmlFor="heroPrimaryAction" className="text-sm font-medium text-gray-300">Botão primário — ação</Label>
                                <Input id="heroPrimaryAction" value={heroPrimaryButtonAction} onChange={(e) => setHeroPrimaryButtonAction(e.target.value)} placeholder="explore" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                              </div>
                              <div>
                                <Label htmlFor="heroSecondaryText" className="text-sm font-medium text-gray-300">Botão secundário — texto</Label>
                                <Input id="heroSecondaryText" value={heroSecondaryButtonText} onChange={(e) => setHeroSecondaryButtonText(e.target.value)} placeholder="Podcasts" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                              </div>
                              <div>
                                <Label htmlFor="heroSecondaryAction" className="text-sm font-medium text-gray-300">Botão secundário — ação</Label>
                                <Input id="heroSecondaryAction" value={heroSecondaryButtonAction} onChange={(e) => setHeroSecondaryButtonAction(e.target.value)} placeholder="podcasts" className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Carousel Section */}
                      {homeContentTab === "carousel" && (
                        <div className="space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-white">Imagens do Carrossel</h3>
                              <p className="text-sm text-gray-400 mt-0.5">
                                Fotos exibidas no carrossel da home. PNG, JPG ou WebP até 5MB.
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                setCarouselImages([...carouselImages, { url: "", alt: "", order: carouselImages.length }]);
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 self-start"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Imagem
                            </Button>
                          </div>

                          {carouselImages.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                              <Images className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                              <p className="text-sm text-gray-400">Nenhuma imagem no carrossel.</p>
                              <p className="text-xs text-gray-500 mt-1">Clique em &quot;Adicionar Imagem&quot; para começar.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {carouselImages.map((img, index) => (
                                <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-black/20">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">#{index + 1}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        setCarouselImages(carouselImages.filter((_, i) => i !== index));
                                        const newUploading = { ...carouselImageUploading };
                                        delete newUploading[index];
                                        setCarouselImageUploading(newUploading);
                                      }}
                                      className="h-8 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                      Remover
                                    </Button>
                                  </div>
                                  <div className="p-4 sm:p-5 space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-300">Imagem</Label>
                                      <div className="mt-1.5 rounded-lg border border-dashed border-white/15 bg-[#0b1220] p-6 text-center hover:border-blue-500/50 transition-colors">
                                        {carouselImageUploading[index] ? (
                                          <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                                            <p className="text-sm text-gray-400">Enviando imagem...</p>
                                          </div>
                                        ) : img.url ? (
                                          <div className="space-y-3">
                                            <img src={img.url} alt={img.alt || "Preview"} className="w-full h-48 object-cover rounded-lg mx-auto" />
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = async (e) => {
                                                  const file = (e.target as HTMLInputElement).files?.[0];
                                                  if (file) {
                                                    if (file.size > 5 * 1024 * 1024) {
                                                      toast.error('A imagem deve ter no máximo 5MB');
                                                      return;
                                                    }
                                                    try {
                                                      setCarouselImageUploading({ ...carouselImageUploading, [index]: true });
                                                      const result = await apiClient.uploadImage(file);
                                                      const newImages = [...carouselImages];
                                                      newImages[index].url = result.url;
                                                      setCarouselImages(newImages);
                                                      toast.success('Imagem enviada com sucesso!');
                                                    } catch (error: any) {
                                                      toast.error(error.message || 'Erro ao enviar imagem');
                                                    } finally {
                                                      setCarouselImageUploading({ ...carouselImageUploading, [index]: false });
                                                    }
                                                  }
                                                };
                                                input.click();
                                              }}
                                              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                                            >
                                              <Upload className="w-4 h-4 mr-2" />
                                              Trocar Imagem
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            <Upload className="w-10 h-10 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-400">
                                              Clique no botão abaixo para fazer upload da imagem
                                            </p>
                                            <input
                                              type="file"
                                              id={`carousel-image-${index}`}
                                              accept="image/*"
                                              className="hidden"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  if (file.size > 5 * 1024 * 1024) {
                                                    toast.error('A imagem deve ter no máximo 5MB');
                                                    return;
                                                  }
                                                  try {
                                                    setCarouselImageUploading({ ...carouselImageUploading, [index]: true });
                                                    const result = await apiClient.uploadImage(file);
                                                    const newImages = [...carouselImages];
                                                    newImages[index].url = result.url;
                                                    setCarouselImages(newImages);
                                                    toast.success('Imagem enviada com sucesso!');
                                                  } catch (error: any) {
                                                    toast.error(error.message || 'Erro ao enviar imagem');
                                                  } finally {
                                                    setCarouselImageUploading({ ...carouselImageUploading, [index]: false });
                                                  }
                                                }
                                              }}
                                            />
                                            <Button
                                              type="button"
                                              onClick={() => {
                                                document.getElementById(`carousel-image-${index}`)?.click();
                                              }}
                                              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                                            >
                                              <Upload className="w-4 h-4 mr-2" />
                                              Selecionar Imagem
                                            </Button>
                                            <p className="text-xs text-gray-500">
                                              PNG, JPG, WEBP até 5MB
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Texto Alternativo</Label>
                                        <Input
                                          value={img.alt}
                                          onChange={(e) => {
                                            const newImages = [...carouselImages];
                                            newImages[index].alt = e.target.value;
                                            setCarouselImages(newImages);
                                          }}
                                          placeholder="Descrição da imagem"
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Ordem</Label>
                                        <Input
                                          type="number"
                                          value={img.order}
                                          onChange={(e) => {
                                            const newImages = [...carouselImages];
                                            newImages[index].order = parseInt(e.target.value) || 0;
                                            setCarouselImages(newImages);
                                          }}
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Why Choose Us Section */}
                      {homeContentTab === "whyChooseUs" && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">Por Que Escolher Nós</h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Textos e cards da seção de diferenciais da home.
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <Label htmlFor="whyBadge" className="text-sm font-medium text-gray-300">Badge</Label>
                              <Input
                                id="whyBadge"
                                value={whyChooseUsBadge}
                                onChange={(e) => setWhyChooseUsBadge(e.target.value)}
                                placeholder="Por Que Escolher Nós?"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="whyTitle" className="text-sm font-medium text-gray-300">Título</Label>
                              <Input
                                id="whyTitle"
                                value={whyChooseUsTitle}
                                onChange={(e) => setWhyChooseUsTitle(e.target.value)}
                                placeholder="Transforme Sua Vida com Conhecimento"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="whySubtitle" className="text-sm font-medium text-gray-300">Subtítulo</Label>
                              <Textarea
                                id="whySubtitle"
                                value={whyChooseUsSubtitle}
                                onChange={(e) => setWhyChooseUsSubtitle(e.target.value)}
                                placeholder="Somos uma plataforma dedicada..."
                                rows={3}
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">Cards</p>
                                <p className="text-xs text-gray-400 mt-0.5">Ícone, título, descrição e gradiente de cada card</p>
                              </div>
                              <Button
                                onClick={() => {
                                  setWhyChooseUsCards([...whyChooseUsCards, { icon: "Brain", title: "", description: "", gradientColors: { from: "blue-500", to: "blue-600" } }]);
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 self-start"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Card
                              </Button>
                            </div>
                            <div className="space-y-4">
                              {whyChooseUsCards.map((card, index) => (
                                <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-black/20">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Card #{index + 1}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        setWhyChooseUsCards(whyChooseUsCards.filter((_, i) => i !== index));
                                      }}
                                      className="h-8 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                      Remover
                                    </Button>
                                  </div>
                                  <div className="p-4 sm:p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Ícone (lucide-react)</Label>
                                        <Input
                                          value={card.icon}
                                          onChange={(e) => {
                                            const newCards = [...whyChooseUsCards];
                                            newCards[index].icon = e.target.value;
                                            setWhyChooseUsCards(newCards);
                                          }}
                                          placeholder="Brain, Award, TrendingUp"
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Título</Label>
                                        <Input
                                          value={card.title}
                                          onChange={(e) => {
                                            const newCards = [...whyChooseUsCards];
                                            newCards[index].title = e.target.value;
                                            setWhyChooseUsCards(newCards);
                                          }}
                                          placeholder="Baseado em Ciência"
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-300">Descrição</Label>
                                      <Textarea
                                        value={card.description}
                                        onChange={(e) => {
                                          const newCards = [...whyChooseUsCards];
                                          newCards[index].description = e.target.value;
                                          setWhyChooseUsCards(newCards);
                                        }}
                                        placeholder="Todo conteúdo é validado..."
                                        rows={2}
                                        className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Gradiente (de)</Label>
                                        <Input
                                          value={card.gradientColors.from}
                                          onChange={(e) => {
                                            const newCards = [...whyChooseUsCards];
                                            newCards[index].gradientColors.from = e.target.value;
                                            setWhyChooseUsCards(newCards);
                                          }}
                                          placeholder="blue-500"
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-300">Gradiente (para)</Label>
                                        <Input
                                          value={card.gradientColors.to}
                                          onChange={(e) => {
                                            const newCards = [...whyChooseUsCards];
                                            newCards[index].gradientColors.to = e.target.value;
                                            setWhyChooseUsCards(newCards);
                                          }}
                                          placeholder="blue-600"
                                          className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Testimonials Section */}
                      {homeContentTab === "testimonials" && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">Depoimentos</h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Badge, título e subtítulo da seção de depoimentos.
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <Label htmlFor="testimonialsBadge" className="text-sm font-medium text-gray-300">Badge</Label>
                              <Input
                                id="testimonialsBadge"
                                value={testimonialsBadge}
                                onChange={(e) => setTestimonialsBadge(e.target.value)}
                                placeholder="Depoimentos"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="testimonialsTitle" className="text-sm font-medium text-gray-300">Título</Label>
                              <Input
                                id="testimonialsTitle"
                                value={testimonialsTitle}
                                onChange={(e) => setTestimonialsTitle(e.target.value)}
                                placeholder="O Que Nossos Alunos Dizem"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="testimonialsSubtitle" className="text-sm font-medium text-gray-300">Subtítulo</Label>
                              <Textarea
                                id="testimonialsSubtitle"
                                value={testimonialsSubtitle}
                                onChange={(e) => setTestimonialsSubtitle(e.target.value)}
                                placeholder="Histórias reais de transformação..."
                                rows={3}
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Newsletter Section */}
                      {homeContentTab === "newsletter" && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">Newsletter</h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Textos e bullets de benefícios do formulário de captura.
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <Label htmlFor="newsletterTitle" className="text-sm font-medium text-gray-300">Título</Label>
                              <Input
                                id="newsletterTitle"
                                value={newsletterTitle}
                                onChange={(e) => setNewsletterTitle(e.target.value)}
                                placeholder="Receba Conteúdos Exclusivos"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newsletterSubtitle" className="text-sm font-medium text-gray-300">Subtítulo</Label>
                              <Textarea
                                id="newsletterSubtitle"
                                value={newsletterSubtitle}
                                onChange={(e) => setNewsletterSubtitle(e.target.value)}
                                placeholder="Cadastre-se e receba dicas..."
                                rows={3}
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">Features</p>
                                <p className="text-xs text-gray-400 mt-0.5">Itens de benefício exibidos ao lado do formulário</p>
                              </div>
                              <Button
                                onClick={() => {
                                  setNewsletterFeatures([...newsletterFeatures, { text: "" }]);
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 self-start"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Feature
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {newsletterFeatures.map((feature, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={feature.text}
                                    onChange={(e) => {
                                      const newFeatures = [...newsletterFeatures];
                                      newFeatures[index].text = e.target.value;
                                      setNewsletterFeatures(newFeatures);
                                    }}
                                    placeholder="Sem spam"
                                    className="flex-1 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      setNewsletterFeatures(newsletterFeatures.filter((_, i) => i !== index));
                                    }}
                                    className="bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA Section */}
                      {homeContentTab === "cta" && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">CTA Final</h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Textos, botões e cards de benefícios do bloco final da home.
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <Label htmlFor="ctaBadge" className="text-sm font-medium text-gray-300">Badge</Label>
                              <Input
                                id="ctaBadge"
                                value={ctaBadge}
                                onChange={(e) => setCtaBadge(e.target.value)}
                                placeholder="🚀 Comece Agora"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ctaTitle" className="text-sm font-medium text-gray-300">Título</Label>
                              <Input
                                id="ctaTitle"
                                value={ctaTitle}
                                onChange={(e) => setCtaTitle(e.target.value)}
                                placeholder="Pronto Para Transformar Sua Vida?"
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ctaSubtitle" className="text-sm font-medium text-gray-300">Subtítulo</Label>
                              <Textarea
                                id="ctaSubtitle"
                                value={ctaSubtitle}
                                onChange={(e) => setCtaSubtitle(e.target.value)}
                                placeholder="Escolha o curso ideal..."
                                rows={3}
                                className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                              />
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                            <div>
                              <p className="text-sm font-medium text-white">Botões de ação</p>
                              <p className="text-xs text-gray-400 mt-0.5">Texto exibido e ação interna</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="ctaPrimaryText" className="text-sm font-medium text-gray-300">Botão Primário — texto</Label>
                                <Input
                                  id="ctaPrimaryText"
                                  value={ctaPrimaryButtonText}
                                  onChange={(e) => setCtaPrimaryButtonText(e.target.value)}
                                  placeholder="Explorar Todos os Cursos"
                                  className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor="ctaPrimaryAction" className="text-sm font-medium text-gray-300">Botão Primário — ação</Label>
                                <Input
                                  id="ctaPrimaryAction"
                                  value={ctaPrimaryButtonAction}
                                  onChange={(e) => setCtaPrimaryButtonAction(e.target.value)}
                                  placeholder="explore"
                                  className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor="ctaSecondaryText" className="text-sm font-medium text-gray-300">Botão Secundário — texto</Label>
                                <Input
                                  id="ctaSecondaryText"
                                  value={ctaSecondaryButtonText}
                                  onChange={(e) => setCtaSecondaryButtonText(e.target.value)}
                                  placeholder="Ver Aula Grátis"
                                  className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor="ctaSecondaryAction" className="text-sm font-medium text-gray-300">Botão Secundário — ação</Label>
                                <Input
                                  id="ctaSecondaryAction"
                                  value={ctaSecondaryButtonAction}
                                  onChange={(e) => setCtaSecondaryButtonAction(e.target.value)}
                                  placeholder="free-class"
                                  className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">Cards de Benefícios</p>
                                <p className="text-xs text-gray-400 mt-0.5">Ícone, cor, título e subtítulo de cada card</p>
                              </div>
                              <Button
                                onClick={() => {
                                  setCtaBenefitCards([...ctaBenefitCards, { icon: "Heart", title: "", subtitle: "", iconColor: "red-400" }]);
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 self-start"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Card
                              </Button>
                            </div>
                            <div className="space-y-4">
                              {ctaBenefitCards.map((card, index) => {
                                const IconComponent = (LucideIcons as any)[card.icon] || LucideIcons.Heart;
                                const iconColorClass = card.iconColor || "red-400";
                                
                                const getColorValue = (colorClass: string) => {
                                  const colorMap: { [key: string]: string } = {
                                    'red-400': '#f87171',
                                    'green-400': '#4ade80',
                                    'blue-400': '#60a5fa',
                                    'yellow-400': '#facc15',
                                    'pink-400': '#f472b6',
                                    'indigo-400': '#818cf8',
                                    'teal-400': '#2dd4bf',
                                  };
                                  return colorMap[colorClass] || '#f87171';
                                };

                                const iconColor = getColorValue(iconColorClass);
                                
                                const convertHexToTailwind = (hex: string): string => {
                                  if (!hex.startsWith('#')) {
                                    return hex;
                                  }
                                  
                                  const colorMap: { [key: string]: string } = {
                                    '#f87171': 'red-400',
                                    '#4ade80': 'green-400',
                                    '#60a5fa': 'blue-400',
                                    '#facc15': 'yellow-400',
                                    '#a78bfa': 'blue-400',
                                    '#f472b6': 'pink-400',
                                    '#818cf8': 'indigo-400',
                                    '#2dd4bf': 'teal-400',
                                  };
                                  
                                  if (colorMap[hex.toLowerCase()]) {
                                    return colorMap[hex.toLowerCase()];
                                  }
                                  
                                  const r = parseInt(hex.slice(1, 3), 16);
                                  const g = parseInt(hex.slice(3, 5), 16);
                                  const b = parseInt(hex.slice(5, 7), 16);
                                  
                                  const colors = [
                                    { name: 'red-400', r: 248, g: 113, b: 113 },
                                    { name: 'green-400', r: 74, g: 222, b: 128 },
                                    { name: 'blue-400', r: 96, g: 165, b: 250 },
                                    { name: 'yellow-400', r: 250, g: 204, b: 21 },
                                    { name: 'blue-400', r: 167, g: 139, b: 250 },
                                    { name: 'pink-400', r: 244, g: 114, b: 182 },
                                    { name: 'indigo-400', r: 129, g: 140, b: 248 },
                                    { name: 'teal-400', r: 45, g: 212, b: 191 },
                                  ];
                                  
                                  let closest = colors[0];
                                  let minDistance = Infinity;
                                  
                                  colors.forEach(color => {
                                    const distance = Math.sqrt(
                                      Math.pow(r - color.r, 2) +
                                      Math.pow(g - color.g, 2) +
                                      Math.pow(b - color.b, 2)
                                    );
                                    if (distance < minDistance) {
                                      minDistance = distance;
                                      closest = color;
                                    }
                                  });
                                  
                                  return closest.name;
                                };
                                const baseColor = iconColorClass.split('-')[0];
                                const lightColorMap: { [key: string]: string } = {
                                  'red': '#fee2e2',
                                  'green': '#dcfce7',
                                  'blue': '#dbeafe',
                                  'yellow': '#fef9c3',
                                  'pink': '#fce7f3',
                                  'indigo': '#e0e7ff',
                                  'teal': '#ccfbf1',
                                };
                                const lightColor = lightColorMap[baseColor] || '#fee2e2';

                                const iconOptions = [
                                  { value: "Heart", label: "Heart (Coração)", Icon: LucideIcons.Heart },
                                  { value: "Shield", label: "Shield (Escudo)", Icon: LucideIcons.Shield },
                                  { value: "Award", label: "Award (Troféu)", Icon: LucideIcons.Award },
                                  { value: "Star", label: "Star (Estrela)", Icon: LucideIcons.Star },
                                  { value: "CheckCircle", label: "CheckCircle (Check)", Icon: LucideIcons.CheckCircle },
                                  { value: "Zap", label: "Zap (Raio)", Icon: LucideIcons.Zap },
                                  { value: "Lock", label: "Lock (Cadeado)", Icon: LucideIcons.Lock },
                                  { value: "Clock", label: "Clock (Relógio)", Icon: LucideIcons.Clock },
                                  { value: "Users", label: "Users (Usuários)", Icon: LucideIcons.Users },
                                  { value: "Brain", label: "Brain (Cérebro)", Icon: LucideIcons.Brain },
                                  { value: "Target", label: "Target (Alvo)", Icon: LucideIcons.Target },
                                  { value: "Rocket", label: "Rocket (Foguete)", Icon: LucideIcons.Rocket },
                                  { value: "Sparkles", label: "Sparkles (Brilho)", Icon: LucideIcons.Sparkles },
                                  { value: "Gift", label: "Gift (Presente)", Icon: LucideIcons.Gift },
                                  { value: "TrendingUp", label: "TrendingUp (Crescimento)", Icon: LucideIcons.TrendingUp },
                                ];
                                
                                return (
                                  <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-black/20">
                                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Benefício #{index + 1}</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          setCtaBenefitCards(ctaBenefitCards.filter((_, i) => i !== index));
                                        }}
                                        className="h-8 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Remover
                                      </Button>
                                    </div>
                                    <div className="p-4 sm:p-5 space-y-4">
                                      <div className="rounded-lg border border-dashed border-white/15 bg-[#0b1220] p-4">
                                        <div className="flex items-center gap-4">
                                          <div 
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border"
                                            style={{ 
                                              backgroundColor: lightColor,
                                              borderColor: iconColor
                                            }}
                                          >
                                            <IconComponent className="w-7 h-7" style={{ color: iconColor }} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold text-white truncate">
                                              {card.title || "Título do Card"}
                                            </h4>
                                            <p className="text-sm text-gray-400 truncate">
                                              {card.subtitle || "Subtítulo do card"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium text-gray-300">Ícone</Label>
                                          <Select
                                            value={card.icon}
                                            onValueChange={(value) => {
                                              const newCards = [...ctaBenefitCards];
                                              newCards[index].icon = value;
                                              setCtaBenefitCards(newCards);
                                            }}
                                          >
                                            <SelectTrigger className="mt-1.5 bg-[#0b1220] border-white/10 text-white">
                                              <div className="flex items-center gap-2">
                                                {card.icon && (() => {
                                                  const PreviewIcon = (LucideIcons as any)[card.icon] || LucideIcons.Heart;
                                                  return <PreviewIcon className="w-4 h-4" />;
                                                })()}
                                                <SelectValue placeholder="Selecione um ícone">
                                                  {card.icon || "Selecione um ícone"}
                                                </SelectValue>
                                              </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0b1220] border-white/10">
                                              {iconOptions.map(({ value, label, Icon }) => (
                                                <SelectItem key={value} value={value} className="text-white hover:bg-white/5">
                                                  <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4" />
                                                    <span>{label}</span>
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <p className="text-xs text-gray-500 mt-1">Escolha um ícone da lista</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-gray-300">Cor do Ícone</Label>
                                          <div className="flex gap-2 mt-1.5">
                                            <Input
                                              type="color"
                                              value={iconColor}
                                              onChange={(e) => {
                                                const hexColor = e.target.value;
                                                const tailwindColor = convertHexToTailwind(hexColor);
                                                const newCards = [...ctaBenefitCards];
                                                newCards[index].iconColor = tailwindColor;
                                                setCtaBenefitCards([...newCards]);
                                              }}
                                              className="h-10 w-20 cursor-pointer border-white/10 rounded-md bg-[#0b1220]"
                                              title="Escolha uma cor"
                                            />
                                            <Input
                                              value={card.iconColor}
                                              onChange={(e) => {
                                                const newCards = [...ctaBenefitCards];
                                                newCards[index].iconColor = e.target.value;
                                                setCtaBenefitCards([...newCards]);
                                              }}
                                              placeholder="red-400"
                                              className="flex-1 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">Seletor de cor ou classe Tailwind</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-gray-300">Título</Label>
                                          <Input
                                            value={card.title}
                                            onChange={(e) => {
                                              const newCards = [...ctaBenefitCards];
                                              newCards[index].title = e.target.value;
                                              setCtaBenefitCards(newCards);
                                            }}
                                            placeholder="Acesso Imediato"
                                            className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-gray-300">Subtítulo</Label>
                                          <Input
                                            value={card.subtitle}
                                            onChange={(e) => {
                                              const newCards = [...ctaBenefitCards];
                                              newCards[index].subtitle = e.target.value;
                                              setCtaBenefitCards(newCards);
                                            }}
                                            placeholder="Comece agora mesmo"
                                            className="mt-1.5 bg-[#0b1220] border-white/10 text-white placeholder-gray-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-white/10">
                        <p className="text-xs text-gray-500 order-2 sm:order-1">
                          Salva apenas a aba <span className="text-gray-300 font-medium">{
                            ({ logos: "Logos", hero: "Hero", carousel: "Carrossel", whyChooseUs: "Por Que Escolher", testimonials: "Depoimentos", newsletter: "Newsletter", cta: "CTA Final" } as const)[homeContentTab]
                          }</span>
                        </p>
                        <Button
                          onClick={saveHomeContent}
                          disabled={homeContentSaving}
                          className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-500 text-white self-end sm:self-auto shadow-lg shadow-blue-600/25"
                        >
                          {homeContentSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                      </div>
                  </div>
                )}
              </section>
            )}

            {/* Theme Management Section */}
            {/* Products View */}
            {mainView === "products" && (
              <section className="container mx-auto px-4 py-6 sm:py-12">
                <div className="mb-6 sm:mb-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Gerenciar Produtos</h2>
                    <p className="text-sm sm:text-base text-gray-400">
                      Adicione, edite e remova produtos físicos e digitais
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Buscar produtos..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <select
                      value={productTypeFilter}
                      onChange={(e) => setProductTypeFilter(e.target.value as any)}
                      className="px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all" className="bg-gray-700">Todos os Tipos</option>
                      <option value="physical" className="bg-gray-700">Físicos</option>
                      <option value="digital" className="bg-gray-700">Digitais</option>
                    </select>
                  </div>
                </div>

                {/* Products List */}
                {products.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">Nenhum produto cadastrado ainda.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products
                      .filter((product) => {
                        if (productSearch && !product.title.toLowerCase().includes(productSearch.toLowerCase())) {
                          return false;
                        }
                        if (productTypeFilter !== "all" && product.type !== productTypeFilter) {
                          return false;
                        }
                        return true;
                      })
                      .map((product) => (
                        <Card key={product.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-6">
                            {/* Imagem do Produto */}
                            {product.image && (
                              <div className="mb-4">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.title}
                                  className="w-full h-48 object-cover rounded-lg border"
                                  style={{ objectPosition: product.imagePosition || "50% 50%" }}
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2 text-white">{product.title}</h3>
                                <div className="flex gap-2 mb-2">
                                  <Badge className={product.type === 'physical' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}>
                                    {product.type === 'physical' ? 'Físico' : 'Digital'}
                                  </Badge>
                                  {!product.active && <Badge variant="outline" className="border-gray-600 text-gray-300">Inativo</Badge>}
                                </div>
                                <p className="text-green-400 text-sm mb-2 font-semibold">
                                  R$ {(typeof product.price === 'string' ? parseFloat(product.price) : product.price).toFixed(2)}
                                </p>
                                {product.type === 'physical' && (
                                  <p className="text-sm text-gray-300">Estoque: {product.stock || 0}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Garantir que valores numéricos sejam números válidos
                                  setEditingProduct({
                                    ...product,
                                    price: product.price ? (typeof product.price === 'string' ? parseFloat(product.price) : product.price) : undefined,
                                    originalPrice: product.originalPrice ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice) : undefined,
                                    rating: product.rating !== undefined && product.rating !== null ? (typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating) : undefined,
                                    stock: product.stock !== undefined && product.stock !== null ? (typeof product.stock === 'string' ? parseInt(product.stock) : product.stock) : undefined,
                                    imagePosition: product.imagePosition || "50% 50%",
                                  });
                                  setIsDialogOpen(true);
                                }}
                                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm("Tem certeza que deseja remover este produto?")) {
                                    try {
                                      await apiClient.deleteProduct(product.id);
                                      toast.success("Produto removido com sucesso");
                                      loadProducts();
                                    } catch (error: any) {
                                      toast.error(error.message || "Erro ao remover produto");
                                    }
                                  }
                                }}
                                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {/* Product Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[800px] lg:!max-w-[900px] !max-h-[95vh] sm:!max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-800 border-gray-700">
                    <DialogHeader className="pb-4 sm:pb-6 border-b border-gray-700 mb-4 sm:mb-6">
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
                        {editingProduct ? "Editar Produto" : "Novo Produto"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1 sm:px-2 pb-4 space-y-6 sm:space-y-8">
                      {/* Informações Básicas */}
                      <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-base sm:text-lg font-semibold text-white border-b pb-2">Informações Básicas</h3>
                        <div>
                          <Label className="text-sm sm:text-base mb-2 block text-white">Título *</Label>
                          <Input
                            value={editingProduct?.title || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                            placeholder="Nome do produto"
                            className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Label className="text-sm sm:text-base mb-2 block text-white">Descrição</Label>
                          <Textarea
                            value={editingProduct?.description || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                            placeholder="Descrição do produto"
                            rows={4}
                            className="text-sm sm:text-base resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Preços */}
                      <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-base sm:text-lg font-semibold text-white border-b pb-2">Preços</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Preço *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingProduct?.price !== undefined && editingProduct?.price !== null ? editingProduct.price : ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditingProduct({ 
                                  ...editingProduct, 
                                  price: value === "" ? undefined : (isNaN(parseFloat(value)) ? undefined : parseFloat(value))
                                });
                              }}
                              placeholder="0.00"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Preço Original</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingProduct?.originalPrice !== undefined && editingProduct?.originalPrice !== null ? editingProduct.originalPrice : ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditingProduct({ 
                                  ...editingProduct, 
                                  originalPrice: value === "" ? undefined : (isNaN(parseFloat(value)) ? undefined : parseFloat(value))
                                });
                              }}
                              placeholder="0.00"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tipo e Configurações */}
                      <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-base sm:text-lg font-semibold text-white border-b pb-2">Tipo e Configurações</h3>
                        <div>
                          <Label className="text-sm sm:text-base mb-2 block text-white">Tipo *</Label>
                          <select
                            value={editingProduct?.type || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-600 bg-gray-700 text-white rounded-lg h-10 sm:h-11 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="" className="bg-gray-700">Selecione um tipo</option>
                            <option value="physical" className="bg-gray-700">Físico</option>
                            <option value="digital" className="bg-gray-700">Digital</option>
                          </select>
                        </div>
                        {editingProduct?.type === 'physical' && (
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Estoque</Label>
                            <Input
                              type="number"
                              value={editingProduct?.stock || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                              placeholder="0"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        )}
                        {editingProduct?.type === 'digital' && (
                          <div className="space-y-4 sm:space-y-5 bg-blue-900/20 p-4 sm:p-5 rounded-lg border border-blue-700/30">
                            <div>
                              <Label className="text-sm sm:text-base mb-2 block font-medium text-white">Tipo de Conteúdo Digital *</Label>
                              <select
                                value={editingProduct?.digitalContentType || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, digitalContentType: e.target.value, digitalFileUrl: e.target.value === 'upload' ? undefined : editingProduct?.digitalFileUrl })}
                                className="w-full px-3 py-2 sm:py-2.5 border border-gray-600 bg-gray-700 text-white rounded-lg h-10 sm:h-11 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="" className="bg-gray-700">Selecione o tipo</option>
                                <option value="url" className="bg-gray-700">URL do Conteúdo</option>
                                <option value="upload" className="bg-gray-700">Upload do Material</option>
                              </select>
                            </div>
                            {editingProduct?.digitalContentType === 'url' && (
                              <div>
                                <Label className="text-sm sm:text-base mb-2 block font-medium text-white">URL do Arquivo Digital *</Label>
                                <Input
                                  value={editingProduct?.digitalFileUrl || ""}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, digitalFileUrl: e.target.value })}
                                  placeholder="https://..."
                                  className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                />
                              </div>
                            )}
                            {editingProduct?.digitalContentType === 'upload' && (
                              <div>
                                <Label className="text-sm sm:text-base mb-2 block font-medium text-white">Arquivo Digital *</Label>
                                <div className="space-y-3">
                                  <Input
                                    type="file"
                                    accept=".pdf,.zip,.rar,.7z,.doc,.docx,.epub,.mobi"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          setProductImageUploading(true);
                                          const result = await apiClient.uploadDocument(file);
                                          setEditingProduct({ ...editingProduct, digitalFileUrl: result.url });
                                          toast.success("Arquivo enviado com sucesso!");
                                        } catch (error: any) {
                                          console.error('Erro no upload de arquivo:', error);
                                          toast.error(error.message || "Erro ao enviar arquivo");
                                        } finally {
                                          setProductImageUploading(false);
                                        }
                                      }
                                    }}
                                    className="w-full text-sm sm:text-base"
                                    disabled={productImageUploading}
                                  />
                                  {productImageUploading && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Enviando arquivo...</span>
                                    </div>
                                  )}
                                  {editingProduct?.digitalFileUrl && !productImageUploading && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-sm text-green-700 font-medium">✓ Arquivo enviado com sucesso</p>
                                      <p className="text-xs text-green-600 mt-1 break-all">{editingProduct.digitalFileUrl.split('/').pop()}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Informações Adicionais */}
                      <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-base sm:text-lg font-semibold text-white border-b pb-2">Informações Adicionais</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Categoria</Label>
                            <Input
                              value={editingProduct?.category || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                              placeholder="Ex: Livros, E-books"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Autor/Instrutor</Label>
                            <Input
                              value={editingProduct?.author || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, author: e.target.value })}
                              placeholder="Nome do autor ou instrutor"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Quantidade de Páginas</Label>
                            <Input
                              type="number"
                              value={editingProduct?.pages || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, pages: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder="Ex: 300"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <Label className="text-sm sm:text-base mb-2 block text-white">Avaliação (0-5)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={editingProduct?.rating !== undefined && editingProduct?.rating !== null ? editingProduct.rating : ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditingProduct({ 
                                  ...editingProduct, 
                                  rating: value === "" ? undefined : (isNaN(parseFloat(value)) ? undefined : parseFloat(value))
                                });
                              }}
                              placeholder="0.0"
                              className="h-10 sm:h-11 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Imagem */}
                      <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2">Imagem Principal</h3>
                        <div>
                          <input
                            type="file"
                            id="product-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProductImageFile(file);
                                handleProductImageUpload(file);
                              }
                            }}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('product-image-upload')?.click()}
                            disabled={productImageUploading}
                            className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                          >
                            {productImageUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                {productImageFile ? (productImageFile.name.length > 30 ? productImageFile.name.substring(0, 30) + '...' : productImageFile.name) : 'Selecionar Imagem'}
                              </>
                            )}
                          </Button>
                          {editingProduct?.image && editingProduct.image.trim() && (editingProduct.image.startsWith('http://') || editingProduct.image.startsWith('https://')) && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-400 mb-2">Arraste para enquadrar a capa no card da loja</p>
                              <ImagePositionEditor
                                src={editingProduct.image}
                                alt={editingProduct.title || "Preview"}
                                position={editingProduct.imagePosition || "50% 50%"}
                                onChange={(pos) => setEditingProduct({ ...editingProduct, imagePosition: pos })}
                              />
                            </div>
                          )}
                          {editingProduct?.image && editingProduct.image.trim() && !editingProduct.image.startsWith('http://') && !editingProduct.image.startsWith('https://') && (
                            <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-400">Aguardando URL da imagem...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                      <Button
                        onClick={async () => {
                            // Verificar se ainda está fazendo upload
                            if (productImageUploading) {
                              toast.error("Aguarde o upload da imagem concluir antes de salvar.");
                              return;
                            }

                            // Validar tipo do produto
                            if (!editingProduct?.type || editingProduct.type.trim() === "") {
                              toast.error("Por favor, selecione o tipo do produto.");
                              return;
                            }

                            // Validar conteúdo digital se o produto for digital
                            if (editingProduct?.type === 'digital') {
                              if (!editingProduct?.digitalContentType || editingProduct.digitalContentType.trim() === "") {
                                toast.error("Por favor, selecione o tipo de conteúdo digital.");
                                return;
                              }
                              if (!editingProduct?.digitalFileUrl || editingProduct.digitalFileUrl.trim() === "") {
                                toast.error("Por favor, forneça a URL ou faça upload do arquivo digital.");
                                return;
                              }
                            }

                            // Validar avaliação (rating) se fornecida
                            if (editingProduct?.rating !== undefined && editingProduct?.rating !== null) {
                              const rating = typeof editingProduct.rating === 'number' ? editingProduct.rating : parseFloat(editingProduct.rating);
                              if (isNaN(rating) || rating < 0 || rating > 5) {
                                toast.error("A avaliação deve ser um número entre 0 e 5.");
                                return;
                              }
                            }

                            // Verificar se a imagem foi enviada antes de salvar (apenas ao criar novo produto)
                            const hasValidImage = editingProduct?.image && editingProduct.image.trim() && (editingProduct.image.startsWith('http://') || editingProduct.image.startsWith('https://'));
                            if (!editingProduct?.id && !hasValidImage) {
                              toast.error("Por favor, faça o upload da imagem antes de salvar o produto.");
                              return;
                            }

                            try {
                              // Garantir que valores numéricos sejam números válidos ou não sejam enviados
                              const productData: any = { ...editingProduct };
                              
                              // Converter e validar price
                              if (editingProduct.price !== undefined && editingProduct.price !== null) {
                                const priceNum = typeof editingProduct.price === 'string' ? parseFloat(editingProduct.price) : Number(editingProduct.price);
                                if (!isNaN(priceNum) && priceNum >= 0) {
                                  productData.price = priceNum;
                                } else {
                                  delete productData.price;
                                }
                              } else {
                                delete productData.price;
                              }

                              // Converter e validar originalPrice
                              if (editingProduct.originalPrice !== undefined && editingProduct.originalPrice !== null) {
                                const originalPriceNum = typeof editingProduct.originalPrice === 'string' ? parseFloat(editingProduct.originalPrice) : Number(editingProduct.originalPrice);
                                if (!isNaN(originalPriceNum) && originalPriceNum >= 0) {
                                  productData.originalPrice = originalPriceNum;
                                } else {
                                  delete productData.originalPrice;
                                }
                              } else {
                                delete productData.originalPrice;
                              }

                              // Converter e validar rating
                              if (editingProduct.rating !== undefined && editingProduct.rating !== null) {
                                const ratingNum = typeof editingProduct.rating === 'string' ? parseFloat(editingProduct.rating) : Number(editingProduct.rating);
                                if (!isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5) {
                                  productData.rating = ratingNum;
                                } else {
                                  delete productData.rating;
                                }
                              } else {
                                delete productData.rating;
                              }

                              // Converter e validar stock
                              if (editingProduct.stock !== undefined && editingProduct.stock !== null) {
                                const stockNum = typeof editingProduct.stock === 'string' ? parseInt(editingProduct.stock) : Number(editingProduct.stock);
                                if (!isNaN(stockNum) && stockNum >= 0) {
                                  productData.stock = stockNum;
                                } else {
                                  delete productData.stock;
                                }
                              } else {
                                delete productData.stock;
                              }

                              // Validar price obrigatório ao criar produto
                              if (!editingProduct?.id && (!productData.price || isNaN(Number(productData.price)) || Number(productData.price) < 0)) {
                                toast.error("O preço é obrigatório e deve ser um número válido maior ou igual a zero.");
                                return;
                              }

                              productData.imagePosition = editingProduct?.imagePosition || "50% 50%";

                              if (editingProduct?.id) {
                                await apiClient.updateProduct(editingProduct.id, productData);
                                toast.success("Produto atualizado com sucesso");
                              } else {
                                await apiClient.createProduct(productData);
                                toast.success("Produto criado com sucesso");
                              }
                              setIsDialogOpen(false);
                              setEditingProduct(null);
                              setProductImageFile(null);
                              loadProducts();
                            } catch (error: any) {
                              toast.error(error.message || "Erro ao salvar produto");
                            }
                          }}
                          className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={productImageUploading}
                        >
                          {productImageUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                              Aguardando upload...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setEditingProduct(null);
                            setProductImageFile(null);
                          }}
                          disabled={productImageUploading}
                          className="h-11 sm:h-12 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white border-red-600"
                        >
                          Cancelar
                        </Button>
                      </div>
                  </DialogContent>
                </Dialog>
              </section>
            )}

            {/* Sales View - Gerenciar Vendas e Rastreamento */}
            {mainView === "sales" && (
              <section className="container mx-auto px-4 py-6 sm:py-12">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Gerenciar Vendas</h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    Visualize vendas com produtos físicos e adicione códigos de rastreamento
                  </p>
                </div>

                {salesLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : allPurchases.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">Nenhuma venda com produtos físicos encontrada.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Busca, Filtros e Ordenação */}
                    <Card className="mb-6 bg-gray-800 border-gray-700">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {/* Busca */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              type="text"
                              placeholder="Buscar por cliente, email ou ID da compra..."
                              value={salesSearch}
                              onChange={(e) => setSalesSearch(e.target.value)}
                              className="pl-10 h-10 sm:h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>

                          {/* Filtros e Ordenação */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Filtro por Status */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Status</Label>
                              <select
                                value={salesStatusFilter}
                                onChange={(e) => setSalesStatusFilter(e.target.value as any)}
                                className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="all" className="bg-gray-700">Todos</option>
                                <option value="with-proof" className="bg-gray-700">Com Comprovante</option>
                                <option value="without-proof" className="bg-gray-700">Sem Comprovante</option>
                              </select>
                            </div>

                            {/* Filtro por Data */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Período</Label>
                              <select
                                value={salesDateFilter}
                                onChange={(e) => setSalesDateFilter(e.target.value as any)}
                                className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="all" className="bg-gray-700">Todos</option>
                                <option value="7d" className="bg-gray-700">Últimos 7 dias</option>
                                <option value="30d" className="bg-gray-700">Últimos 30 dias</option>
                                <option value="90d" className="bg-gray-700">Últimos 90 dias</option>
                                <option value="month" className="bg-gray-700">Este mês</option>
                                <option value="year" className="bg-gray-700">Este ano</option>
                              </select>
                            </div>

                            {/* Ordenar por */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Ordenar por</Label>
                              <select
                                value={salesSortBy}
                                onChange={(e) => setSalesSortBy(e.target.value as any)}
                                className="w-full h-10 sm:h-11 px-3 rounded-md border border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="date" className="bg-gray-700">Data</option>
                                <option value="total" className="bg-gray-700">Total</option>
                                <option value="customer" className="bg-gray-700">Cliente</option>
                                <option value="products" className="bg-gray-700">Nº Produtos</option>
                              </select>
                            </div>

                            {/* Ordem */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Ordem</Label>
                              <Button
                                variant="outline"
                                onClick={() => setSalesSortOrder(salesSortOrder === "asc" ? "desc" : "asc")}
                                className="w-full h-10 sm:h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                <ArrowUpDown className="w-4 h-4 mr-2" />
                                {salesSortOrder === "asc" ? "Crescente" : "Decrescente"}
                              </Button>
                            </div>

                            {/* Visualização */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Visualização</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant={salesViewMode === "cards" ? "default" : "outline"}
                                  onClick={() => setSalesViewMode("cards")}
                                  className={`flex-1 h-10 sm:h-11 ${
                                    salesViewMode === "cards" 
                                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                  }`}
                                >
                                  <Grid3x3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={salesViewMode === "table" ? "default" : "outline"}
                                  onClick={() => setSalesViewMode("table")}
                                  className={`flex-1 h-10 sm:h-11 ${
                                    salesViewMode === "table" 
                                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                  }`}
                                >
                                  <List className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Contador de resultados */}
                          <div className="text-sm text-gray-400">
                            Mostrando {filteredAndSortedSales.length} de {allPurchases.length} vendas
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {filteredAndSortedSales.length === 0 ? (
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-20 text-center">
                          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2 text-white">Nenhuma venda encontrada</h3>
                          <p className="text-gray-400 mb-6">
                            Tente ajustar os filtros de busca
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSalesSearch("");
                              setSalesStatusFilter("all");
                              setSalesDateFilter("all");
                            }}
                            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                          >
                            Limpar Filtros
                          </Button>
                        </CardContent>
                      </Card>
                    ) : salesViewMode === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredAndSortedSales.map((purchase: any) => (
                          <Card key={purchase.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-gray-800 border-gray-700">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base sm:text-lg mb-1 text-white">Compra #{purchase.id.substring(0, 8)}</CardTitle>
                                  <p className="text-xs sm:text-sm text-gray-300 truncate">
                                    <strong className="text-white">{purchase.user?.name || 'N/A'}</strong>
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {purchase.user?.email || 'N/A'}
                              </p>
                            </div>
                                <Badge className="bg-green-600 text-white flex-shrink-0 ml-2">
                              {purchase.paymentStatus === 'paid' ? 'Pago' : purchase.paymentStatus}
                            </Badge>
                          </div>
                              <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-300 mt-2">
                                <p>
                                  <Calendar className="w-3 h-3 inline mr-1 text-gray-400" />
                                  {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }) : 'N/A'}
                                </p>
                                <p className="font-semibold text-green-400">
                                  R$ {((typeof purchase.finalAmount === 'string' ? parseFloat(purchase.finalAmount) : purchase.finalAmount) || 0).toFixed(2)}
                                </p>
                          </div>
                        </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm mb-2 text-white">Produtos Físicos:</h3>
                            {purchase.physicalProducts.map((pp: any) => (
                                  <div key={pp.id} className="border border-gray-700 rounded-lg p-3 bg-gray-700">
                                    <div className="mb-2">
                                      <h4 className="font-semibold text-sm text-white">{pp.product?.title || 'Produto'}</h4>
                                      <p className="text-xs text-gray-300">
                                        Qtd: {pp.quantity || 0} | R$ {((typeof pp.price === 'string' ? parseFloat(pp.price) : pp.price) || (typeof pp.priceAtPurchase === 'string' ? parseFloat(pp.priceAtPurchase) : pp.priceAtPurchase) || 0).toFixed(2)}
                                      </p>
                                </div>

                                {/* Comprovante de envio */}
                                {(() => {
                                  const tracking = pp.tracking || pp.shippingTracking;
                                  const trackingId = tracking?.id;
                                  
                                  return (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs font-semibold text-gray-300 mb-1">Comprovante de Envio:</p>
                                      
                                      {tracking?.proofOfDeliveryUrl ? (
                                        <div className="space-y-1">
                                          <a
                                            href={tracking.proofOfDeliveryUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-xs underline flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            Ver comprovante
                                          </a>
                                          {tracking.deliveredAt && (
                                            <p className="text-xs text-gray-400">
                                              Entregue: {new Date(tracking.deliveredAt).toLocaleDateString('pt-BR')}
                                          </p>
                                        )}
                                      </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {trackingId ? (
                                            <>
                                              <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    setProofFiles(prev => ({
                                                      ...prev,
                                                      [trackingId]: file
                                                    }));
                                                  }
                                                }}
                                                className="text-xs h-7 bg-gray-700 border-gray-600 text-white"
                                              />
                                              {proofFiles[trackingId] && (
                                      <Button
                                        size="sm"
                                                  onClick={() => handleUploadProof(trackingId)}
                                                  disabled={uploadingProof === trackingId}
                                                  className="h-6 text-xs w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                  {uploadingProof === trackingId ? (
                                                    <>
                                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                      Enviando...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Upload className="w-3 h-3 mr-1" />
                                                      Enviar
                                                    </>
                                                  )}
                                      </Button>
                                              )}
                                            </>
                                ) : (
                                    <Button
                                      onClick={() => {
                                        setSelectedProductPurchase(pp);
                                                setProofFile(null);
                                                setProofDialogOpen(true);
                                      }}
                                              className="bg-blue-600 hover:bg-blue-700 h-7 text-xs w-full text-white"
                                              size="sm"
                                    >
                                              <FileText className="w-3 h-3 mr-1" />
                                              Adicionar Comprovante
                                    </Button>
                                          )}
                                  </div>
                                )}
                                    </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                    ) : (
                      /* Visualização em Tabela */
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-900 border-b border-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Compra</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Produtos</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {filteredAndSortedSales.map((purchase: any) => (
                                  <tr key={purchase.id} className="hover:bg-gray-900 transition-colors">
                                    <td className="px-4 py-4">
                                      <div className="text-sm font-semibold text-white">#{purchase.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-white">{purchase.user?.name || 'N/A'}</div>
                                      <div className="text-xs text-gray-400">{purchase.user?.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-white">
                                        {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <span className="font-semibold text-green-400">
                                        R$ {((typeof purchase.finalAmount === 'string' ? parseFloat(purchase.finalAmount) : purchase.finalAmount) || 0).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                      <Badge className="bg-green-600 text-white">
                                        {purchase.paymentStatus === 'paid' ? 'Pago' : purchase.paymentStatus}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-white">
                                        {purchase.physicalProducts?.length || 0} produto(s)
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPurchaseDetail(purchase);
                                          setPurchaseDetailDialogOpen(true);
                                        }}
                                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Dialog para adicionar comprovante de envio */}
                <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Adicionar Comprovante de Envio
                      </DialogTitle>
                      <DialogDescription className="mt-3">
                        {selectedProductPurchase && (
                          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-base mb-1">
                                  {selectedProductPurchase.product?.title}
                                </p>
                            {allPurchases.find(p => p.physicalProducts?.some((pp: any) => pp.id === selectedProductPurchase.id)) && (
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      <span className="font-medium">
                                        {allPurchases.find(p => p.physicalProducts?.some((pp: any) => pp.id === selectedProductPurchase.id))?.user?.name}
                                      </span>
                                    </p>
                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      {allPurchases.find(p => p.physicalProducts?.some((pp: any) => pp.id === selectedProductPurchase.id))?.user?.email}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 mt-4">
                      {/* Comprovante de Envio */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Comprovante de Envio
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-blue-400 transition-colors">
                          <div className="flex flex-col items-center justify-center gap-3">
                            {proofFile ? (
                              <div className="w-full">
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-white truncate">
                                        {proofFile.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {(proofFile.size / 1024).toFixed(2)} KB
                                      </p>
                      </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setProofFile(null)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-gray-400" />
                                <div className="text-center">
                                  <p className="text-sm text-gray-400 mb-1">
                                    Clique para selecionar ou arraste o arquivo aqui
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                                  </p>
                                </div>
                        <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 10 * 1024 * 1024) {
                                        toast.error("O arquivo deve ter no máximo 10MB");
                                        return;
                                      }
                                      setProofFile(file);
                                    }
                                  }}
                                  className="hidden"
                                  id="proof-file-input"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('proof-file-input')?.click()}
                                  className="mt-2"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Selecionar Arquivo
                                </Button>
                              </>
                            )}
                      </div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-3 pt-2 border-t">
                        <Button
                          onClick={handleAddProof}
                          disabled={salesLoading || !proofFile}
                          className="flex-1 h-11"
                        >
                          {salesLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Enviar Comprovante
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProofDialogOpen(false);
                            setProofFile(null);
                            setSelectedProductPurchase(null);
                          }}
                          className="h-11"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Dialog para visualizar detalhes da compra */}
                <Dialog open={purchaseDetailDialogOpen} onOpenChange={setPurchaseDetailDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                    <DialogHeader className="pb-4 border-b border-gray-700">
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Detalhes da Compra #{selectedPurchaseDetail?.id?.substring(0, 8)}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400 mt-2">
                        Informações completas da venda e produtos físicos
                      </DialogDescription>
                    </DialogHeader>
                    {selectedPurchaseDetail && (
                      <div className="space-y-6 mt-4">
                        {/* Informações do Cliente */}
                        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <h3 className="text-lg font-semibold text-white mb-3">Informações do Cliente</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Nome</p>
                              <p className="text-white font-medium break-words">{selectedPurchaseDetail.user?.name || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-1">
                              <p className="text-sm text-gray-400 mb-1">Email</p>
                              <p className="text-white font-medium break-all word-break break-words">{selectedPurchaseDetail.user?.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Data da Compra</p>
                              <p className="text-white font-medium break-words">
                                {selectedPurchaseDetail.createdAt 
                                  ? new Date(selectedPurchaseDetail.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Status do Pagamento</p>
                              <Badge className={selectedPurchaseDetail.paymentStatus === 'paid' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>
                                {selectedPurchaseDetail.paymentStatus === 'paid' ? 'Pago' : selectedPurchaseDetail.paymentStatus || 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Produtos Físicos */}
                        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <h3 className="text-lg font-semibold text-white mb-3">Produtos Físicos</h3>
                          <div className="space-y-3">
                            {selectedPurchaseDetail.physicalProducts?.map((pp: any) => {
                              const tracking = pp.tracking || pp.shippingTracking;
                              return (
                                <div key={pp.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white mb-1">{pp.product?.title || 'Produto'}</h4>
                                      <div className="flex gap-4 text-sm text-gray-300">
                                        <span>Quantidade: <strong className="text-white">{pp.quantity || 0}</strong></span>
                                        <span>Preço: <strong className="text-green-400">R$ {((typeof pp.price === 'string' ? parseFloat(pp.price) : pp.price) || (typeof pp.priceAtPurchase === 'string' ? parseFloat(pp.priceAtPurchase) : pp.priceAtPurchase) || 0).toFixed(2)}</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Comprovante de Envio */}
                                  <div className="mt-3 pt-3 border-t border-gray-600">
                                    <p className="text-sm font-semibold text-gray-300 mb-2">Comprovante de Envio:</p>
                                    {tracking?.proofOfDeliveryUrl ? (
                                      <div className="space-y-2">
                                        <a
                                          href={tracking.proofOfDeliveryUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center gap-2"
                                        >
                                          <FileText className="w-4 h-4" />
                                          Ver comprovante
                                        </a>
                                        {tracking.deliveredAt && (
                                          <p className="text-xs text-gray-400">
                                            Entregue em: {new Date(tracking.deliveredAt).toLocaleDateString('pt-BR')}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400">Nenhum comprovante adicionado ainda</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Resumo Financeiro */}
                        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <h3 className="text-lg font-semibold text-white mb-3">Resumo Financeiro</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total da Compra:</span>
                            <span className="text-2xl font-bold text-green-400">
                              R$ {((typeof selectedPurchaseDetail.finalAmount === 'string' ? parseFloat(selectedPurchaseDetail.finalAmount) : selectedPurchaseDetail.finalAmount) || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPurchaseDetailDialogOpen(false);
                          setSelectedPurchaseDetail(null);
                        }}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      >
                        Fechar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </section>
            )}

            {mainView === "sale-email" && (
              <section className="container mx-auto px-4 py-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Mail className="w-5 h-5" />
                      Emails de Notificação de Vendas
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2">
                      Configure os emails que receberão notificações sempre que uma venda for confirmada.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {saleEmailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-row items-stretch gap-4">
                          <div className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 p-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">Ativar notificações</p>
                              <p className="text-sm text-gray-400">Se desativado, nenhum email será enviado.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSaleEmailActive(!saleEmailActive)}
                              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                                saleEmailActive ? "bg-blue-600" : "bg-gray-600"
                              }`}
                              aria-pressed={saleEmailActive}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  saleEmailActive ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 flex items-center justify-between gap-6 w-[220px] h-full">
                            <div>
                              <p className={`text-sm font-semibold ${saleEmailActive ? "text-emerald-400" : "text-gray-400"}`}>
                                Status {saleEmailActive ? "Ativo" : "Inativo"}
                              </p>
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/30">
                              {saleEmailList.length} {saleEmailList.length === 1 ? "email" : "emails"}
                            </Badge>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                          <Label className="text-sm font-medium mb-3 block text-white">
                            Adicionar email
                          </Label>
                          <div className="flex flex-col lg:flex-row gap-2">
                            <div className="relative flex-1">
                              <MailIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                value={saleEmailRaw}
                                onChange={(e) => setSaleEmailRaw(e.target.value)}
                                placeholder="Digite o email e clique em adicionar"
                                className="w-full pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addSaleEmail();
                                  }
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={addSaleEmail}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm text-gray-300">Emails adicionados</p>
                              <p className="text-xs text-gray-500">Gerencie e remova quando necessário.</p>
                            </div>
                            <div className="relative w-full md:w-64">
                              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                value={saleEmailFilter}
                                onChange={(e) => setSaleEmailFilter(e.target.value)}
                                placeholder="Filtrar email..."
                                className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              />
                            </div>
                          </div>

                          {saleEmailList.length > 0 ? (
                            filteredSaleEmails.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredSaleEmails.map((item) => (
                                  <div
                                    key={item.email}
                                    className="flex items-center justify-between gap-3 bg-gray-700/60 border border-gray-600/80 text-white px-3 py-2 rounded-lg text-sm shadow-sm hover:border-gray-500 hover:shadow-md transition-all"
                                  >
                                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                      <div className="truncate font-medium">{item.email}</div>
                                      <div className="flex items-center gap-1 text-xs text-gray-300 mt-0.5 sm:mt-0">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatSaleEmailDate(item.createdAt)}</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSaleEmail(item.email)}
                                      className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md w-7 h-7 flex items-center justify-center transition-colors"
                                      aria-label={`Remover ${item.email}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Nenhum email encontrado para este filtro.</p>
                            )
                          ) : (
                            <p className="text-xs text-gray-400">Nenhum email adicionado ainda.</p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-xs text-gray-400">
                            {saleEmailSaving ? "Salvando alterações..." : "As alterações são aplicadas após salvar."}
                          </p>
                          <Button
                            onClick={saveSaleEmailSettings}
                            disabled={saleEmailSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {saleEmailSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar configurações"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {mainView === "theme" && (
              <section className="container mx-auto px-4 py-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Palette className="w-5 h-5" />
                      Gerenciar Paleta de Cores
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2">
                      Personalize as cores do seu site. As alterações serão aplicadas em tempo real.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {themeLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      <>
                        {/* Cores Principais */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Cores Principais</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Cor Primária</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.primary}
                                  onChange={(e) => updateColor('primary', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.primary}
                                  onChange={(e) => updateColor('primary', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#3B82F6"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Primária Escura (Hover)</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.primaryDark}
                                  onChange={(e) => updateColor('primaryDark', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.primaryDark}
                                  onChange={(e) => updateColor('primaryDark', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#2563EB"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Primária Clara</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.primaryLight}
                                  onChange={(e) => updateColor('primaryLight', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.primaryLight}
                                  onChange={(e) => updateColor('primaryLight', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#60A5FA"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cores Secundárias */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Cores Secundárias</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Cor Secundária</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.secondary}
                                  onChange={(e) => updateColor('secondary', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.secondary}
                                  onChange={(e) => updateColor('secondary', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#10B981"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Secundária Escura</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.secondaryDark}
                                  onChange={(e) => updateColor('secondaryDark', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.secondaryDark}
                                  onChange={(e) => updateColor('secondaryDark', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#059669"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cores de Texto */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Cores de Texto</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Texto Principal</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.textPrimary}
                                  onChange={(e) => updateColor('textPrimary', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.textPrimary}
                                  onChange={(e) => updateColor('textPrimary', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#1F2937"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Texto Secundário</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.textSecondary}
                                  onChange={(e) => updateColor('textSecondary', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.textSecondary}
                                  onChange={(e) => updateColor('textSecondary', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#6B7280"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cores de Fundo */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Cores de Fundo</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Fundo Principal</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.background}
                                  onChange={(e) => updateColor('background', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.background}
                                  onChange={(e) => updateColor('background', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Fundo Secundário</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.backgroundSecondary}
                                  onChange={(e) => updateColor('backgroundSecondary', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.backgroundSecondary}
                                  onChange={(e) => updateColor('backgroundSecondary', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#F9FAFB"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cores de Status */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Cores de Status</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Destaque (Accent)</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.accent}
                                  onChange={(e) => updateColor('accent', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.accent}
                                  onChange={(e) => updateColor('accent', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#F59E0B"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Sucesso</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.success}
                                  onChange={(e) => updateColor('success', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.success}
                                  onChange={(e) => updateColor('success', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#10B981"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Erro/Perigo</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.danger}
                                  onChange={(e) => updateColor('danger', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.danger}
                                  onChange={(e) => updateColor('danger', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#EF4444"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Informação</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.info}
                                  onChange={(e) => updateColor('info', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.info}
                                  onChange={(e) => updateColor('info', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#6366F1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cor de Borda */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Bordas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block text-white">Cor da Borda</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={themeColors.border}
                                  onChange={(e) => updateColor('border', e.target.value)}
                                  className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                                />
                                <Input
                                  value={themeColors.border}
                                  onChange={(e) => updateColor('border', e.target.value)}
                                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  placeholder="#E5E7EB"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-4 border-t border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold text-white">Preview das Cores</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg" style={{ backgroundColor: themeColors.primary, color: '#fff' }}>
                              <p className="font-semibold">Primária</p>
                              <p className="text-sm opacity-90">{themeColors.primary}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: themeColors.secondary, color: '#fff' }}>
                              <p className="font-semibold">Secundária</p>
                              <p className="text-sm opacity-90">{themeColors.secondary}</p>
                            </div>
                            <div className="p-4 rounded-lg border-2" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                              <p className="font-semibold" style={{ color: themeColors.textPrimary }}>Fundo</p>
                              <p className="text-sm" style={{ color: themeColors.textSecondary }}>{themeColors.background}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: themeColors.accent, color: '#fff' }}>
                              <p className="font-semibold">Destaque</p>
                              <p className="text-sm opacity-90">{themeColors.accent}</p>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
                          <Button
                            onClick={saveTheme}
                            disabled={themeSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {themeSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Cores
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

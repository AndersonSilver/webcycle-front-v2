import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Course } from "../data/courses";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";

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

interface AppContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  cartItems: Course[];
  setCartItems: (items: Course[]) => void;
  purchasedCourses: PurchasedCourse[];
  setPurchasedCourses: (courses: PurchasedCourse[]) => void;
  addToCart: (course: Course) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  loadUserData: () => Promise<void>;
  loadCart: () => Promise<void>;
  loadPurchasedCourses: () => Promise<void>;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [cartItems, setCartItems] = useState<Course[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);

  const loadUserData = async () => {
    const sessionData = localStorage.getItem('SESSION');
    if (!sessionData) return;
    
    const session = JSON.parse(sessionData);
    const token = session?.token;
    const savedUser = session?.user;
    
    if (!token) return;
    
    if (savedUser) {
      setUser(savedUser);
      
      try {
        const userResponse = await apiClient.getCurrentUser();
        if (userResponse?.user) {
          const userData = { 
            name: userResponse.user.name || "", 
            email: userResponse.user.email || "",
            avatar: userResponse.user.avatar || userResponse.user.picture || undefined,
            role: userResponse.user.role || "student",
          };
          const updatedSession = JSON.parse(localStorage.getItem('SESSION') || '{}');
          updatedSession.user = userData;
          localStorage.setItem('SESSION', JSON.stringify(updatedSession));
          setUser(userData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  };

  const loadCart = async () => {
    try {
      const cartResponse = await apiClient.getCart();
      if (cartResponse?.items) {
        setCartItems(cartResponse.items.map((item: any) => item.course).filter(Boolean));
      }
    } catch (error) {
      console.log("Carrinho vazio ou erro ao carregar:", error);
    }
  };

  const loadPurchasedCourses = async () => {
    try {
      const myCoursesResponse = await apiClient.getMyCourses();
      const coursesMap = new Map<string, PurchasedCourse>();
      myCoursesResponse.courses.forEach((item: any) => {
        if (item.course && item.course.id) {
          const existing = coursesMap.get(item.course.id);
          if (!existing || (item.progress || 0) > (existing.progress || 0)) {
            coursesMap.set(item.course.id, {
              ...item.course,
              progress: item.progress || 0,
              completedLessons: item.completedLessons || 0,
              lastWatched: item.lastWatched,
            });
          }
        }
      });
      setPurchasedCourses(Array.from(coursesMap.values()));
    } catch (error) {
      console.error("Erro ao carregar cursos comprados:", error);
    }
  };

  const addToCart = async (course: Course) => {
    try {
      await apiClient.addToCart(course.id);
      await loadCart();
      toast.success("Curso adicionado ao carrinho");
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('já possui')) {
        toast.error("Você já possui este curso!");
      } else {
        toast.error("Erro ao adicionar curso ao carrinho");
      }
      console.error(error);
    }
  };

  const removeFromCart = async (courseId: string) => {
    try {
      await apiClient.removeFromCart(courseId);
      await loadCart();
      toast.success("Curso removido do carrinho");
    } catch (error) {
      toast.error("Erro ao remover curso do carrinho");
      console.error(error);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    localStorage.clear();
    setUser(null);
    setCartItems([]);
    setPurchasedCourses([]);
    toast.success("Logout realizado com sucesso");
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadCart();
      loadPurchasedCourses();
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cartItems,
        setCartItems,
        purchasedCourses,
        setPurchasedCourses,
        addToCart,
        removeFromCart,
        loadUserData,
        loadCart,
        loadPurchasedCourses,
        handleLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}


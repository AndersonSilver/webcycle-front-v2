import { useState, useEffect } from "react";
import { CourseCard } from "./CourseCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Loader2, BookOpen, Users, Star, CheckCircle } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";
import { Course } from "../data/courses";

interface CourseCatalogProps {
  onViewDetails: (courseId: string) => void;
}

export function CourseCatalog({ onViewDetails }: CourseCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Carregar cursos da API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: 1,
          limit: 100, // Carregar muitos cursos para filtro local
        };

        if (selectedCategory !== "Todos") {
          params.category = selectedCategory;
        }

        if (searchTerm) {
          // Se tem busca, usar endpoint de busca
          const response = await apiClient.searchCourses(searchTerm);
          const coursesList = response?.courses || [];
          setCourses(coursesList);

          // Extrair categorias únicas dos cursos
          if (coursesList && coursesList.length > 0) {
            const uniqueCategories = Array.from(
              new Set(coursesList.map((c: Course) => c.category))
            );
            setCategories(["Todos", ...uniqueCategories]);
          }
        } else {
          // Senão, usar listagem normal
          const response = await apiClient.getCourses(params);
          const coursesList = response?.courses || [];
          setCourses(coursesList);

          // Extrair categorias únicas dos cursos
          if (coursesList && coursesList.length > 0) {
            const uniqueCategories = Array.from(
              new Set(coursesList.map((c: Course) => c.category))
            );
            setCategories(["Todos", ...uniqueCategories]);
          } else {
            setCategories(["Todos"]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        // Não mostrar toast se for erro de conexão (API não disponível)
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
          toast.error("Erro ao carregar cursos");
        }
        setCourses([]);
        setCategories(["Todos"]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [selectedCategory, searchTerm]);

  // Filtrar cursos localmente (caso necessário)
  const filteredCourses = (courses || []).filter(course => {
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 relative overflow-hidden">
      {/* Background decorative elements - apenas azul */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 backdrop-blur-sm">
            <BookOpen className="w-4 h-4" />
            Catálogo Completo
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Explore Nossos Cursos de Psicologia
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Escolha o curso ideal para sua jornada de autoconhecimento e desenvolvimento pessoal
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-400 transition-colors" />
              <Input
                type="text"
                placeholder="Buscar cursos por título, descrição..."
                className="w-full py-4 pl-14 pr-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/15 focus:ring-4 focus:ring-blue-500/20 transition-all backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-16">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-105 transition-all duration-300 px-6 py-2'
                  : 'bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 px-6 py-2 hover:scale-105'
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-slate-400 text-lg">Carregando cursos...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredCourses.map((course, index) => (
              <div key={course.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                <CourseCard
                  course={course}
                  onViewDetails={onViewDetails}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-white/10 mb-6">
              <Search className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg font-medium">
              Nenhum curso encontrado com os filtros selecionados.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Tente ajustar sua busca ou selecione outra categoria.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 mt-16 border-t border-white/10">
        {[
          { icon: <BookOpen className="w-6 h-6" />, value: filteredCourses.length.toString(), label: 'Cursos Disponíveis', color: 'text-blue-400', bg: 'bg-blue-400/10', borderColor: 'border-blue-500/30' },
          { icon: <Users className="w-6 h-6" />, value: '50.000+', label: 'Alunos Satisfeitos', color: 'text-emerald-400', bg: 'bg-emerald-400/10', borderColor: 'border-emerald-500/30' },
          { icon: <Star className="w-6 h-6" />, value: '4.9/5', label: 'Avaliação Média', color: 'text-yellow-400', bg: 'bg-yellow-400/10', borderColor: 'border-yellow-500/30' },
          { icon: <CheckCircle className="w-6 h-6" />, value: '100%', label: 'Garantia de Satisfação', color: 'text-green-400', bg: 'bg-green-400/10', borderColor: 'border-green-500/30' },
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center space-y-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 group cursor-default backdrop-blur-sm">
            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border ${item.borderColor}`}>
              {item.icon}
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{item.value}</div>
            <div className="text-sm text-slate-400 font-medium">{item.label}</div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
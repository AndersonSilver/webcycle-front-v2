import { useState, useEffect } from "react";
import { CourseCard } from "./CourseCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Loader2 } from "lucide-react";
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
    <section 
      className="py-20"
      style={{
        background: `linear-gradient(to bottom, var(--theme-background) 0%, var(--theme-background-secondary) 50%, var(--theme-background) 100%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
            Catálogo Completo
          </div>
          <h2 
            className="text-3xl lg:text-5xl font-bold mb-6 bg-clip-text text-transparent"
            style={{
              background: 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Explore Nossos Cursos de Psicologia
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Escolha o curso ideal para sua jornada de autoconhecimento e desenvolvimento pessoal
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <Input
              type="text"
              placeholder="Buscar cursos por título, descrição..."
              className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg px-6 py-2 rounded-full transition-all hover:scale-105"
                  : "border-2 border-gray-300 hover:border-blue-500 bg-white text-gray-700 hover:text-blue-600 px-6 py-2 rounded-full transition-all hover:scale-105"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Nenhum curso encontrado com os filtros selecionados.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-24 grid md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 text-center hover:shadow-lg transition-shadow">
            <div className="font-bold text-5xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-3">
              {courses.length}
            </div>
            <div className="text-gray-700 font-semibold">Cursos Disponíveis</div>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl border border-teal-100 text-center hover:shadow-lg transition-shadow">
            <div className="font-bold text-5xl bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
              50.000+
            </div>
            <div className="text-gray-700 font-semibold">Alunos Satisfeitos</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 text-center hover:shadow-lg transition-shadow">
            <div className="font-bold text-5xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              4.9/5
            </div>
            <div className="text-gray-700 font-semibold">Avaliação Média</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 text-center hover:shadow-lg transition-shadow">
            <div className="font-bold text-5xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
              100%
            </div>
            <div className="text-gray-700 font-semibold">Garantia de Satisfação</div>
          </div>
        </div>
      </div>
    </section>
  );
}
import { Star, Users, Clock, BookOpen } from "lucide-react";
import { Course } from "../data/courses";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CourseCardProps {
  course: Course;
  onViewDetails: (courseId: string) => void;
}

export function CourseCard({ course, onViewDetails }: CourseCardProps) {
  // Converter preços para número (podem vir como string da API)
  const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
  const originalPrice = course.originalPrice 
    ? (typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)
    : undefined;
  
  const discount = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Converter rating para número se necessário
  const rating = course.rating !== undefined && course.rating !== null
    ? (typeof course.rating === 'string' ? parseFloat(course.rating) : Number(course.rating))
    : undefined;

  return (
    <div className="flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all max-h-[420px] w-full">
      {/* Imagem */}
      <div className="md:w-1/2 relative h-40 md:h-[300px]">
        <ImageWithFallback
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        {/* Badges no topo */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-600 text-white">
            {course.category}
          </span>
          {discount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold uppercase rounded">
              -{discount}%
            </span>
          )}
        </div>
        {/* Tag na parte inferior */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-medium rounded-full border border-white/10">
            Curso
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="md:w-1/2 p-3 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white line-clamp-2">{course.title}</h3>

          {course.description && (
            <p className="text-sm text-slate-300 line-clamp-2">{course.description}</p>
          )}

        </div>

        {/* Detalhes */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          {rating !== undefined && !isNaN(rating) && rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {rating.toFixed(1)}
            </span>
          )}
          {course.students && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" /> {course.students.toLocaleString('pt-BR')} alunos
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {course.duration}
            </span>
          )}
          {course.lessons && (
            <span className="flex items-center gap-0.5">
              <BookOpen className="w-3 h-3" /> {course.lessons} aulas
            </span>
          )}
        </div>
        {course.instructor && (
          <p className="text-sm text-blue-400 font-medium">Por {course.instructor}</p>
        )}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
          <div>
            {originalPrice && (
              <p className="text-[9px] text-slate-500 line-through">R$ {originalPrice.toFixed(2)}</p>
            )}
            <p className="text-base font-bold text-white">R$ {price.toFixed(2)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(course.id);
            }}
            className="px-3 py-1.5 bg-white text-black font-semibold rounded-xl transition-all text-xs shadow-md hover:shadow-lg hover:scale-105 hover:bg-slate-100"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
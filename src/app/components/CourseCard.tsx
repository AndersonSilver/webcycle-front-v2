import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
      <div className="relative" onClick={() => onViewDetails(course.id)}>
        <ImageWithFallback
          src={course.image}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <Badge className="absolute top-4 right-4 bg-red-500 text-white">
            -{discount}%
          </Badge>
        )}
        <Badge className="absolute top-4 left-4 bg-purple-600 text-white">
          {course.category}
        </Badge>
      </div>
      
      <CardContent className="p-6" onClick={() => onViewDetails(course.id)}>
        <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{course.rating}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students.toLocaleString('pt-BR')} alunos</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessons} aulas</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-1">Por {course.instructor}</div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0 flex items-center justify-between">
        <div>
          {originalPrice && (
            <div className="text-sm text-gray-400 line-through">
              R$ {originalPrice.toFixed(2)}
            </div>
          )}
          <div className="font-bold text-2xl text-blue-600">
            R$ {price.toFixed(2)}
          </div>
        </div>
        <Button onClick={() => onViewDetails(course.id)}>
          Ver Curso
        </Button>
      </CardFooter>
    </Card>
  );
}
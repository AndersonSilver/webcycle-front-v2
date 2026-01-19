import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

interface ImageCarouselProps {
  images?: CarouselImage[];
}

const defaultImages: CarouselImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1758273240360-76b908e7582a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVyYXB5JTIwc2Vzc2lvbiUyMGNvdW5zZWxpbmd8ZW58MXx8fHwxNzY2OTkyMjA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    alt: "Sessão de terapia",
    order: 0
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1635373390303-cc78167278ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjB3ZWxsbmVzcyUyMG1lZGl0YXRpb258ZW58MXx8fHwxNzY2OTk5NTYyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    alt: "Bem-estar mental",
    order: 1
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1729105140273-b5e886a4f999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwc3ljaG9sb2d5JTIwYnJhaW4lMjBtaW5kfGVufDF8fHx8MTc2NzA4NzE3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    alt: "Psicologia e mente",
    order: 2
  },
];

export function ImageCarousel({ images = defaultImages }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ordenar imagens por order
  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (sortedImages.length === 0) return;
    
    // Trocar imagem a cada 4 segundos
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [sortedImages.length]);

  if (sortedImages.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={sortedImages[currentIndex]?.id || currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={sortedImages[currentIndex].url}
            alt={sortedImages[currentIndex].alt}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent"></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {sortedImages.length > 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {sortedImages.map((_, index) => (
            <button
              key={sortedImages[index].id}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-8 bg-white" 
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

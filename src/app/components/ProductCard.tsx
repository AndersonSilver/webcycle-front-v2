import { Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  type: 'physical' | 'digital';
  category?: string;
  stock?: number;
  author?: string;
  pages?: number;
  rating?: number;
  reviewsCount?: number;
}

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const originalPrice = product.originalPrice
    ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice)
    : undefined;

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Converter rating para número se necessário
  const rating = product.rating !== undefined && product.rating !== null
    ? (typeof product.rating === 'string' ? parseFloat(product.rating) : Number(product.rating))
    : undefined;

  const isPhysical = product.type === 'physical';
  const isOutOfStock = isPhysical && product.stock !== undefined && product.stock <= 0;

  // Determinar tag baseado no tipo
  const tag = product.category || (isPhysical ? 'Livros' : 'E-books');

  return (
    <div className="flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all max-h-[420px] w-full">
      {/* Imagem */}
      <div className="md:w-1/2 relative h-40 md:h-[300px]">
        <ImageWithFallback
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {/* Badges no topo */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${isPhysical ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
            {isPhysical ? 'Físico' : 'Digital'}
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
            {tag}
          </span>
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm px-3 py-1.5 rounded">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="md:w-1/2 p-3 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white line-clamp-2">{product.title}</h3>

          {product.description && (
            <p className="text-sm text-slate-300 line-clamp-2">{product.description}</p>
          )}

        </div>

        {/* Preço e botões */}

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {product.pages && (
              <span>{product.pages} páginas</span>
            )}
            {rating !== undefined && !isNaN(rating) && rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {rating.toFixed(1)}
              </span>
            )}
          </div>
        {product.author && (
          <p className="text-sm text-blue-400 font-medium">Por {product.author}</p>
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
              onViewDetails(product.id);
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


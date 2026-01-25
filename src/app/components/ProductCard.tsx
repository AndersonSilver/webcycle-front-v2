import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Package, Download, ShoppingCart, Star } from "lucide-react";
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
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
      <div className="relative bg-gray-100 flex items-center justify-center" onClick={() => onViewDetails(product.id)}>
        <ImageWithFallback
          src={product.image}
          alt={product.title}
          className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <Badge className="absolute top-4 right-4 bg-red-500 text-white">
            -{discount}%
          </Badge>
        )}
        <Badge className={`absolute top-4 left-4 ${isPhysical ? 'bg-blue-600' : 'bg-purple-600'} text-white flex items-center gap-1`}>
          {isPhysical ? <Package className="w-3 h-3" /> : <Download className="w-3 h-3" />}
          {isPhysical ? 'Físico' : 'Digital'}
        </Badge>
        {product.category && (
          <Badge className="absolute bottom-4 left-4 bg-gray-800 text-white">
            {product.category}
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white text-lg px-4 py-2">
              Esgotado
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6" onClick={() => onViewDetails(product.id)}>
        <h3 className="font-bold text-xl mb-2 line-clamp-2 transition-colors" style={{ color: 'var(--theme-text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-primary)'}
        >
          {product.title}
        </h3>
        
        {product.author && (
          <p className="text-sm text-gray-500 mb-1">
            Por <strong>{product.author}</strong>
          </p>
        )}
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
          {product.pages && (
            <span>{product.pages} páginas</span>
          )}
          {rating !== undefined && !isNaN(rating) && rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {product.reviewsCount !== undefined && product.reviewsCount > 0 && (
                <span className="text-gray-500">({product.reviewsCount})</span>
              )}
            </div>
          )}
        </div>
        
        {isPhysical && product.stock !== undefined && (
          <div className="text-sm text-gray-600 mb-2">
            Estoque: <strong>{product.stock}</strong> unidades
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-6 pt-0 flex items-center justify-between">
        <div>
          {originalPrice && (
            <div className="text-sm text-gray-400 line-through">
              R$ {originalPrice.toFixed(2)}
            </div>
          )}
          <div className="font-bold text-2xl" style={{ color: 'var(--theme-primary)' }}>
            R$ {price.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product.id);
            }}
            variant="outline"
          >
            Ver Detalhes
          </Button>
          {onAddToCart && !isOutOfStock && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product.id);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Comprar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}


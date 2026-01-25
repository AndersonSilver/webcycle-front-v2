import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Loader2, Package, Download } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";

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
}

interface ProductCatalogProps {
  onViewDetails: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductCatalog({ onViewDetails, onAddToCart }: ProductCatalogProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'physical' | 'digital'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const params: any = {
          page,
          limit: 20,
          active: true,
        };

        if (selectedType !== 'all') {
          params.type = selectedType;
        }

        const response = await apiClient.getProducts(params);
        const productsList = response?.products || [];
        setProducts(productsList);
        setTotalPages(response?.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedType, page]);

  // Filtrar produtos localmente por busca
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-6">
          Loja de Produtos
        </div>
        <h2 
          className="text-3xl lg:text-5xl font-bold mb-6 bg-clip-text text-transparent"
          style={{
            background: 'linear-gradient(135deg, hsl(250 75% 60% / 0.9), hsl(280 70% 65% / 0.9))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Produtos Exclusivos para Você
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Livros físicos, e-books digitais e muito mais para complementar sua jornada de aprendizado
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Button
          variant={selectedType === 'all' ? "default" : "outline"}
          onClick={() => setSelectedType('all')}
          className={
            selectedType === 'all'
              ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg px-6 py-2 rounded-full transition-all hover:scale-105"
              : "border-2 border-gray-300 hover:border-blue-500 bg-white text-gray-700 hover:text-blue-600 px-6 py-2 rounded-full transition-all hover:scale-105"
          }
        >
          Todos os Tipos
        </Button>
        <Button
          variant={selectedType === 'physical' ? "default" : "outline"}
          onClick={() => setSelectedType('physical')}
          className={
            selectedType === 'physical'
              ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg px-6 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2"
              : "border-2 border-gray-300 hover:border-blue-500 bg-white text-gray-700 hover:text-blue-600 px-6 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2"
          }
        >
          <Package className="w-4 h-4" />
          Físicos
        </Button>
        <Button
          variant={selectedType === 'digital' ? "default" : "outline"}
          onClick={() => setSelectedType('digital')}
          className={
            selectedType === 'digital'
              ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg px-6 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2"
              : "border-2 border-gray-300 hover:border-blue-500 bg-white text-gray-700 hover:text-blue-600 px-6 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2"
          }
        >
          <Download className="w-4 h-4" />
          Digitais
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewDetails}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Nenhum produto encontrado com os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}


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
}

export function ProductCatalog({ onViewDetails }: ProductCatalogProps) {
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
            <Package className="w-4 h-4" />
            Loja de Produtos
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Produtos Exclusivos para Você
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Livros físicos, e-books digitais e muito mais para complementar sua jornada de aprendizado
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-400 transition-colors" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 pl-14 pr-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/15 focus:ring-4 focus:ring-blue-500/20 transition-all backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-16">
          <Button
            variant={selectedType === 'all' ? "default" : "outline"}
            onClick={() => setSelectedType('all')}
            className={
              selectedType === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-105 transition-all duration-300 px-6 py-2'
                : 'bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 px-6 py-2 hover:scale-105'
            }
          >
            Todos os Tipos
          </Button>
          <Button
            variant={selectedType === 'physical' ? "default" : "outline"}
            onClick={() => setSelectedType('physical')}
            className={
              selectedType === 'physical'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-105 transition-all duration-300 px-6 py-2'
                : 'bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 px-6 py-2 hover:scale-105'
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
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-105 transition-all duration-300 px-6 py-2'
                : 'bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 px-6 py-2 hover:scale-105'
            }
          >
            <Download className="w-4 h-4" />
            Digitais
          </Button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-slate-400 text-lg">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProducts.map((product, index) => (
                <div key={product.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                  <ProductCard
                    product={product}
                    onViewDetails={onViewDetails}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 transition-all"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-slate-300">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-white/5 text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 transition-all"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-white/10 mb-6">
              <Search className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg font-medium">
              Nenhum produto encontrado com os filtros selecionados.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Tente ajustar sua busca ou selecione outro tipo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, Package, Download, ShoppingCart, ArrowLeft, Star, Book, Globe, Calendar, Truck, Award, CheckCircle2, Users } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  type: 'physical' | 'digital';
  category?: string;
  stock?: number;
  digitalFileUrl?: string;
  specifications?: Record<string, any>;
  salesCount?: number;
  author?: string;
  pages?: number;
  rating?: number;
  reviewsCount?: number;
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{
    averageRating: number;
    totalReviews: number;
    starDistribution: Array<{ stars: number; count: number; percentage: number }>;
  } | null>(null);

  useEffect(() => {
    // Não executar se não estiver na rota de produto
    if (!window.location.pathname.startsWith('/produto/')) {
      return;
    }

    const loadProduct = async () => {
      // Extrair ID da URL se não vier do useParams
      const productId = id || window.location.pathname.split('/produto/')[1]?.split('/')[0];

      if (!productId) {
        console.warn("ID do produto não encontrado na URL - pode ser navegação em andamento");
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.getProductById(productId);
        setProduct(response.product);
        if (response.product?.images && response.product.images.length > 0) {
          setSelectedImage(0);
        }

        // Carregar produtos relacionados (mesma categoria)
        if (response.product?.category) {
          try {
            const relatedResponse = await apiClient.getProducts({
              category: response.product.category,
              limit: 4,
              active: true,
            });
            const related = (relatedResponse?.products || []).filter((p: Product) => p.id !== productId);
            setRelatedProducts(related.slice(0, 3));
          } catch (error) {
            console.error("Erro ao carregar produtos relacionados:", error);
          }
        }

        // Carregar avaliações do produto
        try {
          const reviewsResponse = await apiClient.getProductReviews(productId);
          setReviews(reviewsResponse?.reviews || []);

          // Garantir que sempre temos starDistribution, mesmo sem avaliações
          const defaultStarDistribution = [5, 4, 3, 2, 1].map(stars => ({
            stars,
            count: 0,
            percentage: 0,
          }));

          setReviewsStats({
            averageRating: reviewsResponse?.averageRating || 0,
            totalReviews: reviewsResponse?.totalReviews || 0,
            starDistribution: reviewsResponse?.starDistribution?.length > 0
              ? reviewsResponse.starDistribution
              : defaultStarDistribution,
          });
        } catch (error: any) {
          // Não mostrar toast para erro de avaliações, apenas logar silenciosamente
          // Isso não deve impedir o usuário de comprar o produto
          if (error?.response?.status !== 500) {
            console.warn("Erro ao carregar avaliações:", error);
          }
          setReviews([]);
          // Inicializar com valores zerados ao invés de null
          setReviewsStats({
            averageRating: 0,
            totalReviews: 0,
            starDistribution: [5, 4, 3, 2, 1].map(stars => ({
              stars,
              count: 0,
              percentage: 0,
            })),
          });
        }
      } catch (error: any) {
        console.error("Erro ao carregar produto:", error);
        
        // Verificar se é erro 404 (produto não encontrado)
        if (error?.status === 404 || error?.response?.status === 404 || error?.message?.includes('não encontrado')) {
          toast.error("Produto não encontrado");
          navigate("/");
          return;
        }
        
        // Para outros erros, mostrar mensagem mas não redirecionar imediatamente
        toast.error("Erro ao carregar produto. Tente novamente.");
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  // Função para adicionar produto ao carrinho (localStorage)
  const addProductToCart = (productId: string, quantity: number) => {
    try {
      const cartProducts = JSON.parse(localStorage.getItem('CART_PRODUCTS') || '[]');
      
      // Verificar se o produto já está no carrinho
      const existingIndex = cartProducts.findIndex((item: any) => item.productId === productId);
      
      if (existingIndex >= 0) {
        // Atualizar quantidade
        cartProducts[existingIndex].quantity += quantity;
      } else {
        // Adicionar novo produto
        cartProducts.push({ productId, quantity });
      }
      
      localStorage.setItem('CART_PRODUCTS', JSON.stringify(cartProducts));
      return true;
    } catch (error) {
      console.error("Erro ao salvar produto no carrinho:", error);
      return false;
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product.id) {
      toast.error("Produto não disponível. Tente novamente.");
      return;
    }

    try {
      // Verificar se o usuário está logado
      const sessionData = localStorage.getItem('SESSION');
      if (!sessionData) {
        toast.error("Faça login para continuar");
        return;
      }

      // Verificar se o produto está em estoque (se for físico)
      if (product.type === 'physical' && product.stock !== undefined && product.stock <= 0) {
        toast.error("Produto esgotado");
        return;
      }

      // Adicionar ao carrinho (localStorage)
      console.log("🛒 Adicionando produto ao carrinho:", { productId: product.id, quantity });
      const success = addProductToCart(product.id, quantity);
      console.log("✅ Resultado:", success);
      
      if (success) {
        toast.success(`${product.title} adicionado ao carrinho!`);
        // Atualizar contador do carrinho (disparar evento customizado)
        window.dispatchEvent(new Event('cartUpdated'));
        console.log("📢 Evento cartUpdated disparado");
      } else {
        toast.error("Erro ao adicionar ao carrinho");
      }
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast.error("Erro ao adicionar ao carrinho. Tente novamente.");
    }
  };

  const handleBuyNow = () => {
    if (!product || !product.id) {
      toast.error("Produto não disponível. Tente novamente.");
      return;
    }

    try {
      // Verificar se o usuário está logado
      const sessionData = localStorage.getItem('SESSION');
      if (!sessionData) {
        toast.error("Faça login para continuar");
        return;
      }

      // Verificar se o produto está em estoque (se for físico)
      if (product.type === 'physical' && product.stock !== undefined && product.stock <= 0) {
        toast.error("Produto esgotado");
        return;
      }

      // Ir direto para o checkout
      navigate("/checkout", {
        state: {
          products: [{ productId: product.id, quantity }],
        },
        replace: false,
      });
    } catch (error: any) {
      console.error("Erro ao comprar:", error);
      toast.error("Erro ao processar compra. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Produto não encontrado.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const originalPrice = product.originalPrice
    ? typeof product.originalPrice === 'string'
      ? parseFloat(product.originalPrice)
      : product.originalPrice
    : undefined;

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Converter rating para número se necessário
  const rating = product.rating !== undefined && product.rating !== null
    ? (typeof product.rating === 'string' ? parseFloat(product.rating) : Number(product.rating))
    : undefined;

  const isPhysical = product.type === 'physical';
  const isOutOfStock = isPhysical && product.stock !== undefined && product.stock <= 0;
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="min-h-screen bg-white">
      {/* Header com botão voltar */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-4">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Main Product Section - Estilo Amazon */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-12 gap-8">
            {/* Left Column - Image */}
            <div className="md:col-span-4">
              <div className="sticky top-24">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <ImageWithFallback
                    src={images[selectedImage]}
                    alt={product.title}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`border-2 rounded overflow-hidden transition-all ${selectedImage === index
                            ? 'border-blue-600 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Column - Product Info */}
            <div className="md:col-span-5">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {product.title}
              </h1>

              {/* Format and Author */}
              <div className="mb-2">
                <span className="text-sm text-gray-600">
                  {isPhysical ? 'Capa dura' : 'Digital'} - {product.specifications?.publicationDate
                    ? new Date(product.specifications.publicationDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Data não disponível'}
                </span>
              </div>

              {product.author && (
                <p className="text-sm text-gray-600 mb-4">
                  Edição Português por <span className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">{product.author}</span> (Autor)
                </p>
              )}

              {/* Rating */}
              {rating !== undefined && !isNaN(rating) && rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-300 text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold">
                    {rating.toFixed(1)}
                  </span>
                  {product.reviewsCount !== undefined && product.reviewsCount > 0 && (
                    <span className="text-gray-600 text-sm">
                      ({product.reviewsCount})
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>

                </div>
              )}

              {/* Key Specifications with Icons */}
              <div className="mb-6 space-y-3">
                {product.pages && (
                  <div className="flex items-center gap-2 text-sm">
                    <Book className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700"><strong>Número de páginas:</strong> {product.pages} páginas</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700"><strong>Idioma:</strong> Português</span>
                </div>
                {product.specifications?.publicationDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">
                      <strong>Data da publicação:</strong> {new Date(product.specifications.publicationDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Price and Buy Buttons */}
            <div className="md:col-span-3">
              <div className="sticky top-24">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  {/* Price Section */}
                  <div className="mb-6">
                    {originalPrice && (
                      <div className="text-sm text-gray-500 line-through mb-1">
                        De: R$ {originalPrice.toFixed(2)}
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                        R$ {price.toFixed(2)}
                      </span>
                      {discount > 0 && (
                        <Badge className="bg-red-500 text-white text-sm">
                          Economize {discount}%
                        </Badge>
                      )}
                    </div>
                    {isPhysical && !isOutOfStock && (
                      <p className="text-sm text-green-600 mt-2">
                        Estoque disponível: <strong>{product.stock}</strong> unidades
                      </p>
                    )}
                    {isOutOfStock && (
                      <p className="text-sm text-red-600 mt-2 font-semibold">
                        Produto Esgotado
                      </p>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  {isPhysical && !isOutOfStock && (
                    <div className="mb-6">
                      <label className="block mb-2 font-medium text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                        Quantidade:
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="border-gray-300"
                        >
                          -
                        </Button>
                        <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(q => Math.min(product.stock || 1, q + 1))}
                          disabled={quantity >= (product.stock || 1)}
                          className="border-gray-300"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Buy Buttons */}
                  <div className="mb-4">
                    {isOutOfStock ? (
                      <Button disabled className="w-full bg-gray-400" size="lg">
                        Produto Esgotado
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleAddToCart}
                          className="w-full font-bold text-lg py-6"
                          style={{
                            backgroundColor: '#FFD700',
                            color: '#000'
                          }}
                          size="lg"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                        <Button
                          onClick={handleBuyNow}
                          variant="outline"
                          className="w-full mt-3 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
                          size="lg"
                        >
                          Comprar Agora
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Shipping Info */}
                  {isPhysical && (
                    <div className="text-sm text-gray-600 mb-2">
                      <Package className="w-4 h-4 inline mr-1" />
                      Envio via Correios com rastreamento
                    </div>
                  )}

                  {!isPhysical && product.digitalFileUrl && (
                    <div className="text-sm text-gray-600">
                      <Download className="w-4 h-4 inline mr-1" />
                      Download imediato após a compra
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details and Reviews Section */}
      <section className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Product Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Book className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                Detalhes do produto
              </h2>
              <div className="space-y-4">
                {/* Especificações em cards */}
                <div className="grid grid-cols-1 gap-4">
                  {product.specifications?.asin && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-900 block">ASIN</span>
                        <span className="text-sm text-blue-700">{product.specifications.asin}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-purple-900 block">Idioma</span>
                      <span className="text-sm text-purple-700">Português</span>
                    </div>
                  </div>

                  {product.pages && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Book className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-green-900 block">Número de páginas</span>
                        <span className="text-sm text-green-700">{product.pages} páginas</span>
                      </div>
                    </div>
                  )}

                  {product.specifications?.publicationDate && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-orange-900 block">Data da publicação</span>
                        <span className="text-sm text-orange-700">
                          {new Date(product.specifications.publicationDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {rating !== undefined && !isNaN(rating) && rating > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Star className="w-5 h-5 text-pink-600 fill-pink-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-pink-900 block">Avaliações dos clientes</span>
                        <span className="text-sm text-pink-700">
                          {rating.toFixed(1)} ★★★★★ ({product.reviewsCount || 0})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações de garantia e envio */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
                    Informações importantes
                  </h3>
                  <div className="space-y-3">
                    {isPhysical ? (
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold block">Envio</span>
                          <span className="text-xs text-gray-600">Envio via Correios com rastreamento. Prazo de 5 a 10 dias úteis.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <Download className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold block">Download Imediato</span>
                          <span className="text-xs text-gray-600">Acesso imediato após a confirmação do pagamento.</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-semibold block">Compra Segura</span>
                        <span className="text-xs text-gray-600">Pagamento 100% seguro através do Mercado Pago.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Customer Reviews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Users className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                Avaliações de clientes
              </h2>
              <div>
                {/* Rating Summary */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 border border-yellow-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${reviewsStats && reviewsStats.totalReviews > 0 && star <= Math.round(reviewsStats.averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-300 text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <div>
                      <span className="text-3xl font-bold block" style={{ color: 'var(--theme-text-primary)' }}>
                        {reviewsStats && reviewsStats.totalReviews > 0
                          ? reviewsStats.averageRating.toFixed(1)
                          : '0.0'}
                      </span>
                      <span className="text-sm text-gray-600">
                        de 5 estrelas
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {reviewsStats?.totalReviews || 0} avaliações globais
                    </span>
                  </div>
                </div>

                {/* Star Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                    Distribuição de avaliações
                  </h3>
                  {(reviewsStats?.starDistribution || []).map((dist) => {
                    const percentage = dist.percentage || 0;

                    return (
                      <div key={dist.stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-sm font-medium text-gray-700">{dist.stars}</span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 w-20 justify-end">
                          <span className="text-sm font-semibold text-gray-700">{dist.count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {(!reviewsStats || reviewsStats.totalReviews === 0) && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Ainda não há avaliações para este produto.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Seja o primeiro a avaliar após a compra!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews List Section */}
      {reviews.length > 0 && (
        <section className="bg-white py-8 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>
                Avaliações dos Clientes
              </h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                            {review.userName || 'Usuário'}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {review.comment}
                    </p>
                    {review.helpful > 0 && (
                      <p className="text-xs text-gray-500">
                        {review.helpful} pessoa{review.helpful !== 1 ? 's' : ''} achou útil
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Products - Estilo Amazon */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-8 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>
              Produtos relacionados
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/produto/${relatedProduct.id}`)}
                >
                  <div className="bg-gray-50 flex items-center justify-center h-48 p-4">
                    <ImageWithFallback
                      src={relatedProduct.image}
                      alt={relatedProduct.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2 hover:text-blue-600" style={{ color: 'var(--theme-text-primary)' }}>
                      {relatedProduct.title}
                    </h3>
                    {relatedProduct.author && (
                      <p className="text-sm text-blue-600 mb-2">
                        por {relatedProduct.author}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {relatedProduct.rating !== undefined && relatedProduct.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-blue-600">
                            {typeof relatedProduct.rating === 'string' ? parseFloat(relatedProduct.rating).toFixed(1) : relatedProduct.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-lg mt-2" style={{ color: 'var(--theme-primary)' }}>
                      R$ {typeof relatedProduct.price === 'string' ? parseFloat(relatedProduct.price).toFixed(2) : relatedProduct.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


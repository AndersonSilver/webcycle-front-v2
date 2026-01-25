import { useState, useEffect } from "react";
import { Course } from "../data/courses";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ShoppingCart, Trash2, ShoppingBag, Shield, Clock, Package } from "lucide-react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { apiClient } from "../../services/apiClient";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  type: 'physical' | 'digital';
}

interface CartProps {
  items: Course[];
  onRemoveItem: (courseId: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Cart({ items, onRemoveItem, onCheckout, onContinueShopping, open, onOpenChange }: CartProps) {
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Carregar produtos do localStorage
  useEffect(() => {
    const loadCartProducts = async () => {
      try {
        const cartProductsData = JSON.parse(localStorage.getItem('CART_PRODUCTS') || '[]');
        if (cartProductsData.length > 0) {
          setProductsLoading(true);
          const loadedProducts: Product[] = [];
          
          for (const item of cartProductsData) {
            try {
              const response = await apiClient.getProductById(item.productId);
              if (response.product) {
                // Adicionar múltiplas vezes conforme a quantidade
                for (let i = 0; i < item.quantity; i++) {
                  loadedProducts.push(response.product);
                }
              }
            } catch (error) {
              console.error(`Erro ao carregar produto ${item.productId}:`, error);
            }
          }
          
          setCartProducts(loadedProducts);
        } else {
          setCartProducts([]);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos do carrinho:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadCartProducts();

    // Escutar atualizações
    const handleCartUpdate = () => {
      loadCartProducts();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Função para remover produto do carrinho
  const handleRemoveProduct = (productId: string) => {
    try {
      const cartProductsData = JSON.parse(localStorage.getItem('CART_PRODUCTS') || '[]');
      const filtered = cartProductsData.filter((item: any) => item.productId !== productId);
      localStorage.setItem('CART_PRODUCTS', JSON.stringify(filtered));
      setCartProducts(cartProducts.filter(p => p.id !== productId));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Erro ao remover produto do carrinho:", error);
    }
  };

  // Converter preços para número (podem vir como string da API)
  const coursesTotal = items.reduce((acc, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return acc + price;
  }, 0);
  
  const productsTotal = cartProducts.reduce((acc, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return acc + price;
  }, 0);
  
  const total = coursesTotal + productsTotal;

  const handleCheckout = () => {
    onCheckout();
    onOpenChange?.(false); // Fechar o carrinho ao ir para checkout
  };

  const handleContinueShopping = () => {
    onContinueShopping();
    onOpenChange?.(false); // Fechar o carrinho ao continuar comprando
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative hover:bg-blue-50 border-blue-200">
          <ShoppingCart className="w-5 h-5 text-blue-700" />
          {(items.length > 0 || cartProducts.length > 0) && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-pink-500 text-white border-2 border-white shadow-lg">
              {items.length + cartProducts.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="sr-only">
          <SheetTitle>Carrinho de Compras</SheetTitle>
          <SheetDescription>
            Revise os cursos selecionados e finalize sua compra
          </SheetDescription>
        </SheetHeader>

        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Carrinho de Compras</h2>
                <p className="text-sm text-blue-100">
                  {items.length === 0 && cartProducts.length === 0
                    ? "Vazio" 
                    : `${items.length + cartProducts.length} ${items.length + cartProducts.length === 1 ? 'item selecionado' : 'itens selecionados'}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 && cartProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">Seu carrinho está vazio</h3>
            <p className="text-gray-600 mb-8 max-w-sm">
              Explore nossos cursos de psicologia e comece sua jornada de transformação
            </p>
            <Button 
              onClick={onContinueShopping} 
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg"
              size="lg"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explorar Cursos
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
              <div className="space-y-4">
                {items.map((course) => {
                  const discount = course.originalPrice 
                    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
                    : 0;

                  return (
                    <Card key={course.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {/* Image */}
                          <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {discount > 0 && (
                              <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                -{discount}%
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2 mb-2">
                              <h4 className="font-bold text-sm line-clamp-2 text-gray-900">
                                {course.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveItem(course.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                              👨‍🏫 {course.instructor}
                            </p>
                            
                            {/* Price */}
                            <div className="flex items-center gap-3">
                              {(() => {
                                const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
                                const originalPrice = course.originalPrice 
                                  ? (typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)
                                  : undefined;
                                return (
                                  <>
                                    {originalPrice && originalPrice > price && (
                                      <div className="text-xs text-gray-500 line-through">
                                        R$ {originalPrice.toFixed(2)}
                                      </div>
                                    )}
                                    <div className="font-bold text-lg text-green-600">
                                      R$ {price.toFixed(2)}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Produtos */}
                {cartProducts.map((product, index) => {
                  const discount = product.originalPrice 
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;

                  return (
                    <Card key={`${product.id}-${index}`} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {/* Image */}
                          <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {discount > 0 && (
                              <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                -{discount}%
                              </div>
                            )}
                            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              {product.type === 'physical' ? <Package className="w-3 h-3" /> : '💾'}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2 mb-2">
                              <h4 className="font-bold text-sm line-clamp-2 text-gray-900">
                                {product.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                              {product.type === 'physical' ? '📦 Produto Físico' : '💾 Produto Digital'}
                            </p>
                            
                            {/* Price */}
                            <div className="flex items-center gap-3">
                              {(() => {
                                const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                                const originalPrice = product.originalPrice 
                                  ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice)
                                  : undefined;
                                return (
                                  <>
                                    {originalPrice && originalPrice > price && (
                                      <div className="text-xs text-gray-500 line-through">
                                        R$ {originalPrice.toFixed(2)}
                                      </div>
                                    )}
                                    <div className="font-bold text-lg text-green-600">
                                      R$ {price.toFixed(2)}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {productsLoading && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Carregando produtos...
                  </div>
                )}
              </div>
            </div>

            {/* Summary Footer */}
            <div className="border-t bg-white px-6 py-6 space-y-4">
              {/* Pricing Details */}
              <div className="space-y-3">
                {items.length > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'curso' : 'cursos'}):</span>
                    <span className="font-semibold text-gray-900">
                      R$ {coursesTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                {cartProducts.length > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({cartProducts.length} {cartProducts.length === 1 ? 'produto' : 'produtos'}):</span>
                    <span className="font-semibold text-gray-900">
                      R$ {productsTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Finalizar Compra
                </Button>
                
                <Button
                  onClick={handleContinueShopping}
                  variant="outline"
                  className="w-full border-2 hover:bg-gray-50"
                  size="lg"
                >
                  Continuar Comprando
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Pagamento seguro</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Acesso imediato</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
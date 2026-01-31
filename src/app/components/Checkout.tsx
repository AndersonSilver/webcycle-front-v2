import { Course } from "../data/courses";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { CheckCircle2, Lock, ShoppingCart, X, Copy, MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/apiClient";
import { handleApiError } from "../../utils/errorHandler";
// ✅ CHECKOUT PRO: Não precisa mais do formulário de cartão

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  type: 'physical' | 'digital';
}

interface CheckoutProps {
  courses: Course[];
  onBack: () => void;
}

export function Checkout({ courses, onBack }: CheckoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod] = useState<"credit_card" | "pix" | "boleto">("credit_card");
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  // Endereço de envio para produtos físicos
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [addressLoaded, setAddressLoaded] = useState(false);

  const loadProducts = useCallback(async (productItems: Array<{ productId: string; quantity: number }>) => {
    try {
      setProductsLoading(true);
      const loadedProducts: Product[] = [];
      
      for (const item of productItems) {
        try {
          const response = await apiClient.getProductById(item.productId);
          if (response.product) {
            loadedProducts.push({
              ...response.product,
              // Repetir o produto conforme a quantidade
            });
            // Adicionar múltiplas vezes se quantity > 1
            for (let i = 1; i < item.quantity; i++) {
              loadedProducts.push({ ...response.product });
            }
          } else {
            console.warn(`Produto ${item.productId} não encontrado`);
            toast.error(`Produto não encontrado. Removendo do carrinho.`);
          }
        } catch (error: any) {
          console.error(`Erro ao carregar produto ${item.productId}:`, error);
          toast.error(`Erro ao carregar produto. Verifique se o produto ainda está disponível.`);
        }
      }
      
      if (loadedProducts.length === 0 && productItems.length > 0) {
        toast.error("Nenhum produto pôde ser carregado. Redirecionando...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
        return;
      }
      
      setProducts(loadedProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos. Tente novamente.");
    } finally {
      setProductsLoading(false);
    }
  }, [navigate]);


  // Carregar endereço do perfil se houver produtos físicos
  const loadShippingAddress = useCallback(async () => {
    const hasPhysicalProducts = products.some(p => p.type === 'physical');
    if (!hasPhysicalProducts) {
      setAddressLoaded(true);
      return;
    }

    try {
      const response = await apiClient.getProfile();
      const user = response.user;
      if (user) {
        setShippingAddress({
          street: user.addressStreet || "",
          number: user.addressNumber || "",
          complement: user.addressComplement || "",
          neighborhood: user.addressNeighborhood || "",
          city: user.addressCity || "",
          state: user.addressState || "",
          zipCode: user.addressZipCode || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar endereço:", error);
    } finally {
      setAddressLoaded(true);
    }
  }, [products]);

  // Carregar produtos do location.state ou do localStorage (carrinho)
  useEffect(() => {
    const state = location.state as { products?: Array<{ productId: string; quantity: number }> };
    
    if (state?.products && state.products.length > 0) {
      // Produtos vindos do state (compra direta)
      loadProducts(state.products);
    } else {
      // Tentar carregar do carrinho (localStorage)
      try {
        const cartProducts = JSON.parse(localStorage.getItem('CART_PRODUCTS') || '[]');
        if (cartProducts.length > 0) {
          loadProducts(cartProducts);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos do carrinho:", error);
      }
    }
  }, [location.state, loadProducts]);

  // Carregar endereço quando produtos forem carregados
  useEffect(() => {
    if (products.length > 0) {
      loadShippingAddress();
    }
  }, [products, loadShippingAddress]);

  // Monitorar status da compra via polling quando o modal de pagamento estiver aberto
  useEffect(() => {
    if (!showPaymentModal || !purchaseId) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const maxAttempts = 120; // 60 segundos (120 * 500ms)

    const checkPurchaseStatus = async () => {
      try {
        attempts++;
        console.log(`🔍 Verificando status da compra ${purchaseId} (tentativa ${attempts}/${maxAttempts})...`);
        
        const response = await apiClient.getPurchaseById(purchaseId);
        const purchase = response.purchase;
        
        if (purchase) {
          const status = purchase.paymentStatus;
          console.log(`📊 Status atual da compra: ${status}`);
          
          // Se o pagamento foi aprovado ou está pendente
          if (status === 'paid' || status === 'approved') {
            console.log('✅ Pagamento aprovado! Fechando modal e redirecionando...');
            
            // Limpar carrinho de produtos do localStorage
            try {
              localStorage.removeItem('CART_PRODUCTS');
            } catch (error) {
              console.warn("Erro ao limpar carrinho de produtos:", error);
            }
            
            // Fechar modal
            setShowPaymentModal(false);
            setPaymentUrl(null);
            
            // Limpar intervalo
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            
            // Verificar se a compra contém cursos ou produtos para decidir o redirecionamento
            const hasCourses = purchase.courses && purchase.courses.length > 0;
            const hasProducts = purchase.products && purchase.products.length > 0;
            
            let redirectPath = "/";
            let redirectMessage = "Redirecionando...";
            
            if (hasCourses && !hasProducts) {
              // Apenas cursos
              redirectPath = "/meus-cursos";
              redirectMessage = "Redirecionando para seus cursos...";
            } else if (hasProducts && !hasCourses) {
              // Apenas produtos
              redirectPath = "/minhas-compras";
              redirectMessage = "Redirecionando para suas compras...";
            } else if (hasCourses && hasProducts) {
              // Tem ambos - priorizar cursos
              redirectPath = "/meus-cursos";
              redirectMessage = "Redirecionando para seus cursos...";
            }
            
            toast.success("Pagamento aprovado!", {
              description: redirectMessage,
            });
            
            setTimeout(() => {
              navigate(redirectPath);
            }, 1500);
            
            return;
          }
          
          // Se o pagamento falhou
          if (status === 'failed' || status === 'rejected') {
            console.log('❌ Pagamento rejeitado! Fechando modal...');
            
            setShowPaymentModal(false);
            setPaymentUrl(null);
            
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            
            toast.error("Pagamento não aprovado", {
              description: "Tente novamente ou escolha outra forma de pagamento.",
            });
            
            setTimeout(() => {
              navigate("/");
            }, 3000);
            
            return;
          }
          
          // Se o pagamento está pendente e já tentamos várias vezes, informar o usuário
          if (status === 'pending' && attempts >= 30) {
            console.log('⏳ Pagamento ainda pendente após várias tentativas...');
            // Continuamos verificando, mas não fechamos o modal ainda
          }
        }
        
        // Se excedeu o número máximo de tentativas, parar o polling
        if (attempts >= maxAttempts) {
          console.log('⏱️ Tempo limite atingido. Parando verificação...');
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
          // Informar ao usuário que pode fechar o modal e verificar depois
          toast.info("Verificação de pagamento em andamento", {
            description: "O pagamento está sendo processado. Você receberá um email quando for confirmado.",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status da compra:', error);
        // Continuar tentando mesmo em caso de erro
      }
    };

    // Começar a verificar após 3 segundos (dar tempo para o usuário iniciar o pagamento)
    // Depois verificar a cada 2 segundos
    const startPolling = setTimeout(() => {
      checkPurchaseStatus(); // Primeira verificação
      pollInterval = setInterval(checkPurchaseStatus, 2000); // Verificar a cada 2 segundos
    }, 3000);

    return () => {
      clearTimeout(startPolling);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [showPaymentModal, purchaseId, navigate]);

  // Monitorar mudanças na URL do iframe quando o pagamento for concluído (fallback)
  useEffect(() => {
    if (!showPaymentModal || !iframeRef.current || !purchaseId) return;

    const iframe = iframeRef.current;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const checkIframeUrl = () => {
      try {
        // Tentar acessar a URL do iframe (pode falhar por CORS, mas tentamos)
        const iframeUrl = iframe.contentWindow?.location.href;
        
        if (iframeUrl) {
          // Verificar se a URL contém rotas de retorno do Mercado Pago
          const url = new URL(iframeUrl);
          const pathname = url.pathname;
          const searchParams = url.searchParams;
          
          // Verificar se é uma rota de retorno do pagamento
          if (pathname.includes('/purchase/') || searchParams.has('payment_status') || searchParams.has('pref_id')) {
            const paymentStatus = searchParams.get('payment_status') || 
                                 (pathname.includes('/success') ? 'success' : 
                                  pathname.includes('/failure') ? 'failure' : 
                                  pathname.includes('/pending') ? 'pending' : null);
            
            const prefId = searchParams.get('pref_id') || searchParams.get('preference_id');
            const paymentId = searchParams.get('payment_id');

            if (paymentStatus) {
              console.log('🔔 Pagamento concluído no iframe:', { paymentStatus, prefId, paymentId });
              
              // Fechar modal
              setShowPaymentModal(false);
              setPaymentUrl(null);
              
              // Redirecionar página principal para a rota apropriada
              if (paymentStatus === 'success' || paymentStatus === 'approved') {
                // Se temos purchaseId, buscar a compra para decidir o redirecionamento
                if (purchaseId) {
                  apiClient.getPurchaseById(purchaseId)
                    .then(response => {
                      const purchase = response.purchase;
                      const hasCourses = purchase.courses && purchase.courses.length > 0;
                      const hasProducts = purchase.products && purchase.products.length > 0;
                      
                      let redirectPath = "/";
                      let redirectMessage = "Redirecionando...";
                      
                      if (hasCourses && !hasProducts) {
                        redirectPath = "/meus-cursos";
                        redirectMessage = "Redirecionando para seus cursos...";
                      } else if (hasProducts && !hasCourses) {
                        redirectPath = "/minhas-compras";
                        redirectMessage = "Redirecionando para suas compras...";
                      } else if (hasCourses && hasProducts) {
                        redirectPath = "/meus-cursos";
                        redirectMessage = "Redirecionando para seus cursos...";
                      }
                      
                      toast.success("Pagamento aprovado!", {
                        description: redirectMessage,
                      });
                      
                      setTimeout(() => {
                        navigate(redirectPath);
                      }, 1500);
                    })
                    .catch(() => {
                      // Em caso de erro, redirecionar para meus-cursos por padrão
                      toast.success("Pagamento aprovado!", {
                        description: "Redirecionando...",
                      });
                      setTimeout(() => {
                        navigate("/meus-cursos");
                      }, 1500);
                    });
                } else {
                  // Sem purchaseId, redirecionar para meus-cursos por padrão
                  toast.success("Pagamento aprovado!", {
                    description: "Redirecionando...",
                  });
                  setTimeout(() => {
                    navigate("/meus-cursos");
                  }, 1500);
                }
              } else if (paymentStatus === 'failure' || paymentStatus === 'rejected') {
                toast.error("Pagamento não aprovado", {
                  description: "Tente novamente ou escolha outra forma de pagamento.",
                });
                setTimeout(() => {
                  navigate("/");
                }, 3000);
              } else if (paymentStatus === 'pending') {
                // Para pending, também verificar o tipo de compra se tiver purchaseId
                if (purchaseId) {
                  apiClient.getPurchaseById(purchaseId)
                    .then(response => {
                      const purchase = response.purchase;
                      const hasCourses = purchase.courses && purchase.courses.length > 0;
                      const hasProducts = purchase.products && purchase.products.length > 0;
                      
                      let redirectPath = "/meus-cursos";
                      if (hasProducts && !hasCourses) {
                        redirectPath = "/minhas-compras";
                      }
                      
                      toast.info("Pagamento pendente", {
                        description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
                      });
                      setTimeout(() => {
                        navigate(redirectPath);
                      }, 2000);
                    })
                    .catch(() => {
                      toast.info("Pagamento pendente", {
                        description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
                      });
                      setTimeout(() => {
                        navigate("/meus-cursos");
                      }, 2000);
                    });
                } else {
                  toast.info("Pagamento pendente", {
                    description: "Aguardando confirmação do pagamento. Você será notificado quando o pagamento for confirmado.",
                  });
                  setTimeout(() => {
                    navigate("/meus-cursos");
                  }, 2000);
                }
              }
              
              // Limpar intervalo
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
            }
          }
        }
      } catch (error) {
        // Erro de CORS é esperado - o iframe pode bloquear acesso à URL
        // Continuamos tentando ou usamos mensagens postMessage como fallback
      }
    };

    // Verificar URL do iframe a cada 500ms (menos frequente, já que temos polling)
    checkInterval = setInterval(checkIframeUrl, 1000);

    // Também escutar mensagens postMessage do iframe (fallback)
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem vem do iframe do Mercado Pago
      if (event.data && typeof event.data === 'object') {
        const data = event.data;
        if (data.type === 'payment_completed' || data.payment_status) {
          const paymentStatus = data.payment_status || data.status;
          console.log('🔔 Mensagem de pagamento recebida:', paymentStatus);
          
          setShowPaymentModal(false);
          setPaymentUrl(null);
          
          if (paymentStatus === 'success' || paymentStatus === 'approved') {
            toast.success("Pagamento aprovado!", {
              description: "Redirecionando para seus cursos...",
            });
            setTimeout(() => {
              navigate("/meus-cursos");
            }, 1500);
          } else if (paymentStatus === 'failure' || paymentStatus === 'rejected') {
            toast.error("Pagamento não aprovado", {
              description: "Tente novamente ou escolha outra forma de pagamento.",
            });
            setTimeout(() => {
              navigate("/");
            }, 3000);
          }
          
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [showPaymentModal, purchaseId, navigate]);

  // Prevenir scroll horizontal quando o modal estiver aberto
  useEffect(() => {
    if (showPaymentModal) {
      // Desabilitar scroll horizontal no body
      document.body.style.overflowX = 'hidden';
      document.body.style.maxWidth = '100vw';
      document.documentElement.style.overflowX = 'hidden';
      document.documentElement.style.maxWidth = '100vw';
    } else {
      // Restaurar scroll quando fechar o modal
      document.body.style.overflowX = '';
      document.body.style.maxWidth = '';
      document.documentElement.style.overflowX = '';
      document.documentElement.style.maxWidth = '';
    }

    return () => {
      // Limpar estilos ao desmontar
      document.body.style.overflowX = '';
      document.body.style.maxWidth = '';
      document.documentElement.style.overflowX = '';
      document.documentElement.style.maxWidth = '';
    };
  }, [showPaymentModal]);

  // ✅ CHECKOUT PRO: Não precisa criar checkout antecipadamente
  // O checkout será criado quando o usuário clicar em "Continuar para Pagamento"

  // Calcular totais dos cursos
  const coursesTotalOriginal = courses.reduce((acc, course) => {
    const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
    const originalPrice = course.originalPrice 
      ? (typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)
      : price;
    return acc + originalPrice;
  }, 0);
  
  const coursesTotalCurrent = courses.reduce((acc, course) => {
    const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
    return acc + price;
  }, 0);

  // Calcular totais dos produtos
  const productsTotalOriginal = products.reduce((acc, product) => {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const originalPrice = product.originalPrice 
      ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice)
      : price;
    return acc + originalPrice;
  }, 0);
  
  const productsTotalCurrent = products.reduce((acc, product) => {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    return acc + price;
  }, 0);

  // Totais combinados
  const totalOriginal = coursesTotalOriginal + productsTotalOriginal;
  const totalCurrent = coursesTotalCurrent + productsTotalCurrent;
  
  // Desconto (diferença entre original e atual)
  const discount = totalOriginal - totalCurrent;
  
  // Desconto do cupom (calculado sobre o valor JÁ COM DESCONTO)
  const couponDiscount = discountAmount;
  
  // Total final = valor atual - desconto do cupom
  const totalWithDiscount = totalCurrent - couponDiscount;
  
  // Economia total (desconto + desconto do cupom)
  const totalSavings = discount + couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    try {
      // Usar totalCurrent (valor já com desconto) para validar o cupom
      const response = await apiClient.validateCoupon(couponCode, totalCurrent);
      if (response.valid) {
        setCouponApplied(true);
        setDiscountAmount(response.discountAmount);
        toast.success("Cupom aplicado com sucesso!");
      } else {
        toast.error("Cupom inválido ou expirado");
      }
    } catch (error: any) {
      handleApiError(error, "Erro ao validar cupom");
    }
  };

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      
      // Validar se há pelo menos um curso ou produto
      const hasCourses = courses && courses.length > 0;
      const hasProducts = products && products.length > 0;
      
      if (!hasCourses && !hasProducts) {
        toast.error("Adicione pelo menos um item ao carrinho");
        setIsProcessing(false);
        return;
      }

      // Validar endereço se houver produtos físicos
      const hasPhysicalProducts = products.some(p => p.type === 'physical');
      if (hasPhysicalProducts) {
        if (!shippingAddress.street || !shippingAddress.number || !shippingAddress.neighborhood || 
            !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
          toast.error("Por favor, preencha todos os campos obrigatórios do endereço de envio");
          setIsProcessing(false);
          return;
        }
      }

      // Preparar produtos para o checkout (agrupar por ID e quantidade)
      const productMap = new Map<string, number>();
      products.forEach(product => {
        const count = productMap.get(product.id) || 0;
        productMap.set(product.id, count + 1);
      });
      
      const productItems = Array.from(productMap.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      // Salvar endereço no perfil se houver produtos físicos
      if (hasPhysicalProducts) {
        try {
          await apiClient.updateProfile({
            addressStreet: shippingAddress.street,
            addressNumber: shippingAddress.number,
            addressComplement: shippingAddress.complement || undefined,
            addressNeighborhood: shippingAddress.neighborhood,
            addressCity: shippingAddress.city,
            addressState: shippingAddress.state,
            addressZipCode: shippingAddress.zipCode,
          });
        } catch (error) {
          console.error("Erro ao salvar endereço no perfil:", error);
          // Não bloquear o checkout se falhar ao salvar no perfil
        }
      }

      const response = await apiClient.checkout({
        courses: hasCourses ? courses.map(c => c.id) : undefined,
        products: productItems.length > 0 ? productItems : undefined,
        paymentMethod: paymentMethod,
        couponCode: couponApplied ? couponCode : undefined,
        shippingAddress: hasPhysicalProducts ? {
          street: shippingAddress.street,
          number: shippingAddress.number,
          complement: shippingAddress.complement,
          neighborhood: shippingAddress.neighborhood,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
        } : undefined,
      });

      setDiscountAmount(response.discountAmount || 0);
      setPurchaseId(response.purchaseId);

      // Se for PIX, mostrar QR code
      if (paymentMethod === "pix" && response.payment.pixCode) {
        setPixCode(response.payment.pixCode);
        toast.success("Código PIX gerado! Escaneie o QR code para pagar.");
        setIsProcessing(false);
        return;
      }

      // Se for Boleto, mostrar URL
      if (paymentMethod === "boleto" && response.payment.boletoUrl) {
        toast.info("Boleto gerado! Abrindo em nova aba...");
        window.open(response.payment.boletoUrl, '_blank', 'noopener,noreferrer');
        setIsProcessing(false);
        toast.success("Boleto aberto! Após o pagamento, você receberá um email de confirmação.");
        return;
      }

      // ✅ CHECKOUT PRO: Abrir Mercado Pago em modal/iframe na mesma página
      if (response.payment.paymentLink) {
        console.log("🚀 Abrindo Checkout Pro em modal:", response.payment.paymentLink);
        
        // Adicionar parâmetros para forçar modo mobile/responsivo
        const url = new URL(response.payment.paymentLink);
        url.searchParams.set('mobile', 'true');
        url.searchParams.set('responsive', 'true');
        
        // Abrir checkout em modal/iframe na mesma página
        setPaymentUrl(url.toString());
        setShowPaymentModal(true);
        setIsProcessing(false);
      } else {
        console.warn("⚠️ paymentLink não retornado. Verifique se o backend está configurado para Checkout Pro.");
        toast.error("Erro ao gerar link de pagamento. Tente novamente.");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Erro ao processar checkout:", error);
      
      // Verificar se é erro de curso já comprado
      if (error?.response?.data?.message?.includes('já possui')) {
        toast.error(error.response.data.message, {
          description: "Redirecionando para Meus Cursos...",
        });
        // Redirecionar para meus cursos após 2 segundos
        setTimeout(() => {
          onBack();
        }, 2000);
        setIsProcessing(false);
        return;
      }
      
      // Verificar se é erro de produto não encontrado ou sem estoque
      if (error?.message?.includes('produto') || error?.response?.data?.message?.includes('produto')) {
        toast.error(error.response?.data?.message || error.message || "Erro ao processar produtos", {
          description: "Verifique se os produtos estão disponíveis.",
        });
        setIsProcessing(false);
        return;
      }
      
      // Verificar se é erro de validação
      if (error?.response?.status === 400) {
        toast.error(error.response?.data?.message || "Dados inválidos. Verifique os itens do carrinho.");
        setIsProcessing(false);
        return;
      }
      
      handleApiError(error, "Erro ao processar checkout");
      setIsProcessing(false);
    }
  };



  return (
    <>
      {/* Modal de Pagamento do Mercado Pago */}
      {showPaymentModal && paymentUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex flex-col overflow-hidden"
          style={{ 
            overflowX: 'hidden',
            maxWidth: '100vw',
            width: '100%'
          }}
        >
          {/* Header do Modal - Mobile: fixo no topo */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">Finalizar Pagamento</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentUrl(null);
              }}
              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          
          {/* Container do iframe - Ocupa todo o espaço restante */}
          <div 
            className="flex-1 overflow-hidden relative bg-gray-800 min-w-0" 
            style={{ 
              overflowX: 'hidden',
              maxWidth: '100%',
              width: '100%'
            }}
          >
            <iframe
              ref={iframeRef}
              src={paymentUrl}
              className="w-full h-full border-0"
              title="Pagamento Mercado Pago"
              allow="payment; fullscreen"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-modals"
              style={{
                width: '100%',
                maxWidth: '100vw',
                height: '100%',
                border: 'none',
                overflow: 'auto',
                display: 'block',
                boxSizing: 'border-box'
              }}
              scrolling="yes"
              onLoad={() => {
                // Quando o iframe carrega, verificar se já foi redirecionado
                if (iframeRef.current) {
                  try {
                    const iframeUrl = iframeRef.current.contentWindow?.location.href;
                    if (iframeUrl && (iframeUrl.includes('/purchase/') || iframeUrl.includes('payment_status'))) {
                      // Se já está em uma rota de retorno, processar imediatamente
                      console.log('🔔 Iframe carregou em rota de retorno:', iframeUrl);
                    }
                  } catch (error) {
                    // CORS - esperado, continuamos com o polling
                  }
                }
              }}
            />
            
            {/* Botão de fallback caso iframe não funcione */}
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(paymentUrl, '_blank', 'noopener,noreferrer');
                  setShowPaymentModal(false);
                  setPaymentUrl(null);
                }}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 shadow-lg text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-4"
              >
                Abrir em nova aba
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-6xl my-2 sm:my-4 md:my-8 relative max-h-[95vh] overflow-y-auto bg-gray-800 border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 sm:right-3 md:right-4 top-2 sm:top-3 md:top-4 z-10 h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
          onClick={onBack}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl mb-1 sm:mb-2 text-white">Finalizar Compra</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-400">
                Revise seu pedido e finalize o pagamento
              </CardDescription>
            </div>
            {/* Logo Mercado Pago */}
            <div className="hidden md:block">
              <div className="flex items-center gap-2 bg-blue-600/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-blue-600/30">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-semibold text-blue-400">Pagamento via Mercado Pago</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Resumo do Pedido - 1 coluna - Primeiro no mobile */}
            <div className="order-1 lg:order-2 space-y-3 sm:space-y-4">
              <Card className="bg-gray-800 border-2 border-gray-700 lg:sticky lg:top-2 sm:top-4">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    Resumo do Pedido
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-400">
                    {courses.length > 0 && products.length > 0 
                      ? `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'} e ${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`
                      : courses.length > 0
                      ? `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'}`
                      : products.length > 0
                      ? `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`
                      : '0 cursos'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  {/* Lista de Cursos e Produtos */}
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-gray-700 last:border-b-0">
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1 text-white">{course.title}</h4>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2">{course.instructor}</p>
                          <p className="text-xs sm:text-sm font-bold text-green-400">
                            R$ {(typeof course.price === 'string' ? parseFloat(course.price) : course.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {products.map((product, index) => (
                      <div key={`${product.id}-${index}`} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-gray-700 last:border-b-0">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1 text-white">{product.title}</h4>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2">{product.type === 'physical' ? 'Produto Físico' : 'Produto Digital'}</p>
                          <p className="text-xs sm:text-sm font-bold text-green-400">
                            R$ {(typeof product.price === 'string' ? parseFloat(product.price) : product.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {productsLoading && (
                      <div className="text-xs text-gray-400 text-center py-2">Carregando produtos...</div>
                    )}
                  </div>

                  <Separator />

                  {/* Campo de Cupom */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {!couponApplied ? (
                      <div className="flex gap-1.5 sm:gap-2">
                        <Input
                          placeholder="Código do cupom"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 text-xs sm:text-sm h-8 sm:h-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyCoupon}
                          variant="outline"
                          className="whitespace-nowrap text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          Aplicar
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-2 sm:p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-green-400 truncate">
                            Cupom: {couponCode}
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setCouponApplied(false);
                            setCouponCode("");
                            setDiscountAmount(0);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs flex-shrink-0 text-gray-300 hover:bg-gray-700"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totais */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className={totalSavings > 0 ? "line-through text-gray-500" : "font-semibold text-white"}>
                        R$ {totalOriginal.toFixed(2)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-green-400 font-semibold">Desconto:</span>
                        <span className="text-green-400 font-semibold">-R$ {discount.toFixed(2)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-green-400 font-semibold">Desconto do Cupom:</span>
                        <span className="text-green-400 font-semibold">-R$ {couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="bg-gray-700" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-base md:text-lg text-white">Total</span>
                      <span className="font-bold text-lg sm:text-xl md:text-2xl text-blue-400">R$ {totalWithDiscount.toFixed(2)}</span>
                    </div>
                  </div>

                  {totalSavings > 0 && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1">
                        🎉 Você está economizando R$ {totalSavings.toFixed(2)}!
                      </p>
                      <p className="text-[10px] sm:text-xs opacity-90">
                        {discount > 0 && couponDiscount > 0 
                          ? `R$ ${discount.toFixed(2)} de desconto + R$ ${couponDiscount.toFixed(2)} de desconto do cupom`
                          : discount > 0 
                            ? `Desconto aplicado`
                            : `Desconto do cupom aplicado`
                        }
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-700 p-2 sm:p-3 md:p-4 rounded-lg border border-gray-600">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-white">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      Incluso no seu pedido:
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-gray-300">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                        <span>Acesso vitalício</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                        <span>Materiais digitais</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                        <span>Material complementar</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                        <span>Suporte com instrutores</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formulário - 2 colunas - Segundo no mobile */}
            <div className="order-2 lg:order-1 lg:col-span-2">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Métodos de Pagamento */}
                <Card className="border-2 border-gray-700 bg-gray-800">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      Finalizar Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">

                    {/* Se PIX foi gerado, mostrar QR code */}
                    {pixCode ? (
                      <div className="space-y-4 bg-green-900/20 p-6 rounded-lg border-2 border-green-700">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-white mb-2">Escaneie o QR Code</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Abra o app do seu banco e escaneie o código para pagar
                          </p>
                        </div>
                        
                        {/* QR Code usando API pública */}
                        <div className="flex justify-center">
                          <div className="bg-white p-4 rounded-lg">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`}
                              alt="QR Code PIX"
                              className="w-64 h-64"
                            />
                          </div>
                        </div>

                        {/* Código PIX para copiar */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-white">Código PIX (Copiar e Colar)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={pixCode}
                              readOnly
                              className="font-mono text-xs bg-gray-700 border-gray-600 text-white"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pixCode);
                                toast.success("Código PIX copiado!");
                              }}
                              variant="outline"
                              size="icon"
                              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                          <p className="text-xs text-yellow-300">
                            ⏱️ O pagamento será confirmado automaticamente após a confirmação do PIX.
                            Você receberá um email quando o pagamento for aprovado.
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={onBack}
                          className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                          variant="outline"
                        >
                          Voltar
                        </Button>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden">
                        {/* Background decorativo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 opacity-50"></div>
                        
                        <div className="relative space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
                          {/* Seção de Endereço de Envio (apenas para produtos físicos) */}
                          {products.some(p => p.type === 'physical') && addressLoaded && (
                            <Card className="bg-gray-700/90 backdrop-blur-sm border-2 border-gray-600">
                              <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  Endereço de Envio
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm text-gray-400">
                                  Confirme o endereço para entrega dos produtos físicos
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                  <div className="md:col-span-2">
                                    <Label htmlFor="shipping-street" className="text-xs sm:text-sm text-white">Rua *</Label>
                                    <Input
                                      id="shipping-street"
                                      value={shippingAddress.street}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                      placeholder="Nome da rua"
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="shipping-number" className="text-xs sm:text-sm text-white">Número *</Label>
                                    <Input
                                      id="shipping-number"
                                      value={shippingAddress.number}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                                      placeholder="123"
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="shipping-complement" className="text-xs sm:text-sm text-white">Complemento</Label>
                                  <Input
                                    id="shipping-complement"
                                    value={shippingAddress.complement}
                                    onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                                    placeholder="Apto, Bloco, etc."
                                    className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                  <div>
                                    <Label htmlFor="shipping-neighborhood" className="text-xs sm:text-sm text-white">Bairro *</Label>
                                    <Input
                                      id="shipping-neighborhood"
                                      value={shippingAddress.neighborhood}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                                      placeholder="Nome do bairro"
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="shipping-zipcode" className="text-xs sm:text-sm text-white">CEP *</Label>
                                    <Input
                                      id="shipping-zipcode"
                                      value={shippingAddress.zipCode}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                                      placeholder="00000-000"
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                  <div>
                                    <Label htmlFor="shipping-city" className="text-xs sm:text-sm text-white">Cidade *</Label>
                                    <Input
                                      id="shipping-city"
                                      value={shippingAddress.city}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                      placeholder="Nome da cidade"
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="shipping-state" className="text-xs sm:text-sm text-white">Estado *</Label>
                                    <Input
                                      id="shipping-state"
                                      value={shippingAddress.state}
                                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value.toUpperCase() })}
                                      placeholder="UF"
                                      maxLength={2}
                                      className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Ícone central */}
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30"></div>
                              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 sm:p-5 md:p-6 rounded-full shadow-lg">
                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Título */}
                          <div className="text-center space-y-1 sm:space-y-2">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                              Finalizar Pagamento
                            </h3>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              Você será redirecionado para uma página segura de pagamento
                            </p>
                          </div>

                          {/* Informações de segurança */}
                          <div className="bg-gray-700/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 border border-gray-600 shadow-sm">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-green-400" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">
                                  Pagamento 100% Seguro
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                                  Seus dados são protegidos e processados de forma segura pelo Mercado Pago.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botão de ação */}
                          <Button
                            type="button"
                            onClick={handleCheckout}
                            disabled={isProcessing || productsLoading || (products.length === 0 && courses.length === 0)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Processando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <span>Continuar para Pagamento</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            )}
                          </Button>

                          {/* Badge de segurança */}
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Criptografado e seguro</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>


                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Pagamento 100% seguro</span>
                  </div>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Criptografado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
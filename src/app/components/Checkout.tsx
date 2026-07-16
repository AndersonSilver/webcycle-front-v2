import { Course } from "../data/courses";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CheckCircle2, Lock, ShoppingCart, X, Copy, MapPin, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/apiClient";
import { handleApiError } from "../../utils/errorHandler";
import { isValidBrazilianPhone, normalizePhoneDigits } from "../../utils/phone";
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
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerProfileLoaded, setBuyerProfileLoaded] = useState(false);

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


  const loadBuyerProfile = useCallback(async () => {
    try {
      const response = await apiClient.getProfile();
      const user = response.user;
      if (user) {
        setBuyerName(user.name || "");
        setBuyerEmail(user.email || "");
        setBuyerPhone(user.phone || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do comprador:", error);
      toast.error("Não foi possível carregar seus dados. Atualize a página.");
    } finally {
      setBuyerProfileLoaded(true);
    }
  }, []);

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

  useEffect(() => {
    loadBuyerProfile();
  }, [loadBuyerProfile]);

  // Trava o scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

      if (!isValidBrazilianPhone(buyerPhone)) {
        toast.error("Informe um telefone válido com DDD (10 ou 11 dígitos)");
        setIsProcessing(false);
        return;
      }

      const normalizedPhone = normalizePhoneDigits(buyerPhone);

      try {
        await apiClient.updateProfile({ phone: normalizedPhone });
        setBuyerPhone(normalizedPhone);
      } catch (error) {
        console.error("Erro ao salvar telefone no perfil:", error);
        handleApiError(error, "Erro ao salvar telefone no perfil");
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

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-6">
        <div className="relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#151a22] shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Finalizar compra
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Confirme seus dados e revise o pedido
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
              onClick={onBack}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-white/10">
            {/* Coluna pagamento */}
            <div className="order-2 flex flex-col gap-5 p-5 sm:p-7 lg:order-1">
              {pixCode ? (
                <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Escaneie o QR Code</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Abra o app do seu banco e escaneie o código para pagar
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="rounded-xl bg-white p-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`}
                        alt="QR Code PIX"
                        className="h-56 w-56"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Código PIX</Label>
                    <div className="flex gap-2">
                      <Input
                        value={pixCode}
                        readOnly
                        className="border-white/10 bg-black/30 font-mono text-xs text-white"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pixCode);
                          toast.success("Código PIX copiado!");
                        }}
                        variant="outline"
                        size="icon"
                        className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    O pagamento será confirmado automaticamente. Você receberá um e-mail quando for aprovado.
                  </p>
                  <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                  >
                    Voltar
                  </Button>
                </div>
              ) : (
                <>
                  {buyerProfileLoaded && (
                    <section>
                      <h3 className="mb-3 text-sm font-medium text-white">Dados do comprador</h3>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                          <User className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Nome</p>
                            <p className="truncate text-sm text-gray-100">{buyerName || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                          <Mail className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">E-mail</p>
                            <p className="truncate text-sm text-gray-100">{buyerEmail || "—"}</p>
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          <Label htmlFor="buyer-phone" className="mb-1.5 flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="h-3.5 w-3.5" aria-hidden />
                            Telefone / Contato
                            <span className="text-violet-300">*</span>
                          </Label>
                          <Input
                            id="buyer-phone"
                            type="tel"
                            inputMode="tel"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="h-10 border-white/15 bg-black/25 text-sm text-white placeholder:text-gray-500 focus-visible:border-violet-400/60 focus-visible:ring-violet-500/20"
                          />
                          {!isValidBrazilianPhone(buyerPhone) && (
                            <p className="mt-1.5 text-xs text-gray-500">
                              Informe um telefone com DDD (10 ou 11 dígitos)
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {products.some((p) => p.type === "physical") && addressLoaded && (
                    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <h3 className="text-sm font-medium text-white">Endereço de envio</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <Label htmlFor="shipping-street" className="text-xs text-gray-400">Rua *</Label>
                          <Input
                            id="shipping-street"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                            placeholder="Nome da rua"
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-number" className="text-xs text-gray-400">Número *</Label>
                          <Input
                            id="shipping-number"
                            value={shippingAddress.number}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                            placeholder="123"
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shipping-complement" className="text-xs text-gray-400">Complemento</Label>
                        <Input
                          id="shipping-complement"
                          value={shippingAddress.complement}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                          placeholder="Apto, bloco..."
                          className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="shipping-neighborhood" className="text-xs text-gray-400">Bairro *</Label>
                          <Input
                            id="shipping-neighborhood"
                            value={shippingAddress.neighborhood}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-zipcode" className="text-xs text-gray-400">CEP *</Label>
                          <Input
                            id="shipping-zipcode"
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                            placeholder="00000-000"
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-city" className="text-xs text-gray-400">Cidade *</Label>
                          <Input
                            id="shipping-city"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-state" className="text-xs text-gray-400">UF *</Label>
                          <Input
                            id="shipping-state"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value.toUpperCase() })}
                            maxLength={2}
                            className="mt-1 border-white/10 bg-black/25 text-sm text-white"
                          />
                        </div>
                      </div>
                    </section>
                  )}

                  <div className="mt-auto space-y-3 pt-1">
                    <Button
                      type="button"
                      onClick={handleCheckout}
                      disabled={
                        isProcessing ||
                        productsLoading ||
                        !buyerProfileLoaded ||
                        !isValidBrazilianPhone(buyerPhone) ||
                        (products.length === 0 && courses.length === 0)
                      }
                      className="h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processando...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Continuar para pagamento
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      )}
                    </Button>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      Pagamento seguro via Mercado Pago
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Coluna resumo */}
            <aside className="order-1 bg-black/20 p-5 sm:p-7 lg:order-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  Resumo do pedido
                </h3>
                <span className="text-xs text-gray-500">
                  {courses.length + products.length}{" "}
                  {courses.length + products.length === 1 ? "item" : "itens"}
                </span>
              </div>

              <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                {courses.map((course) => (
                  <div key={course.id} className="flex gap-3">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      style={{ objectPosition: (course as { imagePosition?: string }).imagePosition || "50% 50%" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-white">{course.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{course.instructor}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        R$ {(typeof course.price === "string" ? parseFloat(course.price) : course.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {products.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="flex gap-3">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      style={{ objectPosition: (product as { imagePosition?: string }).imagePosition || "50% 50%" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-white">{product.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {product.type === "physical" ? "Produto físico" : "Produto digital"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        R$ {(typeof product.price === "string" ? parseFloat(product.price) : product.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {productsLoading && (
                  <p className="py-2 text-center text-xs text-gray-500">Carregando produtos...</p>
                )}
              </div>

              <div className="my-5 h-px bg-white/10" />

              {!couponApplied ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Cupom de desconto"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-10 flex-1 border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    variant="outline"
                    className="h-10 border-white/10 bg-white/5 px-4 text-sm text-gray-200 hover:bg-white/10"
                  >
                    Aplicar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Cupom {couponCode}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-xs text-gray-400 hover:text-white"
                    onClick={() => {
                      setCouponApplied(false);
                      setCouponCode("");
                      setDiscountAmount(0);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              )}

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className={totalSavings > 0 ? "line-through text-gray-500" : "text-gray-200"}>
                    R$ {totalOriginal.toFixed(2)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto</span>
                    <span>-R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Cupom</span>
                    <span>-R$ {couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                  <span className="font-medium text-white">Total</span>
                  <span className="text-2xl font-semibold tracking-tight text-white">
                    R$ {totalWithDiscount.toFixed(2)}
                  </span>
                </div>
              </div>

              {totalSavings > 0 && (
                <p className="mt-3 text-xs text-emerald-400/90">
                  Você economiza R$ {totalSavings.toFixed(2)} neste pedido
                </p>
              )}

              <ul className="mt-6 space-y-2 text-xs text-gray-400">
                {["Acesso vitalício", "Materiais digitais", "Material complementar", "Suporte com instrutores"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
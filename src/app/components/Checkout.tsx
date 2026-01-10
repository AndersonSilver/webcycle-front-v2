import { Course } from "../data/courses";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { CheckCircle2, CreditCard, Lock, X, ShoppingCart, QrCode, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/apiClient";
import { handleApiError } from "../../utils/errorHandler";
// ✅ CHECKOUT PRO: Não precisa mais do formulário de cartão

interface CheckoutProps {
  courses: Course[];
  onBack: () => void;
}

export function Checkout({ courses, onBack }: CheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "boleto">("credit_card");
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    installments: "1"
  });

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await apiClient.getCurrentUser();
        setFormData(prev => ({
          ...prev,
          name: userResponse.user.name,
          email: userResponse.user.email,
        }));
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };
    loadUserData();
  }, []);

  // ✅ CHECKOUT PRO: Não precisa criar checkout antecipadamente
  // O checkout será criado quando o usuário clicar em "Continuar para Pagamento"

  // Calcular totais
  // Converter preços para número (podem vir como string da API)
  const totalOriginal = courses.reduce((acc, course) => {
    const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
    const originalPrice = course.originalPrice 
      ? (typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)
      : price;
    return acc + originalPrice;
  }, 0);
  // Valor atual dos cursos (já com desconto do curso aplicado)
  const totalCurrent = courses.reduce((acc, course) => {
    const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
    return acc + price;
  }, 0);
  
  // Desconto do curso (diferença entre original e atual)
  const courseDiscount = totalOriginal - totalCurrent;
  
  // Desconto do cupom (calculado sobre o valor JÁ COM DESCONTO do curso)
  const couponDiscount = discountAmount;
  
  // Total final = valor atual - desconto do cupom
  const totalWithDiscount = totalCurrent - couponDiscount;
  
  // Economia total (desconto do curso + desconto do cupom)
  const totalSavings = courseDiscount + couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    try {
      // Usar totalCurrent (valor já com desconto do curso) para validar o cupom
      const totalCurrent = courses.reduce((acc, course) => {
        const price = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
        return acc + price;
      }, 0);
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
      const response = await apiClient.checkout({
        courses: courses.map(c => c.id),
        paymentMethod: paymentMethod,
        couponCode: couponApplied ? couponCode : undefined,
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

      // ✅ CHECKOUT PRO: Abrir Mercado Pago em nova aba (para cartão)
      if (response.payment.paymentLink) {
        console.log("🚀 Abrindo Checkout Pro em nova aba:", response.payment.paymentLink);
        console.log("🔍 URL completa:", response.payment.paymentLink);
        console.log("🔍 É sandbox?", response.payment.paymentLink.includes('sandbox'));
        
        // Verificar se é sandbox (importante para testes)
        if (!response.payment.paymentLink.includes('sandbox')) {
          console.warn("⚠️ ATENÇÃO: URL não é sandbox! Pode não funcionar em testes.");
        }
        
        toast.info("Abrindo página de pagamento do Mercado Pago em nova aba...");
        // Abrir Checkout Pro do Mercado Pago em nova aba
        const newWindow = window.open(response.payment.paymentLink, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          toast.error("Por favor, permita pop-ups para este site e tente novamente.");
          setIsProcessing(false);
          return;
        }
        
        // Monitorar quando a nova aba fechar ou quando o pagamento for concluído
        // O App.tsx já monitora os parâmetros de retorno na URL
        setIsProcessing(false);
        toast.success("Página de pagamento aberta! Complete o pagamento na nova aba.");
      } else {
        console.warn("⚠️ paymentLink não retornado. Verifique se o backend está configurado para Checkout Pro.");
        toast.error("Erro ao gerar link de pagamento. Tente novamente.");
        setIsProcessing(false);
      }
    } catch (error: any) {
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
      
      handleApiError(error, "Erro ao processar checkout");
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCheckout();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-6xl my-2 sm:my-4 md:my-8 relative max-h-[95vh] overflow-y-auto">
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
              <CardTitle className="text-xl sm:text-2xl mb-1 sm:mb-2">Finalizar Compra</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Escolha a forma de pagamento e complete seus dados
              </CardDescription>
            </div>
            {/* Logo Mercado Pago */}
            <div className="hidden md:block">
              <div className="flex items-center gap-2 bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-600">Pagamento via Mercado Pago</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Formulário - 2 colunas */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Informações Pessoais */}
                <Card className="border-2">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="João Silva"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          name="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => {
                            setFormData({ ...formData, cpf: formatCPF(e.target.value) });
                          }}
                          maxLength={14}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="joao@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Métodos de Pagamento */}
                <Card className="border-2">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      Método de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    {/* Seleção de método de pagamento */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("credit_card")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === "credit_card"
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                          paymentMethod === "credit_card" ? "text-blue-600" : "text-gray-400"
                        }`} />
                        <p className="text-sm font-semibold">Cartão</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === "pix"
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <QrCode className={`w-6 h-6 mx-auto mb-2 ${
                          paymentMethod === "pix" ? "text-green-600" : "text-gray-400"
                        }`} />
                        <p className="text-sm font-semibold">PIX</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("boleto")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === "boleto"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                          paymentMethod === "boleto" ? "text-purple-600" : "text-gray-400"
                        }`} />
                        <p className="text-sm font-semibold">Boleto</p>
                      </button>
                    </div>

                    {/* Se PIX foi gerado, mostrar QR code */}
                    {pixCode ? (
                      <div className="space-y-4 bg-green-50 p-6 rounded-lg border-2 border-green-200">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Escaneie o QR Code</h3>
                          <p className="text-sm text-gray-600 mb-4">
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
                          <Label className="text-sm font-semibold">Código PIX (Copiar e Colar)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={pixCode}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pixCode);
                                toast.success("Código PIX copiado!");
                              }}
                              variant="outline"
                              size="icon"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            ⏱️ O pagamento será confirmado automaticamente após a confirmação do PIX.
                            Você receberá um email quando o pagamento for aprovado.
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={onBack}
                          className="w-full"
                          variant="outline"
                        >
                          Voltar
                        </Button>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden">
                        {/* Background decorativo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 opacity-50"></div>
                        
                        <div className="relative space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
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
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                              Finalizar Pagamento
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {paymentMethod === "pix" 
                                ? "Você verá o QR Code do PIX após confirmar"
                                : paymentMethod === "boleto"
                                ? "Você receberá o boleto para pagamento"
                                : "Você será redirecionado para uma página segura de pagamento"}
                            </p>
                          </div>

                          {/* Informações de segurança */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 shadow-sm">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-green-600" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1">
                                  Pagamento 100% Seguro
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                                  Seus dados são protegidos e processados de forma segura pelo Mercado Pago.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botão de ação */}
                          <Button
                            type="button"
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Processando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <span>
                                  {paymentMethod === "pix" 
                                    ? "Gerar QR Code PIX"
                                    : paymentMethod === "boleto"
                                    ? "Gerar Boleto"
                                    : "Continuar para Pagamento"}
                                </span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            )}
                          </Button>

                          {/* Badge de segurança */}
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Lock className="w-3 h-3" />
                            <span>Criptografado e seguro</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>


                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Pagamento 100% seguro</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Criptografado</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Resumo do Pedido - 1 coluna */}
            <div className="space-y-3 sm:space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200 sticky top-2 sm:top-4">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Resumo do Pedido
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  {/* Lista de Cursos */}
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-blue-200 last:border-b-0">
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1">{course.title}</h4>
                          <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">{course.instructor}</p>
                          <p className="text-xs sm:text-sm font-bold text-green-600">
                            R$ {(typeof course.price === 'string' ? parseFloat(course.price) : course.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
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
                          className="flex-1 text-xs sm:text-sm h-8 sm:h-10"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyCoupon}
                          variant="outline"
                          className="whitespace-nowrap text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                        >
                          Aplicar
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-green-800 truncate">
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
                          className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs flex-shrink-0"
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
                      <span className="text-gray-600">Subtotal:</span>
                      <span className={totalSavings > 0 ? "line-through text-gray-500" : "font-semibold"}>
                        R$ {totalOriginal.toFixed(2)}
                      </span>
                    </div>
                    {courseDiscount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-green-700 font-semibold">Desconto do Curso:</span>
                        <span className="text-green-700 font-semibold">-R$ {courseDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-green-700 font-semibold">Desconto do Cupom:</span>
                        <span className="text-green-700 font-semibold">-R$ {couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-base md:text-lg">Total</span>
                      <span className="font-bold text-lg sm:text-xl md:text-2xl text-blue-600">R$ {totalWithDiscount.toFixed(2)}</span>
                    </div>
                  </div>

                  {totalSavings > 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1">
                        🎉 Você está economizando R$ {totalSavings.toFixed(2)}!
                      </p>
                      <p className="text-[10px] sm:text-xs opacity-90">
                        {courseDiscount > 0 && couponDiscount > 0 
                          ? `R$ ${courseDiscount.toFixed(2)} de desconto do curso + R$ ${couponDiscount.toFixed(2)} de desconto do cupom`
                          : courseDiscount > 0 
                            ? `Desconto do curso aplicado`
                            : `Desconto do cupom aplicado`
                        }
                      </p>
                    </div>
                  )}

                  <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      Incluso no seu pedido:
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                        <span>Acesso vitalício</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                        <span>Certificados digitais</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                        <span>Material complementar</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                        <span>Suporte com instrutores</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                    <p className="text-xs sm:text-sm font-semibold text-green-800 flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Garantia de 7 dias
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                      100% do seu dinheiro de volta
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
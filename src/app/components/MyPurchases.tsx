import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Package, Download, CheckCircle2, Clock, AlertCircle, Eye, BookOpen, FileText, Search, Filter, TrendingUp, Calendar, X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Product {
  id: string;
  title: string;
  image: string;
  type: 'physical' | 'digital';
  price: number;
  digitalFileUrl?: string;
}

interface Tracking {
  id: string;
  proofOfDeliveryUrl?: string;
  deliveredAt?: string;
}

interface ProductPurchase {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  tracking?: Tracking;
}

interface Purchase {
  id: string;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  courses?: Array<{ course: any }>;
  products?: ProductPurchase[];
  paymentLink?: string;
  pixCode?: string;
  boletoUrl?: string;
}

interface MyPurchasesProps {
  onBack: () => void;
}

export function MyPurchases({ onBack }: MyPurchasesProps) {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "courses" | "products">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d" | "year">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMyPurchases();
      setPurchases(response?.purchases || []);
    } catch (error: any) {
      console.error("Erro ao carregar compras:", error);
      toast.error("Erro ao carregar suas compras");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      paid: { label: 'Pago', color: 'bg-green-500', icon: CheckCircle2 },
      pending: { label: 'Pendente', color: 'bg-red-500', icon: Clock },
      failed: { label: 'Falhou', color: 'bg-red-500', icon: AlertCircle },
      refunded: { label: 'Reembolsado', color: 'bg-gray-500', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 px-2.5 py-1 text-xs font-medium text-white`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)",
        }}
      >
        <div className="flex items-center justify-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
        </div>
      </div>
    );
  }

  // Filtrar e ordenar compras
  const filteredAndSortedPurchases = purchases
    .filter((purchase) => {
      // Filtro de status
      if (statusFilter !== 'all' && purchase.paymentStatus !== statusFilter) {
        return false;
      }

      // Filtro de tipo
      if (typeFilter !== 'all') {
        if (typeFilter === 'courses' && (!purchase.courses || purchase.courses.length === 0)) {
          return false;
        }
        if (typeFilter === 'products' && (!purchase.products || purchase.products.length === 0)) {
          return false;
        }
      }

      // Filtro de data
      if (dateFilter !== 'all') {
        const purchaseDate = new Date(purchase.createdAt);
        const now = new Date();
        const daysAgo = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          'year': 365,
        }[dateFilter] || 0;
        
        const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > daysAgo) {
          return false;
        }
      }

      // Busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = purchase.id.toLowerCase().includes(query);
        const matchesCourse = purchase.courses?.some(c => 
          c.course.title.toLowerCase().includes(query) ||
          c.course.instructor?.toLowerCase().includes(query)
        );
        const matchesProduct = purchase.products?.some(p => 
          p.product.title.toLowerCase().includes(query)
        );
        
        if (!matchesId && !matchesCourse && !matchesProduct) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const amountA = typeof a.finalAmount === 'string' ? parseFloat(a.finalAmount) : a.finalAmount;
        const amountB = typeof b.finalAmount === 'string' ? parseFloat(b.finalAmount) : b.finalAmount;
        return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
      }
    });

  // Mostrar todas as compras (não apenas pagas) para permitir pagamento de pendentes
  const allPurchases = purchases;
  const hasPurchases = allPurchases.length > 0;

  // Calcular estatísticas
  // Calcular estatísticas (apenas compras pagas)
  const paidPurchases = purchases.filter((p: Purchase) => p.paymentStatus === 'paid');
  const totalSpent = paidPurchases.reduce((sum: number, p: Purchase) => {
    const amount = typeof p.finalAmount === 'string' ? parseFloat(p.finalAmount) : p.finalAmount;
    return sum + (amount || 0);
  }, 0);

  const totalPurchases = paidPurchases.length;
  const lastPurchase = paidPurchases.length > 0 
    ? paidPurchases.sort((a: Purchase, b: Purchase) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-8 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <header className="mb-12 border-b border-white/[0.07] pb-10 lg:mb-14 lg:pb-12">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
            Pedidos
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Minhas compras
          </h1>
          <p className="max-w-xl text-base text-white/45">
            Acompanhe seus pedidos e produtos adquiridos
          </p>

          {hasPurchases && (
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6">
                <p className="text-3xl font-light tracking-tight text-white tabular-nums sm:text-4xl">
                  R$ {totalSpent.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-white/40">Total gasto</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6">
                <p className="text-3xl font-light tracking-tight text-white tabular-nums sm:text-4xl">
                  {totalPurchases}
                </p>
                <p className="mt-2 text-xs text-white/40">Compras pagas</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6">
                <p className="text-2xl font-light tracking-tight text-white sm:text-3xl">
                  {lastPurchase
                    ? new Date(lastPurchase.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="mt-2 text-xs text-white/40">Última compra</p>
              </div>
            </div>
          )}
        </header>

        {hasPurchases && (
          <div className="mb-8 space-y-4 border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                placeholder="Buscar por ID, produto ou curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-black/30 pl-10 text-sm text-white placeholder:text-gray-500 focus-visible:border-violet-400/50 focus-visible:ring-2 focus-visible:ring-violet-500/25"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-gray-900 text-white">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-gray-900 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="courses">Cursos</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-gray-900 text-white">
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-gray-900 text-white">
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="amount">Valor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-gray-900 text-white">
                  <SelectItem value="desc">Decrescente</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <p className="text-sm text-white/40">
                  Mostrando {filteredAndSortedPurchases.length} de {purchases.length} compras
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {!hasPurchases ? (
          <div className="border border-white/[0.08] bg-white/[0.03] px-6 py-14 sm:px-10">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
              Pedidos
            </p>
            <h3 className="mb-2 text-2xl font-semibold text-white">Nenhuma compra ainda</h3>
            <p className="mb-8 max-w-md text-white/45">
              Você ainda não realizou nenhuma compra.
            </p>
            <Button
              onClick={onBack}
              className="h-11 rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Explorar catálogo
            </Button>
          </div>
        ) : filteredAndSortedPurchases.length === 0 ? (
          <div className="border border-white/[0.08] bg-white/[0.03] px-6 py-14 sm:px-10">
            <h3 className="mb-2 text-2xl font-semibold text-white">Nenhum resultado</h3>
            <p className="mb-8 max-w-md text-white/45">
              Não há compras que correspondam aos filtros selecionados.
            </p>
            <Button
              onClick={clearFilters}
              className="h-11 rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-col gap-4 border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-white/15 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div>{getStatusBadge(purchase.paymentStatus)}</div>
                  <p className="text-sm text-white/45">
                    {new Date(purchase.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xl font-light tracking-tight text-white">
                    R${" "}
                    {(typeof purchase.finalAmount === "string"
                      ? parseFloat(purchase.finalAmount)
                      : purchase.finalAmount
                    ).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedPurchase(purchase);
                    setModalOpen(true);
                  }}
                  className="h-11 shrink-0 gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black hover:bg-slate-100 sm:w-auto"
                >
                  <Eye className="h-4 w-4" />
                  Ver detalhes
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                Detalhes da Compra
              </DialogTitle>
              <DialogDescription>
                {selectedPurchase && (
                  <p className="text-sm text-gray-300 mt-2">
                    Realizada em {new Date(selectedPurchase.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedPurchase && (
              <div className="space-y-6 mt-4">
                {/* Informações da Compra */}
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                  <h3 className="font-semibold mb-3 text-white">Informações da Compra</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedPurchase.paymentStatus)}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Método de Pagamento:</span>
                      <p className="font-medium mt-1 text-white">
                        {selectedPurchase.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                         selectedPurchase.paymentMethod === 'pix' ? 'PIX' : 'Boleto'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-300">Valor Total:</span>
                      <p className="font-bold text-lg mt-1 text-white">
                        R$ {(typeof selectedPurchase.finalAmount === 'string' ? parseFloat(selectedPurchase.finalAmount) : selectedPurchase.finalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cursos */}
                {selectedPurchase.courses && selectedPurchase.courses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      Cursos ({selectedPurchase.courses.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedPurchase.courses.map((pc) => (
                        <div key={pc.course.id} className="flex gap-4 p-4 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm">
                          <ImageWithFallback
                            src={pc.course.image}
                            alt={pc.course.title}
                            className="w-20 h-20 object-cover rounded"
                            style={{ objectPosition: (pc.course as { imagePosition?: string }).imagePosition || "50% 50%" }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{pc.course.title}</h4>
                            <p className="text-sm text-gray-300">{pc.course.instructor}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-white/20 text-white hover:bg-white/10"
                              onClick={() => {
                                setModalOpen(false);
                                navigate(`/curso/${pc.course.id}`);
                              }}
                            >
                              Acessar Curso
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produtos */}
                {selectedPurchase.products && selectedPurchase.products.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                      <Package className="w-5 h-5 text-gray-400" />
                      Produtos ({selectedPurchase.products.length})
                    </h3>
                    <div className="space-y-4">
                      {selectedPurchase.products.map((pp) => (
                        <div key={pp.id} className="border border-white/10 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
                          <div className="flex gap-4">
                            <ImageWithFallback
                              src={pp.product.image}
                              alt={pp.product.title}
                              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              style={{
                                objectPosition:
                                  (pp.product as { imagePosition?: string }).imagePosition || "50% 50%",
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={pp.product.type === 'physical' ? 'bg-blue-600' : 'bg-gray-600'}>
                                  {pp.product.type === 'physical' ? 'Físico' : 'Digital'}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-lg text-white">{pp.product.title}</h4>
                              <p className="text-sm text-gray-300">Quantidade: {pp.quantity}</p>
                              <p className="text-xl font-bold mt-2 text-white">
                                R$ {(typeof pp.price === 'string' ? parseFloat(pp.price) : pp.price).toFixed(2)}
                              </p>

                              {/* Download para produtos digitais */}
                              {pp.product.type === 'digital' && (
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() => {
                                      if (pp.product.digitalFileUrl) {
                                        window.open(pp.product.digitalFileUrl, '_blank');
                                      } else {
                                        toast.info("Arquivo digital ainda não está disponível");
                                      }
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar Produto Digital
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compra Cancelada (Reembolsada) */}
                {selectedPurchase.paymentStatus === 'refunded' && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-1">Compra Cancelada</h4>
                          <p className="text-sm text-red-800">
                            Esta compra foi cancelada e reembolsada. Se você tiver dúvidas, entre em contato com o suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Produtos Físicos Aguardando Envio - Apenas para compras PAGAS */}
                {selectedPurchase.paymentStatus === 'paid' && 
                 selectedPurchase.products && 
                 selectedPurchase.products.some(pp => 
                   pp.product.type === 'physical' && (!pp.tracking || !pp.tracking.proofOfDeliveryUrl)
                 ) && (
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-1">Produtos Aguardando Envio</h4>
                          <p className="text-sm text-blue-800">
                            O envio dos produtos físicos está sendo realizado e o comprovante será disponibilizado em até 2 dias úteis.
                          </p>
                          <div className="mt-3 space-y-2">
                            {selectedPurchase.products
                              .filter(pp => pp.product.type === 'physical' && (!pp.tracking || !pp.tracking.proofOfDeliveryUrl))
                              .map((pp) => (
                                <div key={pp.id} className="flex items-center gap-2 text-sm text-blue-700">
                                  <Package className="w-4 h-4" />
                                  <span>{pp.product.title} (Qtd: {pp.quantity})</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de Pagamento para compras PENDENTES */}
                {selectedPurchase.paymentStatus !== 'paid' && 
                 selectedPurchase.paymentStatus !== 'refunded' && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 rounded-full">
                          <Clock className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-1">Pagamento Pendente</h4>
                          <p className="text-sm text-red-200 mb-4">
                            Esta compra ainda não foi paga. Complete o pagamento para receber seus produtos.
                          </p>
                          <Button
                            onClick={() => {
                              // Redirecionar para checkout com os mesmos itens da compra
                              const courses = selectedPurchase.courses?.map(c => c.course.id) || [];
                              const products = selectedPurchase.products?.map(p => ({
                                productId: p.product.id,
                                quantity: p.quantity
                              })) || [];
                              
                              navigate("/checkout", {
                                state: {
                                  courses: courses.length > 0 ? courses : undefined,
                                  products: products.length > 0 ? products : undefined,
                                  purchaseId: selectedPurchase.id
                                }
                              });
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Finalizar Pagamento
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprovantes de Envio */}
                {selectedPurchase.products && selectedPurchase.products.some(pp => 
                  pp.product.type === 'physical' && pp.tracking?.proofOfDeliveryUrl
                ) && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5 text-gray-400" />
                      Comprovantes de Envio
                    </h3>
                    <div className="space-y-3">
                      {selectedPurchase.products
                        .filter(pp => pp.product.type === 'physical' && pp.tracking?.proofOfDeliveryUrl)
                        .map((pp) => (
                          <div key={pp.id} className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">{pp.product.title}</p>
                                {pp.tracking?.deliveredAt && (
                                  <p className="text-xs text-gray-300 mt-1">
                                    Entregue em: {new Date(pp.tracking.deliveredAt).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={() => window.open(pp.tracking!.proofOfDeliveryUrl!, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-white hover:bg-gray-200 text-black"
                                  onClick={async () => {
                                    try {
                                      const url = pp.tracking!.proofOfDeliveryUrl!;
                                      const response = await fetch(url);
                                      const blob = await response.blob();
                                      const blobUrl = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = blobUrl;
                                      link.download = `comprovante-envio-${pp.product.title.replace(/\s+/g, '-')}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(blobUrl);
                                    } catch (error) {
                                      console.error('Erro ao baixar comprovante:', error);
                                      toast.error('Erro ao baixar comprovante. Tente novamente.');
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


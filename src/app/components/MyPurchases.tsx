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
      <Badge className={`${config.color} text-white flex items-center gap-1 px-3 py-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
          minHeight: '100vh'
        }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
          </div>
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
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <section 
        className="relative text-white overflow-hidden pt-24 pb-12"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-primary-dark) 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-primary-light)', opacity: 0.3 }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.3 }}></div>
        
        <div className="relative container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Minhas Compras</h1>
          <p className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Acompanhe seus pedidos e produtos adquiridos
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8" style={{ background: 'transparent' }}>
        {/* Estatísticas */}
        {hasPurchases && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Total Gasto</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-white/10">
                    <TrendingUp className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Total de Compras</p>
                    <p className="text-2xl font-bold text-white">
                      {totalPurchases}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-white/10">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Última Compra</p>
                    <p className="text-lg font-semibold text-white">
                      {lastPurchase 
                        ? new Date(lastPurchase.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-white/10">
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Busca */}
        {hasPurchases && (
          <Card className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por ID da compra, nome do produto ou curso..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                {/* Filtros em linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border border-white/20 text-white">
                      <SelectItem value="all" className="text-white hover:bg-white/10">Todos os Status</SelectItem>
                      <SelectItem value="paid" className="text-white hover:bg-white/10">Pago</SelectItem>
                      <SelectItem value="pending" className="text-white hover:bg-white/10">Pendente</SelectItem>
                      <SelectItem value="failed" className="text-white hover:bg-white/10">Falhou</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border border-white/20 text-white">
                      <SelectItem value="all" className="text-white hover:bg-white/10">Todos</SelectItem>
                      <SelectItem value="courses" className="text-white hover:bg-white/10">Cursos</SelectItem>
                      <SelectItem value="products" className="text-white hover:bg-white/10">Produtos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border border-white/20 text-white">
                      <SelectItem value="all" className="text-white hover:bg-white/10">Todo Período</SelectItem>
                      <SelectItem value="7d" className="text-white hover:bg-white/10">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d" className="text-white hover:bg-white/10">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d" className="text-white hover:bg-white/10">Últimos 90 dias</SelectItem>
                      <SelectItem value="year" className="text-white hover:bg-white/10">Último ano</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border border-white/20 text-white">
                      <SelectItem value="date" className="text-white hover:bg-white/10">Data</SelectItem>
                      <SelectItem value="amount" className="text-white hover:bg-white/10">Valor</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40">
                      <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border border-white/20 text-white">
                      <SelectItem value="desc" className="text-white hover:bg-white/10">Decrescente</SelectItem>
                      <SelectItem value="asc" className="text-white hover:bg-white/10">Crescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão limpar filtros */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <p className="text-sm text-gray-300">
                      Mostrando {filteredAndSortedPurchases.length} de {purchases.length} compras
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!hasPurchases ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2 text-white">Nenhuma compra encontrada</h3>
              <p className="text-gray-300 mb-6">
                Você ainda não realizou nenhuma compra.
              </p>
              <Button onClick={onBack} className="bg-white text-black hover:bg-gray-200">
                Explorar Produtos
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedPurchases.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-12 text-center">
              <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2 text-white">Nenhuma compra encontrada</h3>
              <p className="text-gray-300 mb-6">
                Não há compras que correspondam aos filtros selecionados.
              </p>
              <Button onClick={clearFilters} className="bg-white text-black hover:bg-gray-200">
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPurchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-md transition-shadow bg-white/5 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(purchase.paymentStatus)}
                      </div>
                      <p className="text-sm text-gray-300">
                        {new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-lg font-bold mt-2 text-white">
                        Total: R$ {(typeof purchase.finalAmount === 'string' ? parseFloat(purchase.finalAmount) : purchase.finalAmount).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setModalOpen(true);
                      }}
                      className="shadow-2xl text-black border-0 hover:scale-105 transition-transform bg-white hover:bg-gray-200"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
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


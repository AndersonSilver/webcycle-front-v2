import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Package, Truck, MapPin, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { toast } from "sonner";

interface TrackingEvent {
  id: string;
  status: string;
  description?: string;
  location?: string;
  timestamp?: string;
  createdAt: string;
}

interface Tracking {
  id: string;
  trackingCode?: string;
  status: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  events?: TrackingEvent[];
}

interface TrackingComponentProps {
  trackingId: string;
  productName?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Aguardando Postagem', color: 'bg-gray-500', icon: Clock },
  preparing: { label: 'Preparando para Envio', color: 'bg-yellow-500', icon: Package },
  shipped: { label: 'Produto Postado', color: 'bg-blue-500', icon: Package },
  in_transit: { label: 'Em Trânsito', color: 'bg-blue-600', icon: Truck },
  out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle2 },
  returned: { label: 'Devolvido', color: 'bg-red-500', icon: AlertCircle },
  exception: { label: 'Exceção', color: 'bg-red-600', icon: AlertCircle },
};

export function TrackingComponent({ trackingId, productName }: TrackingComponentProps) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadTracking = async () => {
    try {
      setLoading(true);
      // Usar getTracking (método disponível)
      const response = await apiClient.getTracking(trackingId);
      setTracking(response.tracking);
    } catch (error: any) {
      console.error('Erro ao carregar tracking:', error);
      toast.error('Erro ao carregar informações de rastreamento');
    } finally {
      setLoading(false);
    }
  };

  const updateTracking = async () => {
    try {
      setUpdating(true);
      // Método updateTracking removido - recarregar tracking manualmente
      const response = await apiClient.getTracking(trackingId);
      setTracking(response.tracking);
      toast.success('Rastreamento atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar tracking:', error);
      toast.error('Erro ao atualizar rastreamento');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadTracking();
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadTracking, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [trackingId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">Rastreamento não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusConfig[tracking.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;
  const events = tracking.events || [];
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.createdAt).getTime();
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Rastreamento de Envio
          </CardTitle>
          <Button
            onClick={updateTracking}
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações principais */}
        <div className="space-y-4">
          {productName && (
            <div>
              <p className="text-sm text-gray-600">Produto</p>
              <p className="font-semibold">{productName}</p>
            </div>
          )}
          
          {tracking.trackingCode && (
            <div>
              <p className="text-sm text-gray-600">Código de Rastreamento</p>
              <p className="font-mono font-semibold text-lg">{tracking.trackingCode}</p>
            </div>
          )}

          {tracking.carrier && (
            <div>
              <p className="text-sm text-gray-600">Transportadora</p>
              <p className="font-semibold">{tracking.carrier}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">Status Atual</p>
            <Badge className={`${statusInfo.color} text-white flex items-center gap-2 w-fit px-3 py-1`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </Badge>
          </div>

          {tracking.estimatedDeliveryDate && (
            <div>
              <p className="text-sm text-gray-600">Previsão de Entrega</p>
              <p className="font-semibold">
                {new Date(tracking.estimatedDeliveryDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {tracking.deliveredAt && (
            <div>
              <p className="text-sm text-gray-600">Data de Entrega</p>
              <p className="font-semibold text-green-600">
                {new Date(tracking.deliveredAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Timeline de eventos */}
        {sortedEvents.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Histórico de Rastreamento</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {sortedEvents.map((event, index) => {
                  const eventDate = event.timestamp 
                    ? new Date(event.timestamp)
                    : new Date(event.createdAt);
                  const isLast = index === 0;
                  
                  return (
                    <div key={event.id} className="relative flex items-start gap-4">
                      <div className={`relative z-10 w-8 h-8 rounded-full ${isLast ? statusInfo.color : 'bg-gray-400'} flex items-center justify-center text-white`}>
                        {isLast ? (
                          <StatusIcon className="w-4 h-4" />
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{event.status}</p>
                          <p className="text-sm text-gray-500">
                            {eventDate.toLocaleDateString('pt-BR')} {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {sortedEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum evento de rastreamento disponível ainda.</p>
            <p className="text-sm mt-2">Os eventos aparecerão aqui assim que o produto for postado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


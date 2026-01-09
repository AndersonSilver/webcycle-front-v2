import { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

interface MercadoPagoCardFormProps {
  publicKey: string;
  amount: number;
  onReady?: () => void;
  onSubmit?: (formData: any) => void;
}

export function MercadoPagoCardForm({ 
  publicKey, 
  amount, 
  onReady,
  onSubmit 
}: MercadoPagoCardFormProps) {
  const [mpInitialized, setMpInitialized] = useState(false);

  useEffect(() => {
    // Inicializar Mercado Pago apenas uma vez
    try {
      // Verificar se já foi inicializado
      if ((window as any).__MP_INITIALIZED__) {
        setMpInitialized(true);
        return;
      }
      
      initMercadoPago(publicKey);
      (window as any).__MP_INITIALIZED__ = true;
      setMpInitialized(true);
      console.log("[MP] Mercado Pago inicializado com sucesso!");
      console.log("[MP] Public Key sendo usada:", publicKey.substring(0, 20) + "...");
      console.log("[MP] ⚠️ IMPORTANTE: Esta Public Key deve ser da MESMA aplicação do Access Token do backend!");
    } catch (err: any) {
      // Se já foi inicializado, apenas marcar como pronto
      if (err?.message?.includes('already been initialized')) {
        (window as any).__MP_INITIALIZED__ = true;
        setMpInitialized(true);
        return;
      }
      console.error("[MP] Erro ao inicializar:", err);
    }
  }, [publicKey]);

  const handleReady = () => {
    console.log("[MP] CardPayment pronto!");
    if (onReady) {
      onReady();
    }
  };

  const handleSubmit = async (param: any) => {
    console.log("🔵 [MP] Iniciando processamento do pagamento...");
    console.log("📦 [MP] Dados completos do formulário:", JSON.stringify(param, null, 2));
    
    // O SDK React do Mercado Pago retorna o token em diferentes estruturas
    // Tentar extrair de todas as possíveis propriedades
    let token = param.token || 
                param.id || 
                param.cardToken || 
                param.payment_method_id ||
                param.paymentMethodId ||
                (param.formData && param.formData.token) ||
                (param.data && param.data.token);
    
    // Se ainda não encontrou, verificar se está dentro de um objeto nested
    if (!token && param.formData) {
      token = param.formData.id || param.formData.token;
    }
    
    // Se ainda não encontrou, verificar se o param inteiro é o token (string)
    if (!token && typeof param === 'string') {
      token = param;
    }
    
    console.log("🔑 [MP] Token extraído:", {
      id: token,
      length: token?.length,
      fullToken: token, // Mostrar completo para debug
      exists: !!token,
      source: param.token ? 'param.token' : 
              param.id ? 'param.id' :
              param.cardToken ? 'param.cardToken' :
              param.payment_method_id ? 'param.payment_method_id' :
              param.formData?.token ? 'param.formData.token' :
              'não encontrado',
    });
    
    // Verificar se token é válido
    if (!token) {
      console.error("❌ [MP] Token não encontrado nos dados!");
      console.error("❌ [MP] Estrutura completa do param:", JSON.stringify(param, null, 2));
      console.error("❌ [MP] Tipo do param:", typeof param);
      console.error("❌ [MP] Chaves disponíveis:", Object.keys(param || {}));
      
      // Tentar extrair token de forma mais agressiva
      const paramString = JSON.stringify(param);
      const tokenMatch = paramString.match(/"token":\s*"([^"]+)"/i) || 
                        paramString.match(/"id":\s*"([a-f0-9]{32})"/i);
      
      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1];
        console.log("✅ [MP] Token encontrado via regex:", token);
      } else {
        if (onSubmit) {
          // Passar o objeto completo mesmo sem token para que o handler possa tentar extrair
          onSubmit(param);
        }
        return;
      }
    }
    
    if (token.length !== 32) {
      console.warn("⚠️ [MP] Token não tem 32 caracteres! Tamanho:", token.length);
      console.warn("⚠️ [MP] Token completo:", token);
    } else {
      console.log("✅ [MP] Token válido (32 caracteres)");
    }
    
    // Criar objeto com token garantido
    const paymentData = {
      ...param,
      token: token, // Garantir que o token está na propriedade correta
    };
    
    console.log("📤 [MP] Enviando dados para processamento:", {
      ...paymentData,
      token: paymentData.token ? (paymentData.token.substring(0, 10) + "****" + paymentData.token.substring(paymentData.token.length - 4)) : "NÃO ENCONTRADO",
    });
    
    if (onSubmit) {
      onSubmit(paymentData);
    }
  };

  if (!mpInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[150px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-xs text-gray-500">Inicializando Mercado Pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[150px]">
      <CardPayment
        initialization={{
          amount: amount,
        }}
        onSubmit={handleSubmit}
        onReady={handleReady}
      />
    </div>
  );
}

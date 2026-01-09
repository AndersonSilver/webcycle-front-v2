/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ENV?: string;
  readonly VITE_MERCADOPAGO_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declaração global do Mercado Pago
declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => {
      fields: {
        create: (type: string, options?: any) => {
          mount: (element: HTMLElement | string) => void;
          createToken: () => Promise<{
            status: string;
            id: string;
          }>;
        };
      };
    };
  }
}

export {};

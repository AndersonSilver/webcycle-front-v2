import { toast } from "sonner";

/**
 * Trata erros retornados pela API e exibe mensagens de validação ao usuário
 * @param error - Erro capturado do try/catch
 * @param defaultMessage - Mensagem padrão caso não haja mensagem específica
 */
export function handleApiError(error: any, defaultMessage: string = "Erro ao processar requisição") {
  console.error("Erro da API:", error);
  
  // Tratar erros de validação da API
  if (error?.errors && Array.isArray(error.errors)) {
    const validationErrors = error.errors.map((err: any) => {
      const property = err.property || 'campo';
      const constraints = err.constraints || {};
      const constraintMessages = Object.values(constraints);
      return `${property}: ${constraintMessages.join(', ')}`;
    });
    
    // Mensagem principal
    toast.error(error.message || "Erro de validação");
    
    // Exibir cada erro de validação individualmente
    setTimeout(() => {
      validationErrors.forEach((errMsg: string) => {
        toast.error(errMsg, { duration: 5000 });
      });
    }, 500);
    
    return validationErrors;
  } else {
    // Erro genérico
    const errorMessage = error?.message || error?.errorData?.message || defaultMessage;
    toast.error(errorMessage);
    return [];
  }
}

/**
 * Extrai erros de validação para exibir em campos específicos do formulário
 * @param error - Erro capturado do try/catch
 * @returns Objeto com erros por campo
 */
export function extractValidationErrors(error: any): Record<string, string> {
  const formErrors: Record<string, string> = {};
  
  if (error?.errors && Array.isArray(error.errors)) {
    error.errors.forEach((err: any) => {
      const property = err.property;
      const constraints = err.constraints || {};
      const constraintMessages = Object.values(constraints);
      if (property && constraintMessages.length > 0) {
        formErrors[property] = constraintMessages[0] as string;
      }
    });
  }
  
  return formErrors;
}


/**
 * Cliente HTTP centralizado para comunicação com a API
 * Gerencia autenticação, requisições e tratamento de erros
 */

// @ts-ignore - Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private redirecting = false; // Flag para evitar múltiplos redirecionamentos
  private readonly SESSION_KEY = 'SESSION';

  private getSession(): { token?: string; user?: any } | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  private setSession(data: { token?: string; user?: any }): void {
    const currentSession = this.getSession() || {};
    const newSession = { ...currentSession, ...data };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
  }

  private clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  private getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  private setToken(token: string): void {
    this.setSession({ token });
  }

  private removeToken(): void {
    const session = this.getSession();
    if (session) {
      delete session.token;
      if (Object.keys(session).length === 0) {
        this.clearSession();
      } else {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Adicionar token de autenticação se necessário
    if (requiresAuth) {
      const token = this.getToken();
      if (token) {
        (requestHeaders as any)['Authorization'] = `Bearer ${token}`;
      } else {
        // Se não há token e está tentando fazer requisição autenticada, não fazer a requisição
        console.warn('Token não encontrado para requisição autenticada:', endpoint);
        // Não fazer a requisição se não há token e está em processo de redirecionamento
        if (this.redirecting) {
          throw new Error('Redirecionando para login...');
        }
      }
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(fullUrl, {
        ...restOptions,
        headers: requestHeaders,
      });


      // Se token expirou ou é inválido, fazer logout
      if (response.status === 401 && requiresAuth) {
        this.removeToken();
        // Não redirecionar para /login (não existe), apenas limpar sessão
        // O componente App.tsx vai detectar que não há usuário e mostrar o estado correto
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        let errorData;
        try {
          errorData = isJson ? await response.json() : { message: response.statusText };
        } catch {
          errorData = { message: response.statusText };
        }
        
        // Mensagem mais específica para 404
        if (response.status === 404) {
          throw new Error(`Endpoint não encontrado: ${endpoint}. Verifique se o backend está rodando e a rota está configurada corretamente.`);
        }
        
        // Criar erro customizado com detalhes de validação
        const error = new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).errors = errorData.errors || [];
        (error as any).errorData = errorData;
        throw error;
      }

      // Retornar dados vazios para respostas 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      try {
        const data = isJson ? await response.json() : (await response.text() as T);
        return data;
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError);
        return {} as T;
      }
    } catch (error) {
      if (error instanceof Error) {
        // Se for erro de rede (API não disponível)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error(`[API] Erro de rede ao acessar ${fullUrl}. Verifique se o backend está rodando em ${API_BASE_URL}`);
          throw new Error(`Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`);
        }
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  // ==================== AUTENTICAÇÃO ====================

  async register(data: { name: string; email: string; password: string }) {
    const response = await this.request<{ user: any; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth: false,
      }
    );
    this.setToken(response.token);
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ user: any; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth: false,
      }
    );
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateProfile(data: { name?: string; avatar?: string }) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  }

  async resetPassword(data: { token: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false,
    });
  }

  logout(): void {
    this.clearSession();
  }

  // ==================== CURSOS ====================

  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<{
      courses: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/courses${query ? `?${query}` : ''}`);
  }

  async getPublicStats() {
    return this.request<{
      totalCourses: number;
      totalHours: number;
      averageRating: number;
    }>('/courses/stats/public', { requiresAuth: false });
  }

  async searchCourses(q: string, page?: number, limit?: number) {
    const queryParams = new URLSearchParams({ q });
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    return this.request<{
      courses: any[];
      total: number;
      query: string;
    }>(`/courses/search?${queryParams.toString()}`);
  }

  async getCourseById(id: string) {
    return this.request<{ course: any }>(`/courses/${id}`);
  }

  async getRelatedCourses(courseId: string) {
    return this.request<{ courses: any[] }>(`/courses/${courseId}/related`);
  }

  async shareCourse(courseId: string) {
    return this.request<{ shareToken: any; shareUrl: string }>(
      `/courses/${courseId}/share`,
      { method: 'POST' }
    );
  }

  // ==================== CARRINHO ====================

  async getCart() {
    return this.request<{
      items: any[];
      total: number;
      count: number;
    }>('/cart');
  }

  async addToCart(courseId: string) {
    return this.request<{ cartItem: any }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async removeFromCart(courseId: string) {
    return this.request<{ message: string }>(`/cart/remove/${courseId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<{ message: string }>('/cart/clear', {
      method: 'DELETE',
    });
  }

  async getCartTotal() {
    return this.request<{
      subtotal: number;
      discount: number;
      total: number;
      count: number;
    }>('/cart/total');
  }

  async applyCoupon(code: string) {
    return this.request<{ coupon: any; message: string }>('/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // ==================== COMPRAS ====================

  async checkout(data: {
    courses: string[];
    paymentMethod: 'pix' | 'boleto' | 'credit_card';
    couponCode?: string;
  }) {
    return this.request<{
      purchaseId: string;
      totalAmount: number;
      discountAmount: number;
      finalAmount: number;
      payment: any;
    }>('/purchases/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmPurchase(purchaseId: string, paymentId: string) {
    return this.request<{ purchase: any }>(`/purchases/${purchaseId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  }

  async processPayment(purchaseId: string, paymentData: {
    token: string;
    installments: string;
    paymentMethodId?: string;
    identificationType?: string;
    identificationNumber?: string;
  }) {
    console.log("🔵 [API] Iniciando processPayment...");
    console.log("📦 [API] Dados recebidos:", {
      purchaseId,
      paymentData: {
        ...paymentData,
        token: paymentData.token ? (paymentData.token.substring(0, 10) + "****" + paymentData.token.substring(paymentData.token.length - 4)) : "NÃO ENCONTRADO",
        tokenLength: paymentData.token?.length,
      },
    });
    
    // Validar que o token está presente
    if (!paymentData.token) {
      console.error("❌ [API] Token não encontrado!");
      throw new Error("Token do cartão não foi gerado");
    }
    
    // Validar tamanho do token
    if (paymentData.token.length !== 32) {
      console.warn("⚠️ [API] Token não tem 32 caracteres! Tamanho:", paymentData.token.length);
      console.warn("⚠️ [API] Token completo:", paymentData.token);
    } else {
      console.log("✅ [API] Token válido (32 caracteres)");
    }
    
    const bodyString = JSON.stringify(paymentData);
    console.log("📤 [API] Body JSON completo:", bodyString);
    console.log("📤 [API] Enviando para:", `/purchases/${purchaseId}/process`);
    
    try {
      const response = await this.request<{ purchase: any; payment: any }>(`/purchases/${purchaseId}/process`, {
        method: 'POST',
        body: bodyString,
      });
      console.log("✅ [API] Resposta do backend:", response);
      return response;
    } catch (error: any) {
      console.error("❌ [API] Erro na requisição:", error);
      throw error;
    }
  }

  async getMyPurchases() {
    return this.request<{ purchases: any[] }>('/purchases/my-purchases');
  }

  async getPurchaseStats() {
    return this.request<{
      totalPurchases: number;
      totalSpent: number;
      totalCourses: number;
      paidPurchases: number;
      pendingPurchases: number;
      averageTicket: number;
    }>('/purchases/my-purchases/stats');
  }

  async getPurchaseById(id: string) {
    return this.request<{ purchase: any }>(`/purchases/${id}`);
  }

  // ==================== PROGRESSO ====================

  async getCourseProgress(courseId: string) {
    return this.request<{
      courseId: string;
      progress: number;
      completedLessons: string[];
      lessons: any[];
    }>(`/progress/course/${courseId}`);
  }

  async getMyCourses() {
    return this.request<{ courses: any[] }>('/progress/my-courses');
  }

  async completeLesson(lessonId: string, watchedDuration: number) {
    return this.request<{ progress: any }>(
      `/progress/lesson/${lessonId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ watchedDuration }),
      }
    );
  }

  async updateWatchTime(lessonId: string, watchedDuration: number) {
    return this.request<{ progress: any }>(
      `/progress/lesson/${lessonId}/watch`,
      {
        method: 'PUT',
        body: JSON.stringify({ watchedDuration }),
      }
    );
  }

  async getLessonProgress(lessonId: string) {
    return this.request<{
      lessonId: string;
      progress: { completed: boolean; watchedDuration: number };
    }>(`/progress/lesson/${lessonId}`);
  }

  async getProgressStats() {
    return this.request<{
      totalLessons: number;
      completedLessons: number;
      totalWatchTime: number;
      completionRate: number;
    }>('/progress/stats');
  }

  async getProgressHistory(page?: number, limit?: number) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const query = queryParams.toString();
    return this.request<{ history: any[] }>(
      `/progress/history${query ? `?${query}` : ''}`
    );
  }

  // ==================== AVALIAÇÕES ====================

  async getCourseReviews(courseId: string) {
    return this.request<{
      reviews: any[];
      averageRating: number;
      totalReviews: number;
    }>(`/reviews/course/${courseId}`);
  }

  async getPublicReviews(limit?: number) {
    return this.request<{
      reviews: Array<{
        id: string;
        rating: number;
        comment: string;
        userName: string;
        userInitial: string;
        courseTitle: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/reviews/public${limit ? `?limit=${limit}` : ''}`, {
      requiresAuth: false,
    });
  }

  async getMyReview(courseId: string) {
    return this.request<{
      review: any | null;
    }>(`/reviews/my-review/${courseId}`);
  }

  async createReview(data: {
    courseId: string;
    rating: number;
    comment: string;
    images?: string[];
  }) {
    return this.request<{ review: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markReviewHelpful(reviewId: string) {
    return this.request<{ message: string; review: any }>(
      `/reviews/${reviewId}/helpful`,
      { method: 'POST' }
    );
  }

  async addReviewImages(reviewId: string, images: string[]) {
    return this.request<{ message: string; review: any }>(
      `/reviews/${reviewId}/images`,
      {
        method: 'POST',
        body: JSON.stringify({ images }),
      }
    );
  }

  // ==================== FAVORITOS ====================

  async getFavorites() {
    return this.request<{ favorites: any[] }>('/favorites');
  }

  async addFavorite(courseId: string) {
    return this.request<{ favorite: any }>(`/favorites/${courseId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(courseId: string) {
    return this.request<{ message: string }>(`/favorites/${courseId}`, {
      method: 'DELETE',
    });
  }

  async checkFavorite(courseId: string) {
    return this.request<{ isFavorite: boolean; favoriteId?: string }>(
      `/favorites/check/${courseId}`
    );
  }

  // ==================== CERTIFICADOS ====================

  async getCertificates() {
    return this.request<{ certificates: any[] }>('/certificates');
  }

  async getCertificateById(id: string) {
    return this.request<{ certificate: any }>(`/certificates/${id}`);
  }

  async downloadCertificate(id: string) {
    const response = await fetch(`${API_BASE_URL}/certificates/${id}/download`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async generateCertificate(courseId: string) {
    return this.request<{ certificate: any }>(
      `/certificates/generate/${courseId}`,
      { method: 'POST' }
    );
  }

  async verifyCertificate(code: string) {
    return this.request<{ valid: boolean; certificate: any }>(
      `/certificates/verify/${code}`,
      { requiresAuth: false }
    );
  }

  // ==================== CUPONS ====================

  async validateCoupon(code: string, totalAmount?: number) {
    const queryParams = new URLSearchParams({ code });
    if (totalAmount) queryParams.append('totalAmount', totalAmount.toString());

    return this.request<{
      valid: boolean;
      coupon: any;
      discountAmount: number;
      finalAmount: number;
    }>(`/coupons/validate/${code}${totalAmount ? `?totalAmount=${totalAmount}` : ''}`);
  }

  // ==================== REEMBOLSOS ====================

  async requestRefund(data: { purchaseId: string; reason: string }) {
    return this.request<{ refund: any }>('/refunds/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyRefunds() {
    return this.request<{ refunds: any[] }>('/refunds/my-refunds');
  }

  // ==================== NOTIFICAÇÕES ====================

  async getNotifications(params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{
      notifications: any[];
      unreadCount: number;
      total: number;
      page: number;
      limit: number;
    }>(`/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request<{ notification: any }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== RECOMENDAÇÕES ====================

  async getRecommendations(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<{ recommendations: any[] }>(
      `/recommendations${query}`
    );
  }

  async getTrendingCourses(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<{ courses: any[] }>(`/recommendations/trending${query}`);
  }

  // ==================== MÓDULOS E AULAS ====================

  async getCourseModules(courseId: string) {
    return this.request<{ modules: any[] }>(`/courses/${courseId}/modules`);
  }

  async getModuleLessons(moduleId: string) {
    return this.request<{ lessons: any[] }>(`/modules/${moduleId}/lessons`);
  }

  async getLessonById(lessonId: string) {
    return this.request<{
      lesson: any;
      hasAccess: boolean;
      progress: { completed: boolean; watchedDuration: number };
    }>(`/lessons/${lessonId}`);
  }

  async getLessonMaterials(lessonId: string) {
    return this.request<{ materials: any[] }>(`/lessons/${lessonId}/materials`);
  }

  // ==================== ADMIN ====================

  async getAdminDashboard(params?: { period?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request<any>(`/admin/dashboard${query ? `?${query}` : ''}`);
  }

  async getAdminSalesChart(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<{ labels: string[]; datasets: any[] }>(`/admin/dashboard/sales-chart${query}`);
  }

  async getAdminRevenueChart() {
    return this.request<{ labels: string[]; datasets: any[]; total: number }>('/admin/dashboard/revenue-chart');
  }

  async getAdminStudentsChart(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<{ labels: string[]; datasets: any[] }>(`/admin/dashboard/students-chart${query}`);
  }

  async getAdminPaymentMethodsChart() {
    return this.request<{ labels: string[]; datasets: any[]; total: number }>('/admin/dashboard/payment-methods-chart');
  }

  async getAdminStudents(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<{ students: any[]; total: number; page: number }>(
      `/admin/students${query ? `?${query}` : ''}`
    );
  }

  async getAdminPurchases(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request<{ purchases: any[]; total: number; page: number }>(
      `/admin/purchases${query ? `?${query}` : ''}`
    );
  }

  async getAdminRevenue(params?: { period?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request<any>(`/admin/revenue${query ? `?${query}` : ''}`);
  }

  async getAdminAnalyticsOverview() {
    return this.request<any>('/admin/analytics/overview');
  }

  async getAdminStudentProgress() {
    return this.request<any>('/admin/analytics/student-progress');
  }

  async exportPurchases(format: 'csv' | 'xlsx', startDate?: string, endDate?: string) {
    const body: any = { format };
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;

    const response = await fetch(`${API_BASE_URL}/admin/export/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(body),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compras-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async exportStudents(format: 'csv' | 'xlsx') {
    const response = await fetch(`${API_BASE_URL}/admin/export/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ format }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async exportCourses(format: 'csv' | 'xlsx') {
    const response = await fetch(`${API_BASE_URL}/admin/export/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ format }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cursos-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Admin - Cursos
  async createCourse(data: any) {
    return this.request<{ course: any }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any) {
    return this.request<{ course: any }>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Upload de arquivos
  async uploadVideo(file: File): Promise<{ url: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append('video', file);
    
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/video`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao fazer upload' }));
      throw new Error(error.message || 'Erro ao fazer upload de vídeo');
    }

    return response.json();
  }

  async uploadImage(file: File): Promise<{ url: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao fazer upload' }));
      throw new Error(error.message || 'Erro ao fazer upload de imagem');
    }

    return response.json();
  }

  async deleteCourse(id: string) {
    return this.request<{ message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin - Módulos
  async createModule(courseId: string, data: { title: string; duration: string; order: number }) {
    return this.request<{ module: any }>(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModule(courseId: string, moduleId: string, data: any) {
    return this.request<{ module: any }>(`/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModule(courseId: string, moduleId: string) {
    return this.request<{ message: string }>(`/courses/${courseId}/modules/${moduleId}`, {
      method: 'DELETE',
    });
  }

  async reorderModules(courseId: string, moduleIds: string[]) {
    return this.request<{ message: string }>(`/admin/courses/${courseId}/reorder-modules`, {
      method: 'PUT',
      body: JSON.stringify({ moduleIds }),
    });
  }

  // Admin - Aulas
  async createLesson(moduleId: string, data: {
    title: string;
    description?: string;
    videoUrl?: string;
    duration: string;
    order: number;
    free?: boolean;
  }) {
    return this.request<{ lesson: any }>(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(moduleId: string, lessonId: string, data: any) {
    return this.request<{ lesson: any }>(`/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLesson(moduleId: string, lessonId: string) {
    return this.request<{ message: string }>(`/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  }

  async reorderLessons(moduleId: string, lessonIds: string[]) {
    return this.request<{ message: string }>(`/admin/modules/${moduleId}/reorder-lessons`, {
      method: 'PUT',
      body: JSON.stringify({ lessonIds }),
    });
  }

  // Admin - Cupons
  async getAdminCoupons(params?: { page?: number; limit?: number; active?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());

    const query = queryParams.toString();
    return this.request<{ coupons: any[]; total: number; page: number }>(
      `/coupons${query ? `?${query}` : ''}`
    );
  }

  async getCouponById(id: string) {
    return this.request<{ coupon: any }>(`/coupons/${id}`);
  }

  async createCoupon(data: any) {
    return this.request<{ coupon: any }>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoupon(id: string, data: any) {
    return this.request<{ coupon: any }>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(id: string) {
    return this.request<{ message: string }>(`/coupons/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleCoupon(id: string) {
    return this.request<{ coupon: any }>(`/coupons/${id}/toggle`, {
      method: 'PUT',
    });
  }

  async getCouponUsage(code: string) {
    return this.request<any>(`/coupons/${code}/usage`);
  }

  // Admin - Avaliações
  async getAdminReviews(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ reviews: any[]; total: number }>(`/reviews${query ? `?${query}` : ''}`);
  }

  async approveReview(id: string) {
    return this.request<{ review: any }>(`/reviews/${id}/approve`, {
      method: 'PUT',
    });
  }

  async deleteReview(id: string) {
    return this.request<{ message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async getPendingReviews() {
    return this.request<{ reviews: any[]; total: number }>('/reviews/pending');
  }

  async getReviewStats() {
    return this.request<any>('/reviews/stats');
  }

  // Admin - Reembolsos
  async getAdminRefunds(params?: { page?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<{ refunds: any[]; total: number }>(`/refunds${query ? `?${query}` : ''}`);
  }

  async approveRefund(id: string) {
    return this.request<{ refund: any }>(`/refunds/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectRefund(id: string, reason: string) {
    return this.request<{ refund: any }>(`/refunds/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin - Notificações
  async getAdminNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/admin/notifications');
  }

  async markAdminNotificationRead(id: string) {
    return this.request<{ notification: any }>(`/admin/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllAdminNotificationsRead() {
    return this.request<{ message: string }>('/admin/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Admin - Uploads
  async uploadCourseVideo(courseId: string, lessonId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lessonId', lessonId);

    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/upload-video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload do vídeo');
    }

    return response.json();
  }

  async uploadCourseImage(courseId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    return response.json();
  }

  async uploadMaterial(courseId: string, file: File, title: string, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/upload-material`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload do material');
    }

    return response.json();
  }

  async duplicateCourse(courseId: string, title: string) {
    return this.request<{ course: any }>(`/admin/courses/${courseId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ title, includeContent: true, includeModules: true, includeLessons: true }),
    });
  }

  // ==================== PODCASTS ====================

  async getPodcasts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<{
      podcasts: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/podcasts${query ? `?${query}` : ''}`, { requiresAuth: false });
  }

  async getPodcastById(id: string) {
    return this.request<{ podcast: any }>(`/podcasts/${id}`, { requiresAuth: false });
  }

  async createPodcast(data: {
    title: string;
    description?: string;
    image?: string;
    videoUrl: string;
    duration?: string;
    tags?: string[];
    active?: boolean;
  }) {
    return this.request<{ podcast: any }>('/podcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePodcast(id: string, data: {
    title?: string;
    description?: string;
    image?: string;
    videoUrl?: string;
    duration?: string;
    tags?: string[];
    active?: boolean;
  }) {
    return this.request<{ podcast: any }>(`/podcasts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePodcast(id: string) {
    return this.request<{ message: string }>(`/podcasts/${id}`, {
      method: 'DELETE',
    });
  }

  async incrementPodcastListens(id: string) {
    return this.request<{ listens: number }>(`/podcasts/${id}/increment-listens`, {
      method: 'POST',
      requiresAuth: false,
    });
  }

  // ==================== MEUS PODCASTS ====================

  async addPodcastToMyCourses(podcastId: string) {
    return this.request<{ message: string; userPodcast: any }>(`/my-podcasts/${podcastId}`, {
      method: 'POST',
    });
  }

  async removePodcastFromMyCourses(podcastId: string) {
    return this.request<{ message: string }>(`/my-podcasts/${podcastId}`, {
      method: 'DELETE',
    });
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('document', file);
    
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/document`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao fazer upload' }));
      throw new Error(error.message || 'Erro ao fazer upload de documento');
    }

    return response.json();
  }

  async getMyPodcasts() {
    return this.request<{ podcasts: any[] }>('/my-podcasts');
  }

  async checkIfPodcastAdded(podcastId: string) {
    return this.request<{ isAdded: boolean }>(`/my-podcasts/check/${podcastId}`);
  }

  // ==================== NEWSLETTER ====================

  async subscribeNewsletter(email: string, name?: string) {
    return this.request<{
      message: string;
      subscriber: {
        id: string;
        email: string;
        name?: string;
        active: boolean;
      };
    }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
      requiresAuth: false,
    });
  }

  async unsubscribeNewsletter(email: string) {
    return this.request<{ message: string }>('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  }

  async sendNewsletterUpdate(data: {
    subject: string;
    content: string;
    ctaText?: string;
    ctaLink?: string;
  }) {
    return this.request<{
      message: string;
      stats: {
        total: number;
        sent: number;
        failed: number;
      };
      errors?: string[];
    }>('/newsletter/send-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNewsletterSubscribers(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());

    return this.request<{
      subscribers: Array<{
        id: string;
        email: string;
        name?: string;
        active: boolean;
        subscribedAt: string;
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`/newsletter/subscribers?${queryParams.toString()}`);
  }

  // ==================== SUPPORT CHAT ====================

  async getMySupportTickets() {
    return this.request<{ tickets: any[] }>('/support/tickets');
  }

  async createSupportTicket(data: { subject: string; priority?: string }) {
    return this.request<{ ticket: any }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSupportTicket(id: string) {
    return this.request<{ ticket: any }>(`/support/tickets/${id}`);
  }

  async sendSupportMessage(ticketId: string, data: { content: string }) {
    return this.request<{ message: any }>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closeSupportTicket(id: string) {
    return this.request<{ ticket: any }>(`/support/tickets/${id}/close`, {
      method: 'PUT',
    });
  }

  // Admin Support Methods
  async getAdminSupportTickets(params?: { status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    return this.request<{ tickets: any[] }>(`/support/admin/tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  }

  async assignSupportTicket(id: string) {
    return this.request<{ ticket: any }>(`/support/admin/tickets/${id}/assign`, {
      method: 'PUT',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { X, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/apiClient";
import { handleApiError } from "../../utils/errorHandler";

interface LoginProps {
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; avatar?: string; role?: "student" | "admin" }) => void;
}

export function Login({ onClose, onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.login({
        email: loginData.email,
        password: loginData.password,
      });

      const user = {
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar || response.user.picture || undefined,
        role: response.user.role || "student",
      };

      // Token já é salvo automaticamente pelo apiClient na SESSION
      // Atualizar SESSION com dados do usuário
      const session = JSON.parse(localStorage.getItem('SESSION') || '{}');
      session.user = user;
      localStorage.setItem('SESSION', JSON.stringify(session));
      
      toast.success("Login realizado com sucesso!");
      onLoginSuccess(user);
      onClose();
    } catch (error: any) {
      handleApiError(error, "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (registerData.name.trim().length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      });

      const user = {
        name: response.user.name,
        email: response.user.email,
        avatar: response.user.avatar || response.user.picture || undefined,
        role: response.user.role || "student",
      };

      // Token já é salvo automaticamente pelo apiClient na SESSION
      // Atualizar SESSION com dados do usuário
      const session = JSON.parse(localStorage.getItem('SESSION') || '{}');
      session.user = user;
      localStorage.setItem('SESSION', JSON.stringify(session));
      
      toast.success("Conta criada com sucesso!");
      onLoginSuccess(user);
      onClose();
    } catch (error: any) {
      handleApiError(error, "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-md my-8 relative bg-gray-800 border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <CardHeader>
          <CardTitle className="text-2xl text-white">Bem-vindo a WebCycle</CardTitle>
          <CardDescription className="text-gray-400">
            Faça login ou crie sua conta para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-700 border-gray-600">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">Criar Conta</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="rounded accent-blue-600" />
                    Lembrar de mim
                  </label>
                  <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
                    Esqueci a senha
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="relative my-6">
                  <Separator className="bg-gray-700" />
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-2 text-sm text-gray-400">
                    ou
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    onClick={() => {
                      // Redirecionar para login Google
                      const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
                      window.location.href = `${apiBase}/api/auth/google`;
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-white">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="João Silva"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-white">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="text-white">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-300">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="rounded mt-0.5 accent-blue-600" required />
                    <span>
                      Eu concordo com os{" "}
                      <a href="#" className="text-blue-400 hover:text-blue-300">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-blue-400 hover:text-blue-300">
                        Política de Privacidade
                      </a>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>

                <div className="relative my-6">
                  <Separator className="bg-gray-700" />
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-2 text-sm text-gray-400">
                    ou
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    onClick={() => {
                      // Redirecionar para login Google
                      const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
                      window.location.href = `${apiBase}/api/auth/google`;
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
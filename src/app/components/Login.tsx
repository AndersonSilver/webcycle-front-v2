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
import { API_BASE_URL } from "../../config/apiUrl";
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

  const fieldIcon =
    "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/70";
  const fieldInput =
    "h-11 rounded-xl border-white/10 bg-black/30 pl-10 text-sm text-white placeholder:text-gray-500 shadow-none focus-visible:border-violet-400/50 focus-visible:ring-2 focus-visible:ring-violet-500/25";
  const primaryBtn =
    "h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-none hover:bg-violet-500";
  const googleBtn =
    "h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white hover:bg-white/10 hover:text-white";
  const dividerLabel =
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#14121f] px-3 text-xs text-gray-500";

  const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="relative my-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#14121f] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-violet-600/20 to-transparent"
          aria-hidden
        />

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="relative space-y-1.5 pb-2 pt-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
            Culture Builders
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            Bem-vindo
          </CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Faça login ou crie sua conta para continuar
          </CardDescription>
        </CardHeader>

        <CardContent className="relative px-6 pb-7 pt-2">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg text-sm text-gray-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg text-sm text-gray-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className={fieldIcon} />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className={fieldInput}
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm text-gray-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className={fieldIcon} />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className={fieldInput}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input type="checkbox" className="rounded border-white/20 accent-violet-600" />
                    Lembrar de mim
                  </label>
                  <button
                    type="button"
                    className="text-sm text-violet-300 transition-colors hover:text-violet-200"
                  >
                    Esqueci a senha
                  </button>
                </div>

                <Button type="submit" className={primaryBtn} size="lg" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="relative my-5">
                  <Separator className="bg-white/10" />
                  <span className={dividerLabel}>ou</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className={googleBtn}
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/auth/google`;
                  }}
                >
                  <GoogleIcon />
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-sm text-gray-300">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className={fieldIcon} />
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="João Silva"
                      className={fieldInput}
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className={fieldIcon} />
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className={fieldInput}
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm text-gray-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className={fieldIcon} />
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className={fieldInput}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="text-sm text-gray-300">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className={fieldIcon} />
                    <Input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      className={fieldInput}
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-white/20 accent-violet-600"
                      required
                    />
                    <span>
                      Eu concordo com os{" "}
                      <a href="#" className="text-violet-300 hover:text-violet-200">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-violet-300 hover:text-violet-200">
                        Política de Privacidade
                      </a>
                    </span>
                  </label>
                </div>

                <Button type="submit" className={primaryBtn} size="lg" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>

                <div className="relative my-5">
                  <Separator className="bg-white/10" />
                  <span className={dividerLabel}>ou</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className={googleBtn}
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/auth/google`;
                  }}
                >
                  <GoogleIcon />
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
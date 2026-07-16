import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Save, Loader2, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface MyProfileProps {
  onBack: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  document?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
}

const PAGE_BG =
  "linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)";

const fieldInput =
  "h-11 rounded-xl border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 shadow-none focus-visible:border-violet-400/50 focus-visible:ring-2 focus-visible:ring-violet-500/25";

const fieldLabel = "text-sm text-white/50";

export function MyProfile({ onBack }: MyProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    document: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProfile();
      const user = response.user;
      setProfile({
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || "",
        phone: user.phone || "",
        document: user.document || "",
        addressStreet: user.addressStreet || "",
        addressNumber: user.addressNumber || "",
        addressComplement: user.addressComplement || "",
        addressNeighborhood: user.addressNeighborhood || "",
        addressCity: user.addressCity || "",
        addressState: user.addressState || "",
        addressZipCode: user.addressZipCode || "",
      });
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
      toast.error(error.message || "Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateProfile({
        name: profile.name,
        avatar: profile.avatar,
        phone: profile.phone || undefined,
        document: profile.document || undefined,
        addressStreet: profile.addressStreet || undefined,
        addressNumber: profile.addressNumber || undefined,
        addressComplement: profile.addressComplement || undefined,
        addressNeighborhood: profile.addressNeighborhood || undefined,
        addressCity: profile.addressCity || undefined,
        addressState: profile.addressState || undefined,
        addressZipCode: profile.addressZipCode || undefined,
      });
      toast.success("Perfil atualizado com sucesso!");
      await loadProfile();
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error(error.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: PAGE_BG }}>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-violet-300/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-8 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <header className="mb-12 grid gap-8 border-b border-white/[0.07] pb-10 lg:grid-cols-12 lg:items-end lg:pb-12">
          <div className="lg:col-span-8">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
              Conta
            </p>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Meu perfil
            </h1>
            <p className="max-w-xl text-base text-white/45">
              Gerencie suas informações pessoais e endereço
            </p>
          </div>
          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !profile.name}
              className="h-11 w-full rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 lg:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </header>

        <div className="space-y-8">
          <section className="border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-3 border-b border-white/[0.07] pb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">
                  Informações básicas
                </h2>
                <p className="text-sm text-white/40">Dados da sua conta</p>
              </div>
            </div>

            <div className="mb-8 flex items-center gap-5">
              <Avatar className="h-20 w-20 border border-white/10">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-violet-600/30 text-xl text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">{profile.name || "Seu nome"}</p>
                <p className="text-sm text-white/40">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className={fieldLabel}>
                  Nome completo *
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                  className={fieldInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={fieldLabel}>
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${fieldInput} opacity-60`}
                />
                <p className="text-xs text-white/30">O e-mail não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={fieldLabel}>
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className={fieldInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document" className={fieldLabel}>
                  CPF/CNPJ
                </Label>
                <Input
                  id="document"
                  value={profile.document || ""}
                  onChange={(e) => setProfile({ ...profile, document: e.target.value })}
                  placeholder="000.000.000-00"
                  className={fieldInput}
                />
              </div>
            </div>
          </section>

          <section className="border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-3 border-b border-white/[0.07] pb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">Endereço</h2>
                <p className="text-sm text-white/40">Usado em compras de produtos físicos</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressStreet" className={fieldLabel}>
                    Rua
                  </Label>
                  <Input
                    id="addressStreet"
                    value={profile.addressStreet || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressStreet: e.target.value })
                    }
                    placeholder="Nome da rua"
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressNumber" className={fieldLabel}>
                    Número
                  </Label>
                  <Input
                    id="addressNumber"
                    value={profile.addressNumber || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressNumber: e.target.value })
                    }
                    placeholder="123"
                    className={fieldInput}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressComplement" className={fieldLabel}>
                  Complemento
                </Label>
                <Input
                  id="addressComplement"
                  value={profile.addressComplement || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, addressComplement: e.target.value })
                  }
                  placeholder="Apto, bloco, etc."
                  className={fieldInput}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressNeighborhood" className={fieldLabel}>
                    Bairro
                  </Label>
                  <Input
                    id="addressNeighborhood"
                    value={profile.addressNeighborhood || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressNeighborhood: e.target.value })
                    }
                    placeholder="Nome do bairro"
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressZipCode" className={fieldLabel}>
                    CEP
                  </Label>
                  <Input
                    id="addressZipCode"
                    value={profile.addressZipCode || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressZipCode: e.target.value })
                    }
                    placeholder="00000-000"
                    className={fieldInput}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressCity" className={fieldLabel}>
                    Cidade
                  </Label>
                  <Input
                    id="addressCity"
                    value={profile.addressCity || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressCity: e.target.value })
                    }
                    placeholder="Nome da cidade"
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressState" className={fieldLabel}>
                    Estado
                  </Label>
                  <Input
                    id="addressState"
                    value={profile.addressState || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, addressState: e.target.value })
                    }
                    placeholder="UF"
                    maxLength={2}
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end border-t border-white/[0.07] pt-8">
            <Button
              onClick={handleSave}
              disabled={saving || !profile.name}
              className="h-11 rounded-lg bg-violet-600 px-8 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

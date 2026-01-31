import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Save, Loader2, User, Mail, Phone, FileText, MapPin } from "lucide-react";
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
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
          minHeight: '100vh'
        }}
      >
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)',
        minHeight: '100vh'
      }}
    >
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:text-gray-200 hover:bg-white/10"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Meu Perfil
          </h1>
          <p className="text-gray-300">
            Gerencie suas informações pessoais e endereço
          </p>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-gray-400" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-gray-600 to-gray-700 text-white border border-white/20">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-800/50 border-gray-600/40 text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="flex items-center gap-2 text-gray-300">
                    <FileText className="w-4 h-4" />
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="document"
                    value={profile.document || ""}
                    onChange={(e) => setProfile({ ...profile, document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-gray-400" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="addressStreet" className="text-gray-300">Rua</Label>
                  <Input
                    id="addressStreet"
                    value={profile.addressStreet || ""}
                    onChange={(e) => setProfile({ ...profile, addressStreet: e.target.value })}
                    placeholder="Nome da rua"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressNumber" className="text-gray-300">Número</Label>
                  <Input
                    id="addressNumber"
                    value={profile.addressNumber || ""}
                    onChange={(e) => setProfile({ ...profile, addressNumber: e.target.value })}
                    placeholder="123"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressComplement" className="text-gray-300">Complemento</Label>
                <Input
                  id="addressComplement"
                  value={profile.addressComplement || ""}
                  onChange={(e) => setProfile({ ...profile, addressComplement: e.target.value })}
                  placeholder="Apto, Bloco, etc."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressNeighborhood" className="text-gray-300">Bairro</Label>
                  <Input
                    id="addressNeighborhood"
                    value={profile.addressNeighborhood || ""}
                    onChange={(e) => setProfile({ ...profile, addressNeighborhood: e.target.value })}
                    placeholder="Nome do bairro"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressZipCode" className="text-gray-300">CEP</Label>
                  <Input
                    id="addressZipCode"
                    value={profile.addressZipCode || ""}
                    onChange={(e) => setProfile({ ...profile, addressZipCode: e.target.value })}
                    placeholder="00000-000"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressCity" className="text-gray-300">Cidade</Label>
                  <Input
                    id="addressCity"
                    value={profile.addressCity || ""}
                    onChange={(e) => setProfile({ ...profile, addressCity: e.target.value })}
                    placeholder="Nome da cidade"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressState" className="text-gray-300">Estado</Label>
                  <Input
                    id="addressState"
                    value={profile.addressState || ""}
                    onChange={(e) => setProfile({ ...profile, addressState: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !profile.name}
              className="min-w-[150px] bg-white text-black hover:bg-gray-200"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


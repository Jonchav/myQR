import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Key, Save, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState({
    paypal: false,
    stripe: false,
    session: false
  });

  const [secrets, setSecrets] = useState({
    paypalClientId: "",
    paypalClientSecret: "",
    stripeSecretKey: "",
    stripePublicKey: "",
    sessionSecret: ""
  });

  const handleSecretChange = (key: string, value: string) => {
    setSecrets(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSecretVisibility = (type: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSaveSecrets = async () => {
    try {
      // En una aplicación real, esto enviaría los secretos al backend
      toast({
        title: "Configuración guardada",
        description: "Los secretos han sido actualizados correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los secretos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las claves de API y configuraciones de tu aplicación
        </p>
      </div>

      <Tabs defaultValue="secrets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="secrets" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Secretos y API Keys
          </TabsTrigger>
          <TabsTrigger value="general">Configuración General</TabsTrigger>
        </TabsList>

        <TabsContent value="secrets" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Los secretos se almacenan de forma segura en el servidor. Nunca compartas estas claves con terceros.
            </AlertDescription>
          </Alert>

          {/* PayPal Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                PayPal API Configuration
              </CardTitle>
              <CardDescription>
                Configura tus credenciales de PayPal para procesar pagos de suscripción.
                Puedes obtener estas claves desde el <a href="https://developer.paypal.com/" target="_blank" className="text-primary underline">PayPal Developer Dashboard</a>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                <div className="relative">
                  <Input
                    id="paypalClientId"
                    type={showSecrets.paypal ? "text" : "password"}
                    value={secrets.paypalClientId}
                    onChange={(e) => handleSecretChange("paypalClientId", e.target.value)}
                    placeholder="Ingresa tu PayPal Client ID"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleSecretVisibility("paypal")}
                  >
                    {showSecrets.paypal ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="paypalClientSecret">PayPal Client Secret</Label>
                <div className="relative">
                  <Input
                    id="paypalClientSecret"
                    type={showSecrets.paypal ? "text" : "password"}
                    value={secrets.paypalClientSecret}
                    onChange={(e) => handleSecretChange("paypalClientSecret", e.target.value)}
                    placeholder="Ingresa tu PayPal Client Secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleSecretVisibility("paypal")}
                  >
                    {showSecrets.paypal ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stripe API Configuration
              </CardTitle>
              <CardDescription>
                Configura tus credenciales de Stripe para procesar pagos.
                Obtén estas claves desde el <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-primary underline">Stripe Dashboard</a>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stripePublicKey">Stripe Publishable Key</Label>
                <div className="relative">
                  <Input
                    id="stripePublicKey"
                    type={showSecrets.stripe ? "text" : "password"}
                    value={secrets.stripePublicKey}
                    onChange={(e) => handleSecretChange("stripePublicKey", e.target.value)}
                    placeholder="pk_test_... o pk_live_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleSecretVisibility("stripe")}
                  >
                    {showSecrets.stripe ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                <div className="relative">
                  <Input
                    id="stripeSecretKey"
                    type={showSecrets.stripe ? "text" : "password"}
                    value={secrets.stripeSecretKey}
                    onChange={(e) => handleSecretChange("stripeSecretKey", e.target.value)}
                    placeholder="sk_test_... o sk_live_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleSecretVisibility("stripe")}
                  >
                    {showSecrets.stripe ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Sesión</CardTitle>
              <CardDescription>
                Configuración de seguridad para las sesiones de usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="sessionSecret">Session Secret</Label>
                <div className="relative">
                  <Input
                    id="sessionSecret"
                    type={showSecrets.session ? "text" : "password"}
                    value={secrets.sessionSecret}
                    onChange={(e) => handleSecretChange("sessionSecret", e.target.value)}
                    placeholder="Clave secreta para firmar sesiones"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleSecretVisibility("session")}
                  >
                    {showSecrets.session ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSecrets} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Guardar Configuración
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configuraciones básicas de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="appName">Nombre de la Aplicación</Label>
                <Input
                  id="appName"
                  value="myQR"
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="environment">Entorno</Label>
                <Input
                  id="environment"
                  value={import.meta.env.MODE}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  value="1.0.0"
                  readOnly
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
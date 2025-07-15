import { useState, useEffect } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Zap, Calendar, Clock } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionForm = ({ plan, onSuccess }: { plan: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription?success=true',
        },
      });
      
      if (error) {
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema procesando el pago",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Procesando..." : `Suscribirse al Plan ${plan}`}
      </Button>
    </form>
  );
};

const SubscriptionPayment = ({ plan, clientSecret, onSuccess }: { 
  plan: string; 
  clientSecret: string; 
  onSuccess: () => void;
}) => {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  return (
    <Elements options={options} stripe={stripePromise}>
      <SubscriptionForm plan={plan} onSuccess={onSuccess} />
    </Elements>
  );
};

export default function Subscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Get subscription status
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    retry: false,
  });
  
  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/trial");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Prueba gratuita activada!",
        description: "Disfruta de myQR Pro por 3 días gratis",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo activar la prueba gratuita",
        variant: "destructive",
      });
    },
  });
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/subscription/create", { plan });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la suscripción",
        variant: "destructive",
      });
    },
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/cancel");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción se ha cancelado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la suscripción",
        variant: "destructive",
      });
    },
  });
  
  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    createSubscriptionMutation.mutate(plan);
  };
  
  const handlePaymentSuccess = () => {
    toast({
      title: "¡Pago exitoso!",
      description: "Tu suscripción se ha activado correctamente",
    });
    setSelectedPlan(null);
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
  };
  
  const plans = [
    {
      id: "weekly",
      name: "Semanal",
      price: "$3.99",
      period: "por semana",
      icon: Calendar,
      description: "Ideal para uso regular",
      popular: true,
      features: [
        "Acceso completo a myQR Pro",
        "Historial ilimitado",
        "Estadísticas avanzadas",
        "Exportación a Excel",
        "Customización premium",
        "Cancela cuando quieras"
      ]
    },
    {
      id: "monthly",
      name: "Mensual",
      price: "$6.99",
      period: "por mes",
      icon: Crown,
      description: "Máximo ahorro para usuarios frecuentes",
      features: [
        "Acceso completo a myQR Pro",
        "Historial ilimitado",
        "Estadísticas avanzadas",
        "Exportación a Excel",
        "Customización premium",
        "Mejor valor por dinero"
      ]
    }
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // Show payment form if a plan is selected
  if (clientSecret && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Completar Suscripción
              </CardTitle>
              <CardDescription>
                Completa tu pago para activar myQR Pro - Plan {selectedPlan}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionPayment 
                plan={selectedPlan} 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Elige tu Plan myQR Pro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Desbloquea todas las características premium de myQR
          </p>
        </div>
        
        {/* Current subscription status */}
        {subscriptionStatus?.isActive && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Suscripción Activa
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Plan: {subscriptionStatus.plan} | Estado: {subscriptionStatus.status}
                  {subscriptionStatus.subscriptionEndDate && (
                    <span className="block">
                      Expira: {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {cancelSubscriptionMutation.isPending ? "Cancelando..." : "Cancelar Suscripción"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Free trial offer */}
        {!subscriptionStatus?.trialUsed && !subscriptionStatus?.isActive && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
              <CardHeader>
                <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Prueba Gratuita de 3 Días
                </CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Prueba todas las características premium sin costo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => startTrialMutation.mutate()}
                  disabled={startTrialMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {startTrialMutation.isPending ? "Activando..." : "Iniciar Prueba Gratuita"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Subscription plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-purple-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    Más Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-12 h-12 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-purple-600">
                    {plan.price}
                    <span className="text-sm text-gray-500 font-normal">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={createSubscriptionMutation.isPending || subscriptionStatus?.isActive}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {createSubscriptionMutation.isPending && selectedPlan === plan.id
                      ? "Procesando..."
                      : subscriptionStatus?.isActive 
                        ? "Ya Tienes Suscripción" 
                        : "Seleccionar Plan"
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Features comparison */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">¿Qué Incluye myQR Pro?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Gratis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Generación básica de QR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Descarga inmediata</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Colores básicos</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-purple-600">myQR Pro</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Historial completo de QR codes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Estadísticas de escaneos en tiempo real</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Exportación a Excel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Customización avanzada</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Seguimiento de clicks</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
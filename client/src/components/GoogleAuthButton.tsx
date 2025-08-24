import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

interface GoogleAuthButtonProps {
  variant?: "login" | "logout";
  className?: string;
}

export function GoogleAuthButton({ variant = "login", className }: GoogleAuthButtonProps) {
  const handleAuth = () => {
    if (variant === "login") {
      window.location.href = "/api/auth/google";
    } else {
      window.location.href = "/api/auth/logout";
    }
  };

  return (
    <Button 
      onClick={handleAuth}
      variant={variant === "login" ? "default" : "outline"}
      className={className}
    >
      <Chrome className="w-4 h-4 mr-2" />
      {variant === "login" ? "Iniciar sesión con Google" : "Cerrar sesión"}
    </Button>
  );
}
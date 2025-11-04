import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useAuth() {
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const isAuthenticated = !!user && !error;

  // Redirigir a login si no está autenticado y está en ruta protegida
  useEffect(() => {
    const publicRoutes = ["/login", "/register"];
    const isPublicRoute = publicRoutes.includes(location);

    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      setLocation("/login");
    }

    // Si está autenticado y en login/register, redirigir al dashboard
    if (!isLoading && isAuthenticated && isPublicRoute) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

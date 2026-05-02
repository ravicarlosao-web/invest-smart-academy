import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Protects all child routes:
 *  - Redirects to "/" if not logged in
 *  - Redirects to "/cadastrar?verificar=1" if email not verified
 *
 * Also listens for the global "aluka:email_not_verified" event dispatched
 * by the API client whenever any protected request returns 403 email_not_verified.
 */
export default function AuthGuard() {
  const user          = useAuthStore((s) => s.user);
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const navigate      = useNavigate();

  useEffect(() => {
    function onEmailNotVerified() {
      navigate("/cadastrar?verificar=1", { replace: true });
    }
    window.addEventListener("aluka:email_not_verified", onEmailNotVerified);
    return () => window.removeEventListener("aluka:email_not_verified", onEmailNotVerified);
  }, [navigate]);

  if (!user) return <Navigate to="/" replace />;
  if (!emailVerified) return <Navigate to="/cadastrar?verificar=1" replace />;

  return <Outlet />;
}

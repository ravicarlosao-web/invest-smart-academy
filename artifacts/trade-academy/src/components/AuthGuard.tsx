import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Protects all child routes — redirects to "/" if not logged in.
 */
export default function AuthGuard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

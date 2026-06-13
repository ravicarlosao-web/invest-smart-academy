/**
 * @deprecated Esta página foi removida.
 * O login de administrador é feito directamente em /ta-painel-gestao.
 */
import { Navigate } from "react-router-dom";
export default function AdminLogin() {
  return <Navigate to="/ta-painel-gestao" replace />;
}

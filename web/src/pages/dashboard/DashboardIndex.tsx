import { Navigate, useLocation } from 'react-router-dom';

export function DashboardIndex() {
  const location = useLocation();
  // By default, if they just go to /dashboard, we might bounce them to login or a default role.
  // Since we rely on /dashboard/:role, returning to /login is safer if there's no role matched.
  return <Navigate to="/login" replace />;
}

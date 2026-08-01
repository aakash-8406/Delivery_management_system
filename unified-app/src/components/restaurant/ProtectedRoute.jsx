import { Navigate } from 'react-router-dom';
import { useRestaurantAuth } from '../../context/RestaurantAuthContext';

export default function RestaurantProtectedRoute({ children }) {
  const { user } = useRestaurantAuth();
  if (!user) return <Navigate to="/restaurant/login" replace />;
  return children;
}

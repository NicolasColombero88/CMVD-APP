import { Routes,Route} from 'react-router-dom';
import { AuthRoutes } from './modules/auth/routes/authRoutes'
import { UsersRoutes } from './modules/users/routes/usersRoutes'
import { CompaniesRoutes } from './modules/companies/routes/companiesRoutes'
import { waybillsRoutes } from './modules/waybills/routes/waybillsRoutes'
import { shippingZonesRoutes } from './modules/shipping-zones/routes/shippingZonesRoutes'
import { branchesRoutes } from './modules/branches/routes/branchesRoutes'
import { CalculateRoutes } from './modules/calculate/routes/calculateRoutes'
import { LandingRoutes } from './modules/landing/routes/LandingRoutes'
import { SettingsRoutes } from './modules/settings/routes/settingsRoutes'
import PrivateRoute from '@/components/PrivateRoute';
export const AppRoutes = () => { 
  return (
    <Routes>
     {AuthRoutes}
     {CalculateRoutes}
     {LandingRoutes}
     <Route element={<PrivateRoute />}>
     {SettingsRoutes}
     {UsersRoutes}
     {branchesRoutes}
     {CompaniesRoutes} 
     {waybillsRoutes}
     {shippingZonesRoutes}
     </Route>
    </Routes>
  );
};
export default function App() {
  return (
    <AppRoutes />
  );
}

import { Route } from 'react-router-dom';

import Users from '../presentation/index';
import Create from '../presentation/create';
import Edit from '../presentation/edit';
import View from '../presentation/view';
export const shippingZonesRoutes = (
  <>
    <Route path="/shipping-zones" element={<Users />} />
    <Route path="/shipping-zones/create" element={<Create />} />
    <Route path="/shipping-zones/edit/:id" element={<Edit />} />
    <Route path="/shipping-zones/view/:id" element={<View />} />
  </>
);
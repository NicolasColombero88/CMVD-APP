import { Route } from 'react-router-dom';

import Users from '../presentation/index';
import Create from '../presentation/create';
import Edit from '../presentation/edit';
import View from '../presentation/view';
export const waybillsRoutes = (
  <>
    <Route path="/waybills" element={<Users />} />
    <Route path="/waybills/create" element={<Create />} />
    <Route path="/waybills/edit/:id" element={<Edit />} />
    <Route path="/waybills/view/:id" element={<View />} />
  </>
);
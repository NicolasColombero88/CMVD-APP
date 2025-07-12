import { Route } from 'react-router-dom';
import Users from '../presentation/index';
import Create from '../presentation/create';
import Edit from '../presentation/edit';
import View from '../presentation/view';
export const branchesRoutes = (
  <>
    <Route path="/branches" element={<Users />} />
    <Route path="/branches/create" element={<Create />} />
    <Route path="/branches/edit/:id" element={<Edit />} />
    <Route path="/branches/view/:id" element={<View />} />
  </>
);
import { Route } from 'react-router-dom';

import Users from '../presentation/index';
import Create from '../presentation/create';
import Edit from '../presentation/edit';
import Account from '../presentation/account';
import Support from '../presentation/support';
import View from '../presentation/view';
export const UsersRoutes = (
  <>
    <Route path="/users" element={<Users />} />
    <Route path="/users/create" element={<Create />} />
    <Route path="/users/edit/:id" element={<Edit />} />
    <Route path="/users/account" element={<Account />} />
    <Route path="/users/support" element={<Support />} />
    <Route path="/users/view/:id" element={<View />} />
  </>
);
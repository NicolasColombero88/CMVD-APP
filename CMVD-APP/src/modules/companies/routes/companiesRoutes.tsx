import { Route } from 'react-router-dom';

import Users from '../presentation/index';
import Create from '../presentation/create';
import Edit from '../presentation/edit';
import Get from '../presentation/view';
export const CompaniesRoutes = (
  <>
    <Route path="/companies" element={<Users />} />
    <Route path="/companies/create" element={<Create />} />
    <Route path="/companies/view/:id" element={<Get />} />
    <Route path="/companies/edit/:id" element={<Edit />} />
  </>
);
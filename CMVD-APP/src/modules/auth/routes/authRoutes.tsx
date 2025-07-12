import { Route } from 'react-router-dom';

import Login from '../presentation/login';
import Register from '../presentation/register';
import Recovery from '../presentation/recovery';
export const AuthRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/recovery" element={<Recovery />} />
  </>
);
import { Route } from 'react-router-dom';

import Home from '../presentation/index';
import Register from '../presentation/register';
export const LandingRoutes = (
  <>
    <Route path="/" element={<Home />} />
  </>
);
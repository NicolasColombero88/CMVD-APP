import { Route } from 'react-router-dom';

import Calculate from '../presentation/index';
export const CalculateRoutes = (
  <>
    <Route path="/calculate" element={<Calculate />} />
  </>
);
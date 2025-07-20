import { createBrowserRouter } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import SuiFlowDashboard from './components/SuiFlowDashboard.jsx';
import SuiFlowCheckout from './components/SuiFlowCheckout.jsx';
import SuiFlowSuccess from './components/SuiFlowSuccess.jsx';
import SuiFlowLogin from './components/SuiFlowLogin.jsx';
import ReactCheckout from './ReactCheckout.jsx';
import AdminDashboard from './AdminDashboard.jsx';

// Wrapper component to handle URL parameters
const ReactCheckoutWrapper = () => {
  const { productId } = useParams();
  return <ReactCheckout productId={productId} />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <SuiFlowLogin />,
  },
  {
    path: '/dashboard',
    element: <SuiFlowDashboard />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/checkout/:productId',
    element: <SuiFlowCheckout />,
  },
  {
    path: '/pay/:productId',
    element: <SuiFlowCheckout />,
  },
  {
    path: '/success',
    element: <SuiFlowSuccess />,
  },
  {
    path: '/legacy-checkout/:productId',
    element: <ReactCheckoutWrapper />,
  },
  {
    path: '/legacy-dashboard',
    element: <AdminDashboard />,
  },
]);

export default router;

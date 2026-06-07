import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrdersProvider } from './context/OrdersContext'
import { ToastProvider } from './components/common/Toast'

import Landing from './pages/Landing'
import OrderRoleSelect from './pages/OrderRoleSelect'
import Auth from './pages/Auth'
import VerifyEmail from './pages/VerifyEmail'
import StudentDashboard from './pages/student/StudentDashboard'
import VendorAuth from './pages/vendor/VendorAuth'
import VendorDashboard from './pages/vendor/VendorDashboard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <OrdersProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/order" element={<OrderRoleSelect />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/vendor" element={<VendorAuth />} />
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </ToastProvider>
          </OrdersProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

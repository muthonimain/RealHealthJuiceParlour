import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import EmployeeSelectPage from './pages/EmployeeSelectPage'
import OwnerDashboard from './pages/dashboards/OwnerDashboard'
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard'
import MenuCategoryPage from './pages/employee/MenuCategoryPage'
import ReceiptPage from './pages/ReceiptPage'
import EmployeeRecordsPage from './pages/owner/EmployeeRecordsPage'
import FaithInventoryPage from './pages/owner/FaithInventoryPage'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'

export type UserRole = 'owner' | 'employee'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Owner login — dynamic :role param so LoginPage can read it */}
            <Route path="/login/:role" element={<LoginPage />} />

            {/* Employee: select name first, then password */}
            <Route path="/employee-select" element={<EmployeeSelectPage />} />

            {/* Owner dashboard */}
            <Route
              path="/dashboard/owner"
              element={
                <ProtectedRoute role="owner">
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee dashboards */}
            <Route
              path="/dashboard/employee"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/employee/menu/:categoryId"
              element={
                <ProtectedRoute role="employee">
                  <MenuCategoryPage />
                </ProtectedRoute>
              }
            />

            {/* Receipt page — employee views after generating */}
            <Route
              path="/receipt/:orderId"
              element={
                <ProtectedRoute role="employee">
                  <ReceiptPage />
                </ProtectedRoute>
              }
            />

            {/* Owner: employee records */}
            <Route
              path="/dashboard/owner/employee-records"
              element={
                <ProtectedRoute role="owner">
                  <EmployeeRecordsPage />
                </ProtectedRoute>
              }
            />

            {/* Owner: Faith inventory */}
            <Route
              path="/dashboard/owner/faith-inventory"
              element={
                <ProtectedRoute role="owner">
                  <FaithInventoryPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import EmployeeSelectPage from './pages/EmployeeSelectPage'
import OwnerSelectPage from './pages/OwnerSelectPage'
import OwnerDashboard from './pages/dashboards/OwnerDashboard'
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard'
import MenuCategoryPage from './pages/employee/MenuCategoryPage'
import ReceiptPage from './pages/ReceiptPage'
import EmployeeRecordsPage from './pages/owner/EmployeeRecordsPage'
import OwnerMenuCategoriesPage from './pages/owner/OwnerMenuCategoriesPage'
import OwnerMenuCategoryPage from './pages/owner/OwnerMenuCategoryPage'
import ExpensesPage from './pages/ExpensesPage'
import NetProfitPage from './pages/owner/NetProfitPage'
import SalesReportsPage from './pages/owner/SalesReportsPage'
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

            {/* Owner: select Carol or Kariuki, then password */}
            <Route path="/owner-select" element={<OwnerSelectPage />} />

            {/* Legacy login route (employee only) */}
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
            <Route
              path="/dashboard/employee/expenses"
              element={
                <ProtectedRoute role="employee">
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            {/* Receipt page — employee views after generating */}
            <Route
              path="/receipt/:orderId"
              element={
                <ProtectedRoute role={['owner', 'employee']}>
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

            {/* Owner: menu management */}
            <Route
              path="/dashboard/owner/menu"
              element={
                <ProtectedRoute role="owner">
                  <OwnerMenuCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/owner/menu/:categoryId"
              element={
                <ProtectedRoute role="owner">
                  <OwnerMenuCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/owner/expenses"
              element={
                <ProtectedRoute role="owner">
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/owner/net-profit"
              element={
                <ProtectedRoute role="owner">
                  <NetProfitPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/owner/sales-reports"
              element={
                <ProtectedRoute role="owner">
                  <SalesReportsPage />
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

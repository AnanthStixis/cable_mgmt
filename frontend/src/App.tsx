import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { AreasPage } from './pages/AreasPage'
import { CollectorsPage } from './pages/CollectorsPage'
import { CustomerFormPage } from './pages/CustomerFormPage'
import { CustomerProfilePage } from './pages/CustomerProfilePage'
import { CustomersListPage } from './pages/CustomersListPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PendingPaymentsPage } from './pages/PendingPaymentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersListPage /></ProtectedRoute>} />
          <Route path="/customers/new" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
          <Route path="/customers/:customerCode/edit" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
          <Route path="/customers/:customerCode" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/pending" element={<ProtectedRoute><PendingPaymentsPage /></ProtectedRoute>} />
          <Route path="/collectors" element={<ProtectedRoute><CollectorsPage /></ProtectedRoute>} />
          <Route path="/areas" element={<ProtectedRoute><AreasPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

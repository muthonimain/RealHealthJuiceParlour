import { useParams, Navigate } from 'react-router-dom'

/** Legacy route — redirects to the current sign-in flows. */
export default function LoginPage() {
  const { role } = useParams<{ role: string }>()

  if (role === 'owner') return <Navigate to="/owner-select" replace />
  if (role === 'employee') return <Navigate to="/dashboard/employee" replace />

  return <Navigate to="/" replace />
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Users } from 'lucide-react'
import OwnerPageShell from '../../components/OwnerPageShell'
import { authFetch, readApiJson } from '../../lib/api'
import type { EmployeeManaged } from '../../types/employee'

export default function StaffManagementPage() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState<EmployeeManaged[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')

  const loadStaff = useCallback(async () => {
    try {
      const res = await authFetch('/api/employees/manage')
      const data = await readApiJson<EmployeeManaged[] | { items?: EmployeeManaged[]; message?: string }>(
        res
      )
      if (!res.ok) {
        const msg = !Array.isArray(data) ? data.message : undefined
        throw new Error(msg || 'Failed to load staff.')
      }
      setStaff(Array.isArray(data) ? data : (data.items ?? []))
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load staff list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  const resetAddForm = () => {
    setNewName('')
    setNewUsername('')
    setNewPassword('')
  }

  const startEdit = (emp: EmployeeManaged) => {
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditUsername(emp.username)
    setEditPassword(emp.password)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newName.trim()) {
      setError('Enter the employee name.')
      return
    }
    if (!newPassword.trim()) {
      setError('Enter a password for the new employee.')
      return
    }

    setActionBusy(true)
    try {
      const res = await authFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          username: newUsername.trim() || newName.trim(),
          password: newPassword.trim(),
        }),
      })
      const data = await readApiJson<{ items?: EmployeeManaged[]; message?: string }>(res)
      if (!res.ok) throw new Error(data.message || 'Could not add employee.')
      setStaff(data.items ?? [])
      resetAddForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not add employee.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setError('')
    if (!editName.trim()) {
      setError('Name is required.')
      return
    }
    if (!editUsername.trim()) {
      setError('Username is required.')
      return
    }
    if (!editPassword.trim()) {
      setError('Password is required.')
      return
    }

    setActionBusy(true)
    try {
      const res = await authFetch(`/api/employees/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim(),
          password: editPassword.trim(),
        }),
      })
      const data = await readApiJson<{ items?: EmployeeManaged[]; message?: string }>(res)
      if (!res.ok) throw new Error(data.message || 'Could not update employee.')
      setStaff(data.items ?? [])
      setEditingId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update employee.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from staff? They will no longer appear on the sign-in screen.`)) {
      return
    }
    setError('')
    setActionBusy(true)
    try {
      const res = await authFetch(`/api/employees/${id}`, { method: 'DELETE' })
      const data = await readApiJson<{ items?: EmployeeManaged[]; message?: string }>(res)
      if (!res.ok) throw new Error(data.message || 'Could not remove employee.')
      setStaff(data.items ?? [])
      if (editingId === id) setEditingId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not remove employee.')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <OwnerPageShell
      title="Staff Management"
      subtitle="Staff sign-in names & passwords"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to therapist dashboard"
    >
      <p className="rhjp-staff-hint">
        Changes apply immediately. New or updated staff appear on the staff dashboard.
      </p>

      <form onSubmit={handleAdd} className="rhjp-staff-card rhjp-staff-card--add">
        <div className="rhjp-staff-card-head">
          <span className="rhjp-staff-card-icon" aria-hidden>
            <Plus size={20} />
          </span>
          <h2>Add staff</h2>
        </div>
        <div className="rhjp-staff-form-grid">
          <div>
            <label htmlFor="new-name">Display name</label>
            <input
              id="new-name"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                if (!newUsername || newUsername === newName) {
                  setNewUsername(e.target.value)
                }
              }}
              placeholder="e.g. Salma"
              required
            />
          </div>
          <div>
            <label htmlFor="new-username">Username (for login)</label>
            <input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Same as name if left blank"
            />
          </div>
          <div>
            <label htmlFor="new-password">Password</label>
            <input
              id="new-password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Sign-in password"
              required
            />
          </div>
        </div>
        <button type="submit" disabled={actionBusy} className="rhjp-staff-btn rhjp-staff-btn--primary">
          {actionBusy ? 'Saving…' : 'Add staff'}
        </button>
      </form>

      <div className="rhjp-staff-section-head">
        <h2 className="rhjp-staff-section-title">
          <Users size={18} aria-hidden />
          Current staff
        </h2>
        <button
          type="button"
          className="rhjp-staff-toggle-pw"
          onClick={() => setShowPasswords((v) => !v)}
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </button>
      </div>

      {error ? <p className="rhjp-staff-error">{error}</p> : null}

      {loading ? (
        <p className="rhjp-staff-loading">Loading staff…</p>
      ) : staff.length === 0 ? (
        <p className="rhjp-staff-empty">No employees yet. Add one above.</p>
      ) : (
        <div className="rhjp-staff-table-wrap">
          <table className="rhjp-staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {staff.map((emp) =>
                editingId === emp.id ? (
                  <tr key={emp.id} className="rhjp-staff-table-edit-row">
                    <td colSpan={4}>
                      <form onSubmit={handleUpdate} className="rhjp-staff-inline-edit">
                        <div className="rhjp-staff-form-grid rhjp-staff-form-grid--compact">
                          <div>
                            <label>Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label>Username</label>
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label>Password</label>
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="rhjp-staff-inline-actions">
                          <button type="submit" disabled={actionBusy} className="rhjp-staff-btn rhjp-staff-btn--primary">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={actionBusy}
                            className="rhjp-staff-btn rhjp-staff-btn--ghost"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.username}</td>
                    <td className="rhjp-staff-pw-cell">
                      {showPasswords ? emp.password : '••••••••'}
                    </td>
                    <td>
                      <div className="rhjp-staff-row-actions">
                        <button
                          type="button"
                          title="Edit"
                          disabled={actionBusy}
                          onClick={() => startEdit(emp)}
                          className="rhjp-staff-icon-btn"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Remove"
                          disabled={actionBusy}
                          onClick={() => void handleDelete(emp.id, emp.name)}
                          className="rhjp-staff-icon-btn rhjp-staff-icon-btn--danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </OwnerPageShell>
  )
}

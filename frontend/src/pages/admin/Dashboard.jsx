import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminGetSkills, adminGetProjects, adminGetCertificates, adminGetMessages } from '../../services/api'

export default function Dashboard() {
  const { data: skills } = useApi(adminGetSkills)
  const { data: projects } = useApi(adminGetProjects)
  const { data: certs } = useApi(adminGetCertificates)
  const { data: messages } = useApi(adminGetMessages)

  const unread = (messages || []).filter((m) => !m.is_read).length

  const stats = [
    { label: 'Projects', value: (projects || []).length },
    { label: 'Skills', value: (skills || []).length },
    { label: 'Certificates', value: (certs || []).length },
    { label: 'Unread Messages', value: unread },
  ]

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-accent mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-6">
            <p className="text-3xl font-bold text-accent mb-1">{s.value}</p>
            <p className="text-sm text-accent-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

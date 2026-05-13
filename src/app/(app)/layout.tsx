import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session} />
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Settings, 
  User
} from 'lucide-react'

interface User {
    email: string;
    fullName: string;
    role: string;
    token: string;
  }

  export default function Sidebar() {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const navItems = [
    {
      href: "/dashboard/leadDeveloper-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      href: "/dashboard/leadDeveloper-tasks", 
      label: "Tasks",
      icon: CheckSquare
    },
    {
      href: "/dashboard/team-overview",
      label: "Team Overview", 
      icon: Users
    },
    {
      href: "/dashboard/reports",
      label: "Reports & Insights",
      icon: BarChart3
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings
    }
  ]

  return (
    <div className="w-[250px] bg-[#032556] shadow-sm h-screen ">
      {/* Header */}
      <div className="p-4">
        <Link href="/leadDeveloper-dashboard">
          <h1 className="text-4xl font-bold text-left text-white cursor-pointer hover:text-gray-200">
            PlanIT
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-[5px] h-[350px] pt-[20px]">
        <div className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center px-4 py-3 mb-[20px] text-white hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${
                  isActive ? 'bg-black' : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-2 w-full p-4">
        <div className="flex items-center">
          <Link href="/profile">
            <User className="w-6 h-6 text-gray-600 hover:text-white cursor-pointer transition-colors" />
          </Link>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
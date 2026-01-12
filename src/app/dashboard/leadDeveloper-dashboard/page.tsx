'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Bell,
  CalendarCheck2,
  ListCheck,
  Ellipsis,
  LogOut,
  User,
  ChevronDown,
  

} from 'lucide-react'
import { useRouter } from "next/navigation";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


type TaskStatus =  "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED"
type TaskType = "BUG" | "INCIDENT" | "MAINTENANCE" | "FEATURE"

interface TaskDto {
  id: number
  title: string
  description: string
  status: TaskStatus
  taskType: TaskType
  assignedTo: number | null
  assignedToName: string | null
  createdBy: number
  deadline: string
  completedAt: string
}

interface DeveloperTaskCount {
  developerEmail: string
  developerName: string
  taskCount: number
}

interface User {
  email: string
  fullName: string
  role: string
  token: string
}


export default function LeadDeveloperPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<TaskDto[]>([])


    const [developerTaskCount, SetDeveloperTaskCount] = useState<DeveloperTaskCount[]>([])
    const [createdTaskCount, setCreatedTaskCount] = useState<number | null>(null)
    const [openModal, setOpenModal] = useState<"team" | "deadlines" | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleDropdown = () => { setIsDropdownOpen(!isDropdownOpen);  }
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const router = useRouter();
    

    useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }, []);
 

  // const handleProfileClick = () => {
  //   router.push("/leadDeveloper/profile");
  //   setIsDropdownOpen(false);
  // };
  
  useEffect(() => {
    if (!user) return

    const fetchTasks = async () => {
      try {
        const res = await fetch(`${backendUrl}/task/lead/${user.email}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!res.ok) {
          const message = await res.text()
          throw new Error(`Failed to fetch tasks: ${message}`)
        }

        const data = await res.json()
        console.log("Fetched tasks:", data)

        if (Array.isArray(data)) {
          setTasks(data)
        } else {
          console.error("API did not return an array:", data)
          setTasks([])
        }
      } catch (err) {
        console.error("Error fetching tasks:", err)
        setTasks([])
      }
    }

    fetchTasks()
  }, [user])



  useEffect(() => {
    const fetchDeveloperTaskCounts = async () => {
      if (!user) return

      try {
        const res = await fetch(`${backendUrl}/team/${user.email}/developers`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!res.ok) {
          const message = await res.text()
          throw new Error(`Failed to fetch developer task counts: ${message}`)
        }

        const data = await res.json()
        console.log("Fetched developer task counts:", data)

        if (Array.isArray(data)) {
          SetDeveloperTaskCount(data)
        } else {
          console.error("API did not return an array:", data)
          SetDeveloperTaskCount([])
        }
      } catch (err) {
        console.error("Error fetching developer task counts:", err)
        SetDeveloperTaskCount([])
      }
    }
    fetchDeveloperTaskCounts()
  }, [user])



  useEffect(() => {
    const fetchCreatedTasks = async () => {
      if (!user) return

      try {
        const res = await fetch(
          `${backendUrl}/task/lead/${user.email}/count`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        )

        if (!res.ok) {
          const message = await res.text()
          throw new Error(`Failed to fetch created tasks: ${message}`)
        }

        const data = await res.json()
        console.log("Fetched created task count:", data)
        setCreatedTaskCount(data)
      } catch (err) {
        console.error("Error fetching created task count:", err)
        setCreatedTaskCount(0)
      }
    }

    fetchCreatedTasks()
  }, [user])

  const handleLogout = async () => {
    try {
      await fetch("${backendUrl}/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("user");
      router.push("/auth/login");
    }
  };

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(0, 0, 0, 0)

  const completedThisWeek = tasks.filter(task => {
    if (task.status !== "COMPLETED") return false
    const completedDate = new Date(task.completedAt)
    completedDate.setHours(0, 0, 0, 0)
    return completedDate >= startOfWeek && completedDate <= endOfWeek
  }).length


  
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === "COMPLETED").length
  const pendingIncidents = tasks.filter(task => task.status !== "COMPLETED").length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  const upcomingTasks = tasks.filter((task) => {
    if (!task.deadline) return false
    const deadlineDate = new Date(task.deadline)
    return deadlineDate >= today && deadlineDate <= nextWeek
  })

  const teamToShow = developerTaskCount.slice(0, 3)
  const tasksToShow = upcomingTasks.slice(0, 3)

    return (
      <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-9 py-4">
          {/* Welcome Message */}
          <div className="flex items-center space-x-4">
            <div className="ml-3">
              <p className="text-sm font-bold text-[30px]">
                Welcome, {user?.fullName || "User"}
              </p>
            </div>
          </div>
      
          {/* Right Section: Bell + Profile */}
          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <button className="relative">
                 <Bell className="w-6 h-6 text-gray-600 mt-[2px]" />
            </button>
      
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-50 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-[10px] text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 overflow-y-auto">
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:bg-blue-900 text-black hover:text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Created Tasks</h3>
              <div className="w-6 h-6 bg-[#032556] rounded-full flex items-center justify-center">
                <CalendarCheck2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{createdTaskCount !== null ? createdTaskCount : "…"}</p>
          </div>
          
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:bg-blue-900 text-black hover:text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Pending Incidents</h3>
              <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center">
                <Ellipsis className="w-3 h-3 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{pendingIncidents}</p>
          </div>
          
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:bg-blue-900 text-black hover:text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Completed This Week</h3>
              <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center">
                <ListCheck className="w-3 h-3 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{completedThisWeek}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 mb-8 mt-[10px]">
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
            <h1 className="mb-[10px] font-bold pb-[10px]">Task Overview</h1>
            <div className="bg-white rounded-2xl p-[20px]">
              <h2 className="mb-[10px]">Overall Progress</h2>
              <div className="w-full bg-gray-300 rounded-full h-4">
                <div 
                  className="bg-[#032556] h-4 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-700">
                {completedTasks} of {totalTasks} tasks completed ({progress.toFixed(0)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 mb-8 mt-[10px] gap-5">
          {/* TEAM OVERVIEW CARD */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setOpenModal("team")
            }}
            className="bg-gray-100 p-6 rounded-lg shadow-sm block cursor-pointer"
          >
            <h1 className="mb-[10px] font-bold pb-[10px]">Team Overview</h1>
            <ul>
              {teamToShow.map((dev) => (
                <li
                  key={dev.developerEmail}
                  className="flex items-center justify-between bg-white shadow rounded-xl p-3 mb-4 h-[71px]"
                >
                  <span className="font-medium text-gray-800 first-letter:uppercase">
                    {dev.developerName}
                  </span>
                  <span className="bg-blue-100 text-[#032556] text-sm font-semibold px-3 py-1 rounded-full">
                    {dev.taskCount} tasks
                  </span>
                </li>
              ))}
            </ul>
          </a>

          {/* UPCOMING DEADLINES CARD */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setOpenModal("deadlines")
            }}
            className="bg-gray-100 p-6 rounded-lg shadow-sm block cursor-pointer"
          >
            <h1 className="mb-[10px] font-bold pb-[10px]">Upcoming Deadlines</h1>
            {upcomingTasks.length > 0 ? (
              <ul>
                {tasksToShow.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between bg-white shadow rounded-xl p-3 mb-4"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{task.title}</span>
                      <span className="text-gray-700 first-letter:uppercase">{task.assignedToName}</span>
                    </div>
                    <span className="text-sm text-red-800 font-semibold">
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No upcoming deadlines in the next 7 days.
              </p>
            )}
          </a>
        </div>

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 backdrop-blur-[5px] flex justify-center items-center z-50">
            <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {openModal === "team"
                    ? "All Team Members"
                    : "All Upcoming Deadlines"}
                </h2>
                <button
                  onClick={() => setOpenModal(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              {openModal === "team" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {developerTaskCount.map((dev) => (
                    <div
                      key={dev.developerEmail}
                      className="p-4 rounded-xl shadow-sm bg-gray-50"
                    >
                      <h3 className="font-semibold first-letter:uppercase">{dev.developerName}</h3>
                      <p className="text-sm text-blue-900 font-medium mt-2">
                        {dev.taskCount} tasks
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {openModal === "deadlines" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl shadow-sm bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <h3 className="font-medium">{task.title}</h3>
                        <h3 className="text-gray-700 first-letter:uppercase">{task.assignedToName}</h3>
                      </div>
                      <p className="text-sm text-red-700 font-medium mt-2">
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
 );
}





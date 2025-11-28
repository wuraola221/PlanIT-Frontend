'use client'
import { useState, useEffect } from 'react'
import { Users, X, Clock, CheckCircle, AlertCircle, Pause } from 'lucide-react'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED"
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

export default function TeamOverview() {
  const [user, setUser] = useState<User>({ email: '', fullName: '', role: '', token: '' });
  // const [tasks, setTasks] = useState<TaskDto[]>([])
  const [developerTaskCount, SetDeveloperTaskCount] = useState<DeveloperTaskCount[]>([])
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperTaskCount | null>(null)
  const [developerTasks, setDeveloperTasks] = useState<TaskDto[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user.email || !user.token) return
    const fetchDeveloperTaskCounts = async () => {
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

  const fetchDeveloperTasks = async (developer: DeveloperTaskCount) => {
    setIsLoadingTasks(true)
    try {
      const res = await fetch(`${backendUrl}/task/developer/${developer.developerEmail}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`Failed to fetch developer tasks: ${message}`)
      }

      const data = await res.json()
      console.log("Fetched developer tasks:", data)

      if (Array.isArray(data)) {
        setDeveloperTasks(data)
      } else {
        console.error("API did not return an array:", data)
        setDeveloperTasks([])
      }
    } catch (err) {
      console.error("Error fetching developer tasks:", err)
      setDeveloperTasks([])
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleDeveloperClick = async (developer: DeveloperTaskCount) => {
    setSelectedDeveloper(developer)
    setIsModalOpen(true)
    await fetchDeveloperTasks(developer)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDeveloper(null)
    setDeveloperTasks([])
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'BLOCKED':
        return <Pause className="w-4 h-4 text-red-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const DeveloperList = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {developerTaskCount.map((developer) => (
          <div
            key={developer.developerEmail}
            onClick={() => handleDeveloperClick(developer)}
            className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] border border-gray-100 hover:border-gray-200"
          >
            <div className="text-xs text-gray-800 space-y-1 mb-3">
              {developer.developerName && (
                <p className='first-letter:uppercase font-medium text-lg'>{developer.developerName}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-800`}>
                {developer.taskCount} Tasks
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const TaskModal = () => {
    if (!isModalOpen || !selectedDeveloper) return null

    return (
      <div className="fixed inset-0 backdrop-blur-sm  flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDeveloper.developerName}&apos;s Tasks
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {selectedDeveloper.developerEmail}
              </p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-96">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading tasks...</span>
              </div>
            ) : developerTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Clock className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">No tasks found</p>
                <p className="text-gray-400 text-sm">This developer has no assigned tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {developerTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {getStatusIcon(task.status)} <span
  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}
>
  {task.status ? task.status.replace('_', ' ') : "UNKNOWN"}
</span>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Total: {developerTasks.length} tasks
              </span>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <h1 className="text-2xl font-bold p-4 flex items-center mx-[30px]">
          <Users className="h-8 w-8 p-[3px] rounded shadow-sm inline-block mr-2" /> Team Overview
        </h1>
      </header>

      <main className="p-6">
        <DeveloperList />
      </main>

      <TaskModal />
    </div>
  )
}
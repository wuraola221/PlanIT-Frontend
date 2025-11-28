'use client'
import { useState, useEffect, useRef} from 'react'
import { Bell, User, LogOut, ChevronDown } from 'lucide-react'
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
type TaskType = "BUG" | "INCIDENT" | "MAINTENANCE" | "FEATURE";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

interface TaskDto {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  taskType: TaskType;
  assignedTo: number | null;
  assignedToName: string | null;
  createdBy: number;
  deadline: string;
  completedAt: string;
}

const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  TODO: { title: 'To Do', color: 'bg-gray-100' },
  IN_PROGRESS: { title: 'In Progress', color: 'bg-yellow-100' },
  BLOCKED: { title: 'Blocked', color: 'bg-red-100' },
  COMPLETED: { title: 'Completed', color: 'bg-green-100' },
};

export default function DeveloperDashboard() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // const [notificationCount, setNotificationCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User loaded from localStorage:", parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setErrorMsg("Failed to load user data");
        setIsLoading(false);
      }
    } else {
      console.log("No user found in localStorage");
      setErrorMsg("Please log in to view your tasks");
      setIsLoading(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleProfileClick = () => {
    router.push("/developer/profile");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (!user || !user.email || !user.token) {
      console.log("User not loaded yet:", user);
      return;
    }
    
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching tasks for user:", user.email);

        const res = await fetch(`${backendUrl}/task/developer/${user.email}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const message = await res.text();
          console.error("API Error Response:", message);
          throw new Error(`Failed to fetch tasks: ${message}`);
        }

        const data = await res.json();
        console.log("Fetched tasks:", data);

        if (Array.isArray(data)) {
          setTasks(data);
          setErrorMsg(null);
        } else {
          console.error("API did not return an array:", data);
          setTasks([]);
          setErrorMsg("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setErrorMsg(`Failed to load tasks: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, {
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area or in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = tasks.find(task => task.id.toString() === draggableId)?.id;

    // Find the task being moved
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    // Update local state optimistically
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus as TaskStatus } : task
    );
    
    setTasks(updatedTasks);

    // Call API to update task status
    try {
      const response = await fetch(`${backendUrl}/task/update-task-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus as TaskStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
      setTasks(originalTasks);
      setErrorMsg(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // Group tasks by their UI status
  const tasksByStatus: Record<TaskStatus, TaskDto[]> = {
    TODO: tasks.filter(task => task.status === "TODO"),
    IN_PROGRESS: tasks.filter(task => task.status === "IN_PROGRESS"),
    BLOCKED: tasks.filter(task => task.status === "BLOCKED"),
    COMPLETED: tasks.filter(task => task.status === "COMPLETED"),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-9 py-4">
          
          <div className="flex items-center space-x-4">
            <div className="ml-3">
              <p className="text-sm font-bold text-[30px]">
                Welcome, {user?.fullName || "User"}
              </p>
            </div>
          </div>
      
          {/* Right Section: Bell + Profile */}
          <div className="flex items-center space-x-6" ref={dropdownRef}>
            {/* Notification Bell */}
            <button 
            onClick={toggleDropdown}
            className="relative">
              <Bell className={`w-6 h-6 text-gray-600 mt-[2px] transition-transform ${isDropdownOpen ? 'rotate-0' :'' }`} />
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-[10px] text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  
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
      
      <main className="p-6">
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMsg}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {Object.entries(columnConfig).map(([status, { title, color }]) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 rounded-lg shadow ${color} min-h-[400px] ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <h2 className="font-bold text-lg mb-4">
                        {title} ({tasksByStatus[status as TaskStatus].length})
                      </h2>

                      {tasksByStatus[status as TaskStatus].map((task, index) => (
                        <Draggable draggableId={task.id.toString()} index={index} key={task.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow p-3 mb-3 ${snapshot.isDragging ? 'rotate-2' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{task.title}</h3>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {task.taskType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                              {task.assignedToName && (
                                <p className="text-xs text-gray-500 mt-2">Assigned to: {task.assignedToName}</p>
                              )}
                              {task.deadline && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
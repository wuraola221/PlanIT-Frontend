'use client';

import { useState, useEffect } from 'react';
import { ListCheck, Pen, X, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
type TaskType = "BUG" | "INCIDENT" | "MAINTENANCE" | "FEATURE";

interface User {
  // id: number;
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

export default function LeadDeveloperTasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskDto[]>([])
  const [user, setUser] = useState<User>({ email: '', fullName: '', role: '', token: '' });
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskDto | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskDto | null>(null);
  const [developers, setDevelopers] = useState<{ id: number; fullName: string; email: string }[]>([]);


  // FORM DATA
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: '',
    status: '',
    assignedTo: '',
    deadline: '',
  });

  // Success message auto-hide
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User loaded from localStorage:", parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setUser({ email: '', fullName: '', role: '', token: '' });
      }
    } else {
      console.log("No user found in localStorage");
      setIsLoading(false); // Stop loading if no user
    }
  }, []);

  useEffect(() => {
    if (!user || !user.email || !user.token) {
      console.log("User not loaded yet:", user);
      setIsLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching tasks for user:", user.email);

        const res = await fetch(`${backendUrl}/task/lead/${user.email}`, {
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
        } else {
          console.error("API did not return an array:", data);
          setTasks([]);
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

  useEffect(() => {
    if (!user || !user.token) return;

    const fetchDevelopers = async () => {
      try {
        const res = await fetch(`${backendUrl}/task/developers/dropdown`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error("Failed to fetch developers");

        const data = await res.json();
        setDevelopers(data);
      } catch (err) {
        console.error("Error fetching developers:", err);
        setErrorMsg("Failed to load developers");
      }
    }; 
    fetchDevelopers();

  }, [user]);

  

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (taskToEdit) {
      // EDIT EXISTING TASK
      try {
        const res = await fetch(`${backendUrl}/task/update-task/${taskToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            ...formData,
            assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
          }),
        });

        if (!res.ok) throw new Error("Failed to update task");

        const updatedTask = await res.json();
        
        // Update task in state
        setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
        setSuccessMsg("Task updated successfully ✅");
        setIsModalOpen(false);
        setTaskToEdit(null);
        
        // Reset form
        setFormData({ title: '', description: '', taskType: '', status: '', assignedTo: '', deadline: '' });
        
        // Update selected task if it's being viewed
        if (selectedTask?.id === updatedTask.id) {
          setSelectedTask(updatedTask);
        }
      } catch (err) {
        console.error("Error updating task:", err);
        setErrorMsg("Failed to update task");
      }
    } else {
      // CREATE NEW TASK
      try {
        const res = await fetch(`${backendUrl}/task/create-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            ...formData,
            assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
          }),
        });

        if (!res.ok) throw new Error("Failed to create task");

        const newTask = await res.json();
        
        // Add new task to state
        setTasks([...tasks, newTask]);
        setSuccessMsg("Task created successfully ✅");
        setFormData({ title: '', description: '', taskType: '', status: '', assignedTo: '', deadline: '' });
        setIsModalOpen(false);
      } catch (err) {
        console.error("Error creating task:", err);
        setErrorMsg("Failed to create task");
      }
    }
  };

  // ✅ FIXED: Updated closeModal to reset edit state
  const closeModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
    setFormData({ title: '', description: '', taskType: '', status: '', assignedTo: '', deadline: '' });
  };

  const openTaskDetails = (task: TaskDto) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  const handleDeleteClick = (task: TaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  };

  const handleEditClick = (task: TaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setFormData({
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      status: task.status,
      assignedTo: task.assignedTo ? task.assignedTo.toString() : '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
    });
    setIsModalOpen(true);
    setIsTaskModalOpen(false);
  };

  const handleComments = (task: TaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCommentsOpen(true);
    setIsTaskModalOpen(false);
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`${backendUrl}/task/delete-task/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete task");

      setTasks(tasks.filter(task => task.id !== taskToDelete.id));
      setSuccessMsg("Task deleted successfully ✅");
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);

      if (selectedTask?.id === taskToDelete.id) {
        closeTaskDetails();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setErrorMsg("Failed to delete task");
    }
  };

  // COMPONENTS
  const LoadingState = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#032556] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tasks...</p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <ClipboardList className="w-16 h-16 text-gray-400" />
      </div>
      <h2 className="text-[16px] font-bold text-gray-900 mb-2">Welcome to Task Management!</h2>
      <p className="text-gray-600 text-[14px] mb-8 max-w-md">
        You don&apos;t have any tasks yet. As a lead developer, you can create and assign tasks to your team members to get started.
      </p>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex cursor-pointer hover:bg-[#032556] hover:text-white p-[10px] shadow-sm rounded-lg transition-colors"
      >
        Create Task
        <div className="w-6 h-6 bg-[#032556] ml-[5px] rounded-full flex items-center justify-center">
          <Pen className="w-3 h-3 text-white" />
        </div>
      </button>
    </div>
  );

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "BLOCKED":
        return "bg-red-100 text-red-700 border-red-300";
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "To Do";
      case "IN_PROGRESS":
        return "In Progress";
      case "BLOCKED":
        return "Blocked";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  const TaskList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => openTaskDetails(task)}
          className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] border border-gray-100 hover:border-gray-200"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-900 truncate pr-2 first-letter:uppercase">{task.title}</h3>
            <button
              onClick={(e) => handleDeleteClick(task, e)}
              className="text-gray-800 hover:text-gray-300 hover:bg-gray-50 p-1 rounded-full transition-colors flex-shrink-0 border border-gray-50 bg-gray-100"
              title="Delete task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-800 space-y-1 mb-3">
            {task.assignedToName && (
              <p className='first-letter:uppercase'>{task.assignedToName}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className={`inline-block px-2 py-1 text-xs rounded uppercase font-medium ${getStatusStyle(task.status)}`}>
              {getStatusText(task.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const TaskDetailsModal = () => {
    if (!selectedTask) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm  flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={closeTaskDetails} 
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 first-letter:uppercase">{selectedTask.title}</h3>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 text-sm rounded-full uppercase font-medium ${getStatusStyle(selectedTask.status)}`}>
                  {getStatusText(selectedTask.status)}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {selectedTask.taskType}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed first-letter:uppercase">
                {selectedTask.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Assignment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-20 text-gray-500">Assigned to:</span>
                    <span className="font-medium uppercase">
                      {selectedTask.assignedToName || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2 text-sm">
                  {selectedTask.deadline && (
                    <div className="flex items-center">
                      <span className="w-16 text-gray-500">Deadline:</span>
                      <span className="font-medium">
                        {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div className="flex items-center">
                      <span className="w-19 text-gray-500">Completed:</span>
                      <span className="font-medium">
                        {new Date(selectedTask.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="-mx-4 mb-2 p-4">
              <div className=" text-l">
                <label > Leave a comment for {selectedTask.assignedToName }
                  <textarea 
                  name="comment"
                  // value={formData.description}
                  // onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                  >
                  </textarea>
                </label>
                <div className='flex justify-end mt-2'>
                  <button className='px-4 py-2 rounded-lg border border-blue-300 text-[#032556] hover:bg-blue-50 transition-colors'> Submit</button>
                </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-3  bg-gray-50">
          <button
              onClick={() => handleComments(selectedTask, { stopPropagation: () => {} } as React.MouseEvent)}
              className="px-4 py-2 rounded-lg border border-blue-300 text-[#032556] hover:bg-blue-50 transition-colors"
            >
              View Comments
            </button>
            <button
              onClick={() => handleEditClick(selectedTask, { stopPropagation: () => {} } as React.MouseEvent)}
              className="px-4 py-2 rounded-lg border border-blue-300 text-[#032556] hover:bg-blue-50 transition-colors"
            >
              Edit Task
            </button>
            <button
              onClick={() => handleDeleteClick(selectedTask, { stopPropagation: () => {} } as React.MouseEvent)}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
            >
              Delete Task
            </button>
            <button
              onClick={closeTaskDetails}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CommentsModal = () => {
    if (!selectedTask) return null;
      return (
        <div className='fixed inset-0 backdrop-blur-sm  flex items-center justify-center z-50'> 
           <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-2xl font-bold text-gray-900">Comments for {selectedTask.title}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCommentsOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700">Comments functionality is under development.</p>
            </div>
          </div>
        </div>
      );
  };

  const DeleteConfirmationModal = () => {
    if (!taskToDelete) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete &quot;{taskToDelete.title}&quot;?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteTask}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between mx-[30px]">
          <div>
            <h1 className="text-2xl font-bold p-4 flex items-center">
              <ListCheck className="h-8 w-8 p-[3px] rounded shadow-sm inline-block mr-2" /> Tasks 
            </h1>
          </div>
          <div>             
            <button               
              onClick={() => setIsModalOpen(true)}
              className="bg-[#032556] text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors duration-200 flex items-center gap-2 shadow-sm"
            >
              <Pen className="w-4 h-4" />
              Create Task
            </button>           
          </div>          
        </div>
      </header>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 
                       p-3 rounded-lg bg-green-100 text-green-700 border border-green-300 
                       shadow-lg w-fit z-50"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 
                       p-3 rounded-lg bg-red-100 text-red-700 border border-red-300 
                       shadow-lg w-fit z-50"
          >
            {errorMsg}
            <button 
              onClick={() => setErrorMsg('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-6">
        {isLoading ? (
          <LoadingState />
        ) : tasks.length > 0 ? (
          <TaskList />
        ) : (
          <EmptyState />
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {taskToEdit ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Task Type</label>
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                >
                  <option value="">Select Type</option>
                  <option value="BUG">Bug</option>
                  <option value="INCIDENT">Incident</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="FEATURE">Feature</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                >
                  <option value="">Select Status</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Assigned To</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                >
                    <option value="">Select Developer</option>
                    {developers.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.fullName} 
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-red-800 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#032556] text-white hover:bg-blue-900">
                  {taskToEdit ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isTaskModalOpen && <TaskDetailsModal />}
      {isCommentsOpen && <CommentsModal />}
      {isDeleteConfirmOpen && <DeleteConfirmationModal />}
    </div>
  );


}
'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
// type TaskType = "BUG" | "INCIDENT" | "MAINTENANCE" | "FEATURE";

// interface User {
//   email: string;
//   fullName: string;
//   role: string;
//   token: string;
// }

// interface TaskDto {
//   id: number;
//   title: string;
//   description: string;
//   status: TaskStatus;
//   taskType: TaskType;
//   assignedTo: number | null;
//   assignedToName: string | null;
//   createdBy: number;
//   deadline: string;
//   completedAt: string;
// }

type Task = {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'done';
};

const initialTasks: Task[] = [
  { id: '1', title: 'Setup project', status: 'not_started' },
  { id: '2', title: 'Implement login', status: 'in_progress' },
  { id: '3', title: 'Deploy app', status: 'done' },
];

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const columns = {
    not_started: { title: 'Not Started', color: 'bg-gray-100' },
    in_progress: { title: 'In Progress', color: 'bg-yellow-100' },
    done: { title: 'Done', color: 'bg-green-100' },
  };

  const handleDragEnd = async (result: { destination: { droppableId: string; index: number } | null; source: { droppableId: string; index: number }; draggableId: string }) => {
    const { destination, source, draggableId } = result;

    if (!destination) return; // dropped outside

    const newStatus = destination.droppableId as Task['status'];
    if (source.droppableId === newStatus) return;

    // Update local state
    setTasks((prev) =>
      prev.map((task) =>
        task.id === draggableId ? { ...task, status: newStatus } : task
      )
    );

    // Call API to update task status
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 p-6">
        {Object.entries(columns).map(([status, { title, color }]) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-4 rounded-lg shadow ${color} min-h-[400px]`}
              >
                <h2 className="font-bold text-lg mb-4">{title}</h2>
                {tasks
                  .filter((task) => task.status === status)
                  .map((task, index) => (
                    <Draggable
                      draggableId={task.id}
                      index={index}
                      key={task.id}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white rounded-lg shadow p-3 mb-3"
                        >
                          {task.title}
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
  );
}

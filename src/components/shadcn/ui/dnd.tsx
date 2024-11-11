import {
  DragDropContext as RBDDragDropContext,
  Droppable as RBDDroppable,
  Draggable as RBDDraggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd';

// Export types
export type {
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
};

// DragDropContext wrapper
export const DragDropContext = RBDDragDropContext;

// Droppable wrapper
export const Droppable = RBDDroppable;

// Draggable wrapper
export const Draggable = RBDDraggable;

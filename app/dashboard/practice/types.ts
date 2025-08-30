// app/dashboard/practice/types.ts
import { ReactNode } from "react";


export interface WorkspacePanel {
  id: string;
  title: string;
  component: ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  isMinimized: boolean;
  zIndex: number;
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  dragStart: { x: number; y: number };
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  resizeHandle: string | null;
}

export type PanelComponentMap = {
  [key: string]: ReactNode;
};

export type PanelConfig = Omit<WorkspacePanel, 'component' | 'title'>;
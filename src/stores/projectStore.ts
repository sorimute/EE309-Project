import { create } from 'zustand';

interface ProjectState {
  projectRoot: string | null;
  setProjectRoot: (root: string | null) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectRoot: null,
  setProjectRoot: (root) => set({ projectRoot: root }),
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
}));


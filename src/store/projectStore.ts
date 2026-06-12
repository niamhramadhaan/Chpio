import { create } from 'zustand';
import type { Project } from '../types';

const STORAGE_KEY = 'chpio-projects';

let projectsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  if (projectsSaveTimer) clearTimeout(projectsSaveTimer);
  projectsSaveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, 300);
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  createProject: (name: string) => string;
  setActiveProject: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'skills' | 'specialInstructions'>>) => void;
  deleteProject: (id: string) => void;
  getActiveProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: loadProjects(),
  activeProjectId: null,

  createProject: (name) => {
    const id = crypto.randomUUID();
    const project: Project = {
      id,
      name,
      description: '',
      skills: '',
      specialInstructions: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const projects = [project, ...get().projects];
    saveProjects(projects);
    set({ projects, activeProjectId: id });
    return id;
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  updateProject: (id, updates) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    );
    saveProjects(projects);
    set({ projects });
  },

  deleteProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    saveProjects(projects);
    const activeProjectId = get().activeProjectId === id ? null : get().activeProjectId;
    set({ projects, activeProjectId });
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId);
  },
}));

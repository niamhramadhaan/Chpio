import type { Project } from '../types';

export function buildProjectSystemMessage(project: Project): string | null {
  if (!project.skills && !project.specialInstructions && !project.description) return null;

  const parts: string[] = [`# Active Project: ${project.name}`];

  if (project.description) {
    parts.push(`\nDescription: ${project.description}`);
  }

  if (project.skills) {
    parts.push(`\n## Skills & Capabilities\n${project.skills}`);
  }

  if (project.specialInstructions) {
    parts.push(`\n## Special Instructions\n${project.specialInstructions}`);
  }

  return parts.join('\n');
}

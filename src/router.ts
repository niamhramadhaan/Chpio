import type { Feature, AppView } from './types';

export const featureToPath: Record<Feature, string> = {
  home: '/home',
  chat: '/chat',
  notes: '/notes',
  docs: '/docs',
  research: '/research',
  email: '/email',
  calendar: '/calendar',
  memory: '/memory',
  imagegen: '/imagegen',
  settings: '/settings',
};

const pathToFeature: [string, Feature][] = [
  ['/chat', 'chat'],
  ['/notes', 'notes'],
  ['/docs', 'docs'],
  ['/research', 'research'],
  ['/email', 'email'],
  ['/calendar', 'calendar'],
  ['/memory', 'memory'],
  ['/imagegen', 'imagegen'],
  ['/settings', 'settings'],
  ['/home', 'home'],
];

export function buildPath(
  feature: Feature,
  params?: { sessionId?: string; noteId?: string; docId?: string; folderId?: string },
): string {
  const base = featureToPath[feature];
  if (feature === 'chat' && params?.sessionId) return `${base}/${params.sessionId}`;
  if (feature === 'notes' && params?.folderId) return `${base}/folder/${params.folderId}`;
  if (feature === 'notes' && params?.noteId) return `${base}/${params.noteId}`;
  if (feature === 'docs' && params?.docId) return `${base}/${params.docId}`;
  return base;
}

export function parseHash(hash: string): {
  view: AppView;
  feature: Feature;
  sessionId?: string;
  noteId?: string;
  docId?: string;
  folderId?: string;
} {
  const path = hash.replace(/^#/, '') || '/';

  if (path === '/') {
    return { view: 'onboarding', feature: 'home' };
  }

  const chatMatch = path.match(/^\/chat\/(.+)$/);
  if (chatMatch) return { view: 'workspace', feature: 'chat', sessionId: chatMatch[1] };

  const notesFolderMatch = path.match(/^\/notes\/folder\/(.+)$/);
  if (notesFolderMatch) return { view: 'workspace', feature: 'notes', folderId: notesFolderMatch[1] };

  const noteMatch = path.match(/^\/notes\/([^/]+)$/);
  if (noteMatch) return { view: 'workspace', feature: 'notes', noteId: noteMatch[1] };

  const docMatch = path.match(/^\/docs\/([^/]+)$/);
  if (docMatch) return { view: 'workspace', feature: 'docs', docId: docMatch[1] };

  for (const [prefix, feature] of pathToFeature) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return { view: 'workspace', feature };
    }
  }

  return { view: 'onboarding', feature: 'home' };
}

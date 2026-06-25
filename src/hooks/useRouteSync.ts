import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { useNotesStore } from '../store/notesStore';
import { useDocsStore } from '../store/docsStore';
import { parseHash, buildPath } from '../router';

export function useRouteSync() {
  const [location, navigate] = useLocation();
  const skipNextSync = useRef(false);
  const prevLocation = useRef<string | null>(null);

  const view = useAppStore((s) => s.view);
  const activeFeature = useAppStore((s) => s.activeFeature);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const setActiveSession = useChatStore((s) => s.setActiveSession);

  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const activeFolderId = useNotesStore((s) => s.activeFolderId);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const setActiveFolder = useNotesStore((s) => s.setActiveFolder);

  const activeDocId = useDocsStore((s) => s.activeDocId);
  const setActiveDoc = useDocsStore((s) => s.setActiveDoc);

  // URL → Zustand: only when URL actually changes (mount, back/forward, direct link)
  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    const parsed = parseHash(location);

    setView(parsed.view);
    setActiveFeature(parsed.feature);

    if (parsed.sessionId) setActiveSession(parsed.sessionId);
    if (parsed.noteId) setActiveNote(parsed.noteId);
    if (parsed.folderId) setActiveFolder(parsed.folderId);
    if (parsed.docId) setActiveDoc(parsed.docId);

    skipNextSync.current = true;
  }, [location]);

  // Zustand → URL: when in-app navigation changes state
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    let path: string;
    if (view === 'onboarding') {
      path = '/';
    } else {
      path = buildPath(activeFeature, {
        sessionId: activeSessionId || undefined,
        noteId: activeNoteId || undefined,
        docId: activeDocId || undefined,
        folderId: activeFolderId || undefined,
      });
    }

    const currentPath = location;
    if (currentPath !== path) {
      navigate(path, { replace: true });
    }
  }, [view, activeFeature, activeSessionId, activeNoteId, activeFolderId, activeDocId]);
}

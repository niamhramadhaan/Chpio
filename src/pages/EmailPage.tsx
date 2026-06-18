import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, RefreshCw, Loader2, Settings } from 'lucide-react';
import { useEmailStore } from '../store/emailStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { fetchFolders, fetchMessages, updateMessageFlags, deleteMessage, updateMessageTriage, connectSSE } from '../services/emailApi';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import { triageEmail } from '../utils/emailTriage';
import { FolderList } from '../components/email/FolderList';
import { EmailList } from '../components/email/EmailList';
import { EmailDetail } from '../components/email/EmailDetail';
import { ComposeModal } from '../components/email/ComposeModal';
import type { EmailMessage } from '../types';

export default function EmailPage() {
  const {
    accounts, selectedAccountId, selectedFolder, folders, messages, selectedMessage,
    isLoading, error,
    setSelectedAccount, setSelectedFolder, setFolders, setMessages, setSelectedMessage,
    updateMessage, setIsLoading, setError,
  } = useEmailStore();
  const providers = useSettingsStore((s) => s.providers);
  const models = useMemo(() => getActiveModels(providers), [providers]);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [composeMode, setComposeMode] = useState<'compose' | 'reply' | 'forward' | null>(null);
  const [threadFilter, setThreadFilter] = useState<string | null>(null);

  const getStreamFn = useCallback(() => {
    const mId = selectedModelId || defaultModelId;
    const m = models.find((x) => x.id === mId);
    const pId = m?.providerId;
    const p = providers.find((x) => x.id === pId);
    const baseUrl = p?.baseUrl || 'https://openrouter.ai/api/v1';
    const apiKey = p?.apiKey || undefined;
    return (msgs: { role: 'system' | 'user' | 'assistant'; content: string }[]) => {
      return streamChat(baseUrl, apiKey, stripProviderPrefix(mId), msgs, pId);
    };
  }, [selectedModelId, defaultModelId, models, providers]);

  const runTriage = useCallback(async (msgs: EmailMessage[], accountId: string, folder: string) => {
    const untriaged = msgs.filter((m) => !m.triage).slice(0, 10);
    if (untriaged.length === 0) return;

    const streamFn = getStreamFn();

    for (const msg of untriaged) {
      try {
        const result = await triageEmail(msg, streamFn);
        if (result) {
          updateMessage(msg.uid, { triage: result.triage, tags: result.tags });
          await updateMessageTriage(accountId, folder, msg.uid, result.triage, result.tags);
        }
      } catch (err) {
        console.error('[email] Triage failed for', msg.uid, err);
      }
    }
  }, [getStreamFn, updateMessage]);

  const loadFolders = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const f = await fetchFolders(selectedAccountId);
      setFolders(f);
    } catch (err) {
      console.error('[email] Failed to load folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    }
  }, [selectedAccountId, setFolders, setError]);

  const loadMessages = useCallback(async () => {
    if (!selectedAccountId || !selectedFolder) return;
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await fetchMessages(selectedAccountId, selectedFolder);
      setMessages(msgs);
      // Run AI triage in background for untriaged messages
      runTriage(msgs, selectedAccountId, selectedFolder);
    } catch (err) {
      console.error('[email] Failed to load messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, selectedFolder, setMessages, setIsLoading, setError, runTriage]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // SSE connection for real-time new mail notifications
  useEffect(() => {
    if (!selectedAccountId) return;
    const disconnect = connectSSE(selectedAccountId, (event) => {
      if (event.type === 'newMail') {
        loadMessages();
        // Desktop notification
        if (Notification.permission === 'granted') {
          new Notification('New Email', { body: `${event.count || 1} new message(s) in ${event.folder || 'INBOX'}` });
        }
      }
    });
    return disconnect;
  }, [selectedAccountId, loadMessages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSelectMessage = useCallback(async (msg: EmailMessage) => {
    if (!selectedAccountId) return;
    setSelectedMessage(msg);
    setView('detail');

    if (!msg.isRead) {
      updateMessage(msg.uid, { isRead: true });
      try {
        await updateMessageFlags(selectedAccountId, msg.folder, msg.uid, { isRead: true });
      } catch { /* ignore */ }
    }
  }, [selectedAccountId, setSelectedMessage, updateMessage]);

  const handleToggleStar = useCallback(async (uid: number, current: boolean) => {
    if (!selectedAccountId) return;
    updateMessage(uid, { isStarred: !current });
    try {
      await updateMessageFlags(selectedAccountId, selectedFolder, uid, { isStarred: !current });
    } catch { /* revert */ updateMessage(uid, { isStarred: current }); }
  }, [selectedAccountId, selectedFolder, updateMessage]);

  const handleDelete = useCallback(async (uid: number) => {
    if (!selectedAccountId) return;
    try {
      await deleteMessage(selectedAccountId, selectedFolder, uid);
      setMessages(messages.filter((m) => m.uid !== uid));
      if (selectedMessage?.uid === uid) {
        setSelectedMessage(null);
        setView('list');
      }
    } catch (err) {
      console.error('[email] Failed to delete:', err);
    }
  }, [selectedAccountId, selectedFolder, messages, selectedMessage, setMessages, setSelectedMessage]);

  const handleRefresh = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // No accounts configured
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-5 h-5 text-white/15" />
          </div>
          <p className="text-white/40 text-[12px] font-medium mb-1">No email accounts</p>
          <p className="text-white/20 text-[10px] mb-4">Configure your IMAP/SMTP credentials in Settings</p>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/10 text-teal-400/80 text-[10px] hover:bg-teal-400/20 hover:text-teal-400 transition-colors cursor-pointer mx-auto"
          >
            <Settings className="w-3 h-3" />
            Open Settings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white/30" />
            <p className="text-[11px] text-white/50 font-medium">Email</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {accounts.length > 1 && (
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white/60 outline-none"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name || a.email}</option>
            ))}
          </select>
        )}
      </div>

      <div className="h-px bg-white/5 mx-4 shrink-0" />

      {/* Content: 3-panel */}
      <div className="flex-1 flex min-h-0">
        {/* Folder sidebar */}
        <div className="w-[30%] min-w-[100px] border-r border-white/[0.06] overflow-y-auto px-2 pt-2 pb-2 shrink-0">
          <FolderList
            folders={folders}
            selected={selectedFolder}
            onSelect={setSelectedFolder}
          />
        </div>

        {/* Email list */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <p className="text-[10px] text-red-400/60 text-center mb-2">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-[9px] text-teal-400/50 hover:text-teal-400/80 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {view === 'detail' && selectedMessage ? (
                <EmailDetail
                  key="detail"
                  message={selectedMessage}
                  onBack={() => { setView('list'); setSelectedMessage(null); }}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                  onReply={() => setComposeMode('reply')}
                  onForward={() => setComposeMode('forward')}
                />
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <EmailList
                    messages={messages}
                    selectedUid={selectedMessage?.uid ?? null}
                    onSelect={handleSelectMessage}
                    onToggleStar={handleToggleStar}
                    threadFilter={threadFilter}
                    onThreadFilter={setThreadFilter}
                    onClearFilter={() => setThreadFilter(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <ComposeModal
        isOpen={composeMode !== null}
        onClose={() => setComposeMode(null)}
        mode={composeMode || 'compose'}
        replyTo={composeMode !== 'compose' ? selectedMessage || undefined : undefined}
      />
    </div>
  );
}

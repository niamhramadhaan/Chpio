import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, Loader2, Reply, Forward, PenSquare } from 'lucide-react';
import { sendEmail as sendEmailApi } from '../../services/emailApi';
import { streamChat } from '../../services/providers';
import { getActiveModels, stripProviderPrefix } from '../../utils/models';
import { useSettingsStore } from '../../store/settingsStore';
import { useEmailStore } from '../../store/emailStore';
import type { EmailMessage } from '../../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'compose' | 'reply' | 'forward';
  replyTo?: EmailMessage;
}

export function ComposeModal({ isOpen, onClose, mode, replyTo }: ComposeModalProps) {
  const providers = useSettingsStore((s) => s.providers);
  const models = (() => {
    const p = useSettingsStore.getState().providers;
    return getActiveModels(p);
  })();
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const selectedAccountId = useEmailStore((s) => s.selectedAccountId);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'reply' && replyTo) {
      setTo(replyTo.from.address);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setBody('');
    } else if (mode === 'forward' && replyTo) {
      setTo('');
      setSubject(replyTo.subject.startsWith('Fwd:') ? replyTo.subject : `Fwd: ${replyTo.subject}`);
      setBody(`\n\n---------- Forwarded message ----------\nFrom: ${replyTo.from.name} <${replyTo.from.address}>\nSubject: ${replyTo.subject}\n\n${replyTo.textBody || replyTo.snippet}`);
    } else {
      setTo('');
      setSubject('');
      setBody('');
    }
    setError(null);
  }, [isOpen, mode, replyTo]);

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

  const handleAiDraft = useCallback(async () => {
    if (!replyTo || drafting) return;
    setDrafting(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const streamFn = getStreamFn();
      const senderName = replyTo.from.name || replyTo.from.address;
      const threadContext = replyTo.textBody || replyTo.snippet;

      const messages = [
        {
          role: 'system' as const,
          content: `You are an email reply drafter. Write a concise, professional reply to the email thread below. Match the tone of the conversation. Be helpful and specific. Output ONLY the reply body — no subject line, no "Dear" greeting unless the original used one, no signature.`,
        },
        {
          role: 'user' as const,
          content: `Original email from: ${senderName} <${replyTo.from.address}>
Subject: ${replyTo.subject}

${threadContext}

Draft a reply:`,
        },
      ];

      let draft = '';
      const stream = streamFn(messages);
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        if (chunk.type === 'content') {
          draft += chunk.text;
          setBody(draft);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Draft generation failed');
      }
    } finally {
      setDrafting(false);
      abortRef.current = null;
    }
  }, [replyTo, drafting, getStreamFn]);

  const handleSend = useCallback(async () => {
    if (!selectedAccountId || !to.trim() || !subject.trim() || sending) return;
    setSending(true);
    setError(null);

    try {
      const toAddresses = to.split(',').map((addr) => addr.trim()).filter(Boolean);
      await sendEmailApi(selectedAccountId, toAddresses, subject, body);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [selectedAccountId, to, subject, body, sending, onClose]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {mode === 'reply' && <Reply className="w-4 h-4 text-teal-400/60" />}
                {mode === 'forward' && <Forward className="w-4 h-4 text-teal-400/60" />}
                {mode === 'compose' && <PenSquare className="w-4 h-4 text-teal-400/60" />}
                <p className="text-[12px] text-white/60 font-medium">
                  {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Email'}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="px-4 py-3 space-y-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-white/30 w-12 shrink-0">To</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 bg-transparent text-[11px] text-white/70 outline-none placeholder-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-white/30 w-12 shrink-0">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1 bg-transparent text-[11px] text-white/70 outline-none placeholder-white/20"
                />
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              {mode === 'reply' && replyTo && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={handleAiDraft}
                    disabled={drafting}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-400/10 text-teal-400/70 text-[9px] hover:bg-teal-400/20 hover:text-teal-400 transition-colors cursor-pointer disabled:opacity-30"
                  >
                    {drafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {drafting ? 'Drafting...' : 'AI Draft'}
                  </button>
                  {drafting && (
                    <button
                      onClick={() => abortRef.current?.abort()}
                      className="text-[9px] text-white/20 hover:text-white/40 cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={mode === 'reply' ? 'Write your reply...' : 'Write your email...'}
                rows={10}
                className="w-full bg-transparent text-[11px] text-white/60 leading-relaxed outline-none placeholder-white/15 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <div>
                {error && <p className="text-[9px] text-red-400/60">{error}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-lg text-white/30 text-[10px] hover:text-white/50 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!to.trim() || !subject.trim() || sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/15 text-teal-400 text-[10px] hover:bg-teal-400/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEmailStore } from '../store/emailStore';
import type { EmailAccount, EmailFolder, EmailMessage } from '../types';

function getBaseUrl(): string {
  return useEmailStore.getState().serverUrl;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAccounts(): Promise<EmailAccount[]> {
  return apiFetch('/api/accounts');
}

export async function addAccount(config: Omit<EmailAccount, 'id' | 'createdAt'>): Promise<{ id: string }> {
  return apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(config) });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' });
}

export async function testImapConnection(config: { imapHost: string; imapPort: number; imapSecure: boolean; username: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  return apiFetch('/api/accounts/test', { method: 'POST', body: JSON.stringify(config) });
}

export async function fetchFolders(accountId: string): Promise<EmailFolder[]> {
  return apiFetch(`/api/accounts/${accountId}/folders`);
}

export async function fetchMessages(accountId: string, folder: string, limit = 50): Promise<EmailMessage[]> {
  return apiFetch(`/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages?limit=${limit}`);
}

export async function fetchMessageDetail(accountId: string, folder: string, uid: number): Promise<EmailMessage> {
  return apiFetch(`/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages/${uid}`);
}

export async function updateMessageFlags(accountId: string, folder: string, uid: number, flags: { isRead?: boolean; isStarred?: boolean }): Promise<void> {
  await apiFetch(`/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(flags),
  });
}

export async function deleteMessage(accountId: string, folder: string, uid: number): Promise<void> {
  await apiFetch(`/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages/${uid}`, {
    method: 'DELETE',
  });
}

export async function updateMessageTriage(accountId: string, folder: string, uid: number, triage: string, tags: string[]): Promise<void> {
  await apiFetch(`/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages/${uid}/triage`, {
    method: 'PATCH',
    body: JSON.stringify({ triage, tags }),
  });
}

export async function sendEmail(
  accountId: string,
  to: string[],
  subject: string,
  textBody: string,
  htmlBody?: string,
  inReplyTo?: string,
  references?: string,
): Promise<void> {
  await apiFetch(`/api/accounts/${accountId}/send`, {
    method: 'POST',
    body: JSON.stringify({ to, subject, textBody, htmlBody, inReplyTo, references }),
  });
}

export function connectSSE(accountId: string, onEvent: (data: any) => void): () => void {
  const baseUrl = getBaseUrl();
  let currentEs: EventSource | null = new EventSource(`${baseUrl}/api/accounts/${accountId}/events`);
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (currentEs) {
      currentEs.close();
      currentEs = null;
    }
  };

  const connect = (es: EventSource) => {
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      es.close();
      reconnectTimer = setTimeout(() => {
        const newEs = new EventSource(`${baseUrl}/api/accounts/${accountId}/events`);
        currentEs = newEs;
        connect(newEs);
      }, 5000);
    };
  };

  connect(currentEs);
  return cleanup;
}

export async function downloadAttachment(accountId: string, folder: string, uid: number, partId: string): Promise<Blob> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages/${uid}/attachments/${partId}`);
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

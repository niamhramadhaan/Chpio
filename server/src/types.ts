export interface EmailAccountConfig {
  id: string;
  name: string;
  email: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  username: string;
  password: string;
}

export interface EmailFolder {
  name: string;
  path: string;
  delimiter: string;
  unreadCount: number;
  totalCount: number;
  specialUse?: string;
}

export interface EmailMessage {
  uid: number;
  messageId: string;
  folder: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  cc?: { name: string; address: string }[];
  subject: string;
  snippet: string;
  htmlBody?: string;
  textBody?: string;
  date: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface CachedMessage {
  account_id: string;
  folder: string;
  uid: number;
  message_id: string;
  from_name: string;
  from_address: string;
  to_addrs: string;
  subject: string;
  snippet: string;
  date: number;
  is_read: number;
  is_starred: number;
  has_attachments: number;
  triage: string | null;
  tags: string | null;
  synced_at: number;
}

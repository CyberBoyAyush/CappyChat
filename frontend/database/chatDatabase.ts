import { UIMessage } from 'ai';
import Dexie, { type EntityTable } from 'dexie';

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

interface DBMessage {
  id: string;
  threadId: string;
  parts: UIMessage['parts'];
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  createdAt: Date;
}

interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
}

const db = new Dexie('atchat') as Dexie & {
  threads: EntityTable<Thread, 'id'>;
  messages: EntityTable<DBMessage, 'id'>;
  messageSummaries: EntityTable<MessageSummary, 'id'>;
};

db.version(1).stores({
  threads: 'id, title, updatedAt, lastMessageAt',
  messages: 'id, threadId, createdAt, [threadId+createdAt]',
  messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
});

export type { Thread, DBMessage };
export { db };

import { db } from './chatDatabase';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import Dexie from 'dexie';

export const getThreads = async () => {
  return await db.threads.orderBy('lastMessageAt').reverse().toArray();
};

export const createThread = async (id: string) => {
  return await db.threads.add({
    id,
    title: 'New Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
  });
};

export const updateThread = async (id: string, title: string) => {
  return await db.threads.update(id, {
    title,
    updatedAt: new Date(),
  });
};

export const deleteThread = async (id: string) => {
  return await db.transaction(
    'rw',
    [db.threads, db.messages, db.messageSummaries],
    async () => {
      await db.messages.where('threadId').equals(id).delete();
      await db.messageSummaries.where('threadId').equals(id).delete();
      return await db.threads.delete(id);
    }
  );
};

export const deleteAllThreads = async () => {
  return db.transaction(
    'rw',
    [db.threads, db.messages, db.messageSummaries],
    async () => {
      await db.threads.clear();
      await db.messages.clear();
      await db.messageSummaries.clear();
    }
  );
};

export const getMessagesByThreadId = async (threadId: string) => {
  return await db.messages
    .where('[threadId+createdAt]')
    .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
    .toArray();
};

export const createMessage = async (threadId: string, message: UIMessage) => {
  return await db.transaction('rw', [db.messages, db.threads], async () => {
    await db.messages.add({
      id: message.id,
      threadId,
      parts: message.parts,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date(),
    });

    await db.threads.update(threadId, {
      lastMessageAt: message.createdAt || new Date(),
    });
  });
};

export const deleteTrailingMessages = async (
  threadId: string,
  createdAt: Date,
  gte: boolean = true
) => {
  const startKey = gte
    ? [threadId, createdAt]
    : [threadId, new Date(createdAt.getTime() + 1)];
  const endKey = [threadId, Dexie.maxKey];

  return await db.transaction(
    'rw',
    [db.messages, db.messageSummaries],
    async () => {
      const messagesToDelete = await db.messages
        .where('[threadId+createdAt]')
        .between(startKey, endKey)
        .toArray();

      const messageIds = messagesToDelete.map((msg) => msg.id);

      await db.messages
        .where('[threadId+createdAt]')
        .between(startKey, endKey)
        .delete();

      if (messageIds.length > 0) {
        await db.messageSummaries.where('messageId').anyOf(messageIds).delete();
      }
    }
  );
};

export const createMessageSummary = async (
  threadId: string,
  messageId: string,
  content: string
) => {
  return await db.messageSummaries.add({
    id: uuidv4(),
    threadId,
    messageId,
    content,
    createdAt: new Date(),
  });
};

export const getMessageSummaries = async (threadId: string) => {
  return await db.messageSummaries
    .where('[threadId+createdAt]')
    .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
    .toArray();
};

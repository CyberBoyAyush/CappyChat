/**
 * ThreadListItem Component
 *
 * Used in: frontend/components/panel/ConversationPanel.tsx
 * Purpose: Renders individual thread items in the conversation panel sidebar.
 * Displays thread title, active state, and provides navigation and delete functionality.
 */

import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThreadData, ThreadOperations } from './ThreadManager';

// Props interface for thread list item
interface ThreadListItemProps extends ThreadOperations {
  threadData: ThreadData;
}

// Thread title display component
const ThreadTitle = ({ title }: { title: string }) => (
  <span className="truncate block">{title}</span>
);

// Delete thread button component
interface DeleteButtonProps {
  onDelete: (event: React.MouseEvent) => void;
}

const DeleteButton = ({ onDelete }: DeleteButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className="hidden group-hover/thread:flex ml-auto h-7 w-7"
    onClick={onDelete}
  >
    <X size={16} />
  </Button>
);

// Main thread list item component
const ThreadListItem = ({ threadData, onNavigate, onDelete, isActive }: ThreadListItemProps) => {
  const containerStyles = cn(
    'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-lg overflow-hidden w-full transition-colors',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
  );

  const handleItemClick = () => {
    onNavigate(threadData.id);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    onDelete(threadData.id, event);
  };

  return (
    <div className={containerStyles} onClick={handleItemClick}>
      <ThreadTitle title={threadData.title} />
      <DeleteButton onDelete={handleDeleteClick} />
    </div>
  );
};

export default ThreadListItem;

/**
 * ConversationItem Component
 *
 * Used in: frontend/components/drawer/ConversationsList.tsx
 * Purpose: Renders individual conversation/thread items in the sidebar.
 * Displays thread title, selection state, and delete functionality.
 */

import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Props for conversation item
interface ConversationItemProps {
  data: {
    id: string;
    title: string;
  };
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string, event: React.MouseEvent) => void;
}

// Conversation title display
const ConversationTitle = ({ title }: { title: string }) => (
  <span className="truncate block">{title}</span>
);

// Remove conversation button
interface RemoveButtonProps {
  onRemove: (event: React.MouseEvent) => void;
}

const RemoveButton = ({ onRemove }: RemoveButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className="hidden group-hover/thread:flex ml-auto h-7 w-7"
    onClick={onRemove}
  >
    <X size={16} />
  </Button>
);

// Individual conversation item component
export const ConversationItem = ({ data, selected, onSelect, onRemove }: ConversationItemProps) => {
  const itemClassName = cn(
    'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-lg overflow-hidden w-full transition-colors',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    selected && 'bg-sidebar-accent text-sidebar-accent-foreground'
  );

  const handleClick = () => {
    onSelect(data.id);
  };

  const handleRemoveClick = (event: React.MouseEvent) => {
    onRemove(data.id, event);
  };

  return (
    <div className={itemClassName} onClick={handleClick}>
      <ConversationTitle title={data.title} />
      <RemoveButton onRemove={handleRemoveClick} />
    </div>
  );
};

export default ConversationItem;

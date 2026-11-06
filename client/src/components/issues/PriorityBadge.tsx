import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import type { Priority } from '@/types/issue';
import { label } from '@/lib/utils';
export default function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon =
    priority === 'HIGH' ? ArrowUp : priority === 'LOW' ? ArrowDown : ArrowRight;
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      <Icon size={14} />
      {label(priority)}
    </span>
  );
}

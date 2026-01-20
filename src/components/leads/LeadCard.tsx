import { Lead } from '@/types/lead';
import { isOverdue, isToday, isLockedStatus } from '@/lib/leadStorage';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, LinkIcon, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const overdue = isOverdue(lead.nextActionDate) && !isLockedStatus(lead.status);
  const today = isToday(lead.nextActionDate) && !isLockedStatus(lead.status);

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'High': return 'badge-priority-high';
      case 'Medium': return 'badge-priority-medium';
      default: return 'badge-priority-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-primary/10 text-primary';
      case 'Contacted': return 'bg-secondary text-secondary-foreground';
      case 'Interested': return 'bg-success/10 text-success';
      case 'Follow-up': return 'bg-warning/10 text-warning';
      case 'Closed': return 'bg-success/20 text-success';
      case 'Dropped': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'lead-card group animate-fade-in',
        overdue && 'lead-card-overdue',
        today && !overdue && 'lead-card-today'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {lead.creatorEmail && (
            <div className="mb-1.5">
              <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                By {lead.creatorEmail}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
            {overdue && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Overdue
              </Badge>
            )}
            {today && !overdue && (
              <Badge className="badge-today text-xs shrink-0">
                Today
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className={cn('text-xs', getStatusColor(lead.status))}>
              {lead.status}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', getPriorityClass(lead.priority))}>
              {lead.priority}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              {lead.source}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{lead.nextAction}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(lead.nextActionDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
          {lead.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

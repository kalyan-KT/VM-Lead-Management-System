import { ViewFilter, Lead, LeadSource, LeadStatus, LeadPriority } from '@/types/lead';
import { isOverdue, isToday, isActiveStatus } from '@/lib/leadStorage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertCircle,
  Flame,
  Users,
  CheckCircle,
  LayoutDashboard,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadSidebarProps {
  leads: Lead[];
  activeView: ViewFilter;
  onViewChange: (view: ViewFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: LeadStatus | 'all';
  onStatusFilterChange: (status: LeadStatus | 'all') => void;
  sourceFilter: LeadSource | 'all';
  onSourceFilterChange: (source: LeadSource | 'all') => void;
  priorityFilter: LeadPriority | 'all';
  onPriorityFilterChange: (priority: LeadPriority | 'all') => void;
}

const SOURCES: LeadSource[] = ['LinkedIn', 'WhatsApp', 'Referral', 'Website', 'Other'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Dropped'];
const PRIORITIES: LeadPriority[] = ['High', 'Medium', 'Low'];

export function LeadSidebar({
  leads,
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: LeadSidebarProps) {
  const counts = {
    all: leads.length,
    overdue: leads.filter(l => isOverdue(l.nextActionDate) && isActiveStatus(l.status)).length,
    today: leads.filter(l => isToday(l.nextActionDate) && isActiveStatus(l.status)).length,
    active: leads.filter(l => isActiveStatus(l.status)).length,
    closed: leads.filter(l => !isActiveStatus(l.status)).length,
  };

  const hasFilters = statusFilter !== 'all' || sourceFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    onStatusFilterChange('all');
    onSourceFilterChange('all');
    onPriorityFilterChange('all');
  };

  const navItems = [
    { id: 'all' as ViewFilter, label: 'Dashboard', icon: LayoutDashboard, count: counts.all },
    { id: 'overdue' as ViewFilter, label: 'Overdue', icon: AlertCircle, count: counts.overdue, danger: true },
    { id: 'today' as ViewFilter, label: "Today's Follow-ups", icon: Flame, count: counts.today, warning: true },
    { id: 'active' as ViewFilter, label: 'Active Leads', icon: Users, count: counts.active },
    { id: 'closed' as ViewFilter, label: 'Closed / Dropped', icon: CheckCircle, count: counts.closed },
  ];

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Title */}
      <div className="p-4 border-b border-sidebar-border flex flex-col items-start text-left">
        <img src="/logo.png" alt="Lead Management System" className="h-10 w-auto mb-2" />
        <p className="text-xs text-muted-foreground">Lead Management System</p>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-sidebar-accent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'sidebar-nav-item w-full justify-between',
              activeView === item.id ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className={cn(
                'h-4 w-4',
                item.danger && activeView !== item.id && 'text-destructive',
                item.warning && activeView !== item.id && 'text-warning'
              )} />
              {item.label}
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              activeView === item.id
                ? 'bg-sidebar-primary-foreground/20'
                : item.danger && item.count > 0
                  ? 'bg-destructive/10 text-destructive'
                  : item.warning && item.count > 0
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted'
            )}>
              {item.count}
            </span>
          </button>
        ))}
      </nav>

      {/* Filters */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Filters</Label>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as LeadStatus | 'all')}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={(v) => onSourceFilterChange(v as LeadSource | 'all')}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => onPriorityFilterChange(v as LeadPriority | 'all')}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}

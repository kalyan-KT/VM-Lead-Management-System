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
  X,
  Table,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadFilters } from './LeadFilters';
import { useUser } from '@clerk/clerk-react';

interface LeadSidebarProps {
  leads: Lead[];
  activeView: ViewFilter;
  onViewChange: (view: ViewFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  sourceFilter: string[];
  onSourceFilterChange: (source: string[]) => void;
  priorityFilter: string[];
  onPriorityFilterChange: (priority: string[]) => void;
  className?: string;
  onItemClick?: () => void;
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
  className,
  onItemClick,
}: LeadSidebarProps) {
  const { user } = useUser();
  const counts = {
    all: leads.length,
    overdue: leads.filter(l => isOverdue(l.nextActionDate) && isActiveStatus(l.status)).length,
    today: leads.filter(l => isToday(l.nextActionDate) && isActiveStatus(l.status)).length,
    active: leads.filter(l => isActiveStatus(l.status)).length,
    closed: leads.filter(l => !isActiveStatus(l.status)).length,
  };

  const hasFilters = statusFilter.length > 0 || sourceFilter.length > 0 || priorityFilter.length > 0;

  const clearFilters = () => {
    onStatusFilterChange([]);
    onSourceFilterChange([]);
    onPriorityFilterChange([]);
  };

  const navItems = [
    { id: 'all' as ViewFilter, label: 'Dashboard', icon: LayoutDashboard, count: counts.all },
    { id: 'table' as ViewFilter, label: 'Table View', icon: Table, count: counts.all },
    { id: 'overdue' as ViewFilter, label: 'Overdue', icon: AlertCircle, count: counts.overdue, danger: true },
    { id: 'today' as ViewFilter, label: "Today's Follow-ups", icon: Flame, count: counts.today, warning: true },
    { id: 'active' as ViewFilter, label: 'Active Leads', icon: Users, count: counts.active },
    { id: 'closed' as ViewFilter, label: 'Closed / Dropped', icon: CheckCircle, count: counts.closed },
  ];

  // Admin Link
  if (user?.publicMetadata?.role === 'admin') {
    // @ts-expect-error - Adding custom view type for navigation
    navItems.push({ id: 'users', label: 'Manage Users', icon: Settings, count: 0, hideCount: true });
  }

  return (
    <aside className={cn("w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col", className)}>
      {/* Logo / Title */}
      <div className="p-4 border-b border-sidebar-border flex flex-col items-start text-left">
        <img src="/logo.png" alt="Lead Management System" className="h-10 w-auto mb-2 block dark:hidden" />
        <img src="/logo_darkmode.png" alt="Lead Management System" className="h-10 w-auto mb-2 hidden dark:block" />
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
            onClick={() => {
              onViewChange(item.id);
              onItemClick?.();
            }}
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
            {/* @ts-expect-error - hideCount is optional */}
            {!item.hideCount && (
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
            )}
          </button>
        ))}
      </nav>

      {/* Filters removed */}
      <div className="p-4 border-t border-sidebar-border" />
    </aside>
  );
}

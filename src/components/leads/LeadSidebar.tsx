import { ViewFilter, Lead, LeadSource, LeadStatus, LeadPriority, Folder } from '@/types/lead';
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
  Settings,
  Globe,
  Plus,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadFilters } from './LeadFilters';
import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';

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
  folders: Folder[];
  onCreateFolder: (name: string) => Promise<Folder | null>;
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
  folders = [],
  onCreateFolder,
}: LeadSidebarProps) {
  const { user } = useUser();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

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
    { id: 'table' as ViewFilter, label: 'Table Views', icon: Table, count: counts.all },
    { id: 'overdue' as ViewFilter, label: 'Overdue', icon: AlertCircle, count: counts.overdue, danger: true },
    { id: 'today' as ViewFilter, label: "Today's Follow-ups", icon: Flame, count: counts.today, warning: true },
    { id: 'active' as ViewFilter, label: 'Active Leads', icon: Users, count: counts.active },
    { id: 'closed' as ViewFilter, label: 'Closed / Dropped', icon: CheckCircle, count: counts.closed },
  ];

  // Admin Link
  if (user?.publicMetadata?.role === 'admin') {
    // @ts-expect-error - Adding custom view type for navigation
    navItems.push({ id: 'website_leads', label: 'VM-Website Leads', icon: Globe, count: 0, hideCount: true });
    // @ts-expect-error - Adding custom view type for navigation
    navItems.push({ id: 'stacli_leads', label: 'Stacli-Website Leads', icon: Globe, count: 0, hideCount: true });
    // @ts-expect-error - Adding custom view type for navigation
    navItems.push({ id: 'vm_onboarding', label: 'VM-Client Onboarding', icon: Globe, count: 0, hideCount: true });
    // @ts-expect-error - Adding custom view type for navigation
    navItems.push({ id: 'stacli_onboarding', label: 'Stacli-Client Onboarding', icon: Globe, count: 0, hideCount: true });
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

        {/* Folders Section */}
        <div className="pt-4 pb-2">
          <div className="px-3 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Folders</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
              onClick={() => setIsCreatingFolder(true)}
              title="New Folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isCreatingFolder && (
            <div className="px-3 mb-2 flex items-center gap-2">
              <Input
                autoFocus
                size={1}
                className="h-7 text-xs bg-sidebar-accent"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCreateFolder}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {folders.map((folder) => {
            const folderViewId = `folder_${folder.id}` as ViewFilter;
            const folderCount = leads.filter(l => l.folderId === folder.id).length;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  onViewChange(folderViewId);
                  onItemClick?.();
                }}
                className={cn(
                  'sidebar-nav-item w-full justify-between mt-1',
                  activeView === folderViewId ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
                )}
              >
                <span className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate max-w-[120px] text-left">{folder.name}</span>
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  activeView === folderViewId
                    ? 'bg-sidebar-primary-foreground/20'
                    : 'bg-muted'
                )}>
                  {folderCount}
                </span>
              </button>
            );
          })}
          {folders.length === 0 && !isCreatingFolder && (
            <div className="px-4 py-2 text-xs text-muted-foreground italic">
              No folders yet
            </div>
          )}
        </div>
      </nav>

      {/* Filters removed */}
      <div className="p-4 border-t border-sidebar-border" />
    </aside>
  );
}

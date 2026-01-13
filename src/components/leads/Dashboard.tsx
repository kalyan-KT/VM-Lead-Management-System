import { useState, useMemo, useEffect } from 'react';
import { Lead, ViewFilter, LeadSource, LeadStatus, LeadPriority } from '@/types/lead';
import { getLeads, saveLead, isOverdue, isToday, isUpcoming, isActiveStatus } from '@/lib/leadStorage';
import { LeadCard } from './LeadCard';
import { LeadTable } from './LeadTable';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import { LeadSidebar } from './LeadSidebar';
import { DashboardStats } from './DashboardStats';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, AlertCircle, Flame, Clock, Menu, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LeadFilters } from './LeadFilters';
import { UserButton } from "@clerk/clerk-react";

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeView, setActiveView] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      const data = await getLeads();
      setLeads(data);
    };
    fetchLeads();
  }, []);

  const handleSaveLead = async (lead: Lead) => {
    try {
      await saveLead(lead);
      const data = await getLeads();
      setLeads(data);
      setEditingLead(undefined);
    } catch (error) {
      console.error('Failed to save lead:', error);
      alert('Failed to save lead. Please check the console for details.');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleUpdateLead = async (lead: Lead) => {
    await saveLead(lead);
    const data = await getLeads();
    setLeads(data);
    setSelectedLead(lead);
  };

  // Derived state
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.primaryContact.toLowerCase().includes(query) ||
          (l.linkedInUrl && l.linkedInUrl.toLowerCase().includes(query)) ||
          l.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((l) => statusFilter.includes(l.status));
    }

    // Source filter
    if (sourceFilter.length > 0) {
      result = result.filter((l) => sourceFilter.includes(l.source));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      result = result.filter((l) => priorityFilter.includes(l.priority));
    }

    // View filter
    switch (activeView) {
      case 'overdue':
        result = result.filter((l) => isOverdue(l.nextActionDate) && isActiveStatus(l.status));
        break;
      case 'today':
        result = result.filter((l) => isToday(l.nextActionDate) && isActiveStatus(l.status));
        break;
      case 'active':
        result = result.filter((l) => isActiveStatus(l.status));
        break;
      case 'closed':
        return result.filter((l) => ['Closed', 'Dropped'].includes(l.status));
    }

    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter, priorityFilter, activeView]);

  // Group leads for dashboard view
  const groupedLeads = useMemo(() => {
    if (activeView !== 'all') return null;

    const activeLeads = filteredLeads.filter((l) => isActiveStatus(l.status));

    const overdue = activeLeads
      .filter((l) => isOverdue(l.nextActionDate))
      .sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime());

    const today = activeLeads
      .filter((l) => isToday(l.nextActionDate))
      .sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const upcoming = activeLeads
      .filter((l) => isUpcoming(l.nextActionDate))
      .sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime());

    return { overdue, today, upcoming };
  }, [filteredLeads, activeView]);

  // Collect all unique tags for autocomplete
  const allTags = useMemo(() => {
    return Array.from(new Set(leads.flatMap((lead) => lead.tags || [])));
  }, [leads]);

  const renderLeadSection = (
    title: string,
    icon: React.ReactNode,
    leads: Lead[],
    variant: 'danger' | 'warning' | 'default' = 'default'
  ) => {
    if (leads.length === 0) return null;

    return (
      <div className="mb-8 animate-fade-in">
        <div className={cn(
          'section-header',
          variant === 'danger' && 'text-destructive',
          variant === 'warning' && 'text-warning'
        )}>
          {icon}
          <span>{title}</span>
          <span className={cn(
            'ml-2 text-xs px-2 py-0.5 rounded-full',
            variant === 'danger' && 'bg-destructive/10',
            variant === 'warning' && 'bg-warning/10',
            variant === 'default' && 'bg-muted'
          )}>
            {leads.length}
          </span>
        </div>
        <div className="grid gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => handleLeadClick(lead)} />
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="grid gap-3">
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No leads found</p>
        </div>
      ) : (
        filteredLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => handleLeadClick(lead)} />
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden border-b bg-background p-4 flex items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <LeadSidebar
                leads={leads}
                activeView={activeView}
                onViewChange={setActiveView}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                className="w-full border-r-0"
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LeadSidebar
        leads={leads}
        activeView={activeView}
        onViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        className="hidden md:flex"
      />

      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeView === 'all' && 'Dashboard'}
              {activeView === 'table' && 'Lead Table'}
              {activeView === 'overdue' && 'Overdue Leads'}
              {activeView === 'today' && "Today's Follow-ups"}
              {activeView === 'active' && 'Active Leads'}
              {activeView === 'closed' && 'Closed / Dropped'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  userButtonPopoverFooter: "hidden"
                }
              }}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <LeadFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  sourceFilter={sourceFilter}
                  onSourceFilterChange={setSourceFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  showLabel={false}
                />
              </PopoverContent>
            </Popover>
            <Button className="gap-2" onClick={() => {
              setEditingLead(undefined);
              setFormOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </header>

        <div className="p-6">
          {activeView === 'table' ? (
            <LeadTable leads={filteredLeads} onLeadClick={handleLeadClick} />
          ) : activeView === 'all' && groupedLeads ? (
            <>
              <DashboardStats leads={leads} />

              {renderLeadSection(
                'Overdue',
                <AlertCircle className="h-4 w-4" />,
                groupedLeads.overdue,
                'danger'
              )}
              {renderLeadSection(
                "Today's Follow-ups",
                <Flame className="h-4 w-4" />,
                groupedLeads.today,
                'warning'
              )}
              {renderLeadSection(
                'Upcoming',
                <Clock className="h-4 w-4" />,
                groupedLeads.upcoming
              )}
              {groupedLeads.overdue.length === 0 &&
                groupedLeads.today.length === 0 &&
                groupedLeads.upcoming.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-4">No active leads to follow up on</p>
                    <Button onClick={() => setFormOpen(true)} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add your first lead
                    </Button>
                  </div>
                )}
            </>
          ) : (
            renderListView()
          )}
        </div>
      </main>

      <LeadForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingLead(undefined);
        }}
        onSave={handleSaveLead}
        existingLead={editingLead}
        availableTags={allTags}
      />

      <LeadDetail
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleUpdateLead}
        onEdit={() => {
          setDetailOpen(false);
          setEditingLead(selectedLead);
          setFormOpen(true);
        }}
      />
    </div>
  );
}

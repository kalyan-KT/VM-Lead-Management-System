import { useState, useMemo, useEffect } from 'react';
import { Lead, ViewFilter, LeadSource, LeadStatus, LeadPriority } from '@/types/lead';
import { getLeads, saveLead, isOverdue, isToday, isUpcoming, isActiveStatus } from '@/lib/leadStorage';
import { LeadCard } from './LeadCard';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import { LeadSidebar } from './LeadSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, AlertCircle, Flame, Clock, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeView, setActiveView] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setLeads(getLeads());
  }, []);

  const handleSaveLead = (lead: Lead) => {
    saveLead(lead);
    setLeads(getLeads());
    setEditingLead(undefined);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleUpdateLead = (lead: Lead) => {
    saveLead(lead);
    setLeads(getLeads());
    setSelectedLead(lead);
  };

  const filteredLeads = useMemo(() => {
    let result = leads;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.primaryContact.toLowerCase().includes(query) ||
          l.linkedInUrl.toLowerCase().includes(query) ||
          l.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter((l) => l.source === sourceFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((l) => l.priority === priorityFilter);
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
        result = result.filter((l) => !isActiveStatus(l.status));
        break;
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
      <div className="md:hidden border-b bg-background p-4 flex items-center gap-3 sticky top-0 z-20">
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
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <div className="flex flex-col">
            <h1 className="font-semibold text-sm leading-none">Venture Mond</h1>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Lead Management System</span>
          </div>
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
              {activeView === 'overdue' && 'Overdue Leads'}
              {activeView === 'today' && "Today's Follow-ups"}
              {activeView === 'active' && 'Active Leads'}
              {activeView === 'closed' && 'Closed / Dropped'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </header>

        <div className="p-6">
          {activeView === 'all' && groupedLeads ? (
            <>
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
      />

      <LeadDetail
        lead={selectedLead}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedLead(null);
        }}
        onUpdate={handleUpdateLead}
      />
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Lead, ViewFilter } from '@/types/lead';
import { getLeads, saveLead, isOverdue, isToday, isUpcoming, isActiveStatus, deleteLead, getAdminLeadStats, AdminLeadStat, getAdminDashboardStats, AdminDashboardStats as AdminStatsType, cloneLead, getWebsiteLeads, getStacliLeads, getVmOnboardingLeads, getStacliOnboardingLeads } from '@/lib/leadStorage';
import { LeadCard } from './LeadCard';
import { LeadTable } from './LeadTable';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import { LeadSidebar } from './LeadSidebar';
import { DashboardStats } from './DashboardStats';
import { UserLeadActivity } from './UserLeadActivity';
import { AdminDashboardStats } from './AdminDashboardStats';
import { WebsiteLeadsView } from './WebsiteLeadsView';
import { OnboardingLeadsView } from './OnboardingLeadsView';
import ManageUsers from '@/pages/ManageUsers';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, AlertCircle, Flame, Clock, Menu, Filter, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LeadFilters } from './LeadFilters';
import { AccountModal } from "@/components/account/AccountModal";
import { useAuth, useUser } from '@clerk/clerk-react';

export function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [websiteLeads, setWebsiteLeads] = useState<Lead[]>([]); // Website Leads State
  const [stacliLeads, setStacliLeads] = useState<Lead[]>([]); // Stacli Leads State
  const [vmOnboardingLeads, setVmOnboardingLeads] = useState<Lead[]>([]); // VM Onboarding Leads State
  const [stacliOnboardingLeads, setStacliOnboardingLeads] = useState<Lead[]>([]); // Stacli Onboarding Leads State
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
  const [adminStats, setAdminStats] = useState<AdminLeadStat[]>([]);
  const [adminDashboardStats, setAdminDashboardStats] = useState<AdminStatsType | null>(null);
  const [selectedUserForLeads, setSelectedUserForLeads] = useState<{ id: string; email: string } | null>(null);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    const fetchLeads = async () => {
      const token = await getToken();
      const data = await getLeads(token || undefined);
      setLeads(data);
    };
    fetchLeads();
  }, [getToken]);

  useEffect(() => {
    if (isAdmin) {
      const fetchAdminData = async () => {
        const token = await getToken();
        if (token) {
          const stats = await getAdminLeadStats(token);
          setAdminStats(stats);

          const dashboardStats = await getAdminDashboardStats(token);
          setAdminDashboardStats(dashboardStats);

          // Fetch Website Leads
          const webLeads = await getWebsiteLeads(token);
          setWebsiteLeads(webLeads);

          // Fetch Stacli Leads
          const stacliRes = await getStacliLeads(token);
          setStacliLeads(stacliRes);

          // Fetch VM Onboarding Leads
          const vmOnboardingRes = await getVmOnboardingLeads(token);
          setVmOnboardingLeads(vmOnboardingRes);

          // Fetch Stacli Onboarding Leads
          const stacliOnboardingRes = await getStacliOnboardingLeads(token);
          setStacliOnboardingLeads(stacliOnboardingRes);
        }
      };
      fetchAdminData();
    }
  }, [isAdmin, getToken, leads]); // Re-fetch stats when leads change (maybe add activeView dependency later)

  // Real-time Poll for Website / Stacli / VM Onboarding Leads
  useEffect(() => {
    if (isAdmin && (activeView === 'website_leads' || activeView === 'stacli_leads' || activeView === 'vm_onboarding' || activeView === 'stacli_onboarding')) {
      const fetchExternalLeads = async () => {
        try {
          const token = await getToken();
          if (activeView === 'website_leads') {
            const webLeads = await getWebsiteLeads(token);
            setWebsiteLeads(webLeads);
          } else if (activeView === 'stacli_leads') {
            const stacliResp = await getStacliLeads(token);
            setStacliLeads(stacliResp);
          } else if (activeView === 'vm_onboarding') {
            const vmOnboardingResp = await getVmOnboardingLeads(token);
            setVmOnboardingLeads(vmOnboardingResp);
          } else if (activeView === 'stacli_onboarding') {
            const stacliOnboardingResp = await getStacliOnboardingLeads(token);
            setStacliOnboardingLeads(stacliOnboardingResp);
          }
        } catch (error) {
          console.error(`Polling ${activeView} failed`, error);
        }
      };

      fetchExternalLeads(); // Fetch immediately on view switch
      const interval = setInterval(fetchExternalLeads, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAdmin, activeView, getToken]);

  const handleCardAction = (action: string) => {
    if (action === 'hot') {
      setPriorityFilter(['High']);
      setActiveView('all');
    } else if (action === 'all') {
      setActiveView('all');
      setPriorityFilter([]);
      setStatusFilter([]);
      setSearchQuery('');
    } else if (action === 'users' || action === 'users_active') {
      setActiveView('users');
    } else if (action === 'leads_today') {
      setActiveView('table');
    } else if (action === 'leads_active' || action === 'active') { // Assuming Active card sends this
      setActiveView('active');
    } else {
      setActiveView(action as ViewFilter);
      setPriorityFilter([]);
      setStatusFilter([]);
      setSearchQuery('');
    }
  };

  const handleUserClick = (userId: string, email: string) => {
    setSelectedUserForLeads({ id: userId, email });
    setActiveView('user_leads');
  };

  const handleSaveLead = async (lead: Lead) => {
    try {
      const token = await getToken();

      // Inject creator email if new lead
      if (!lead.id || !lead.id.match(/^[0-9a-fA-F]{24}$/)) {
        lead.creatorEmail = user?.primaryEmailAddress?.emailAddress;
      }

      await saveLead(lead, token || undefined);
      const data = await getLeads(token || undefined);
      setLeads(data);
      setEditingLead(undefined);
    } catch (error) {
      console.error('Failed to save lead:', error);
      alert('Failed to save lead. Please check the console for details.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!id) return;
    try {
      const token = await getToken();
      await deleteLead(id, token || undefined);
      // Success path
      const data = await getLeads(token || undefined);
      setLeads(data);
      if (selectedLead?.id === id) {
        setDetailOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      // Even if delete failed (e.g. 404 not found), refresh the list to remove ghost items
      try {
        const token = await getToken();
        const data = await getLeads(token || undefined);
        setLeads(data);
        // If the lead is gone from the server, verify and close detail
        if (!data.find(l => l.id === id)) {
          if (selectedLead?.id === id) {
            setDetailOpen(false);
            setSelectedLead(null);
          }
        } else {
          alert('Failed to delete lead. Please try again.');
        }
      } catch (wsError) {
        console.error("Failed to refresh leads", wsError);
      }

      // Refresh Website & Stacli Leads if Admin
      if (isAdmin) {
        try {
          const token = await getToken();
          const webLeads = await getWebsiteLeads(token || undefined);
          setWebsiteLeads(webLeads);
          const stacliResp = await getStacliLeads(token || undefined);
          setStacliLeads(stacliResp);
          const vmOnboardingResp = await getVmOnboardingLeads(token || undefined);
          setVmOnboardingLeads(vmOnboardingResp);
          const stacliOnboardingResp = await getStacliOnboardingLeads(token || undefined);
          setStacliOnboardingLeads(stacliOnboardingResp);
        } catch (e) { console.error("Failed to refresh external leads", e); }
      }
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleUpdateLead = async (lead: Lead) => {
    try {
      const token = await getToken();
      const updatedLead = await saveLead(lead, token || undefined);
      const data = await getLeads(token || undefined);
      setLeads(data);
      // Update selected lead to match the FRESH data from server/utils
      setSelectedLead(updatedLead);

      // Refresh Website/Stacli/VM Onboarding Leads if Admin (in case we updated one)
      if (isAdmin) {
        const webLeads = await getWebsiteLeads(token || undefined);
        setWebsiteLeads(webLeads);
        const stacliResp = await getStacliLeads(token || undefined);
        setStacliLeads(stacliResp);
        const vmOnboardingResp = await getVmOnboardingLeads(token || undefined);
        setVmOnboardingLeads(vmOnboardingResp);
        const stacliOnboardingResp = await getStacliOnboardingLeads(token || undefined);
        setStacliOnboardingLeads(stacliOnboardingResp);
      }
    } catch (error) {
      console.error("Failed to update lead", error);
      alert(error instanceof Error ? error.message : "Failed to update lead changes.");
    }
  };

  const handleClone = async (lead: Lead) => {
    try {
      if (!confirm(`Clone "${lead.name}" to your leads?`)) return;

      const token = await getToken();
      await cloneLead(lead.id, token || '');

      // Refresh leads
      const data = await getLeads(token || undefined);
      setLeads(data);

      alert(`Lead "${lead.name}" cloned to your dashboard.`);
    } catch (error) {
      console.error('Failed to clone lead:', error);
      alert('Failed to clone lead.');
    }
  };

  // Base leads for sidebar counts (Admin Privacy applied)
  const sidebarLeads = useMemo(() => {
    if (isAdmin && user?.id) {
      return leads.filter(l => l.createdBy === user.id);
    }
    return leads;
  }, [leads, isAdmin, user?.id]);

  // Derived state
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Admin Privacy Logic: 
    // By default, Admin sees only their own leads in the main lists (Dashboard, Table, Overdue etc.)
    // They can view other users' leads by clicking on a user in "User Lead Activity" (activeView === 'user_leads').
    if (isAdmin && user?.id && activeView !== 'user_leads' && activeView !== 'users') {
      result = result.filter(l => l.createdBy === user.id);
    }

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
      case 'user_leads':
        if (selectedUserForLeads) {
          result = result.filter((l) => l.createdBy === selectedUserForLeads.id);
        }
        break;
      case 'website_leads':
        return websiteLeads;
      case 'stacli_leads':
        return stacliLeads;
      case 'vm_onboarding':
        return vmOnboardingLeads;
      case 'stacli_onboarding':
        return stacliOnboardingLeads;
    }

    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter, priorityFilter, activeView, isAdmin, user?.id, selectedUserForLeads]);

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

    const unscheduled = activeLeads.filter(l => {
      if (!l.nextActionDate) return true;
      const d = new Date(l.nextActionDate);
      return isNaN(d.getTime());
    });

    return { overdue, today, upcoming, unscheduled };
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
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => handleLeadClick(lead)}
            />
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
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => handleLeadClick(lead)}
          />
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
                leads={sidebarLeads}
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
        leads={sidebarLeads}
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
              {activeView === 'active' && 'Active Leads'}
              {activeView === 'closed' && 'Closed / Dropped'}
              {activeView === 'users' && 'User Management'}
              {activeView === 'website_leads' && 'Website Leads'}
              {activeView === 'stacli_leads' && 'Stacli Website Leads'}
              {activeView === 'vm_onboarding' && 'VM-Client Onboarding'}
              {activeView === 'stacli_onboarding' && 'Stacli-Client Onboarding'}
              {activeView === 'user_leads' && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setActiveView('all')} className="-ml-2 h-8 w-8">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <span>Leads by {selectedUserForLeads?.email}</span>
                </div>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AccountModal />
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
          {activeView === 'users' ? (
            <ManageUsers />
          ) : activeView === 'website_leads' ? (
            <WebsiteLeadsView
              leads={websiteLeads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
            />
          ) : activeView === 'stacli_leads' ? (
            <WebsiteLeadsView
              leads={stacliLeads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
            />
          ) : activeView === 'vm_onboarding' ? (
            <OnboardingLeadsView
              leads={vmOnboardingLeads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
            />
          ) : activeView === 'stacli_onboarding' ? (
            <OnboardingLeadsView
              leads={stacliOnboardingLeads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
            />
          ) : activeView === 'table' || activeView === 'user_leads' ? (
            <LeadTable leads={filteredLeads} onLeadClick={handleLeadClick} />
          ) : activeView === 'all' && groupedLeads ? (
            <>
              <DashboardStats leads={sidebarLeads} onCardClick={handleCardAction} />

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <AdminDashboardStats stats={adminDashboardStats} onCardClick={handleCardAction} />
                  <UserLeadActivity stats={adminStats} onUserClick={handleUserClick} />
                </>
              )}

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
              {renderLeadSection(
                'Unscheduled Follow-ups',
                <HelpCircle className="h-4 w-4" />,
                groupedLeads.unscheduled
              )}
              {groupedLeads.overdue.length === 0 &&
                groupedLeads.today.length === 0 &&
                groupedLeads.upcoming.length === 0 &&
                groupedLeads.unscheduled.length === 0 && (
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
        onDelete={handleDeleteLead}
        onClone={handleClone}
        onEdit={() => {
          setDetailOpen(false);
          setEditingLead(selectedLead);
          setFormOpen(true);
        }}
      />
    </div>
  );
}

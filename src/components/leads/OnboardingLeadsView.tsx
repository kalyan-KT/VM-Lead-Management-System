import { useState, useMemo } from 'react';
import { Lead } from '@/types/lead';
import { OnboardingLeadDetail } from './OnboardingLeadDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Eye, Mail, Filter, Users, Activity, Trophy, ChevronDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface OnboardingLeadsViewProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onDeleteLead: (id: string) => void;
}

export function OnboardingLeadsView({ leads, onUpdateLead, onDeleteLead }: OnboardingLeadsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | 'All'>('All');
    const [serviceFilter, setServiceFilter] = useState<string | 'All'>('All');

    // Stats
    const stats = useMemo(() => {
        const total = leads.length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newLeads = leads.filter(l => new Date(l.createdAt) > sevenDaysAgo).length;

        const services = leads.map(l => l.service).filter(Boolean) as string[];
        const serviceCounts = services.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return { total, newLeads, topService };
    }, [leads]);

    // Filtered Leads
    const filteredLeads = useMemo(() => {
        let result = leads;

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(lead =>
                lead.name.toLowerCase().includes(query) ||
                lead.primaryContact.toLowerCase().includes(query) ||
                (lead.company || '').toLowerCase().includes(query)
            );
        }

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(lead => lead.status === statusFilter);
        }

        // Service Filter
        if (serviceFilter !== 'All') {
            result = result.filter(lead => lead.service === serviceFilter);
        }

        return result;
    }, [leads, searchQuery, statusFilter, serviceFilter]);

    const uniqueServices = useMemo(() => {
        return Array.from(new Set(leads.map(l => l.service).filter(Boolean))).sort();
    }, [leads]);

    // Export Function
    const handleExport = () => {
        const headers = ['Date', 'Name', 'Email', 'Company', 'Industry', 'Project', 'Services', 'Budget', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(lead => [
                new Date(lead.createdAt).toLocaleDateString(),
                `"${lead.name}"`,
                lead.primaryContact,
                `"${lead.company || ''}"`,
                `"${lead.industry || ''}"`,
                `"${lead.projectName || ''}"`,
                `"${lead.service || ''}"`,
                `"${lead.budget || ''}"`,
                lead.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `onboarding_leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleUpdateStatus = (lead: Lead, newStatus: string) => {
        // Create a copy with updated status
        const updated = { ...lead, status: newStatus as any };
        onUpdateLead(updated);
        // Update selected lead to reflect changes immediately in drawer if open
        if (selectedLead?.id === lead.id) {
            setSelectedLead(updated);
        }
    };

    return (
        <div className="space-y-6 pt-2 animate-in fade-in duration-500">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-emerald-500 bg-emerald-100 p-0.5 rounded-full w-6 h-6" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">New (7 Days)</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500 bg-blue-100 p-0.5 rounded-full w-6 h-6" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.newLeads}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Service</CardTitle>
                        <Trophy className="h-4 w-4 text-purple-500 bg-purple-100 p-0.5 rounded-full w-6 h-6" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate text-gray-900 dark:text-gray-100" title={stats.topService}>
                            {stats.topService}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-2">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads... (/)"
                        className="pl-9 bg-white dark:bg-gray-950"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white dark:bg-gray-950 w-32 justify-between">
                                {statusFilter === 'All' ? 'Status: All' : statusFilter}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuCheckboxItem checked={statusFilter === 'All'} onCheckedChange={() => setStatusFilter('All')}>
                                All
                            </DropdownMenuCheckboxItem>
                            {['New', 'Contacted', 'Qualified', 'Closed'].map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={statusFilter === status}
                                    onCheckedChange={() => setStatusFilter(status === statusFilter ? 'All' : status)}
                                >
                                    {status}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Service Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white dark:bg-gray-950 w-40 justify-between">
                                <span className="truncate">{serviceFilter === 'All' ? 'Service: All' : serviceFilter}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px]">
                            <DropdownMenuCheckboxItem checked={serviceFilter === 'All'} onCheckedChange={() => setServiceFilter('All')}>
                                All
                            </DropdownMenuCheckboxItem>
                            {uniqueServices.map((service) => (
                                <DropdownMenuCheckboxItem
                                    key={service}
                                    checked={serviceFilter === service}
                                    onCheckedChange={() => setServiceFilter(service === serviceFilter ? 'All' : service)}
                                >
                                    {service}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="gap-2 bg-white dark:bg-gray-950" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableHead className="w-[120px] text-xs font-semibold uppercase text-muted-foreground">Date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Name</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Email</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Company</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Project</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Services</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Budget</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                    No leads found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLeads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    className="group hover:bg-muted/30 cursor-pointer"
                                    onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}
                                >
                                    <TableCell className="text-muted-foreground font-medium text-xs whitespace-nowrap">
                                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        <div className="flex items-center gap-2">
                                            {lead.name}
                                            {lead.status === 'New' && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-100 text-green-700 hover:bg-green-100 border-0">NEW</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{lead.primaryContact}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground font-medium">{lead.company || '-'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{lead.projectName || '-'}</TableCell>
                                    <TableCell className="text-sm font-medium">
                                        <div className="max-w-[150px] truncate" title={lead.service || ''}>
                                            {lead.service || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {lead.budget ? (
                                            <Badge variant="outline" className="font-normal text-muted-foreground bg-gray-50 dark:bg-gray-900">
                                                {lead.budget}
                                            </Badge>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`
                            font-medium 
                            ${lead.status === 'New' ? 'text-green-600 bg-green-50 border-green-200' : ''}
                            ${lead.status === 'Contacted' ? 'text-blue-600 bg-blue-50 border-blue-200' : ''}
                            ${lead.status === 'Closed' ? 'text-gray-600 bg-gray-50 border-gray-200' : ''}
                        `}
                                        >
                                            {lead.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div
                                            className="flex items-center justify-end gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => window.open(`mailto:${lead.primaryContact}`)}>
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            {/* More actions could go here */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <OnboardingLeadDetail
                lead={selectedLead}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                onUpdateStatus={handleUpdateStatus}
                onDelete={onDeleteLead}
            />
        </div>
    );
}

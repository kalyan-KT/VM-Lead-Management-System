import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Lead } from '@/types/lead';
import { isOverdue, isToday } from '@/lib/leadStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Download, ArrowUpDown, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadTableProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
}

type SortField = 'name' | 'status' | 'nextActionDate' | 'priority';
type SortDirection = 'asc' | 'desc';

export function LeadTable({ leads, onLeadClick }: LeadTableProps) {
    const [sortField, setSortField] = useState<SortField>('nextActionDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedLeads = [...leads].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;

        switch (sortField) {
            case 'name':
                return a.name.localeCompare(b.name) * direction;
            case 'status':
                return a.status.localeCompare(b.status) * direction;
            case 'nextActionDate':
                return (new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime()) * direction;
            case 'priority': {
                const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction;
            }
            default:
                return 0;
        }
    });

    const handleExport = () => {
        // Generate CSV
        const headers = [
            'Name',
            'Source',
            'Status',
            'Priority',
            'Next Action',
            'Next Action Date',
            'Overdue',
            'Tags',
            'Primary Contact',
            'LinkedIn URL'
        ];

        const rows = sortedLeads.map(lead => [
            lead.name,
            lead.source,
            lead.status,
            lead.priority,
            lead.nextAction,
            lead.nextActionDate,
            isOverdue(lead.nextActionDate) ? 'Yes' : 'No',
            lead.tags.join('; '),
            lead.primaryContact,
            lead.linkedInUrl
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `lead-management-system-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'New': return 'bg-primary/10 text-primary hover:bg-primary/20';
            case 'Contacted': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
            case 'Interested': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200';
            case 'Follow-up': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200';
            case 'Closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200';
            case 'Dropped': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden bg-card text-card-foreground shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10 cursor-pointer" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1 font-semibold text-foreground">
                                        Name
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                                    <div className="flex items-center gap-1">Priority <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead>Next Action</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('nextActionDate')}>
                                    <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead>Overdue</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="hidden md:table-cell">Contact</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Post Links</TableHead>
                                {isAdmin && <TableHead>Admin Review</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 11 : 10} className="text-center py-8 text-muted-foreground">
                                        No leads found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedLeads.map((lead, index) => {
                                    const overdue = isOverdue(lead.nextActionDate) && !['Closed', 'Dropped'].includes(lead.status);
                                    const today = isToday(lead.nextActionDate) && !['Closed', 'Dropped'].includes(lead.status);

                                    return (
                                        <TableRow
                                            key={lead.id}
                                            className={cn(
                                                "cursor-pointer transition-colors",
                                                index % 2 === 0 ? "bg-card" : "bg-muted/20",
                                                overdue ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20" :
                                                    today ? "bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20" :
                                                        "hover:bg-muted/50"
                                            )}
                                            onClick={() => onLeadClick(lead)}
                                        >
                                            <TableCell className={cn("font-medium sticky left-0 z-10",
                                                index % 2 === 0 ? "bg-card" : "bg-muted/20", // Note: Sticky might be slightly transparent
                                                overdue ? "bg-red-50 dark:bg-red-900/10" : today ? "bg-orange-50 dark:bg-orange-900/10" : ""
                                            )}>
                                                {lead.name}
                                            </TableCell>
                                            <TableCell>{lead.source}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={cn("font-normal border-0", getStatusColor(lead.status))}>
                                                    {lead.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                    lead.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                        lead.priority === 'Medium' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                )}>
                                                    {lead.priority}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={lead.nextAction}>
                                                {lead.nextAction}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {(() => {
                                                    if (!lead.nextActionDate) return <span className="text-muted-foreground text-xs italic">No Date</span>;
                                                    const date = new Date(lead.nextActionDate);
                                                    return isNaN(date.getTime()) ? <span className="text-muted-foreground text-xs italic">No Date</span> : date.toLocaleDateString();
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {overdue && (
                                                    <div className="flex items-center text-destructive text-xs font-medium">
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Overdue
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {lead.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="inline-flex text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {lead.tags.length > 2 && (
                                                        <span className="text-[10px] text-muted-foreground">+{lead.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{lead.primaryContact}</TableCell>
                                            <TableCell className="hidden md:table-cell text-right">
                                                {lead.relevantLinks && lead.relevantLinks.length > 0 ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const url = lead.relevantLinks[0];
                                                            window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
                                                        }}
                                                        title="View Post"
                                                    >
                                                        <LinkIcon className="h-3 w-3 text-blue-600" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell>
                                                    {lead.adminReview ? (
                                                        <Badge variant="outline" className={cn("font-normal border-0 whitespace-nowrap",
                                                            lead.adminReview === 'Sent Message' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                lead.adminReview === 'Sent Note' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                    lead.adminReview === 'Hiring Post' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                        )}>
                                                            {lead.adminReview}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Not Reviewed</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

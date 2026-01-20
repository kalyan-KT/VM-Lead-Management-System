import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLeadStat } from '@/lib/leadStorage';
import { formatDistanceToNow } from 'date-fns';

interface UserLeadActivityProps {
    stats: AdminLeadStat[];
    onUserClick?: (userId: string, email: string) => void;
}

export function UserLeadActivity({ stats, onUserClick }: UserLeadActivityProps) {
    return (
        <Card className="mb-8 overflow-hidden animate-fade-in">
            <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    User Lead Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Total Leads Created</TableHead>
                                <TableHead className="text-right">Leads Created Today</TableHead>
                                <TableHead className="text-right">Last Lead Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No lead activity found per user.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stats.map((stat) => (
                                    <TableRow
                                        key={stat.userId}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => onUserClick?.(stat.userId, stat.email)}
                                    >
                                        <TableCell className="font-medium text-foreground">
                                            {stat.email || 'Unknown User'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${stat.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : stat.role === 'deleted'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                {stat.role || 'User'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                                            {stat.totalLeads}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-orange-600 dark:text-orange-400">
                                            {/* Placeholder until backend sends this */}
                                            {stat.leadsToday || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {stat.lastCreatedAt
                                                ? formatDistanceToNow(new Date(stat.lastCreatedAt), { addSuffix: true })
                                                : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

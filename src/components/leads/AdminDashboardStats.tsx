import { AdminDashboardStats as AdminStatsType } from '@/lib/leadStorage';
import { Users, FileText, Calendar, Activity } from 'lucide-react';

interface AdminDashboardStatsProps {
    stats: AdminStatsType | null;
    onCardClick: (action: string) => void;
}

export function AdminDashboardStats({ stats, onCardClick }: AdminDashboardStatsProps) {
    if (!stats) return null;

    const items = [
        {
            label: 'TOTAL USERS',
            value: stats.totalUsers,
            icon: Users,
            colorClass: 'text-indigo-600 dark:text-indigo-400',
            bgClass: 'bg-indigo-100 dark:bg-indigo-900/20',
            action: 'users'
        },
        {
            label: 'TOTAL LEADS (ALL)',
            value: stats.totalLeads,
            icon: FileText,
            colorClass: 'text-blue-600 dark:text-blue-400',
            bgClass: 'bg-blue-100 dark:bg-blue-900/20',
            action: null // No action
        },
        {
            label: 'LEADS TODAY',
            value: stats.leadsToday,
            icon: Calendar,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            bgClass: 'bg-emerald-100 dark:bg-emerald-900/20',
            action: 'leads_today'
        },
        {
            label: 'ACTIVE USERS',
            value: stats.activeUsers,
            icon: Activity,
            colorClass: 'text-purple-600 dark:text-purple-400',
            bgClass: 'bg-purple-100 dark:bg-purple-900/20',
            action: 'users_active'
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {items.map((item, index) => (
                <div
                    key={index}
                    onClick={() => item.action && onCardClick(item.action)}
                    className={`flex flex-col justify-between rounded-xl bg-card text-card-foreground p-6 shadow-sm ring-1 ring-border ${item.action
                        ? 'cursor-pointer hover:shadow-md hover:ring-primary/20 transition-all'
                        : ''
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {item.label}
                        </span>
                        <div className={`p-2 rounded-full ${item.bgClass}`}>
                            <item.icon className={`h-5 w-5 ${item.colorClass}`} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

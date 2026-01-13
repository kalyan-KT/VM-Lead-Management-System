import { Lead } from '@/types/lead';
import { isActiveStatus, isOverdue } from '@/lib/leadStorage';

interface DashboardStatsProps {
    leads: Lead[];
}

export function DashboardStats({ leads }: DashboardStatsProps) {
    // Calculate Metrics
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => isActiveStatus(l.status)).length;
    // Hot leads: High priority and active
    const hotLeads = leads.filter(l => l.priority === 'High' && isActiveStatus(l.status)).length;
    // Overdue leads: Past nextActionDate and active
    const overdueLeads = leads.filter(l => isOverdue(l.nextActionDate) && isActiveStatus(l.status)).length;

    const stats = [
        {
            label: 'TOTAL LEADS',
            value: totalLeads,
            colorClass: 'text-blue-600',
            dotClass: 'bg-blue-500' // Visual accent
        },
        {
            label: 'ACTIVE',
            value: activeLeads,
            colorClass: 'text-emerald-600',
            dotClass: 'bg-emerald-500'
        },
        {
            label: 'HOT LEADS',
            value: hotLeads,
            colorClass: 'text-orange-600',
            dotClass: 'bg-orange-500'
        },
        {
            label: 'OVERDUE',
            value: overdueLeads,
            colorClass: 'text-red-600',
            dotClass: 'bg-red-500'
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="group relative flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default"
                >
                    {/* Top Row: Label with small accent dot */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`h-2 w-2 rounded-full ${stat.dotClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 group-hover:text-muted-foreground">
                            {stat.label}
                        </span>
                    </div>

                    {/* Bottom Row: Big Bold Number */}
                    <div className={`text-4xl font-bold tracking-tight ${stat.colorClass}`}>
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

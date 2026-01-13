import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadStatus, LeadSource, LeadPriority } from '@/types/lead';

interface LeadFiltersProps {
    statusFilter: string[];
    onStatusFilterChange: (value: string[]) => void;
    sourceFilter: string[];
    onSourceFilterChange: (value: string[]) => void;
    priorityFilter: string[];
    onPriorityFilterChange: (value: string[]) => void;
    showLabel?: boolean;
}

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Dropped'];
const SOURCES: LeadSource[] = ['LinkedIn', 'WhatsApp', 'Referral', 'Website', 'Other'];
const PRIORITIES: LeadPriority[] = ['High', 'Medium', 'Low'];

export function LeadFilters({
    statusFilter,
    onStatusFilterChange,
    sourceFilter,
    onSourceFilterChange,
    priorityFilter,
    onPriorityFilterChange,
    showLabel = true,
}: LeadFiltersProps) {
    const hasActiveFilters = statusFilter.length > 0 || sourceFilter.length > 0 || priorityFilter.length > 0;

    const handleClearFilters = () => {
        onStatusFilterChange([]);
        onSourceFilterChange([]);
        onPriorityFilterChange([]);
    };

    const toggleFilter = (current: string[], value: string, onChange: (v: string[]) => void) => {
        if (current.includes(value)) {
            onChange(current.filter(i => i !== value));
        } else {
            onChange([...current, value]);
        }
    };

    const renderCheckboxGroup = (title: string, items: string[], current: string[], onChange: (v: string[]) => void) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">{title}</Label>
            <div className="space-y-1.5">
                {items.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${title}-${item}`}
                            checked={current.includes(item)}
                            onCheckedChange={() => toggleFilter(current, item, onChange)}
                        />
                        <label
                            htmlFor={`${title}-${item}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {showLabel && (
                <div className="flex items-center justify-between">
                    <Label>Filters</Label>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        >
                            Clear
                            <X className="ml-1 h-3 w-3" />
                        </Button>
                    )}
                </div>
            )}

            {renderCheckboxGroup('Status', STATUSES, statusFilter, onStatusFilterChange)}
            {renderCheckboxGroup('Source', SOURCES, sourceFilter, onSourceFilterChange)}
            {renderCheckboxGroup('Priority', PRIORITIES, priorityFilter, onPriorityFilterChange)}
        </div>
    );
}

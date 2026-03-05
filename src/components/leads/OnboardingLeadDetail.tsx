import { Lead } from '@/types/lead';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Trash2, Building, Briefcase, Calendar, DollarSign, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface OnboardingLeadDetailProps {
    lead: Lead | null;
    open: boolean;
    onClose: () => void;
    onUpdateStatus: (lead: Lead, newStatus: string) => void;
    onDelete: (id: string) => void;
}

export function OnboardingLeadDetail({ lead, open, onClose, onUpdateStatus, onDelete }: OnboardingLeadDetailProps) {
    if (!lead) return null;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold">{lead.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{lead.company || 'No Company'}</p>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Contact Section */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Contact</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${lead.primaryContact}`} className="text-sm hover:underline">{lead.primaryContact}</a>
                            </div>
                            {lead.phone && (
                                <div className="flex items-center gap-3">
                                    <span className="h-4 w-4 flex items-center justify-center text-muted-foreground text-xs">Ph</span>
                                    <span className="text-sm">{lead.phone}</span>
                                </div>
                            )}
                            {lead.company && (
                                <div className="flex items-center gap-3">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{lead.company}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Company Details */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Company Profile</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-md">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block">Industry</span>
                                <p className="font-medium text-sm">{lead.industry || 'N/A'}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block">Website</span>
                                <a href={lead.companyWebsite} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-blue-500 hover:underline break-all">{lead.companyWebsite || 'N/A'}</a>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md col-span-2">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block">Company Address</span>
                                <p className="font-medium text-sm">{lead.companyAddress || 'N/A'}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md col-span-2">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block">Company Description</span>
                                <p className="font-medium text-sm">{lead.companyDescription || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Project Details */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Project Requirements</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground uppercase">Service</span>
                                </div>
                                <p className="font-medium text-sm">{lead.service || 'N/A'}</p>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground uppercase">Division</span>
                                </div>
                                <p className="font-medium text-sm">{lead.division || 'Services'}</p>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground uppercase">Budget</span>
                                </div>
                                <p className="font-medium text-sm">{lead.budget || '-'}</p>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground uppercase">Ideal Start Date</span>
                                </div>
                                <p className="font-medium text-sm">{lead.idealStartDate || '-'}</p>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-md col-span-2">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block">Project Name</span>
                                <p className="font-medium text-sm">{lead.projectName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Detailed Answers */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Detailed Answers</h3>
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-md">
                                <span className="text-xs text-muted-foreground uppercase mb-2 block font-semibold">Primary Goals</span>
                                <p className="text-sm border-l-2 border-primary/50 pl-2 py-1">{lead.primaryGoals || 'N/A'}</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-md">
                                <span className="text-xs text-muted-foreground uppercase mb-2 block font-semibold">Additional Comments</span>
                                <p className="text-sm border-l-2 border-primary/50 pl-2 py-1">{lead.additionalComments || 'N/A'}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <span className="text-xs text-muted-foreground uppercase mb-1 block font-semibold">How did you hear about us?</span>
                                <p className="text-sm">{lead.howDidYouHear || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Status */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Status</h3>
                        <Select
                            defaultValue={lead.status}
                            onValueChange={(val) => onUpdateStatus(lead, val)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Contacted">Contacted</SelectItem>
                                <SelectItem value="Interested">Interested</SelectItem>
                                <SelectItem value="Follow-up">Follow-up</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                                <SelectItem value="Dropped">Dropped</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actions / Misc */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Submitted</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(lead.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => window.open(`mailto:${lead.primaryContact}`)}>
                            <Mail className="h-4 w-4" />
                            Email Lead
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => {
                            if (confirm('Are you sure you want to delete this lead?')) onDelete(lead.id);
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}

import { useState } from 'react';
import { Lead, LeadStatus, LeadPriority } from '@/types/lead';
import { isLockedStatus, getToday, addNote } from '@/lib/leadStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Mail,
  Phone,
  Link2,
  ArrowRight,
  Plus,
  Clock,
  AlertCircle,
  ExternalLink,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDetailProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
  onEdit: () => void;
}

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Dropped'];
const PRIORITIES: LeadPriority[] = ['High', 'Medium', 'Low'];

export function LeadDetail({ lead, open, onClose, onUpdate, onEdit }: LeadDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [dateError, setDateError] = useState('');

  // Sync local state when lead changes
  useState(() => {
    if (lead) {
      setNextAction(lead.nextAction);
      setNextActionDate(lead.nextActionDate);
      setStatus(lead.status);
      setPriority(lead.priority);
    }
  });

  if (!lead) return null;

  const isLocked = isLockedStatus(lead.status);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note = await addNote(lead.id, newNote.trim());
    if (note) {
      onUpdate({
        ...lead,
        notes: [...lead.notes, note],
      });
      setNewNote('');
    }
  };

  const validateAndUpdateStatus = (newStatus: LeadStatus) => {
    setDateError('');

    if (['Interested', 'Follow-up'].includes(newStatus)) {
      const today = new Date(getToday());
      const actionDate = new Date(nextActionDate || lead.nextActionDate);
      if (actionDate <= today) {
        setDateError('Date must be in the future for this status');
        return;
      }
    }

    setStatus(newStatus);
    onUpdate({
      ...lead,
      status: newStatus,
      lastContactedAt: new Date().toISOString(),
    });
  };

  const handleSaveFollowUp = () => {
    setDateError('');

    if (['Interested', 'Follow-up'].includes(status)) {
      const today = new Date(getToday());
      const actionDate = new Date(nextActionDate);
      if (actionDate <= today) {
        setDateError('Date must be in the future for this status');
        return;
      }
    }

    onUpdate({
      ...lead,
      nextAction,
      nextActionDate,
      status,
      priority,
      lastContactedAt: lead.status !== status ? new Date().toISOString() : lead.lastContactedAt,
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'New': return 'bg-primary/10 text-primary';
      case 'Contacted': return 'bg-secondary text-secondary-foreground';
      case 'Interested': return 'bg-success/10 text-success';
      case 'Follow-up': return 'bg-warning/10 text-warning';
      case 'Closed': return 'bg-success/20 text-success';
      case 'Dropped': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isContactEmail = lead.primaryContact.includes('@');

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold flex items-center gap-3">
              {lead.name}
              <Badge className={cn('text-xs', getStatusColor(lead.status))}>
                {lead.status}
              </Badge>
            </SheetTitle>
            {!isLocked && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground mb-4">
            <AlertCircle className="h-4 w-4" />
            This lead is {lead.status.toLowerCase()} and cannot be edited.
          </div>
        )}

        {/* Lead Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {isContactEmail ? (
                <Mail className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Phone className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{lead.primaryContact}</span>
            </div>
            {lead.linkedInUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`https://${lead.linkedInUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate flex items-center gap-1"
                >
                  {lead.linkedInUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Last contact: {new Date(lead.lastContactedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {lead.contextNote && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground font-medium mb-1">Context</p>
              <p className="text-sm">{lead.contextNote}</p>
            </div>
          )}

          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {lead.valueEstimate && (
            <div className="text-sm">
              <span className="text-muted-foreground">Value Estimate:</span>{' '}
              <span className="font-medium">{lead.valueEstimate}</span>
            </div>
          )}

          {/* Relevant Links */}
          {lead.relevantLinks && lead.relevantLinks.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Relevant Links</p>
              <div className="flex flex-col gap-1">
                {lead.relevantLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> {link} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {lead.documents && lead.documents.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <div className="space-y-1">
                {lead.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-medium truncate max-w-[150px]" title={doc.filename}>{doc.filename}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">({Math.round(doc.size / 1024)} KB)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 hover:text-primary"
                      onClick={() => {
                        const filename = doc.path.split(/[/\\]/).pop();
                        const url = `http://localhost:5000/api/leads/files/${filename}`;
                        window.open(url, '_blank');
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          {lead.followUps && lead.followUps.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Follow-up Schedule</p>
              <div className="space-y-1 border-l-2 pl-2">
                {lead.followUps.map((fu, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">{fu.date}:</span> {fu.note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meeting Notes */}
          {lead.meetingNotes && lead.meetingNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Meeting Notes</p>
              <div className="space-y-2">
                {lead.meetingNotes.map((note, i) => (
                  <div key={i} className="bg-muted/30 p-2 rounded">
                    <div className="font-medium text-sm">{note.title}</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Status & Next Action Editor */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Next Action
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => validateAndUpdateStatus(v as LeadStatus)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as LeadPriority)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="What needs to be done?"
              disabled={isLocked}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              disabled={isLocked}
              className={dateError ? 'border-destructive' : ''}
            />
            {dateError && <p className="text-xs text-destructive">{dateError}</p>}
          </div>

          {!isLocked && (
            <Button onClick={handleSaveFollowUp} className="w-full">
              Save Changes
            </Button>
          )}
        </div>

        <Separator className="my-6" />

        {/* Conversation Notes */}
        <div className="space-y-4">
          <h3 className="font-semibold">Conversation Notes</h3>

          {!isLocked && (
            <div className="space-y-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                size="sm"
                disabled={!newNote.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lead.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notes yet
              </p>
            ) : (
              [...lead.notes].reverse().map((note) => (
                <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm">• {note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

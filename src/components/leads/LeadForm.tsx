import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Lead, LeadSource, LeadStatus, LeadPriority, Folder } from '@/types/lead';
import { generateId, getToday, isLockedStatus } from '@/lib/leadStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { X, Plus, AlertCircle, ChevronDown } from 'lucide-react';

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  existingLead?: Lead;
  availableTags?: string[];
  folders?: Folder[];
  onCreateFolder?: (name: string) => Promise<Folder | null>;
}

const SOURCES: LeadSource[] = ['LinkedIn', 'WhatsApp', 'Referral', 'Website', 'Other'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Dropped'];
const PRIORITIES: LeadPriority[] = ['High', 'Medium', 'Low'];
const OUTREACH_CHANNELS = ['Email', 'Whatsapp', 'Cold Calling', 'Field'];

export function LeadForm({ open, onClose, onSave, existingLead, availableTags = [], folders = [], onCreateFolder }: LeadFormProps) {
  // Deduplicate tags for the list
  const userTags = Array.from(new Set(availableTags)).sort();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [outreachChannel, setOutreachChannel] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [source, setSource] = useState<LeadSource>('LinkedIn');
  const [primaryContact, setPrimaryContact] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [nextAction, setNextAction] = useState('Contact lead');
  const [nextActionDate, setNextActionDate] = useState(getToday());
  const [folderId, setFolderId] = useState<string>('none');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [valueEstimate, setValueEstimate] = useState('');
  const [linkedInPostLink, setLinkedInPostLink] = useState('');

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [adminReview, setAdminReview] = useState<string | undefined>(undefined);
  const [adminReviewNote, setAdminReviewNote] = useState('');

  const { getToken } = useAuth();
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // New States
  const [relevantLinks, setRelevantLinks] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]); // Using any for simplicity or define strict type
  const [followUps, setFollowUps] = useState<{ date: string; note: string }[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<{ title: string; note: string }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existingLead;
  const isLocked = existingLead && isLockedStatus(existingLead.status);

  useEffect(() => {
    if (existingLead) {
      setName(existingLead.name);
      setCompanyName(existingLead.companyName || '');
      setDesignation(existingLead.designation || '');
      setOutreachChannel(existingLead.outreachChannel || []);
      setEmail(existingLead.email || '');
      setContactNumber(existingLead.contactNumber || '');
      setSource(existingLead.source);
      setPrimaryContact(existingLead.primaryContact);
      setLinkedInUrl(existingLead.linkedInUrl || '');
      setStatus(existingLead.status);
      setNextAction(existingLead.nextAction);
      setNextActionDate(existingLead.nextActionDate);
      setContextNote(existingLead.contextNote || '');
      setPriority(existingLead.priority);
      setTags(existingLead.tags);
      setValueEstimate(existingLead.valueEstimate || '');
      setFolderId(existingLead.folderId || 'none');
      // Sync new fields
      setRelevantLinks(existingLead.relevantLinks || []);
      setDocuments(existingLead.documents || []);
      setFollowUps(existingLead.followUps || []);
      setMeetingNotes(existingLead.meetingNotes || []);

      const postLink = existingLead.relevantLinks?.find(l => l.includes('linkedin.com/posts/') || l.includes('linkedin.com/feed/update/'));
      setLinkedInPostLink(postLink || '');
    } else {
      resetForm();
    }
  }, [existingLead, open]);

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setDesignation('');
    setOutreachChannel([]);
    setEmail('');
    setContactNumber('');
    setSource('LinkedIn');
    setPrimaryContact('');
    setLinkedInUrl('');
    setStatus('New');
    setNextAction('Contact lead');
    setNextActionDate(getToday());
    setContextNote('');
    setPriority('Medium');
    setTags([]);
    setTagInput('');
    setValueEstimate('');
    setFolderId('none');
    setIsCreatingFolder(false);
    setNewFolderName('');
    setRelevantLinks([]);
    setDocuments([]);
    setFollowUps([]);
    setMeetingNotes([]);
    setLinkedInPostLink('');
    setAdminReview(undefined);
    setAdminReviewNote('');
    setDuplicateError(null);
    setErrors({});
  };

  const checkDuplicateUrl = async (url: string) => {
    if (!url || (!url.includes('linkedin.com/posts/') && !url.includes('linkedin.com/feed/update/'))) {
      setDuplicateError(null);
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch('/api/leads/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url,
          excludeId: existingLead?.id
        })
      });
      const data = await res.json();
      if (data.exists) {
        setDuplicateError(`This lead was already added by ${data.createdBy}`);
      } else {
        setDuplicateError(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateLinkedInUrl = (url: string): boolean => {
    // Remove protocol and www to check domain
    const cleanUrl = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    return cleanUrl.startsWith('linkedin.com/');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';

    // LinkedIn URL validation only if provided and source is LinkedIn
    if (source === 'LinkedIn' && linkedInUrl.trim() && !validateLinkedInUrl(linkedInUrl)) {
      newErrors.linkedInUrl = 'URL must contain linkedin.com/';
    }
    // Next Action and Date are now optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Handle LinkedIn Post Link - append to relevantLinks if present
    let finalLinks = [...relevantLinks].filter(l => l.trim());
    if (source === 'LinkedIn' && linkedInPostLink.trim()) {
      if (!finalLinks.includes(linkedInPostLink.trim())) {
        finalLinks.push(linkedInPostLink.trim());
      }
    }

    const lead: Lead = {
      id: existingLead?.id || generateId(),
      name: name.trim(),
      companyName: companyName.trim(),
      designation: designation.trim(),
      outreachChannel: outreachChannel,
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      source,
      primaryContact: email.trim() || contactNumber.trim() || primaryContact.trim(),
      linkedInUrl: source === 'LinkedIn' ? linkedInUrl.trim() : '',
      status,
      nextAction: nextAction.trim(),
      nextActionDate: nextActionDate || '', // Send empty string if optional
      contextNote: contextNote.trim() || undefined,
      priority,
      folderId: folderId && folderId !== 'none' ? folderId : undefined,
      folderName: folderId && folderId !== 'none' ? folders?.find(f => f.id === folderId)?.name || undefined : undefined,
      tags,
      valueEstimate: valueEstimate.trim() || undefined,
      relevantLinks: finalLinks,
      documents,
      followUps,
      meetingNotes,
      notes: existingLead?.notes || [],
      createdAt: existingLead?.createdAt || new Date().toISOString(),
      lastContactedAt: existingLead?.status !== status
        ? new Date().toISOString()
        : existingLead?.lastContactedAt || new Date().toISOString(),
      createdBy: existingLead?.createdBy || '',
      creatorEmail: existingLead?.creatorEmail,
      ...(adminReview ? { adminReview: adminReview as any, adminReviewNote } : {}),
    };

    onSave(lead);
    resetForm();
    onClose();
  };

  const isValid = name.trim().length > 0 && !duplicateError;



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? (isLocked ? 'View Lead' : 'Edit Lead') : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>

        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            This lead is {existingLead.status.toLowerCase()} and cannot be edited.
          </div>
        )}

        <div className="grid gap-6 py-4">
          {/* Mandatory Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Person Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Person Name"
                disabled={isLocked}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Designation"
                disabled={isLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select value={source} onValueChange={(v) => setSource(v as LeadSource)} disabled={isLocked}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outreach Channel</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                  disabled={isLocked}
                >
                  <span className="truncate">
                    {outreachChannel.length > 0 ? outreachChannel.join(', ') : "Select channels..."}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]">
                {OUTREACH_CHANNELS.map(channel => (
                  <DropdownMenuCheckboxItem
                    key={channel}
                    checked={outreachChannel.includes(channel)}
                    onSelect={(e) => e.preventDefault()} // Keep menu open
                    onCheckedChange={(checked) => {
                      if (!isLocked) {
                        setOutreachChannel(prev =>
                          checked
                            ? [...prev, channel]
                            : prev.filter(c => c !== channel)
                        );
                      }
                    }}
                  >
                    {channel}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={isLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Phone Number"
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedInUrl">
              {source === 'LinkedIn' ? 'LinkedIn Profile URL' :
                source === 'WhatsApp' ? 'WhatsApp Number' :
                  source === 'Website' ? 'Website URL' :
                    source === 'Referral' ? 'Referrer Name' :
                      'Source Details'}
            </Label>
            <Input
              id="linkedInUrl"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              placeholder={
                source === 'LinkedIn' ? 'linkedin.com/in/username' :
                  source === 'WhatsApp' ? '+1234567890' :
                    source === 'Website' ? 'https://example.com' :
                      source === 'Referral' ? 'Name of referrer' :
                        'Enter details'
              }
              disabled={isLocked}
              className={errors.linkedInUrl ? 'border-destructive' : ''}
            />
            {errors.linkedInUrl && <p className="text-xs text-destructive">{errors.linkedInUrl}</p>}
          </div>

          {source === 'LinkedIn' && (
            <div className="space-y-2">
              <Label htmlFor="linkedInPostLink">LinkedIn Post Link</Label>
              <Input
                id="linkedInPostLink"
                value={linkedInPostLink}
                onChange={(e) => {
                  setLinkedInPostLink(e.target.value);
                  if (!e.target.value) setDuplicateError(null);
                }}
                onBlur={() => checkDuplicateUrl(linkedInPostLink)}
                placeholder="Link to the post or update"
                disabled={isLocked}
                className={duplicateError ? 'border-destructive' : ''}
              />
              {duplicateError && <p className="text-xs text-destructive font-medium">{duplicateError}</p>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)} disabled={isLocked}>
                <SelectTrigger id="status">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="folder">Folder</Label>
                {onCreateFolder && !isLocked && !isCreatingFolder && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setIsCreatingFolder(true)}
                  >
                    + New Folder
                  </Button>
                )}
              </div>

              {isCreatingFolder ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFolderName.trim() && onCreateFolder) {
                          onCreateFolder(newFolderName.trim()).then(folder => {
                            if (folder) {
                              setFolderId(folder.id);
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            }
                          });
                        }
                      } else if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={async () => {
                      if (newFolderName.trim() && onCreateFolder) {
                        const folder = await onCreateFolder(newFolderName.trim());
                        if (folder) {
                          setFolderId(folder.id);
                          setIsCreatingFolder(false);
                          setNewFolderName('');
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsCreatingFolder(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select value={folderId} onValueChange={setFolderId} disabled={isLocked}>
                  <SelectTrigger id="folder">
                    <SelectValue placeholder="No Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Folder</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextAction">Next Action</Label>
              <Input
                id="nextAction"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="What's next?"
                disabled={isLocked}
                className={errors.nextAction ? 'border-destructive' : ''}
              />
              {errors.nextAction && <p className="text-xs text-destructive">{errors.nextAction}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextActionDate">Next Action Date</Label>
              <Input
                id="nextActionDate"
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                disabled={isLocked}
                className={errors.nextActionDate ? 'border-destructive' : ''}
              />
              {errors.nextActionDate && <p className="text-xs text-destructive">{errors.nextActionDate}</p>}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as LeadPriority)} disabled={isLocked}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueEstimate">Value Estimate</Label>
              <Input
                id="valueEstimate"
                value={valueEstimate}
                onChange={(e) => setValueEstimate(e.target.value)}
                placeholder="e.g., $10,000"
                disabled={isLocked}
              />
            </div>
          </div>



          {/* Admin Review Section (Admin Only) */}
          {isAdmin && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">Admin Review (Internal)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Review Status</Label>
                  <Select value={adminReview || ''} onValueChange={setAdminReview}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sent Message">Sent Message</SelectItem>
                      <SelectItem value="Sent Note">Sent Note</SelectItem>
                      <SelectItem value="Hiring Post">Hiring Post (Rejected)</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(adminReview === 'Other' || adminReview === 'Rejected') && (
                  <div className="space-y-2">
                    <Label>{adminReview === 'Rejected' ? 'Rejection Reason' : 'Admin Review Note'}</Label>
                    <Textarea
                      value={adminReviewNote}
                      onChange={(e) => setAdminReviewNote(e.target.value)}
                      placeholder={adminReview === 'Rejected' ? "Enter reason for rejection..." : "Enter admin review note..."}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Relevant Links */}
          <div className="space-y-2">
            <Label>Relevant Links</Label>
            {relevantLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...relevantLinks];
                    newLinks[index] = e.target.value;
                    setRelevantLinks(newLinks);
                  }}
                  placeholder="https://example.com"
                  disabled={isLocked}
                />
                {!isLocked && (
                  <Button type="button" variant="outline" size="icon" onClick={() => {
                    setRelevantLinks(relevantLinks.filter((_, i) => i !== index));
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isLocked && (
              <div className="pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setRelevantLinks([...relevantLinks, ''])}>
                  <Plus className="h-4 w-4 mr-2" /> Add Link
                </Button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <Label>Documents / Attachments</Label>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium">{doc.filename}</span>
                    <span className="text-muted-foreground text-xs">({Math.round(doc.size / 1024)} KB)</span>
                  </div>
                  {!isLocked && (
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      setDocuments(documents.filter((_, i) => i !== index));
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {!isLocked && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  className="cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      const res = await fetch('/api/leads/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) throw new Error('Upload failed');
                      const data = await res.json();
                      setDocuments([...documents, data]);
                      // Clear input
                      e.target.value = '';
                    } catch (err) {
                      console.error(err);
                      alert('Failed to upload file');
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Follow-up Schedule */}
          <div className="space-y-2">
            <Label>Follow-up Schedule</Label>
            {followUps.map((fu, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  type="date"
                  value={fu.date}
                  onChange={(e) => {
                    const newFus = [...followUps];
                    newFus[index] = { ...newFus[index], date: e.target.value };
                    setFollowUps(newFus);
                  }}
                  disabled={isLocked}
                  className="w-40 shrink-0"
                />
                <Input
                  value={fu.note}
                  onChange={(e) => {
                    const newFus = [...followUps];
                    newFus[index] = { ...newFus[index], note: e.target.value };
                    setFollowUps(newFus);
                  }}
                  placeholder="Note (optional)"
                  disabled={isLocked}
                />
                {!isLocked && (
                  <Button type="button" variant="outline" size="icon" onClick={() => {
                    setFollowUps(followUps.filter((_, i) => i !== index));
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isLocked && (
              <div className="pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setFollowUps([...followUps, { date: getToday(), note: '' }])}>
                  <Plus className="h-4 w-4 mr-2" /> Add Follow-up
                </Button>
              </div>
            )}
          </div>

          {/* Meeting Notes */}
          <div className="space-y-2">
            <Label>Meeting Notes</Label>
            {meetingNotes.map((note, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Meeting {index + 1}</Label>
                  {!isLocked && (
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      setMeetingNotes(meetingNotes.filter((_, i) => i !== index));
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  value={note.title}
                  onChange={(e) => {
                    const newNotes = [...meetingNotes];
                    newNotes[index] = { ...newNotes[index], title: e.target.value };
                    setMeetingNotes(newNotes);
                  }}
                  placeholder="Meeting Title"
                  disabled={isLocked}
                />
                <Textarea
                  value={note.note}
                  onChange={(e) => {
                    const newNotes = [...meetingNotes];
                    newNotes[index] = { ...newNotes[index], note: e.target.value };
                    setMeetingNotes(newNotes);
                  }}
                  placeholder="Notes..."
                  disabled={isLocked}
                  rows={2}
                />
              </div>
            ))}
            {!isLocked && (
              <div className="pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setMeetingNotes([...meetingNotes, { title: `Meeting ${meetingNotes.length + 1}`, note: '' }])}>
                  <Plus className="h-4 w-4 mr-2" /> Add Meeting
                </Button>
              </div>
            )}
          </div>

          {/* Context Note (Legacy/Hidden if empty and has meeting notes?) - Keeping purely for compatibility, maybe move to bottom or keep visible if data exists. User said REPLACE. I'll hide it if I can but I must support it. I'll just remove the UI element but keep data persistence in submit. */}
          {/* <div className="space-y-2">
            <Label htmlFor="contextNote">Context Note</Label> ... 
            I am removing the UI as requested.
          </div> */}

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                disabled={isLocked}
                list="tag-suggestions"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <datalist id="tag-suggestions">
                {userTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag} disabled={isLocked}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    {!isLocked && (
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {isLocked ? 'Close' : 'Cancel'}
          </Button>
          {!isLocked && (
            <Button onClick={handleSubmit} disabled={!isValid}>
              {isEditing ? 'Save Changes' : 'Add Lead'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}

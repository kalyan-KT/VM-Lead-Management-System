import { useState } from 'react';
import { Folder, Lead, ViewFilter } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FolderOpen, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FoldersViewProps {
    folders: Folder[];
    leads: Lead[];
    onCreateFolder: (name: string) => Promise<Folder | null>;
    onRenameFolder: (id: string, name: string) => Promise<boolean>;
    onDeleteFolder: (id: string) => Promise<boolean>;
    onViewFolder: (view: ViewFilter) => void;
}

export function FoldersView({
    folders,
    leads,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onViewFolder,
}: FoldersViewProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleCreate = async () => {
        if (!newFolderName.trim()) return;
        const folder = await onCreateFolder(newFolderName.trim());
        if (folder) {
            setNewFolderName('');
            setIsCreating(false);
        }
    };

    const handleRenameSession = (folder: Folder) => {
        setEditingId(folder.id);
        setEditName(folder.name);
    };

    const handleRename = async () => {
        if (!editingId || !editName.trim()) return;
        const success = await onRenameFolder(editingId, editName.trim());
        if (success) {
            setEditingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the folder "${name}"? Leads inside this folder will NOT be deleted, but they will be removed from this folder.`)) {
            await onDeleteFolder(id);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Folders Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Organize and manage your lead folders</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Folder
                </Button>
            </div>

            {isCreating && (
                <Card className="mb-8 border-primary/50 shadow-sm bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full text-primary">
                            <FolderOpen className="h-6 w-6" />
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                            <Input
                                autoFocus
                                placeholder="Enter folder name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                                className="max-w-md bg-background"
                            />
                            <Button onClick={handleCreate}>Create</Button>
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {folders.length === 0 && !isCreating ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No folders yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create folders to organize your leads by category, priority, or campaign.</p>
                    <Button onClick={() => setIsCreating(true)} variant="outline">Create your first folder</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {folders.map(folder => {
                        const folderCount = leads.filter(l => l.folderId === folder.id).length;
                        const isEditingFolder = editingId === folder.id;

                        return (
                            <Card key={folder.id} className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/30 flex flex-col h-full">
                                <CardHeader className="pb-3 px-5 pt-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                                            <FolderOpen className="h-5 w-5" />
                                        </div>

                                        {!isEditingFolder && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleRenameSession(folder)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(folder.id, folder.name)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditingFolder ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input
                                                autoFocus
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename();
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                className="h-8 text-sm px-2"
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleRename}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <CardTitle
                                            className="text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                            onClick={() => onViewFolder(`folder_${folder.id}` as ViewFilter)}
                                        >
                                            {folder.name}
                                        </CardTitle>
                                    )}
                                </CardHeader>
                                <CardContent className="px-5 pb-5 flex-1">
                                    <p className="text-sm text-muted-foreground">
                                        Contains {folderCount} lead{folderCount !== 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                                <CardFooter className="px-5 py-3 border-t bg-muted/20">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-sm text-muted-foreground hover:text-primary justify-between"
                                        onClick={() => onViewFolder(`folder_${folder.id}` as ViewFilter)}
                                    >
                                        View Leads <span className="text-xs">&rarr;</span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

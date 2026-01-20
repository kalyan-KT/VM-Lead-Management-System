import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
    getAdminUsers,
    createAdminUser,
    updateAdminUser,
    resetAdminUserPassword,
    toggleAdminUserStatus,
    getAdminUserDetails,
    AdminUser
} from '@/lib/leadStorage';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus, Loader2, Eye, EyeOff, Shield, ShieldAlert, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageUsers() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Edit User State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null); // Full user details
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [showPassword, setShowPassword] = useState(false);

    // Edit Form State
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [resetPassValue, setResetPassValue] = useState('');

    const isAdmin = user?.publicMetadata?.role === 'admin';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (token) {
                const data = await getAdminUsers(token);
                setUsers(data);
            }
        } catch (error) {
            toast({
                title: "Error fetching users",
                description: "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (userSummary: AdminUser) => {
        setIsEditOpen(true);
        setIsLoadingDetails(true);
        setSelectedUser(null); // Clear previous
        try {
            const token = await getToken();
            if (token) {
                const details = await getAdminUserDetails(userSummary.id, token);
                setSelectedUser(details);
                setEditFirstName(details.firstName || '');
                setEditLastName(details.lastName || '');

                const primaryId = details.primaryEmailAddressId;
                const primaryObj = details.emailAddresses?.find((e: any) => e.id === primaryId);
                setEditEmail(primaryObj ? primaryObj.emailAddress : (details.emailAddresses[0]?.emailAddress || ''));

                setEditRole(details.publicMetadata?.role || 'user');
                setResetPassValue('');
            }
        } catch (error) {
            toast({
                title: "Error details",
                description: "Could not fetch user details.",
                variant: "destructive"
            });
            setIsEditOpen(false);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (token) {
                await updateAdminUser(selectedUser.id, {
                    firstName: editFirstName,
                    lastName: editLastName,
                    role: editRole,
                    email: editEmail
                }, token);

                toast({ title: "Profile updated successfully" });
                fetchUsers(); // Refresh list to show new role/name
                // Update local selectedUser to reflect changes without re-fetch? 
                setSelectedUser({ ...selectedUser, firstName: editFirstName, lastName: editLastName, publicMetadata: { ...selectedUser.publicMetadata, role: editRole } });
            }
        } catch (error: any) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleResetPassword = async () => {
        if (!resetPassValue || resetPassValue.length < 8) {
            toast({ title: "Invalid Password", description: "Must be at least 8 characters", variant: "destructive" });
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (token) {
                await resetAdminUserPassword(selectedUser.id, resetPassValue, token);
                toast({ title: "Password reset successfully" });
                setResetPassValue('');
            }
        } catch (error: any) {
            toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleToggleStatus = async () => {
        if (!selectedUser) return;
        const action = selectedUser.banned ? 'enable' : 'disable';

        try {
            setIsSubmitting(true); // Re-use submitting state
            const token = await getToken();
            if (token) {
                await toggleAdminUserStatus(selectedUser.id, action, token);
                toast({ title: `User ${action}d successfully` });

                // Update local state
                setSelectedUser({ ...selectedUser, banned: !selectedUser.banned });
                fetchUsers();
            }
        } catch (error: any) {
            toast({ title: "Action failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword) return;

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (token) {
                await createAdminUser({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole
                }, token);

                toast({
                    title: "User created successfully",
                    description: `${newUserEmail} has been added.`
                });

                setIsCreateOpen(false);
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserRole('user');
                fetchUsers(); // Refresh list
            }
        } catch (error: any) {
            toast({
                title: "Failed to create user",
                description: error.message || "Unknown error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAdmin) {
        return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage system users and their roles.
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Create User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system. They can login immediately.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="sr-only">
                                                {showPassword ? "Hide password" : "Show password"}
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Total Leads</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(u)}
                                >
                                    <TableCell className="font-medium text-foreground">{u.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${u.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{u.totalLeads}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(u as any).banned
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {(u as any).banned ? 'Disabled' : 'Active'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User Details</DialogTitle>
                        <DialogDescription>
                            manage profile, role, and security settings.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : selectedUser ? (
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="security">Security</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-4 pt-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="user@example.com"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Updates the primary login email immediately.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>First Name</Label>
                                            <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Last Name</Label>
                                            <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Role</Label>
                                        <Select value={editRole} onValueChange={setEditRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Admins have full access to all leads and settings.
                                        </p>
                                    </div>
                                    <Button onClick={handleUpdateProfile} disabled={isSubmitting} className="w-full">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Profile Changes
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="space-y-6 pt-4">
                                {/* Password Reset */}
                                <div className="space-y-4 rounded-lg border p-4">
                                    <div className="flex items-center gap-2">
                                        <Key className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-medium">Reset Password</h3>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>New Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={resetPassValue}
                                                onChange={(e) => setResetPassValue(e.target.value)}
                                                placeholder="Enter new password"
                                                minLength={8}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleResetPassword}
                                        disabled={isSubmitting || !resetPassValue}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Update Password
                                    </Button>
                                </div>


                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">User not found</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

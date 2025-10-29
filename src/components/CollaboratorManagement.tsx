'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThemeStore } from '@/lib/theme-store';
import { Check, Loader2, Mail, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Collaborator {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  acceptedAt: string;
  createdAt: string;
}

interface Owner {
  id: string;
  email: string;
  name: string | null;
}

interface CollaboratorManagementProps {
  babyId: string;
  isOwner: boolean;
}

export function CollaboratorManagement({ babyId, isOwner }: CollaboratorManagementProps) {
  const { getThemeConfig } = useThemeStore();
  const themeConfig = getThemeConfig();
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Add collaborator form
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/babies/${babyId}/collaborators`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }
      
      const data = await response.json();
      setOwner(data.owner);
      setCollaborators(data.collaborators);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, [babyId]);

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      setAddError('Email is required');
      return;
    }

    setIsAdding(true);
    setAddError('');

    try {
      const response = await fetch(`/api/babies/${babyId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role })
      });

      const data = await response.json();

      if (!response.ok) {
        setAddError(data.error || 'Failed to add collaborator');
        return;
      }

      // Success - reload and close
      await loadCollaborators();
      setIsAddDialogOpen(false);
      setEmail('');
      setRole('VIEWER');
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setAddError('Network error. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/babies/${babyId}/collaborators?collaboratorId=${collaboratorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      // Reload list
      await loadCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator. Please try again.');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      OWNER: { color: 'bg-gradient-to-r from-purple-500 to-purple-600', text: 'Owner' },
      EDITOR: { color: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'Editor' },
      VIEWER: { color: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'Viewer' }
    };
    const badge = badges[role as keyof typeof badges] || badges.VIEWER;
    return (
      <Badge className={`${badge.color} text-white border-0 shadow-sm text-xs`}>
        {badge.text}
      </Badge>
    );
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      OWNER: 'Full control - Can manage collaborators and delete baby',
      EDITOR: 'Can track sleep and edit sessions',
      VIEWER: 'Can only view sleep data'
    };
    return descriptions[role as keyof typeof descriptions] || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${themeConfig.colors.primary} text-white shadow-md`}>
          <Users className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Shared Access
        </h3>
      </div>

      <Card className={`border-0 shadow-lg bg-gradient-to-br ${themeConfig.colors.card} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Owner */}
              {owner && (
                <div className="pb-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        {owner.name?.[0]?.toUpperCase() || owner.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{owner.name || owner.email}</p>
                        {owner.name && (
                          <p className="text-xs text-gray-500">{owner.email}</p>
                        )}
                      </div>
                    </div>
                    {getRoleBadge('OWNER')}
                  </div>
                </div>
              )}

              {/* Collaborators List */}
              {collaborators.length > 0 ? (
                <div className="space-y-3">
                  {collaborators.map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                          {collab.name?.[0]?.toUpperCase() || collab.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {collab.name || collab.email}
                          </p>
                          {collab.name && (
                            <p className="text-xs text-gray-500 truncate">{collab.email}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {getRoleDescription(collab.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(collab.role)}
                        {isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No collaborators yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isOwner ? 'Invite family members to track together' : 'Ask the owner to add more collaborators'}
                  </p>
                </div>
              )}

              {/* Add Collaborator Button (Owner Only) */}
              {isOwner && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className={`w-full mt-4 bg-gradient-to-r ${themeConfig.colors.primary} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Collaborator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`max-w-md backdrop-blur-sm bg-gradient-to-br ${themeConfig.colors.card} border-0 shadow-2xl`}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${themeConfig.colors.primary} text-white shadow-lg`}>
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <span>Add Collaborator</span>
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="collaborator@example.com"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setAddError('');
                            }}
                            className="pl-10"
                            disabled={isAdding}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          They must have a registered account
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">
                          Access Level
                        </Label>
                        <Select value={role} onValueChange={(val) => setRole(val as 'EDITOR' | 'VIEWER')}>
                          <SelectTrigger id="role" disabled={isAdding}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EDITOR">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Editor</span>
                                <span className="text-xs text-gray-500">Can track sleep and edit data</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="VIEWER">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Viewer</span>
                                <span className="text-xs text-gray-500">Can only view data</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {addError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-sm text-red-600">{addError}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            setEmail('');
                            setRole('VIEWER');
                            setAddError('');
                          }}
                          disabled={isAdding}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddCollaborator}
                          disabled={isAdding || !email.trim()}
                          className={`flex-1 bg-gradient-to-r ${themeConfig.colors.primary} text-white`}
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50/80 to-indigo-50/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">About Shared Access</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Share this baby&apos;s sleep tracker with family members. Editors can track sleep sessions, 
                while viewers can only see the data. Only the owner can manage collaborators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

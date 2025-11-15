'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch } from '@/lib/store/hooks';
import { createSession } from '@/lib/store/slices/sessionSlice';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';

interface CreateSessionDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateSessionDialog = memo(({ open, onClose }: CreateSessionDialogProps) => {
  const [title, setTitle] = useState('');
  const dispatch = useAppDispatch();
  const { userId } = useAuth();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      try {
        await dispatch(createSession({ title: title.trim(), userId })).unwrap();
        setTitle('');
        onClose();
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },
    [title, dispatch, userId, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Session</CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session title (optional)"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

CreateSessionDialog.displayName = 'CreateSessionDialog';

export default CreateSessionDialog;


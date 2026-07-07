'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SavedConversation } from '@/lib/types';

type DeleteConversationDialogProps = {
  conversation: SavedConversation | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConversationDialog({
  conversation,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteConversationDialogProps) {
  return (
    <Dialog
      open={Boolean(conversation)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete conversation?</DialogTitle>
          <DialogDescription>
            This permanently removes &ldquo;{conversation?.title?.trim() || 'New conversation'}&rdquo; and all of its messages. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
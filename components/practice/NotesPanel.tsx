// app/dashboard/practice/NotesPanel.tsx
'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dispatch, SetStateAction } from 'react'; 

export interface NotesPanelProps {
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
}

export function NotesPanel({ notes, setNotes }: NotesPanelProps) {
  return (
    <div className="h-full flex flex-col space-y-4">
      <Label htmlFor="notes-textarea">Your Notes</Label>
      <Textarea
        id="notes-textarea"
        placeholder="Type your notes here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 min-h-[200px]"
      />
    </div>
  );
}
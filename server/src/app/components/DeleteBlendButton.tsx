'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  blendId: string;
  blendName: string;
};

export default function DeleteBlendButton({ blendId, blendName: _blendName }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from('blends')
      .delete()
      .eq('id', blendId);

    if (error) {
      console.error('Error deleting blend:', error);
      alert('Failed to delete blend');
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Confirm'
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
      title="Delete blend"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
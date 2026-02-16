'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

export default function ShareBlendButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/blends/join/${inviteCode}`;

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({
        title: 'Join my food blend!',
        text: `Use code ${inviteCode} to join`,
        url: shareUrl
      });
    } else {
      copyToClipboard();
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={shareNative}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition shadow-lg"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            {inviteCode}
          </>
        )}
      </button>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Share2, X, QrCode } from 'lucide-react';

export default function ShareBlendButton({ inviteCode }: { inviteCode: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function getShareUrl() {
    return `${window.location.origin}/blends/join/${inviteCode}`;
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getShareUrl());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal panel */}
          <div className="relative w-full max-w-sm rounded-2xl bg-gray-900 border border-white/[0.10] shadow-2xl overflow-hidden animate-fade-in">

            {/* Accent gradient top strip */}
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">Invite to Blend</h3>
                <p className="text-gray-500 text-sm mt-0.5">Share with friends to join your list</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invite code block */}
            <div className="mx-5 mb-4 rounded-xl bg-white/[0.05] border border-white/[0.08] p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-gray-500" />
                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Invite code</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-3xl font-mono font-bold text-white tracking-[0.2em]">
                  {inviteCode}
                </span>
                <button
                  onClick={copyCode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-5 mb-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-gray-600 text-xs">or share link</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Copy link button */}
            <div className="px-5 pb-5">
              <button
                onClick={copyLink}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  linkCopied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/10'
                }`}
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Link copied!' : 'Copy invite link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
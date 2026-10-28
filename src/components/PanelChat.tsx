/**
 * Project ORBIT - Panel Chat (A-2)
 * Two channels: a thread on each record (shared with Flag) and one board-wide panel channel.
 * Panelists and the Board President post; the Board Recorder reads. Every post, pin, and
 * close is written to the DELTA Ledger. Text only, 1,000 characters, no health information.
 */

import React, { useMemo, useState } from 'react';
import { MessageSquare, Pin, Lock, Send, AlertTriangle, X } from 'lucide-react';
import { useOrbit } from '../state/context';
import { canPostChat, canReadChat, containsPossiblePhi } from '../lib/panel';

interface PanelChatProps {
  candidateId?: string;
  candidateName?: string;
  startOn?: 'record' | 'panel';
  onClose?: () => void;
}

export const PanelChat: React.FC<PanelChatProps> = ({ candidateId, candidateName, startOn = 'record', onClose }) => {
  const { state, dispatch } = useOrbit();
  const [tab, setTab] = useState<'record' | 'panel'>(candidateId ? startOn : 'panel');
  const [draft, setDraft] = useState('');
  const channel = tab === 'panel' || !candidateId ? 'PANEL' : candidateId;
  const isPresident = state.currentRole === 'Board President';
  const mayPost = canPostChat(state.currentRole);
  const closed = channel !== 'PANEL' && state.closedThreads.includes(channel);
  const phiWarning = containsPossiblePhi(draft);

  const messages = useMemo(
    () =>
      state.chat
        .filter(m => m.boardId === state.selectedBoardId && m.channel === channel)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.at.localeCompare(b.at)),
    [state.chat, state.selectedBoardId, channel]
  );

  if (!canReadChat(state.currentRole)) return null;

  const send = () => {
    if (!draft.trim() || phiWarning || closed || !mayPost) return;
    dispatch({ type: 'POST_CHAT', channel, text: draft });
    setDraft('');
  };

  return (
    <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md flex flex-col text-xs" data-testid="panel-chat">
      <div className="flex items-center justify-between border-b border-[#1e2d45] px-3 py-2">
        <div className="flex items-center gap-2 font-semibold text-white">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Panel Chat</span>
          <span className="font-mono text-[10px] text-slate-500">logged to DELTA</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close chat">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex border-b border-[#1e2d45]">
        {candidateId && (
          <button
            type="button"
            onClick={() => setTab('record')}
            className={`flex-1 px-3 py-1.5 font-mono ${tab === 'record' ? 'text-cyan-300 bg-cyan-950/40' : 'text-slate-400 hover:text-white'}`}
          >
            This record{candidateName ? `: ${candidateName.split(',')[0]}` : ''}
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('panel')}
          className={`flex-1 px-3 py-1.5 font-mono ${tab === 'panel' ? 'text-cyan-300 bg-cyan-950/40' : 'text-slate-400 hover:text-white'}`}
        >
          Panel channel
        </button>
      </div>

      <div className="flex-1 max-h-72 overflow-y-auto p-3 space-y-2" data-testid="chat-messages">
        {messages.length === 0 ? (
          <p className="text-slate-500 italic">No messages yet. Flagging a record also opens its thread.</p>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`rounded border px-2 py-1.5 ${
                m.role === 'System' ? 'border-amber-900/60 bg-amber-950/20 text-amber-200' : 'border-[#1e2d45] bg-[#05080f] text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                <span>
                  {m.pinned && <Pin className="inline w-3 h-3 text-purple-300 mr-1" />}
                  <strong className="text-slate-300">{m.authorName}</strong> · {m.role} · {m.at.slice(0, 16).replace('T', ' ')}Z
                </span>
                {isPresident && m.role !== 'System' && (
                  <button type="button" onClick={() => dispatch({ type: 'PIN_MESSAGE', messageId: m.id })} className="text-purple-300 hover:text-white">
                    {m.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap">{m.text}</p>
            </div>
          ))
        )}
      </div>

      {closed ? (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#1e2d45] text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Thread closed by the Board President. Flagging the record reopens it.
        </div>
      ) : mayPost ? (
        <div className="border-t border-[#1e2d45] p-2 space-y-1.5">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 1000))}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder={tab === 'panel' ? 'Message the whole panel...' : 'Discuss this record...'}
              aria-label="Chat message"
              className="flex-1 bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white focus:outline-hidden focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || phiWarning}
              className="px-3 rounded bg-cyan-900 border border-cyan-700 text-cyan-200 font-semibold disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          {phiWarning && (
            <p className="flex items-center gap-1 text-red-300" role="alert">
              <AlertTriangle className="w-3.5 h-3.5" /> This looks like health information. Remove it before sending.
            </p>
          )}
          {isPresident && channel !== 'PANEL' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLOSE_THREAD', candidateId: channel })}
              className="text-purple-300 hover:text-white font-mono text-[10px]"
            >
              Close this thread
            </button>
          )}
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-[#1e2d45] text-slate-500 italic">Read only for your role.</div>
      )}
    </div>
  );
};

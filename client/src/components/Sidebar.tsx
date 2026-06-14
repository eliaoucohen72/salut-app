import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Conversation } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const { t, i18n } = useTranslation();
  const formatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedConversations = [...conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="flex w-64 flex-col border-e border-light-border bg-light-surface dark:border-navy-700 dark:bg-navy-900">
      <div className="flex flex-col gap-2 p-2">
        <span className="px-1 text-sm font-semibold text-light-text dark:text-warm-white">{t('sidebar.title')}</span>
        <button
          type="button"
          onClick={onNewConversation}
          className="rounded-lg bg-light-bg border border-light-border px-3 py-1 text-sm text-light-text dark:bg-navy-800 dark:border-transparent dark:text-warm-white"
        >
          {t('chat.newConversation')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-light-text-muted dark:text-warm-white">{t('sidebar.empty')}</p>
        ) : (
          <ul>
            {sortedConversations.map((conversation) => (
              <li key={conversation.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  aria-current={conversation.id === activeConversationId ? 'true' : undefined}
                  className={`flex flex-1 flex-col items-start gap-0.5 border-s-2 px-3 py-2 text-start ${
                    conversation.id === activeConversationId
                      ? 'border-accent bg-light-bg text-accent dark:bg-navy-800'
                      : 'border-transparent text-light-text dark:text-warm-white'
                  }`}
                >
                  <span className="truncate w-full text-sm">{conversation.title}</span>
                  <span className="text-xs opacity-70">
                    {formatter.format(new Date(conversation.updatedAt))}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t('sidebar.deleteConversation')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteId(conversation.id);
                  }}
                  className="px-2 text-light-text dark:text-warm-white"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-light-border p-2 dark:border-navy-700">
        <Link
          to="/profile"
          className="block rounded-lg px-3 py-2 text-sm text-light-text hover:border-accent dark:text-warm-white"
        >
          {t('sidebar.profile')}
        </Link>
      </div>

      {confirmDeleteId !== null && (
        <ConfirmDialog
          title={t('sidebar.confirmDelete.title')}
          message={t('sidebar.confirmDelete.message')}
          confirmLabel={t('sidebar.confirmDelete.confirm')}
          cancelLabel={t('sidebar.confirmDelete.cancel')}
          onConfirm={() => {
            onDeleteConversation(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

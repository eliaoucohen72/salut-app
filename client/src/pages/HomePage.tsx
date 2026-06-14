import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useHistory } from '../hooks/useHistory';
import { useAppContext } from '../context/AppContext';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setActiveConversationId } = useAppContext();
  const { conversations, deleteConversation, createConversation } = useHistory();

  const handleNewConversation = () => {
    const conversation = createConversation();
    setActiveConversationId(conversation.id);
    navigate(`/chat/${conversation.id}`);
  };

  const handleDeleteConversation = (id: string) => {
    void deleteConversation(id);
  };

  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={(id) => navigate(`/chat/${id}`)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-lg font-semibold text-accent">{t('home.welcomeTitle')}</h1>
        <p className="text-sm max-w-md">{t('home.welcomeBody')}</p>
        <button
          type="button"
          onClick={handleNewConversation}
          className="px-4 py-2 rounded bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
        >
          {t('chat.newConversation')}
        </button>
      </div>
    </div>
  );
}

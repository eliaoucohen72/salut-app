import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from '../pages/OnboardingPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import { useProfile } from '../hooks/useProfile';

export default function AppRoutes() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return null;
  }

  const requiresOnboarding = profile === null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={requiresOnboarding ? '/onboarding' : '/chat'} replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/chat"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ChatPage />}
      />
      <Route
        path="/chat/:conversationId"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ChatPage />}
      />
      <Route
        path="/profile"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ProfilePage />}
      />
    </Routes>
  );
}

/**
 * LandingPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as root "/" route)
 * Purpose: Root route that redirects users to the main chat interface.
 * Handles initial navigation and routing logic.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/chat');
  }, [navigate]);

  return null;
}

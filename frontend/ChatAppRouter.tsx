/**
 * ChatAppRouter Component
 *
 * Used in: app/static-app-shell/page.tsx
 * Purpose: Main application router component that defines all routes and layout structure.
 * Sets up routing for home, chat threads, settings, and handles 404 pages.
 */

import { BrowserRouter, Route, Routes } from 'react-router';
import ChatLayoutWrapper from './ChatLayoutWrapper';
import ChatHomePage from './routes/ChatHomePage';
import LandingPage from './routes/LandingPage';
import ChatThreadPage from './routes/ChatThreadPage';
import SettingsPage from './routes/SettingsPage';

export default function ChatAppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="chat" element={<ChatLayoutWrapper />}>
          <Route index element={<ChatHomePage />} />
          <Route path=":id" element={<ChatThreadPage />} />
        </Route>
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<p> Not found </p>} />
      </Routes>
    </BrowserRouter>
  );
}

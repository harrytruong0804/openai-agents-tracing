import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Sidebar from './components/Sidebar';
import TracesPage from './components/TracesPage';
import TraceDetailPage from './components/TraceDetailPage';
import ApiKeysPage from './components/ApiKeysPage';
import SetupPage from './components/SetupPage';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="openai-tracing-theme">
      <BrowserRouter>
        <div className="h-screen bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div
            className={`h-screen transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/traces" replace />} />
              <Route path="/traces" element={<TracesPage />} />
              <Route path="/trace/:id" element={<TraceDetailPage />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/setup" element={<SetupPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

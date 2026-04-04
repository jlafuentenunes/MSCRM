import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Tickets from './components/Tickets';
import LeadDetails from './components/LeadDetails';
import Mailbox from './components/Mailbox';
import MailSettings from './components/MailSettings';
import AutomationManager from './components/AutomationManager';
import ServiceTypes from './components/ServiceTypes';

import ProjectManager from './components/ProjectManager';
import CommandPalette from './components/CommandPalette';

function App() {
  return (
    <Router>
      <CommandPalette />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/projects" element={<ProjectManager />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/mail" element={<Mailbox />} />
        <Route path="/mail/settings" element={<MailSettings />} />
        <Route path="/automations" element={<AutomationManager />} />
        <Route path="/services" element={<ServiceTypes />} />
        <Route path="/leads/:id" element={<LeadDetails />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

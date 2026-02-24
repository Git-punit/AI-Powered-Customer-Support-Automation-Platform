import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './components/KnowledgeBase';
import Tickets from './components/Tickets';
import Analytics from './components/Analytics';

const PAGES = {
    dashboard: Dashboard,
    chat: ChatInterface,
    knowledge: KnowledgeBase,
    tickets: Tickets,
    analytics: Analytics,
};

export default function App() {
    const [page, setPage] = useState('dashboard');

    const PageComponent = PAGES[page] || Dashboard;

    return (
        <div className="app" style={{ display: 'flex' }}>
            <Sidebar activePage={page} onNavigate={setPage} />
            <main className="main-content">
                <PageComponent />
            </main>
        </div>
    );
}

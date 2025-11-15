'use client';

import React, { useState, useCallback, memo } from 'react';
import ChatContainer from '@/components/chat/ChatContainer';
import SessionList from '@/components/sessions/SessionList';
import CreateSessionDialog from '@/components/sessions/CreateSessionDialog';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { setSidebarOpen } from '@/lib/store/slices/uiSlice';
import { useAppDispatch } from '@/lib/store/hooks';

const MainPage = memo(() => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const dispatch = useAppDispatch();

  const handleToggleSidebar = useCallback(() => {
    dispatch(setSidebarOpen(!sidebarOpen));
  }, [dispatch, sidebarOpen]);

  const handleCreateSession = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-xl font-bold">ReAct Agent</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'block' : 'hidden'} 
            lg:block 
            w-80 
            border-r 
            bg-muted/40
            transition-all
          `}
        >
          <div className="h-full p-4">
            <SessionList onCreateSession={handleCreateSession} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col m-4 overflow-hidden">
            <ChatContainer />
          </div>
        </main>
      </div>

      <CreateSessionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
});

MainPage.displayName = 'MainPage';

export default MainPage;


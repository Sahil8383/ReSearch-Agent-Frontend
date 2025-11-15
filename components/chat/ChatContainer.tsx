'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Separator } from '@/components/ui/separator';

const ChatContainer = memo(() => {
  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <ChatMessages />
      <Separator />
      <ChatInput />
    </Card>
  );
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;


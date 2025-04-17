import React, { useState } from 'react';
import ChannelList from '../components/ChannelList';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { useApp } from '../contexts/AppContext';

const ChatPage = () => {
  const { isConnected } = useApp();
  const [replyToMessage, setReplyToMessage] = useState(null);

  return (
    <div className="flex h-screen">
      <ChannelList />
      
      <div className="flex-1 flex flex-col">
        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 text-sm p-2 text-center">
            Connecting to server...
          </div>
        )}
        
        <MessageList onReplyToMessage={setReplyToMessage} />
        
        <ChatInput 
          replyToMessage={replyToMessage} 
          onCancelReply={() => setReplyToMessage(null)} 
        />
      </div>
    </div>
  );
};

export default ChatPage; 
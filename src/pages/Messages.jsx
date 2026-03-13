import { useState } from 'react';
import { useStore } from '../lib/useStore';

export default function Messages() {
  const { data, currentUser, store: s } = useStore();
  const [activeConv, setActiveConv] = useState(null);
  const [newMsg, setNewMsg] = useState('');

  const myConversations = data.messages.filter(c =>
    c.participants.includes(currentUser.id)
  );

  const active = myConversations.find(c => c.id === activeConv);

  const getConvName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    const otherId = conv.participants.find(id => id !== currentUser.id);
    const other = data.users.find(u => u.id === otherId);
    return other?.name || 'Unknown';
  };

  const getConvAvatar = (conv) => {
    if (conv.isGroup) return null;
    const otherId = conv.participants.find(id => id !== currentUser.id);
    const other = data.users.find(u => u.id === otherId);
    return other?.avatar;
  };

  const getLastMessage = (conv) => {
    const last = conv.messages[conv.messages.length - 1];
    if (!last) return '';
    const sender = data.users.find(u => u.id === last.senderId);
    return `${sender?.name?.split(' ')[0]}: ${last.text}`;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    s.addMessage(activeConv, {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: newMsg.trim(),
      date: new Date().toISOString(),
    });
    setNewMsg('');
  };

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <h2>Messages</h2>
        <div className="conversations-list">
          {myConversations.map(conv => (
            <button
              key={conv.id}
              className={`conversation-item ${activeConv === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConv(conv.id)}
            >
              {getConvAvatar(conv) ? (
                <img src={getConvAvatar(conv)} alt="" className="conv-avatar" />
              ) : (
                <div className="conv-avatar group-avatar">
                  {conv.participants.length}
                </div>
              )}
              <div className="conv-info">
                <span className="conv-name">{getConvName(conv)}</span>
                <span className="conv-preview">{getLastMessage(conv)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="messages-main">
        {!active ? (
          <div className="no-conversation">
            <p>Select a conversation to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <h3>{getConvName(active)}</h3>
              {active.isGroup && (
                <span className="group-members">
                  {active.participants.map(id => data.users.find(u => u.id === id)?.name?.split(' ')[0]).join(', ')}
                </span>
              )}
            </div>
            <div className="messages-list">
              {active.messages.map(msg => {
                const sender = data.users.find(u => u.id === msg.senderId);
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`message ${isMe ? 'mine' : 'theirs'}`}>
                    {!isMe && <img src={sender?.avatar} alt="" className="msg-avatar" />}
                    <div className="msg-bubble">
                      {!isMe && <span className="msg-sender">{sender?.name?.split(' ')[0]}</span>}
                      <p className="msg-text">{msg.text}</p>
                      <span className="msg-time">
                        {new Date(msg.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="message-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAppStore } from '../App';

export default function Messages() {
  const { data, currentUser, store: s } = useAppStore();
  const [activeConv, setActiveConv] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const myConversations = data.messages.filter(c =>
    c.participants.includes(currentUser.id)
  );

  const active = myConversations.find(c => c.id === activeConv);

  const otherUsers = data.users.filter(u => u.id !== currentUser.id);

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
    if (!last) return 'No messages yet';
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

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStartConversation = () => {
    if (selectedUsers.length === 0) return;

    const participants = [currentUser.id, ...selectedUsers];
    const isGroup = selectedUsers.length > 1;

    // Check if a 1:1 conversation already exists
    if (!isGroup) {
      const existing = myConversations.find(c =>
        !c.isGroup &&
        c.participants.length === 2 &&
        c.participants.includes(selectedUsers[0])
      );
      if (existing) {
        setActiveConv(existing.id);
        setShowNewConv(false);
        setSelectedUsers([]);
        return;
      }
    }

    const convId = s.startConversation(
      participants,
      isGroup,
      isGroup ? (groupName.trim() || selectedUsers.map(id => data.users.find(u => u.id === id)?.name?.split(' ')[0]).join(', ')) : ''
    );
    setActiveConv(convId);
    setShowNewConv(false);
    setSelectedUsers([]);
    setGroupName('');
  };

  return (
    <div className={`messages-page ${active ? 'has-active-conv' : ''}`}>
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
          <button className="new-conv-btn" onClick={() => setShowNewConv(!showNewConv)} title="New conversation">+</button>
        </div>

        {showNewConv && (
          <div className="new-conv-panel">
            <p className="new-conv-label">Select people to message:</p>
            <div className="new-conv-users">
              {otherUsers.map(user => (
                <button
                  key={user.id}
                  className={`new-conv-user ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <img src={user.avatar} alt="" className="new-conv-avatar" />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            {selectedUsers.length > 1 && (
              <input
                type="text"
                placeholder="Group name (optional)"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="group-name-input"
              />
            )}
            <button
              className="btn-primary btn-sm start-conv-btn"
              onClick={handleStartConversation}
              disabled={selectedUsers.length === 0}
            >
              {selectedUsers.length > 1 ? 'Start Group Chat' : 'Start Chat'}
            </button>
          </div>
        )}

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
          {myConversations.length === 0 && !showNewConv && (
            <div className="no-convs-hint">
              <p>No conversations yet.</p>
              <p>Tap <strong>+</strong> to start one.</p>
            </div>
          )}
        </div>
      </div>

      <div className="messages-main">
        {!active ? (
          <div className="no-conversation">
            <p>{myConversations.length === 0 ? 'Start a conversation using the + button.' : 'Select a conversation to start chatting.'}</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <h3>
                <button className="mobile-back-btn" onClick={() => setActiveConv(null)}>← </button>
                {getConvName(active)}
              </h3>
              {active.isGroup && (
                <span className="group-members">
                  {active.participants.map(id => data.users.find(u => u.id === id)?.name?.split(' ')[0]).join(', ')}
                </span>
              )}
            </div>
            <div className="messages-list">
              {active.messages.length === 0 && (
                <div className="no-messages-yet">
                  <p>Say hello! This is the beginning of your conversation.</p>
                </div>
              )}
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

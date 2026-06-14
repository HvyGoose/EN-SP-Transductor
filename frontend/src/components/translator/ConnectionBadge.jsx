import { WifiSlash, WifiHigh } from '@phosphor-icons/react';

export const ConnectionBadge = ({ isOnline, offlineMode }) => {
  const content = offlineMode
    ? { icon: <WifiSlash size={14} />, label: 'Offline' }
    : isOnline
      ? { icon: <WifiHigh size={14} />, label: 'Online' }
      : { icon: <WifiSlash size={14} />, label: 'No Connection' };

  return (
    <div
      data-testid="connection-badge"
      className={`connection-badge ${isOnline ? 'online' : 'offline'} ${offlineMode ? 'offline-mode' : ''}`}
    >
      {content.icon}
      <span className="hidden sm:inline">{content.label}</span>
    </div>
  );
};
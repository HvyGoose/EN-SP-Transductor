import { WifiSlash, WifiHigh } from '@phosphor-icons/react';

const getConnectionContent = ({ isOnline, offlineMode }) => {
  if (offlineMode) {
    return { icon: <WifiSlash size={14} />, label: 'Offline' };
  }

  if (isOnline) {
    return { icon: <WifiHigh size={14} />, label: 'Online' };
  }

  return { icon: <WifiSlash size={14} />, label: 'No Connection' };
};

export const ConnectionBadge = ({ isOnline, offlineMode }) => {
  const content = getConnectionContent({ isOnline, offlineMode });

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
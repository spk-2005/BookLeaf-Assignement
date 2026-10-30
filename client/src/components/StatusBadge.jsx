import React from 'react';

export function StatusBadge({ status }) {
  const getStyle = () => {
    switch (status) {
      case 'Open':
        return 'badge-open';
      case 'In Progress':
        return 'badge-in-progress';
      case 'Resolved':
        return 'badge-resolved';
      case 'Closed':
        return 'badge-closed';
      default:
        return 'badge-open';
    }
  };

  return (
    <span className={`badge ${getStyle()}`}>
      ● {status || 'Open'}
    </span>
  );
}

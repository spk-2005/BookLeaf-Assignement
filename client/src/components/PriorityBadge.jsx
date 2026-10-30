import React from 'react';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

export function PriorityBadge({ priority, isOverridden = false }) {
  const getConfig = () => {
    switch (priority) {
      case 'Critical':
        return {
          className: 'badge-critical',
          icon: <AlertCircle size={12} strokeWidth={2.5} />
        };
      case 'High':
        return {
          className: 'badge-high',
          icon: <AlertTriangle size={12} strokeWidth={2.5} />
        };
      case 'Medium':
        return {
          className: 'badge-medium',
          icon: <Clock size={12} strokeWidth={2.5} />
        };
      case 'Low':
        return {
          className: 'badge-low',
          icon: <Info size={12} strokeWidth={2.5} />
        };
      default:
        return {
          className: 'badge-medium',
          icon: <Clock size={12} strokeWidth={2.5} />
        };
    }
  };

  const { className, icon } = getConfig();

  return (
    <span className={`badge ${className}`} title={isOverridden ? 'Manual Admin Override' : 'AI-Assigned'}>
      {icon}
      <span>{priority}</span>
      {isOverridden && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Overridden)</span>}
    </span>
  );
}

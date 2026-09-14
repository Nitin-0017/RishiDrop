import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'default' | 'outline' | 'dot';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();

  let bg = 'bg-[#FAFAFA] text-[#344054] border-[#E6E8EC]';
  let dotColor = 'bg-[#667085]';

  if (s === 'STORED' || s === 'OCCUPIED' || s === 'RECEIVED') {
    bg = 'bg-[#FBEAEC] text-[#A6192E] border-[#F5C6CB]';
    dotColor = 'bg-[#A6192E]';
  } else if (s === 'COLLECTED' || s === 'EMPTY') {
    bg = 'bg-[#F0FDF4] text-[#16865B] border-[#DCFCE7]';
    dotColor = 'bg-[#16865B]';
  } else if (s === 'OVERDUE' || s === 'ISSUE' || s === 'CANCELLED' || s === 'RETURNED') {
    bg = 'bg-[#FFF6F7] text-[#A6192E] border-[#F5C6CB]';
    dotColor = 'bg-[#A6192E]';
  } else if (s === 'MAINTENANCE') {
    bg = 'bg-[#FFF4DD] text-[#8A5A00] border-[#FDE68A]';
    dotColor = 'bg-[#C77700]';
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses} ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};

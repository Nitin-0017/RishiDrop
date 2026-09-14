import React from 'react';
import { Check, CheckCheck, Clock, X } from 'lucide-react';

interface WhatsAppStatusBadgeProps {
  status?: string | null;
  error?: string | null;
  size?: 'sm' | 'xs';
}

export const WhatsAppStatusBadge: React.FC<WhatsAppStatusBadgeProps> = ({
  status,
  error,
  size = 'xs',
}) => {
  const s = (status || 'QUEUED').toUpperCase();
  const sizeCls = size === 'xs' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  if (s === 'READ') {
    return (
      <span
        title="WhatsApp message read by recipient"
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap align-middle ${sizeCls}`}
      >
        <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Read</span>
      </span>
    );
  }

  if (s === 'DELIVERED') {
    return (
      <span
        title="WhatsApp message delivered to student device"
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs whitespace-nowrap align-middle ${sizeCls}`}
      >
        <CheckCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span>Delivered</span>
      </span>
    );
  }

  if (s === 'SENT') {
    return (
      <span
        title="WhatsApp message sent from server"
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs whitespace-nowrap align-middle ${sizeCls}`}
      >
        <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span>Sent</span>
      </span>
    );
  }

  if (s === 'FAILED') {
    return (
      <span
        title={error || 'WhatsApp message failed to deliver'}
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap align-middle ${sizeCls}`}
      >
        <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Failed</span>
      </span>
    );
  }

  // QUEUED / Sending
  return (
    <span
      title="WhatsApp message queued for delivery"
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap align-middle ${sizeCls}`}
    >
      <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
      <span>Sending...</span>
    </span>
  );
};

export default WhatsAppStatusBadge;

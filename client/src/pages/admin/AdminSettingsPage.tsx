import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analytics.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Settings,
  MessageSquare,
  Clock,
  Shield,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Key
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTriggeringJob, setIsTriggeringJob] = useState(false);
  const [jobResult, setJobResult] = useState<any | null>(null);

  useEffect(() => {
    analyticsApi.getSettings().then((res) => {
      setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const handleTriggerAgedReminders = async () => {
    setIsTriggeringJob(true);
    setJobResult(null);
    try {
      const res = await analyticsApi.triggerUnclaimedJob();
      setJobResult(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to trigger cron job');
    } finally {
      setIsTriggeringJob(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading system settings..." />;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              System Settings & Integration Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              WhatsApp Business Cloud API configuration, background jobs, and campus parameters.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: WhatsApp Cloud API Integration Settings (6 cols) */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-whatsapp-700 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-whatsapp-600" />
            <span>Meta WhatsApp Cloud API Gateway</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            RishiDrop communicates with students via Meta's official WhatsApp Business Cloud API.
          </p>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Webhook Verify Endpoint</span>
              <code className="font-mono text-brand-700 text-[11px] block mt-0.5 break-all">
                GET /api/whatsapp/webhook
              </code>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Webhook Message Endpoint</span>
              <code className="font-mono text-brand-700 text-[11px] block mt-0.5 break-all">
                POST /api/whatsapp/webhook
              </code>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Verify Token</span>
              <code className="font-mono text-slate-800 text-[11px] block mt-0.5">
                campusdrop_verify_token_2026
              </code>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Provider Architecture</span>
              <span className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>IWhatsAppProvider • MetaWhatsAppProvider / DevelopmentSimulator</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Background Cron Jobs & Aged Parcel Escalation (6 cols) */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-700 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Automated Cron Jobs (Unclaimed Parcels)</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Node-cron executes hourly to check aged parcels: 24h (1st WhatsApp reminder), 48h (2nd WhatsApp notice), and 72h (Overdue alert).
          </p>

          {jobResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 animate-fade-in">
              <div className="font-bold flex items-center space-x-1 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Manual Cron Execution Completed!</span>
              </div>
              <p>Parcels Evaluated: <strong>{jobResult.processedCount}</strong> • WhatsApp Reminders Dispatched: <strong>{jobResult.remindersSent}</strong></p>
            </div>
          )}

          <button
            onClick={handleTriggerAgedReminders}
            disabled={isTriggeringJob}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2"
          >
            <RotateCw className={`w-4 h-4 ${isTriggeringJob ? 'animate-spin' : ''}`} />
            <span>{isTriggeringJob ? 'Evaluating Parcels & Sending WhatsApp...' : 'Trigger Aged Parcel Reminders Now'}</span>
          </button>
        </div>

      </div>

      {/* Database System Settings Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">Campus System Constants</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Setting Key</th>
                <th className="pb-3">Value</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="py-3 font-mono font-bold text-brand-800">{st.key}</td>
                  <td className="py-3 font-mono text-slate-900">{st.value}</td>
                  <td className="py-3 text-slate-500">{st.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

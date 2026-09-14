import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { whatsappApi } from '../../services/api/whatsapp.api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  X,
  Send,
  CheckCheck,
  Package,
  QrCode,
  HelpCircle,
  RotateCw,
  Bot,
  UserCheck,
  Shield,
  KeyRound,
  Building2,
} from 'lucide-react';

interface WhatsAppSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageBubble {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  qrPayload?: string | null;
  qrData?: string | null;
  otp?: string | null;
  parcelId?: string | null;
  options?: string[];
}

interface AccountMeta {
  role: 'STUDENT' | 'GUARD' | 'ADMIN' | 'UNREGISTERED';
  displayName: string;
  identifier: string;
  phone: string;
  digits10: string;
  errorType?: string;
}

// Preset Seeded Personas matching the university database
const PERSONA_PRESETS = [
  {
    id: 'student_manjeet',
    role: 'STUDENT' as const,
    name: 'Manjeet Sharma',
    identifier: 'CS2023-0142',
    phone: '9876543210',
    label: '🎓 Student: Manjeet',
    badge: 'CS2023-0142',
  },
  {
    id: 'guard_rajesh',
    role: 'GUARD' as const,
    name: 'Rajesh Kumar',
    identifier: 'GD-001',
    phone: '9876500001',
    label: '🛡️ Guard: Rajesh',
    badge: 'GD-001',
  },
  {
    id: 'admin_vikram',
    role: 'ADMIN' as const,
    name: 'Dr. Vikram Malhotra',
    identifier: 'ADMIN-01',
    phone: '9876500000',
    label: '🏢 Admin: Dr. Vikram',
    badge: 'Admin',
  },
];

// Initial conversation histories with stable unique IDs to prevent duplicate welcome messages
const INITIAL_HISTORIES: Record<string, MessageBubble[]> = {
  '9876543210': [
    {
      id: 'welcome-student-9876543210',
      sender: 'bot',
      text: `👋 Hi Manjeet Sharma! Welcome to RishiDrop.\n\nHow can I help you today?\n\n1️⃣ 📦 My Deliveries\n2️⃣ 📱 Pickup QR\n3️⃣ 🔑 Get OTP\n5️⃣ ℹ️ Hub Info\n\nReply with 1, 2, 3, or 5, or use the quick buttons below.`,
      timestamp: new Date('2026-09-09T18:00:00Z'),
    }
  ],
  '9876500001': [
    {
      id: 'welcome-guard-9876500001',
      sender: 'bot',
      text: `👮 *RishiDrop Guard Logistics Terminal*\n\nWelcome Rajesh Kumar (Badge: GD-001).\n\nUse quick commands below to check pending parcel intakes, scan student pickup passes, or verify OTPs.`,
      timestamp: new Date('2026-09-09T18:00:00Z'),
    }
  ],
  '9876500000': [
    {
      id: 'welcome-admin-9876500000',
      sender: 'bot',
      text: `🏢 *RishiDrop Administration Portal*\n\nWelcome Dr. Vikram Malhotra.\n\nAccess system health metrics and university parcel analytics.`,
      timestamp: new Date('2026-09-09T18:00:00Z'),
    }
  ],
};

/**
 * Idempotent message updater ensuring no message is ever duplicated in conversation state
 */
function upsertMessage(
  existingList: MessageBubble[],
  incoming: MessageBubble
): { updatedList: MessageBubble[]; isNew: boolean } {
  // 1. Strict ID deduplication check
  const idMatchIndex = existingList.findIndex((m) => m.id === incoming.id);
  if (idMatchIndex !== -1) {
    const nextList = [...existingList];
    nextList[idMatchIndex] = {
      ...nextList[idMatchIndex],
      ...incoming,
      qrPayload: incoming.qrPayload || nextList[idMatchIndex].qrPayload,
      qrData: incoming.qrData || nextList[idMatchIndex].qrData,
      otp: incoming.otp || nextList[idMatchIndex].otp,
      parcelId: incoming.parcelId || nextList[idMatchIndex].parcelId,
    };
    return { updatedList: nextList, isNew: false };
  }

  // 2. Fallback content + time window deduplication:
  // Catches cases where Socket.IO and HTTP response return the same bot message within 4 seconds
  const incomingTime = incoming.timestamp ? new Date(incoming.timestamp).getTime() : Date.now();
  const duplicateContentIndex = existingList.findIndex(
    (m) =>
      m.sender === incoming.sender &&
      m.text.trim() === incoming.text.trim() &&
      Math.abs(new Date(m.timestamp).getTime() - incomingTime) < 4000
  );

  if (duplicateContentIndex !== -1) {
    const nextList = [...existingList];
    nextList[duplicateContentIndex] = {
      ...nextList[duplicateContentIndex],
      id: incoming.id.startsWith('wamid') ? incoming.id : nextList[duplicateContentIndex].id,
      qrPayload: incoming.qrPayload || nextList[duplicateContentIndex].qrPayload,
      qrData: incoming.qrData || nextList[duplicateContentIndex].qrData,
      otp: incoming.otp || nextList[duplicateContentIndex].otp,
      parcelId: incoming.parcelId || nextList[duplicateContentIndex].parcelId,
    };
    return { updatedList: nextList, isNew: false };
  }

  // 3. Authentically new message
  return { updatedList: [...existingList, incoming], isNew: true };
}

export const WhatsAppSimulatorModal: React.FC<WhatsAppSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Active persona phone number (Default to Student Manjeet Sharma: 9876543210)
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [accountMeta, setAccountMeta] = useState<AccountMeta>({
    role: 'STUDENT',
    displayName: 'Manjeet Sharma',
    identifier: 'CS2023-0142',
    phone: '9876543210',
    digits10: '9876543210',
  });
  const [accountLabel, setAccountLabel] = useState('Manjeet Sharma (CS2023-0142)');

  // Individual conversation history per phone number to prevent mixing sessions
  const [histories, setHistories] = useState<Record<string, MessageBubble[]>>(INITIAL_HISTORIES);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guard to ensure each session welcome message is only initialized once
  const initializedPhonesRef = useRef<Set<string>>(new Set(['9876543210', '9876500001', '9876500000']));

  const cleanCurrentPhone = phoneNumber.replace(/\D/g, '').slice(-10);

  // Ensure new unknown phone numbers get initialized once with a stable welcome message
  useEffect(() => {
    if (cleanCurrentPhone && !initializedPhonesRef.current.has(cleanCurrentPhone)) {
      initializedPhonesRef.current.add(cleanCurrentPhone);
      setHistories((prev) => {
        if (prev[cleanCurrentPhone]) return prev;
        return {
          ...prev,
          [cleanCurrentPhone]: [
            {
              id: `init-welcome-${cleanCurrentPhone}`,
              sender: 'bot',
              text: `👋 Welcome to RishiDrop WhatsApp Bot!\n\nSend *Hi* or choose an action below to get started.`,
              timestamp: new Date(),
            }
          ]
        };
      });
    }
  }, [cleanCurrentPhone]);

  // Deduplicated and memoized message list for active chat view
  const currentMessages = useMemo(() => {
    const list = histories[cleanCurrentPhone] || [];
    const seen = new Set<string>();
    return list.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [histories, cleanCurrentPhone]);

  // Auto-scroll to latest message in active conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isSending]);

  // Clear unread count when switching to a phone number
  useEffect(() => {
    if (cleanCurrentPhone && unreadCounts[cleanCurrentPhone]) {
      setUnreadCounts((prev) => ({
        ...prev,
        [cleanCurrentPhone]: 0,
      }));
    }
  }, [cleanCurrentPhone, unreadCounts]);

  // Resolve account dynamically when phone number changes
  useEffect(() => {
    const raw = phoneNumber.trim();
    if (!raw || raw.length < 5) {
      setAccountLabel('Enter mobile number');
      setAccountMeta({
        role: 'UNREGISTERED',
        displayName: 'Enter number',
        identifier: '',
        phone: raw,
        digits10: '',
      });
      return;
    }

    let isMounted = true;
    whatsappApi
      .resolveAccount(raw)
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          const acc = res.data;
          setAccountMeta(acc);
          if (acc.role === 'STUDENT') {
            setAccountLabel(`${acc.displayName} (${acc.identifier})`);
          } else if (acc.role === 'GUARD') {
            setAccountLabel(`${acc.displayName} (${acc.identifier})`);
          } else if (acc.role === 'ADMIN') {
            setAccountLabel(`${acc.displayName} (Admin)`);
          } else {
            setAccountLabel(`Unregistered (+91 ${acc.digits10 || raw})`);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccountLabel(`Phone: ${raw}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [phoneNumber]);

  // Real-time incoming WhatsApp notification listener via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleIncomingChatMessage = (data: any) => {
      const recipientDigits = (data.recipient || '').replace(/\D/g, '').slice(-10);
      if (!recipientDigits || !data.text) return;

      const newBubble: MessageBubble = {
        id: data.messageId || `live-${recipientDigits}-${Date.now()}`,
        sender: 'bot',
        text: data.text,
        timestamp: new Date(data.timestamp || Date.now()),
        parcelId: data.parcelId,
        qrPayload: data.qrPayload,
        qrData: data.qrData,
        otp: data.otp,
      };

      // Route message directly to recipient's private conversation history idempotently
      setHistories((prev) => {
        const prevList = prev[recipientDigits] || [];
        const { updatedList, isNew } = upsertMessage(prevList, newBubble);

        if (isNew && recipientDigits !== cleanCurrentPhone) {
          setUnreadCounts((u) => ({
            ...u,
            [recipientDigits]: (u[recipientDigits] || 0) + 1,
          }));
        }

        return {
          ...prev,
          [recipientDigits]: updatedList,
        };
      });
    };

    socket.on('whatsapp_chat_message', handleIncomingChatMessage);

    return () => {
      socket.off('whatsapp_chat_message', handleIncomingChatMessage);
    };
  }, [socket, cleanCurrentPhone]);

  if (!isOpen) return null;

  /**
   * Central command dispatcher for both button clicks and typed commands
   */
  const handleSendMessage = async (commandToSend?: string) => {
    const text = (commandToSend || inputMessage).trim();
    if (!text || isSending) return;

    const targetPhone = cleanCurrentPhone;
    const userMsgId = `user-${targetPhone}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const userMsg: MessageBubble = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    // 1. Immediately append user message bubble idempotently
    setHistories((prev) => {
      const currentList = prev[targetPhone] || [];
      const { updatedList } = upsertMessage(currentList, userMsg);
      return {
        ...prev,
        [targetPhone]: updatedList,
      };
    });

    setInputMessage('');
    setIsSending(true);

    try {
      // 2. Dispatch to backend WhatsApp bot controller
      const res = await whatsappApi.simulateMessage(phoneNumber, text);
      const replyData = res.data;

      // Update role/identity if returned in reply
      if (replyData?.role && replyData.role !== accountMeta.role) {
        setAccountMeta((prev) => ({
          ...prev,
          role: replyData.role as any,
          displayName: replyData.user?.name || prev.displayName,
          identifier: replyData.user?.identifier || prev.identifier,
        }));
      }

      // 3. Merge bot response idempotently (prevents duplicate with Socket.IO stream)
      if (replyData?.reply) {
        const botMsg: MessageBubble = {
          id: replyData.messageId || `bot-${targetPhone}-${Date.now()}`,
          sender: 'bot',
          text: replyData.reply,
          timestamp: new Date(),
          qrPayload: replyData.qrPayload,
          qrData: replyData.qrData,
          otp: replyData.otp,
          parcelId: replyData.parcelId,
        };

        setHistories((prev) => {
          const currentList = prev[targetPhone] || [];
          const { updatedList } = upsertMessage(currentList, botMsg);
          return {
            ...prev,
            [targetPhone]: updatedList,
          };
        });
      }

      setIsSending(false);
    } catch (error: any) {
      console.error('Failed to process WhatsApp bot command:', error);
      const errMsg: MessageBubble = {
        id: `err-${targetPhone}-${Date.now()}`,
        sender: 'bot',
        text: "Sorry, I couldn't process your request right now. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setHistories((prev) => {
        const currentList = prev[targetPhone] || [];
        const { updatedList } = upsertMessage(currentList, errMsg);
        return {
          ...prev,
          [targetPhone]: updatedList,
        };
      });
      setIsSending(false);
    }
  };

  const handleResetChat = () => {
    const targetPhone = cleanCurrentPhone;
    const defaultWelcome = INITIAL_HISTORIES[targetPhone]?.[0] || {
      id: `reset-${targetPhone}-${Date.now()}`,
      sender: 'bot',
      text: `👋 Hi! Welcome to RishiDrop.\n\nSend *Hi* or choose an action below to get started.`,
      timestamp: new Date(),
    };

    setHistories((prev) => ({
      ...prev,
      [targetPhone]: [defaultWelcome],
    }));
  };

  const handleSelectPersona = (preset: typeof PERSONA_PRESETS[0]) => {
    setPhoneNumber(preset.phone);
  };

  const isGuard = accountMeta.role === 'GUARD';
  const isAdmin = accountMeta.role === 'ADMIN';
  const isStudent = accountMeta.role === 'STUDENT';

  // Helper to determine if a bot message should render interactive action buttons
  const shouldShowActionButtons = (msg: MessageBubble) => {
    if (msg.sender !== 'bot') return false;
    const t = msg.text.toLowerCase();
    return (
      t.includes('choose an option below') ||
      t.includes('rishidrop parcel received') ||
      t.includes('how can i help you today') ||
      t.includes('select a parcel to continue')
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col h-[670px]">
        
        {/* WhatsApp Mobile Header */}
        <div className="bg-whatsapp-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold border border-white/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-wide">RishiDrop Official</span>
              </div>
              <span className="text-[11px] text-emerald-100 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>WhatsApp Business API • Online</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset Active Session"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Switcher Tabs: Student, Guard, Admin */}
        <div className="bg-slate-950 px-2 py-1.5 border-b border-slate-800 flex items-center space-x-1">
          {PERSONA_PRESETS.map((p) => {
            const isActive = cleanCurrentPhone === p.phone;
            const unread = unreadCounts[p.phone] || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersona(p)}
                className={`flex-1 relative py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <span className="truncate">{p.label}</span>
                {unread > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Phone Number & Account Identity Bar */}
        <div className="bg-slate-800/95 border-b border-slate-700 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            {isGuard ? (
              <Shield className="w-3.5 h-3.5 text-blue-400" />
            ) : isAdmin ? (
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-semibold text-slate-400">
              {isGuard ? 'Guard:' : isAdmin ? 'Admin:' : 'Student:'}
            </span>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`bg-slate-900 border border-slate-700 font-mono rounded px-2 py-0.5 w-28 text-xs focus:outline-hidden ${
                isGuard
                  ? 'text-blue-400 focus:border-blue-500'
                  : isAdmin
                  ? 'text-purple-400 focus:border-purple-500'
                  : 'text-emerald-400 focus:border-emerald-500'
              }`}
              placeholder="9876543210"
            />
          </div>
          <span className={`text-[10px] font-bold truncate max-w-[170px] ${
            accountMeta.role === 'GUARD' ? 'text-blue-300' :
            accountMeta.role === 'STUDENT' ? 'text-emerald-300' :
            accountMeta.role === 'ADMIN' ? 'text-purple-300' : 'text-amber-300'
          }`}>
            {accountLabel}
          </span>
        </div>

        {/* Chat Message Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95" style={{ backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          {currentMessages.map((m) => {
            const isBot = m.sender === 'bot';
            const showActionButtons = isBot && shouldShowActionButtons(m);

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs leading-relaxed whitespace-pre-wrap ${
                    isBot
                      ? 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-slate-700/50'
                      : 'bg-whatsapp-700 text-white rounded-tr-xs'
                  }`}
                >
                  {m.text}

                  {/* Scannable Pickup QR Code displayed inside message bubble */}
                  {m.qrPayload && (
                    <div className="mt-3 p-3 bg-white rounded-xl text-center text-slate-900 border border-slate-200 shadow-xs flex flex-col items-center">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <QRCodeSVG
                          value={m.qrPayload}
                          size={120}
                          level="M"
                        />
                      </div>
                      <div className="mt-1.5 font-mono text-xs font-black text-slate-900">
                        {m.parcelId}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold">
                        Scannable by Guard Handover Scanner
                      </div>
                    </div>
                  )}

                  {/* Real Verification OTP Banner */}
                  {m.otp && (
                    <div className="mt-2.5 p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-center">
                      <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Verification OTP</div>
                      <div className="text-xl font-mono font-black text-emerald-400 tracking-widest my-0.5">{m.otp}</div>
                      <div className="text-[9px] text-emerald-200/70">Show this OTP at the gate for collection</div>
                    </div>
                  )}

                  {/* Interactive In-Message WhatsApp Buttons */}
                  {showActionButtons && isStudent && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleSendMessage('📦 My Deliveries')}
                        disabled={isSending}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#2a3942] hover:bg-[#32434e] text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-emerald-500/30 active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>📦 My Deliveries</span>
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('📱 Pickup QR')}
                          disabled={isSending}
                          className="py-1.5 px-2 rounded-lg bg-[#2a3942] hover:bg-[#32434e] text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-emerald-500/30 active:scale-98 transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>📱 Pickup QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendMessage('🔑 Get OTP')}
                          disabled={isSending}
                          className="py-1.5 px-2 rounded-lg bg-[#2a3942] hover:bg-[#32434e] text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-emerald-500/30 active:scale-98 transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>🔑 Get OTP</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`text-[9px] mt-1 flex items-center justify-end space-x-1 ${isBot ? 'text-slate-400' : 'text-emerald-200'}`}>
                    <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isBot && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-[#202c33] px-3 py-1.5 rounded-full w-fit animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span>RishiDrop is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Interactive Chips - Role Sensitive */}
        <div className="bg-slate-800/80 px-3 py-2 border-t border-slate-700/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleSendMessage('Hi')}
            disabled={isSending}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>Hi / Menu</span>
          </button>

          {isGuard ? (
            <>
              <button
                type="button"
                onClick={() => handleSendMessage('1. Receive Parcel')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Package className="w-3 h-3 text-amber-400" />
                <span>1. Receive Parcel</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('2. My Assigned Deliveries')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-blue-400" />
                <span>2. My Deliveries</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('3. Scan Pickup QR')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3 text-emerald-400" />
                <span>3. Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('4. Verify OTP')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-purple-400" />
                <span>4. Verify OTP</span>
              </button>
            </>
          ) : isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => handleSendMessage('1. System Status')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>1. System Status</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('2. Uncollected Parcels')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Package className="w-3 h-3 text-amber-400" />
                <span>2. Uncollected</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('3. Storage Overview')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-blue-400" />
                <span>3. Storage Racks</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSendMessage('📦 My Deliveries')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Package className="w-3 h-3 text-amber-400" />
                <span>📦 My Deliveries</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('📱 Pickup QR')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3 text-emerald-400" />
                <span>📱 Pickup QR</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('🔑 Get OTP')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-purple-400" />
                <span>🔑 Get OTP</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('5. Hub Info')}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-600 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-blue-400" />
                <span>5. Hub Info</span>
              </button>
            </>
          )}
        </div>

        {/* Text Input & Send Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="bg-slate-800 p-2.5 flex items-center space-x-2 border-t border-slate-700"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isGuard
                ? "Type command (e.g. 1, 2, 3, 4, Verify 123456)..."
                : isAdmin
                ? "Type admin command (e.g. 1, 2, 3, status)..."
                : "Type message or command (e.g. Hi, 1, QR, OTP)..."
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="w-9 h-9 rounded-full bg-whatsapp-600 hover:bg-whatsapp-700 disabled:opacity-40 text-white flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

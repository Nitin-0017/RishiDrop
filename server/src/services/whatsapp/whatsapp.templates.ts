/**
 * Standardized CampusDrop WhatsApp Templates
 * University Parcel Management Workflow
 */

export const whatsappTemplates = {
  welcomeMenu: (studentName?: string) => {
    const greeting = studentName ? `Hi ${studentName}!` : 'Hi!';
    return (
`👋 ${greeting} Welcome to CampusDrop.

How can I help you?

1️⃣ Check parcel status
2️⃣ Find storage location
3️⃣ Contact security desk

Reply with 1, 2, or 3.`
    );
  },

  unregisteredStudent: (phone: string) => {
    return (
`Sorry, I couldn't find a CampusDrop account linked to this WhatsApp number.

Please contact the university security desk to register your number.`
    );
  },

  arrivalNormal: (
    studentName: string,
    partnerName: string,
    parcelId: string,
    rackName: string,
    slotNumber: string,
    receivedAt?: Date | string
  ) => {
    const firstName = studentName ? studentName.split(' ')[0] : 'Student';
    const dateObj = receivedAt ? (typeof receivedAt === 'string' ? new Date(receivedAt) : receivedAt) : new Date();
    const dateFormatted = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + dateObj.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const storageLine = rackName === 'Oversized Storage' || slotNumber.includes('-')
      ? `📍 *Storage:* Oversized Storage (Ref: ${slotNumber})`
      : `📍 *Storage:* ${rackName} → Slot ${slotNumber}`;

    return (
`📦 *RishiDrop Parcel Received*

Hi ${firstName}!

Your parcel has been received at the university gate.

📦 *Delivery Partner:* ${partnerName}
🆔 *Parcel ID:* ${parcelId}
${storageLine}
🕐 *Received:* ${dateFormatted}

Your parcel is safely stored and ready for pickup.

Choose an option below:
1️⃣ 📦 My Deliveries
2️⃣ 📱 Pickup QR
3️⃣ 🔑 Get OTP`
    );
  },

  parcelStatusReply: (
    partnerName: string,
    trackingNumber: string | null | undefined,
    status: string,
    rackName: string,
    slotNumber: string,
    receivedAt: Date | string,
    parcelId?: string
  ) => {
    const dateObj = typeof receivedAt === 'string' ? new Date(receivedAt) : receivedAt;
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const trackingDisplay = trackingNumber ? `Tracking: ${trackingNumber}\n` : (parcelId ? `Parcel ID: ${parcelId}\n` : '');

    return (
`📦 Your Parcel

${partnerName}
${trackingDisplay}
Status: ${status}

📍 Location:
${rackName} → ${slotNumber}

Received:
${formattedDate}`
    );
  },

  storageLocationReply: (parcels: Array<{ partner: string; rack: string; slot: string; parcelId: string }>) => {
    if (parcels.length === 0) {
      return (
`📍 Storage Location

You have no stored packages at this time.`
      );
    }

    const list = parcels.map((p, idx) => 
      `${idx + 1}. *${p.partner}* (${p.parcelId})\n📍 ${p.rack} → Slot ${p.slot}`
    ).join('\n\n');

    return (
`📍 Storage Location

${list}

Counter: Main Gate Delivery Hub, Rishihood University`
    );
  },

  securityDeskContact: () => {
    return (
`👮 Campus Security Desk

Main Gate 1 Delivery Counter
Helpline: +91 98765 00001
Operating Hours: 08:00 AM – 10:00 PM (Daily)
Location: Rishihood University Main Entrance`
    );
  },

  collectionConfirmation: (
    studentName: string,
    partnerName: string,
    parcelId?: string,
    rackName?: string,
    slotNumber?: string,
    collectedAt?: Date | string
  ) => {
    const dateObj = collectedAt ? (typeof collectedAt === 'string' ? new Date(collectedAt) : collectedAt) : new Date();
    const dateFormatted = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + dateObj.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const storageLine = rackName && slotNumber
      ? `\n📍 Previously stored at: ${rackName} → Slot ${slotNumber}`
      : '';
    const parcelLine = parcelId ? `\n📦 Parcel ID: ${parcelId}` : '';

    return (
`✅ *Parcel Collected*

Your parcel from ${partnerName} has been successfully handed over.${parcelLine}${storageLine}
🕐 *Collected:* ${dateFormatted}

Thank you for using RishiDrop! 🎓`
    );
  },

  pickupQrMessage: (studentName: string, parcelId: string, qrUrl: string, token: string, expiryMinutes = 15) => {
    return (
`*Your Secure Pickup Pass*

Hi ${studentName}, here is your single-use pass for parcel \`${parcelId}\`:

*Token:* \`${token}\`
*Pass Link:* ${qrUrl}
*Expires in:* ${expiryMinutes} minutes

Show this QR code at the Main Gate Storage Counter for verification & collection.`
    );
  },

  otpAlertMessage: (studentName: string, parcelId: string, otpCode: string, expiryMinutes = 10) => {
    return (
`*CampusDrop Verification OTP*

Hi ${studentName}, your one-time pickup code for parcel \`${parcelId}\` is:

*${otpCode}*

*Valid for:* ${expiryMinutes} minutes
Notice: Do not share this OTP with anyone except the on-duty security guard at the collection counter.`
    );
  },

  helpInfo: () => {
    return (
`*CampusDrop Support & Information*

*Main Gate Delivery Hub:* Gate 1 Security Complex
*Operating Hours:* 08:00 AM – 10:00 PM (All 7 Days)
*Gate Security Helpline:* +91 98765 00001
*Admin Office:* logistics@campusdrop.demo

Reply *1* anytime to see your active parcels.`
    );
  },

  reminder24h: (studentName: string, partnerName: string, parcelId: string, location: string) => {
    return (
`⚠️ Parcel Collection Reminder (24h)

Hi ${studentName},

Your ${partnerName} parcel (${parcelId}) is awaiting pickup at ${location}.
Please collect it at the Main Gate Delivery Counter during counter hours (08:00 AM – 10:00 PM).`
    );
  },

  reminder48h: (studentName: string, partnerName: string, parcelId: string, location: string) => {
    return (
`⚠️ Urgent: Parcel Collection Reminder (48h)

Hi ${studentName},

Your ${partnerName} parcel (${parcelId}) has been stored for over 48 hours at ${location}.
Please collect it promptly from the Main Gate Delivery Hub.`
    );
  },

  alert72h: (studentName: string, partnerName: string, parcelId: string, location: string) => {
    return (
`🚨 Final Notice: Unclaimed Parcel (72h+)

Hi ${studentName},

Your ${partnerName} parcel (${parcelId}) stored at ${location} is overdue.
Unclaimed parcels may be flagged for campus return. Please visit the Main Gate Security Counter immediately.`
    );
  }
};

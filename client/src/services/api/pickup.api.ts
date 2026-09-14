import { apiClient } from './axiosClient';

export const pickupApi = {
  generateQr: async (parcelId: string) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        token: string;
        expiresAt: string;
        validityMinutes: number;
        parcel: any;
      };
    }>('/pickups/qr', { parcelId });
    return res.data;
  },

  generateOtp: async (parcelId: string) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        otpCode: string;
        expiresAt: string;
        validityMinutes: number;
        parcelId: string;
      };
    }>('/pickups/otp', { parcelId });
    return res.data;
  },

  verifyQr: async (token: string) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        isValid: boolean;
        token?: string;
        student: any;
        parcel?: any;
        targetParcel?: any;
        allActiveParcels?: any[];
        scannedByGuard?: any;
      };
    }>('/pickups/verify-qr', { token });
    return res.data;
  },

  verifyParcelQr: async (qrData: string) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        isValid: boolean;
        parcel: any;
        student: any;
        scannedByGuard: {
          id: string;
          name: string;
          badgeNumber: string;
          displayText: string;
        };
      };
    }>('/pickups/verify-parcel-qr', { qrData });
    return res.data;
  },

  verifyOtp: async (parcelIdOrOtp: string, maybeOtp?: string) => {
    const payload = maybeOtp
      ? { parcelId: parcelIdOrOtp, otpCode: maybeOtp }
      : { otpCode: parcelIdOrOtp, parcelId: parcelIdOrOtp };
    const res = await apiClient.post<{
      success: boolean;
      data: {
        isValid: boolean;
        otpCode?: string;
        token?: string;
        student: any;
        parcel: any;
      };
    }>('/pickups/verify-otp', payload);
    return res.data;
  },

  completeHandover: async (params: {
    parcelId: string;
    verificationMethod: 'QR' | 'OTP' | 'MANUAL_OVERRIDE';
    verificationToken?: string | null;
    otpCode?: string | null;
    notes?: string | null;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>('/pickups/complete', params);
    return res.data;
  },

  getPickups: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const res = await apiClient.get<{
      success: boolean;
      data: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/pickups?${searchParams.toString()}`);
    return res.data;
  },
};

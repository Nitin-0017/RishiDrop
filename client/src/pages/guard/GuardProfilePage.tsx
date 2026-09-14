import React, { useState, useEffect } from 'react';
import { guardApi } from '../../services/api/guard.api';
import { GuardProfile } from '../../types';
import {
  User as UserIcon,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  Edit3,
  X,
  Lock,
  Camera,
  AlertCircle
} from 'lucide-react';

export default function GuardProfilePage() {
  const [profile, setProfile] = useState<GuardProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    profilePhoto: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await guardApi.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        profilePhoto: data.profilePhoto || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to load profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        profilePhoto: profile.profilePhoto || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setFormErrors({});
      setErrorMessage(null);
      setIsEditModalOpen(true);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email address format';

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to set a new password';
      }
      if (formData.newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        profilePhoto: formData.profilePhoto.trim() || null,
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const updated = await guardApi.updateProfile(payload);
      setProfile(updated);
      setIsEditModalOpen(false);

      // Update localStorage user if present
      const storedUser = localStorage.getItem('campusdrop_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          parsed.name = updated.name;
          parsed.phone = updated.phone;
          parsed.email = updated.email;
          localStorage.setItem('campusdrop_user', JSON.stringify(parsed));
        } catch (_) {}
      }

      setToastMessage('Profile updated successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A6192E]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl border border-gray-200 text-center">
        <AlertCircle className="w-12 h-12 text-[#B30B00] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Profile Not Available</h3>
        <p className="text-sm text-gray-600 mt-1">{errorMessage || 'Unable to retrieve guard profile.'}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-4 py-2 bg-[#A6192E] text-white rounded-lg text-sm font-medium hover:bg-[#8F1628] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-[#16865B] flex-shrink-0" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Guard Personnel Profile</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Verified security credentials, gate assignments, active shift, and contact details.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#A6192E] via-[#8F1628] to-[#0B132B] relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white flex items-center space-x-1.5 border border-white/30">
            <Shield className="w-3.5 h-3.5" />
            <span>Campus Security Operations</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-12 mb-5 gap-4">
            <div className="flex items-end space-x-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-1.5 shadow-md border border-slate-200 flex-shrink-0">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FBEAEC] rounded-2xl flex items-center justify-center text-[#A6192E] font-black text-3xl">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#16865B] border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center space-x-2 mt-1">
                  <span>Guard ID:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-mono">
                    {profile.badgeNumber}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#A6192E] hover:bg-[#8F1628] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">{profile.phone}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{profile.email}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gate Assigned (Read-only)</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{profile.gateNumber}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Shift (Read-only)</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{profile.shift}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <CheckCircle className="w-5 h-5 text-[#16865B] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status (Read-only)</span>
                <span className="text-sm font-bold text-[#16865B] mt-0.5 block">Active Security Personnel</span>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Joined</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {new Date(profile.joinedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold block mb-0.5 text-amber-950">Campus Security Policy Notice</span>
          Guard ID, Gate Assignments, and Shift Rosters are managed centrally by the RishiDrop Campus Logistics & Security Office. To request a shift or gate transfer, please contact the campus security administrator.
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <Edit3 className="w-5 h-5 text-[#A6192E]" />
                <h3 className="text-base font-black text-slate-900">Edit Guard Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    formErrors.name ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-medium`}
                  placeholder="Enter full name"
                />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    formErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-medium font-mono`}
                  placeholder="10-digit mobile number"
                />
                {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    formErrors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-medium`}
                  placeholder="name@campusdrop.demo"
                />
                {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              {/* Profile Photo URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Photo URL (Optional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.profilePhoto}
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                    placeholder="https://..."
                  />
                  <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-extrabold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Change Password (Optional)</span>
                </label>

                <div className="space-y-3">
                  <div>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className={`w-full px-4 py-2 text-sm rounded-xl border ${
                        formErrors.currentPassword ? 'border-red-500' : 'border-slate-300'
                      } focus:outline-none focus:ring-2 focus:ring-[#A6192E]`}
                      placeholder="Current Password"
                    />
                    {formErrors.currentPassword && (
                      <p className="text-xs text-red-600 mt-0.5">{formErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className={`w-full px-4 py-2 text-sm rounded-xl border ${
                        formErrors.newPassword ? 'border-red-500' : 'border-slate-300'
                      } focus:outline-none focus:ring-2 focus:ring-[#A6192E]`}
                      placeholder="New Password (min 6 characters)"
                    />
                    {formErrors.newPassword && (
                      <p className="text-xs text-red-600 mt-0.5">{formErrors.newPassword}</p>
                    )}
                  </div>

                  {formData.newPassword && (
                    <div>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-2 text-sm rounded-xl border ${
                          formErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                        } focus:outline-none focus:ring-2 focus:ring-[#A6192E]`}
                        placeholder="Confirm New Password"
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-0.5">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Read-Only Notice */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Guard ID:</span>
                  <span className="font-bold text-slate-900 font-mono">{profile.badgeNumber} (Locked)</span>
                </div>
                <div className="flex justify-between">
                  <span>Gate Assignment:</span>
                  <span className="font-bold text-slate-900">{profile.gateNumber} (Locked)</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift Schedule:</span>
                  <span className="font-bold text-slate-900">{profile.shift} (Locked)</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#A6192E] hover:bg-[#8F1628] rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

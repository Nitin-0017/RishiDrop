import React, { useState, useEffect } from 'react';
import { guardApi } from '../../services/api/guard.api';
import { GuardProfile } from '../../types';
import {
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  X,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

export default function AdminGuardsPage() {
  const [guards, setGuards] = useState<GuardProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Guard Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    badgeNumber: '',
    phone: '',
    email: '',
    password: '',
    gateNumber: 'Main Gate 1',
    shift: 'Morning (08:00 - 16:00)',
  });

  // Edit Guard Modal State
  const [editingGuard, setEditingGuard] = useState<GuardProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    badgeNumber: '',
    phone: '',
    email: '',
    password: '',
    gateNumber: '',
    shift: '',
    isActive: true,
  });

  // Delete Guard Confirmation State
  const [deletingGuard, setDeletingGuard] = useState<GuardProfile | null>(null);

  // Form Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    try {
      setIsLoading(true);
      const data = await guardApi.getAllGuards();
      setGuards(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to load guards directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await guardApi.createGuard(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        badgeNumber: '',
        phone: '',
        email: '',
        password: '',
        gateNumber: 'Main Gate 1',
        shift: 'Morning (08:00 - 16:00)',
      });
      showToast('Guard added successfully.');
      fetchGuards();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to create guard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (guard: GuardProfile) => {
    setEditingGuard(guard);
    setEditForm({
      name: guard.name,
      badgeNumber: guard.badgeNumber,
      phone: guard.phone,
      email: guard.email,
      password: '',
      gateNumber: guard.gateNumber,
      shift: guard.shift,
      isActive: guard.isActive,
    });
    setErrorMessage(null);
  };

  const handleUpdateGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuard) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const payload: any = {
        name: editForm.name.trim(),
        badgeNumber: editForm.badgeNumber.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        gateNumber: editForm.gateNumber.trim(),
        shift: editForm.shift.trim(),
        isActive: editForm.isActive,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      await guardApi.updateGuard(editingGuard.id, payload);
      setEditingGuard(null);
      showToast('Guard details updated successfully.');
      fetchGuards();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update guard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (guard: GuardProfile) => {
    try {
      const nextState = !guard.isActive;
      await guardApi.toggleStatus(guard.id, nextState);
      showToast(`Guard ${guard.name} marked as ${nextState ? 'Active' : 'Inactive'}.`);
      fetchGuards();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleDeleteGuard = async () => {
    if (!deletingGuard) return;
    try {
      setIsSubmitting(true);
      await guardApi.deleteGuard(deletingGuard.id);
      setDeletingGuard(null);
      showToast(`Guard ${deletingGuard.name} removed successfully.`);
      fetchGuards();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove guard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-[#A6192E]" />
            <span>Security Personnel & Guards</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage campus security roster, gate allocations, and duty shifts.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#A6192E] hover:bg-[#8F1628] text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guard</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by guard name, ID (e.g. GD-001), phone, or email..."
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Guards Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Guard Details</th>
                <th className="py-3.5 px-4">Guard ID</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Gate Assigned</th>
                <th className="py-3.5 px-4">Duty Shift</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#A6192E] mb-2"></div>
                    <p className="text-xs">Loading guards...</p>
                  </td>
                </tr>
              ) : filteredGuards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    No security guards found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredGuards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Guard Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FBEAEC] border border-[#F5C6CB] flex items-center justify-center font-bold text-[#A6192E] flex-shrink-0">
                          {guard.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">{guard.name}</span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(guard.joinedDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Guard ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-800 text-xs">
                      <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                        {guard.badgeNumber}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="text-gray-900 font-medium">{guard.phone}</div>
                      <div className="text-gray-500">{guard.email}</div>
                    </td>

                    {/* Gate */}
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      {guard.gateNumber}
                    </td>

                    {/* Duty Shift */}
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      {guard.shift}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          guard.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {guard.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(guard)}
                          title="Edit Guard"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#A6192E] hover:bg-[#FBEAEC] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(guard)}
                          title={guard.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            guard.isActive
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {guard.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeletingGuard(guard)}
                          title="Delete Guard"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#A6192E]" />
                <h3 className="text-base font-bold text-gray-900">Add Security Guard</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuard} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Guard ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.badgeNumber}
                    onChange={(e) => setAddForm({ ...addForm, badgeNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. GD-004"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="guard.name@campusdrop.demo"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Gate Assignment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.gateNumber}
                    onChange={(e) => setAddForm({ ...addForm, gateNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white"
                  >
                    <option value="Main Gate 1">Main Gate 1</option>
                    <option value="Main Gate 2">Main Gate 2</option>
                    <option value="Hostel Gate">Hostel Gate</option>
                    <option value="East Gate">East Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Shift Schedule <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.shift}
                    onChange={(e) => setAddForm({ ...addForm, shift: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white"
                  >
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 24:00)">Evening (16:00 - 24:00)</option>
                    <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#A6192E] hover:bg-[#8F1628] rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guard Modal */}
      {editingGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-[#A6192E]" />
                <h3 className="text-base font-bold text-gray-900">Edit Guard: {editingGuard.name}</h3>
              </div>
              <button
                onClick={() => setEditingGuard(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGuard} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Guard ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.badgeNumber}
                    onChange={(e) => setEditForm({ ...editForm, badgeNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to keep existing password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Gate Assignment
                  </label>
                  <select
                    value={editForm.gateNumber}
                    onChange={(e) => setEditForm({ ...editForm, gateNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white"
                  >
                    <option value="Main Gate 1">Main Gate 1</option>
                    <option value="Main Gate 2">Main Gate 2</option>
                    <option value="Hostel Gate">Hostel Gate</option>
                    <option value="East Gate">East Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Duty Shift
                  </label>
                  <select
                    value={editForm.shift}
                    onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white"
                  >
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 24:00)">Evening (16:00 - 24:00)</option>
                    <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                  </select>
                </div>

                <div className="col-span-2 pt-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-[#A6192E] focus:ring-[#A6192E] w-4 h-4"
                    />
                    <span>Account is Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingGuard(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#A6192E] hover:bg-[#8F1628] rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Guard?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to remove <strong className="text-gray-900">{deletingGuard.name}</strong> ({deletingGuard.badgeNumber})?
              </p>
              <p className="text-xs text-gray-500 pt-1">
                Historical deliveries and collection ledger entries associated with this guard will be preserved.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingGuard(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGuard}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

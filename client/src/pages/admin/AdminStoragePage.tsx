import React, { useState, useEffect } from 'react';
import { storageApi } from '../../services/api/storage.api';
import { StorageOverview, StorageRack, StorageSlot, SlotStatus } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Package,
  Shield,
  Clock,
  AlertCircle,
  Hash,
  Settings,
  Grid
} from 'lucide-react';

export default function AdminStoragePage() {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<StorageSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Rack Modal State
  const [isAddRackOpen, setIsAddRackOpen] = useState(false);
  const [addRackForm, setAddRackForm] = useState({
    name: '',
    code: '',
    zone: 'Main Gate Hub',
    initialSlots: 10,
    slotCapacity: 5,
  });

  // Edit Rack Modal State
  const [editingRack, setEditingRack] = useState<StorageRack | null>(null);
  const [editRackForm, setEditRackForm] = useState({
    name: '',
    zone: '',
  });

  // Delete Rack Modal State
  const [deletingRack, setDeletingRack] = useState<StorageRack | null>(null);

  // Add Slot Modal State
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [addSlotForm, setAddSlotForm] = useState({
    slotNumber: '',
    capacity: 5,
  });

  // Edit Slot Modal State
  const [editingSlot, setEditingSlot] = useState<StorageSlot | null>(null);
  const [editSlotForm, setEditSlotForm] = useState({
    capacity: 5,
    status: 'AVAILABLE' as SlotStatus,
  });

  // Delete Slot Modal State
  const [deletingSlot, setDeletingSlot] = useState<StorageSlot | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      setIsLoading(true);
      const res = await storageApi.getOverview();
      setOverview(res.data);
      if (res.data.racks.length > 0 && !selectedRackId) {
        setSelectedRackId(res.data.racks[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to load storage racks.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeRack = overview?.racks.find((r) => r.id === selectedRackId) || overview?.racks[0];

  // 1. Add Rack
  const handleAddRack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await storageApi.createRack(addRackForm);
      setIsAddRackOpen(false);
      setAddRackForm({
        name: '',
        code: '',
        zone: 'Main Gate Hub',
        initialSlots: 10,
        slotCapacity: 5,
      });
      showToast('Storage rack created successfully.');
      fetchStorage();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to create rack.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Edit Rack
  const handleEditRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRack) return;
    try {
      setIsSubmitting(true);
      await storageApi.updateRack(editingRack.id, editRackForm);
      setEditingRack(null);
      showToast('Storage rack updated successfully.');
      fetchStorage();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update rack.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Rack
  const handleDeleteRack = async () => {
    if (!deletingRack) return;
    try {
      setIsSubmitting(true);
      await storageApi.deleteRack(deletingRack.id);
      setDeletingRack(null);
      showToast('Storage rack deleted successfully.');
      fetchStorage();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot delete this storage location because parcels are currently stored here.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Add Slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRack) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await storageApi.createSlot({
        rackId: activeRack.id,
        slotNumber: addSlotForm.slotNumber.toUpperCase().trim(),
        capacity: Number(addSlotForm.capacity),
      });
      setIsAddSlotOpen(false);
      setAddSlotForm({ slotNumber: '', capacity: 5 });
      showToast('Storage slot created successfully.');
      fetchStorage();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to create slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Edit Slot
  const handleEditSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    try {
      setIsSubmitting(true);
      await storageApi.updateSlot(editingSlot.id, {
        capacity: Number(editSlotForm.capacity),
        status: editSlotForm.status,
      });
      setEditingSlot(null);
      showToast('Storage slot updated successfully.');
      fetchStorage();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete Slot
  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;
    try {
      setIsSubmitting(true);
      await storageApi.deleteSlot(deletingSlot.id);
      setDeletingSlot(null);
      showToast('Storage slot deleted successfully.');
      fetchStorage();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot delete this storage location because parcels are currently stored here.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Layers className="w-6 h-6 text-[#A6192E]" />
            <span>Storage Racks & Slot Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure multi-parcel storage racks, manage slot capacities, and monitor real-time utilization.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddRackOpen(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#A6192E] hover:bg-[#8F1628] text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Storage Rack</span>
        </button>
      </div>

      {/* Summary Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Racks</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">{overview.summary.totalRacks}</span>
              <span className="text-xs text-gray-500">Active Racks</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Slots</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">{overview.summary.totalSlots}</span>
              <span className="text-xs text-gray-500">Capacity: {overview.summary.totalCapacity} pcs</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Parcels Stored</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#A6192E]">{overview.summary.totalStoredParcels}</span>
              <span className="text-xs text-emerald-700 font-medium">{overview.summary.overallUtilization}% Load</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Available Slots</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">{overview.summary.totalAvailableSlots}</span>
              <span className="text-xs text-gray-500">Ready for intake</span>
            </div>
          </div>
        </div>
      )}

      {/* Racks Navigation Tabs & Actions */}
      {overview && overview.racks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-6">
          {/* Rack Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {overview.racks.map((rack) => (
                <button
                  key={rack.id}
                  onClick={() => setSelectedRackId(rack.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${
                    activeRack?.id === rack.id
                      ? 'bg-[#A6192E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{rack.name}</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    ({rack.storedParcels}/{rack.capacity} parcels)
                  </span>
                </button>
              ))}
            </div>

            {activeRack && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingRack(activeRack);
                    setEditRackForm({ name: activeRack.name, zone: activeRack.zone });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Rack</span>
                </button>
                <button
                  onClick={() => setDeletingRack(activeRack)}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Rack</span>
                </button>
                <button
                  onClick={() => {
                    setIsAddSlotOpen(true);
                    setAddSlotForm({ slotNumber: `${activeRack.code}${activeRack.slots.length + 1}`, capacity: 5 });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#A6192E] text-white text-xs font-semibold hover:bg-[#8F1628] flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slot</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Rack Grid Display */}
          {activeRack && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{activeRack.name} Slots Matrix</span>
                  <span>· {activeRack.slots.length} slots · Zone: {activeRack.zone}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Available</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>Occupied</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                    <span>Full</span>
                  </span>
                </div>
              </div>

              {/* Slot Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {activeRack.slots.map((slot) => {
                  const isFull = slot.currentOccupied >= slot.capacity;
                  const isOccupied = slot.currentOccupied > 0 && !isFull;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotForDetail(slot)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md ${
                        isFull
                          ? 'bg-red-50/50 border-red-200'
                          : isOccupied
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-white border-gray-200 hover:border-[#A6192E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-gray-900">{slot.slotNumber}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlot(slot);
                              setEditSlotForm({ capacity: slot.capacity, status: slot.status });
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                            title="Edit Slot Capacity"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSlot(slot);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Occupancy</span>
                          <span className="font-semibold text-gray-900">
                            {slot.currentOccupied} / {slot.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-red-500' : isOccupied ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((slot.currentOccupied / slot.capacity) * 100))}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px]">
                        <span
                          className={`font-semibold uppercase ${
                            isFull ? 'text-red-700' : isOccupied ? 'text-amber-800' : 'text-emerald-700'
                          }`}
                        >
                          {isFull ? 'Full' : isOccupied ? 'In Use' : 'Available'}
                        </span>
                        <span className="text-gray-400">{slot.parcels?.length || 0} active</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slot Details Modal */}
      {selectedSlotForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Slot Details: {selectedSlotForDetail.slotNumber}
                </h3>
                <span className="text-xs text-gray-500">
                  Capacity: {selectedSlotForDetail.capacity} parcels (Currently holding {selectedSlotForDetail.currentOccupied})
                </span>
              </div>
              <button
                onClick={() => setSelectedSlotForDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSlotForDetail.parcels && selectedSlotForDetail.parcels.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-gray-100">
                {selectedSlotForDetail.parcels.map((p) => (
                  <div key={p.id} className="pt-2 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-gray-900 block">{p.parcelId}</span>
                      <span className="text-gray-500">
                        {p.studentName} ({p.studentRoll}) · {p.partner}
                      </span>
                    </div>
                    <span className="text-gray-400">Waiting {p.daysWaiting}d</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                This slot is currently empty. Ready to store incoming parcels.
              </p>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedSlotForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {isAddRackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Add Storage Rack</h3>
              <button
                onClick={() => setIsAddRackOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRack} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Rack Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addRackForm.name}
                  onChange={(e) => setAddRackForm({ ...addRackForm, name: e.target.value })}
                  placeholder="e.g. Rack D"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Rack Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={addRackForm.code}
                    onChange={(e) => setAddRackForm({ ...addRackForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. D"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Zone / Shelf
                  </label>
                  <input
                    type="text"
                    value={addRackForm.zone}
                    onChange={(e) => setAddRackForm({ ...addRackForm, zone: e.target.value })}
                    placeholder="Main Gate Hub"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Initial Slots
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={addRackForm.initialSlots}
                    onChange={(e) => setAddRackForm({ ...addRackForm, initialSlots: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Slot Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={addRackForm.slotCapacity}
                    onChange={(e) => setAddRackForm({ ...addRackForm, slotCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddRackOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#A6192E] hover:bg-[#8F1628] rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Rack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rack Modal */}
      {editingRack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Edit Rack: {editingRack.name}</h3>
              <button
                onClick={() => setEditingRack(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRack} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Rack Name
                </label>
                <input
                  type="text"
                  required
                  value={editRackForm.name}
                  onChange={(e) => setEditRackForm({ ...editRackForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Zone / Location
                </label>
                <input
                  type="text"
                  value={editRackForm.zone}
                  onChange={(e) => setEditRackForm({ ...editRackForm, zone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRack(null)}
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

      {/* Delete Rack Confirmation Modal */}
      {deletingRack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Storage Rack?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete <strong className="text-gray-900">{deletingRack.name}</strong>?
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-left mt-2">
                Note: A rack cannot be deleted if any parcel is currently stored inside its slots.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingRack(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRack}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Add Slot to {activeRack?.name}</h3>
              <button
                onClick={() => setIsAddSlotOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Slot Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addSlotForm.slotNumber}
                  onChange={(e) => setAddSlotForm({ ...addSlotForm, slotNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. A11"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Slot Capacity (Max Parcels) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={25}
                  value={addSlotForm.capacity}
                  onChange={(e) => setAddSlotForm({ ...addSlotForm, capacity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddSlotOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#A6192E] hover:bg-[#8F1628] rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Configure Slot: {editingSlot.slotNumber}</h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Parcel Capacity
                </label>
                <input
                  type="number"
                  required
                  min={editingSlot.currentOccupied || 1}
                  max={30}
                  value={editSlotForm.capacity}
                  onChange={(e) => setEditSlotForm({ ...editSlotForm, capacity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Currently holding {editingSlot.currentOccupied} parcels. Capacity cannot be less than current stored count.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Slot Operational Status
                </label>
                <select
                  value={editSlotForm.status}
                  onChange={(e) => setEditSlotForm({ ...editSlotForm, status: e.target.value as SlotStatus })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE (Active)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Inactive)</option>
                  <option value="ISSUE">ISSUE (Under Review)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
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

      {/* Delete Slot Confirmation Modal */}
      {deletingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Storage Slot?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete Slot <strong className="text-gray-900">{deletingSlot.slotNumber}</strong>?
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-left mt-2">
                Note: A slot cannot be deleted if parcels are actively assigned to it.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingSlot(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSlot}
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

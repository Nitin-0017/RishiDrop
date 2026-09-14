import React, { useEffect, useState } from 'react';
import { storageApi } from '../../services/api/storage.api';
import { StorageOverview, StorageRack, StorageSlot } from '../../types';
import { Box, Layers, CheckCircle, Package } from 'lucide-react';

export const StorageRacksPage: React.FC = () => {
  const [storage, setStorage] = useState<StorageOverview | null>(null);
  const [activeRackCode, setActiveRackCode] = useState<string>('A');
  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStorage = async () => {
    try {
      setIsLoading(true);
      const res = await storageApi.getOverview();
      setStorage(res.data);
      if (res.data.racks.length > 0) {
        setActiveRackCode(res.data.racks[0].code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const currentRack = storage?.racks.find((r) => r.code === activeRackCode);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Storage Racks Overview</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Real-time physical mailroom storage matrix, rack capacity, and slot occupancy.
            </p>
          </div>
        </div>

        {storage && (
          <div className="bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-right self-stretch sm:self-auto flex sm:flex-col items-center justify-between sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Capacity Load</span>
            <div className="text-base font-black text-slate-900 font-mono">
              <span className="text-[#A6192E]">{storage.summary.totalStoredParcels}</span>
              <span className="text-slate-400"> / </span>
              <span>{storage.summary.totalCapacity}</span>
            </div>
          </div>
        )}
      </div>

      {/* RACK TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {storage?.racks.map((rack) => {
          const isActive = rack.code === activeRackCode;
          const occupiedCount = rack.storedParcels || rack.stats?.occupied || 0;
          return (
            <button
              key={rack.id}
              onClick={() => {
                setActiveRackCode(rack.code);
                setSelectedSlot(null);
              }}
              className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-white border-[#A6192E] ring-2 ring-[#A6192E]/20 shadow-xs'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">{rack.name}</span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#FBEAEC] text-[#A6192E]' : 'bg-slate-100 text-slate-600'
                }`}>
                  Rack {rack.code}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Occupancy: <strong className="text-slate-900 font-bold">{occupiedCount}</strong> / {rack.capacity} parcels
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#A6192E] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((occupiedCount / (rack.capacity || 1)) * 100))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* SLOT GRID */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#A6192E]" />
            <span>{currentRack?.name} Slots Matrix</span>
          </span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Occupied</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
              <span>Full</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 gap-3">
          {currentRack?.slots.map((slot) => {
            const isFull = slot.currentOccupied >= slot.capacity;
            const isOccupied = slot.currentOccupied > 0;
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between text-xs cursor-pointer ${
                  isSelected
                    ? 'border-[#A6192E] bg-[#FBEAEC] text-[#A6192E] ring-2 ring-[#A6192E] shadow-xs'
                    : isFull
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : isOccupied
                    ? 'bg-amber-50/50 border-amber-200 text-slate-900 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-[#A6192E] text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold text-sm">
                  <span>{slot.slotNumber}</span>
                  {isFull && <span className="text-[10px] font-extrabold text-red-600">FULL</span>}
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className="text-slate-500">Parcels:</span>
                  <span className="font-bold text-slate-800">
                    {slot.currentOccupied}/{slot.capacity}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED SLOT INSPECTION PANEL */}
      {selectedSlot && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4 text-[#A6192E]" />
              <span>Slot {selectedSlot.slotNumber} ({currentRack?.name}) Parcels</span>
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB]">
              {selectedSlot.currentOccupied} / {selectedSlot.capacity} Parcels Stored
            </span>
          </div>

          {selectedSlot.parcels && selectedSlot.parcels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedSlot.parcels.map((p) => (
                <div key={p.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-mono font-black text-slate-900 text-sm">{p.parcelId}</div>
                    <div className="text-slate-600 font-medium">
                      {p.studentName} <span className="text-slate-400">({p.studentRoll})</span> · <span className="font-bold text-slate-800">{p.partner}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 font-medium text-[11px] bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                    {p.daysWaiting} day(s) stored
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              This slot is currently empty and available for new parcel intake.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageRacksPage;

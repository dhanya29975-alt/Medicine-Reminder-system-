import React, { useState } from 'react';
import {
  Pill,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medicine } from '../types';
import { formatTo12Hour } from './AddEditMedicineModal';

export const MedicineList: React.FC = () => {
  const {
    medicines,
    setIsAddEditModalOpen,
    setEditingMedicine,
    deleteMedicine,
    triggerAlarmNow
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeds = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.instructions.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (med: Medicine) => {
    setEditingMedicine(med);
    setIsAddEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMedicine(id);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="h-7 w-7 text-teal-600" />
            <span>Prescription & Medicine Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your medicines, dosage schedules, multiple daily alarm times, and inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-44 sm:w-60"
            />
          </div>

          <button
            onClick={() => {
              setEditingMedicine(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Medicines Grid */}
      {filteredMeds.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Pill className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No Medicines Matched Your Search' : 'No Medicines Added Yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Add your prescriptions to receive real-time alarms and maintain your health schedule.
          </p>
          <button
            onClick={() => {
              setEditingMedicine(null);
              setIsAddEditModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeds.map((med) => {
            const isLowStock =
              med.inventory && med.inventory.count <= med.inventory.lowThreshold;

            return (
              <div
                key={med.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/40 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Name, Dosage, Type */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold border border-teal-200 dark:border-teal-800">
                        <Pill className="h-5 w-5 rotate-[-45deg]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {med.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                            {med.dosage}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">
                            {med.form}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Edit, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => triggerAlarmNow(med)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Test Alarm Clock for this medicine right now"
                      >
                        <BellRing className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(med)}
                        className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit medicine details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Delete medicine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Times Badges */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        <span>Convenient Alarm Times ({med.times.length} daily):</span>
                      </div>
                      <button
                        onClick={() => handleEdit(med)}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        Adjust Timings
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {med.times.map((t) => (
                        <button
                          key={t}
                          onClick={() => handleEdit(med)}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-extrabold text-slate-900 dark:text-white hover:border-teal-500 transition cursor-pointer"
                          title="Click to edit timings for this medicine"
                        >
                          <span>{formatTo12Hour(t)}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-1">({t})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions & Recurrence */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                      {med.instructions}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {med.frequency === 'daily' ? 'Every Day' : `${med.frequency} schedule`}
                    </span>
                  </div>

                  {/* Notes if any */}
                  {med.notes && (
                    <p className="mt-2.5 text-xs text-slate-500 italic bg-white dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{med.notes}"
                    </p>
                  )}
                </div>

                {/* Footer: Inventory & Low Threshold Alert */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Package className="h-3.5 w-3.5" />
                    <span>
                      Stock: <strong className="text-slate-900 dark:text-white">{med.inventory?.count ?? 0}</strong> {med.inventory?.unit}
                    </span>
                  </div>

                  {isLowStock ? (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Refill Soon</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>In Stock</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

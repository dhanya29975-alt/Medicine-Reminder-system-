import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Flame,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoseStatus } from '../types';

export const MedicineHistory: React.FC = () => {
  const { history, medicines, deleteHistoryItem } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | DoseStatus>('all');
  const [selectedMedId, setSelectedMedId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Adherence Calculations
  const stats = useMemo(() => {
    const total = history.length;
    const taken = history.filter((h) => h.status === 'taken').length;
    const skipped = history.filter((h) => h.status === 'skipped').length;
    const missed = history.filter((h) => h.status === 'missed').length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 100;
    return { total, taken, skipped, missed, rate };
  }, [history]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (selectedMedId !== 'all' && item.medicineId !== selectedMedId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.medicineName.toLowerCase().includes(q) ||
          item.dosage.toLowerCase().includes(q) ||
          (item.reason && item.reason.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [history, statusFilter, selectedMedId, searchQuery]);

  // CSV Export for Doctor / Caregiver
  const exportCSV = () => {
    if (history.length === 0) {
      return;
    }
    const headers = ['Medicine Name', 'Dosage', 'Scheduled Time', 'Actual Response Time', 'Status', 'Reason/Notes'];
    const rows = history.map((item) => [
      `"${item.medicineName.replace(/"/g, '""')}"`,
      `"${item.dosage.replace(/"/g, '""')}"`,
      `"${item.scheduledTime}"`,
      `"${item.actualTime || 'N/A'}"`,
      `"${item.status.toUpperCase()}"`,
      `"${(item.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medialarm_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: DoseStatus, reason?: string) => {
    switch (status) {
      case 'taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Taken</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            <XCircle className="h-3.5 w-3.5" />
            <span>Skipped</span>
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Missed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Snoozed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-7 w-7 text-teal-600" />
            <span>Medicine History & Adherence Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auditable log of scheduled dose times, actual response times, taken status, and skipped reasons
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
        >
          <Download className="h-4 w-4 text-teal-600" />
          <span>Export CSV for Doctor</span>
        </button>
      </div>

      {/* Compliance Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overall Compliance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
              {stats.rate}%
            </span>
            <span className="text-xs text-slate-400">adherence</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Doses Taken
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.taken}
            </span>
            <span className="text-xs text-slate-400">of {stats.total} logged</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Confirmed responses
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Skipped Doses
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-600 dark:text-slate-300">
              {stats.skipped}
            </span>
            <span className="text-xs text-slate-400">intentional skips</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">With patient reasons</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Missed / Overdue
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.missed}
            </span>
            <span className="text-xs text-slate-400">unanswered</span>
          </div>
          <p className="text-[11px] text-rose-500 mt-1">No confirmation recorded</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Logs ({history.length})
          </button>
          <button
            onClick={() => setStatusFilter('taken')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'taken'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Taken ({stats.taken})
          </button>
          <button
            onClick={() => setStatusFilter('skipped')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'skipped'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Skipped ({stats.skipped})
          </button>
          <button
            onClick={() => setStatusFilter('missed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'missed'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Missed ({stats.missed})
          </button>
        </div>

        {/* Medicine Dropdown & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMedId}
            onChange={(e) => setSelectedMedId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="all">All Medicines</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-36 sm:w-44 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <History className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No History Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            As alarms ring and you respond with Taken, Snooze, or Skip, complete auditable timestamps will be recorded here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Medicine & Dosage</th>
                  <th className="py-3.5 px-4">Scheduled Time</th>
                  <th className="py-3.5 px-4">Actual Response Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Patient Reason / Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.medicineName}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.dosage}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.scheduledTime}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.actualTime || <span className="text-slate-400 italic">No response</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status, item.reason)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 italic max-w-xs truncate">
                      {item.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete log record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

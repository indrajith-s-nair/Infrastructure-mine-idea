'use client';

import React from 'react';
import { TimelineStep } from '@/lib/api';
import { CheckCircle2, Clock, CircleDot, AlertTriangle, Check, ShieldCheck } from 'lucide-react';

interface TrackingTimelineProps {
  timeline: TimelineStep[];
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  resolvedAt: string | null;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  timeline,
  status,
  createdAt,
  resolvedAt,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            RESOLVED & VERIFIED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
            <CircleDot className="w-3.5 h-3.5 animate-spin" />
            UNDER FIELD ACTION
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            CLOSED / REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            PENDING VERIFICATION
          </span>
        );
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Pending scheduled action';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Redressal Lifecycle & Progress Telemetry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered on {formatDate(createdAt)}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Step by Step Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {timeline.map((item, index) => {
          const isDone = item.completed;
          const isCurrent = item.current;

          return (
            <div key={item.step || index} className="relative group">
              {/* Timeline Node Icon */}
              <div
                className={`absolute -left-[30px] sm:-left-[38px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white animate-pulse shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-xs font-bold font-mono">{item.step}</span>
                )}
              </div>

              {/* Step Content Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-300 dark:border-blue-700/80 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                    : isDone
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

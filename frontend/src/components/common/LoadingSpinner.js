import React from "react";

export const PageSkeleton = ({ rows = 6 }) => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
    <div className="skeleton h-8 w-48 rounded-xl" />
    <div className="skeleton h-4 w-72 rounded-lg" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="skeleton h-40 w-full rounded-xl" />
          <div className="skeleton h-5 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
          <div className="skeleton h-8 w-full rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 8, cols = 5 }) => (
  <div className="space-y-2">
    <div className="skeleton h-10 w-full rounded-xl" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="skeleton h-12 flex-1 rounded-lg" />
        ))}
      </div>
    ))}
  </div>
);

const LoadingSpinner = ({ message = "Loading...", fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 p-5">
      <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      <span className="text-slate-500 text-sm">{message}</span>
    </div>
  );
};

export default LoadingSpinner;

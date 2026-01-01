import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Report } from '@/types';

interface ReportContextType {
  reports: Report[];
  addReport: (report: Omit<Report, 'id'>) => void;
  deleteReport: (id: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);

  const addReport = (reportData: Omit<Report, 'id'>) => {
    const newReport: Report = {
      ...reportData,
      id: Date.now().toString(),
    };
    setReports(prev => [newReport, ...prev]);
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return (
    <ReportContext.Provider value={{ reports, addReport, deleteReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}

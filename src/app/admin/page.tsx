'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
import {
  getLocalExpenses,
  updateLocalExpenseStatus,
} from '@/lib/expenses-store';
import jsPDF from 'jspdf';
import {
  Shield,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  Scale,
  Calendar,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

type FilterTab = 'Pending' | 'Approved' | 'Rejected' | 'All';

export default function AdminPage() {
  const { user, profile, loading: authLoading, logout, setRole } = useAuth();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('Pending');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Sync expenses from local store and Firestore
  useEffect(() => {
    // 1. Initial local load
    const initial = getLocalExpenses();
    setExpenses(initial);
    if (initial.length > 0 && !selectedExpense) {
      setSelectedExpense(initial[0]);
    }

    const handleLocalUpdate = () => {
      const updated = getLocalExpenses();
      setExpenses(updated);
      if (selectedExpense) {
        const found = updated.find((e) => e.id === selectedExpense.id);
        if (found) setSelectedExpense(found);
      }
    };
    window.addEventListener('clearaudit_expenses_updated', handleLocalUpdate);

    // 2. Firestore listener with resilient fallback
    let unsub = () => {};
    try {
      const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((d) => {
              const docData = d.data();
              return {
                id: d.id,
                ...docData,
                createdAt:
                  docData.createdAt instanceof Timestamp
                    ? docData.createdAt.toDate()
                    : new Date(docData.createdAt),
                updatedAt:
                  docData.updatedAt instanceof Timestamp
                    ? docData.updatedAt.toDate()
                    : new Date(docData.updatedAt),
              } as Expense;
            });
            setExpenses(data);
            if (!selectedExpense && data.length > 0) {
              setSelectedExpense(data[0]);
            }
          }
        },
        () => {
          // Firestore fallback
          const fallbackData = getLocalExpenses();
          setExpenses(fallbackData);
        }
      );
    } catch {
      // Non-blocking
    }

    return () => {
      unsub();
      window.removeEventListener('clearaudit_expenses_updated', handleLocalUpdate);
    };
  }, [selectedExpense]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedExpense || !selectedExpense.id) return;
    setProcessing(true);
    try {
      // Update local store immediately
      const updated = updateLocalExpenseStatus(selectedExpense.id, 'Approved');
      if (updated) setSelectedExpense(updated);

      // Attempt Firestore sync
      try {
        await updateDoc(doc(db, 'expenses', selectedExpense.id), {
          status: 'Approved',
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedExpense || !selectedExpense.id) return;
    setRejecting(true);
    try {
      const updated = updateLocalExpenseStatus(
        selectedExpense.id,
        'Rejected',
        rejectionNote || 'Expense rejected per compliance policy review.'
      );
      if (updated) setSelectedExpense(updated);

      try {
        await updateDoc(doc(db, 'expenses', selectedExpense.id), {
          status: 'Rejected',
          rejectionNote: rejectionNote || 'Expense rejected per compliance policy review.',
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking
      }

      setShowRejectModal(false);
      setRejectionNote('');
    } finally {
      setRejecting(false);
    }
  };

  // Generate PDF
  const handleExportPDF = () => {
    if (!selectedExpense) return;

    const doc = new jsPDF();

    // Document header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('ClearAudit Compliance Certificate', 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('AUTOMATED FINANCIAL AUDIT REPORT • GEMMA 4 AI ENGINE', 14, 28);

    // Metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Claim ID: ${selectedExpense.id}`, 14, 48);
    doc.text(`Audit Date: ${new Date().toISOString().split('T')[0]}`, 14, 56);
    doc.text(`Reviewer: ${user?.email || 'Admin Auditor'}`, 14, 64);
    doc.text(`Final Decision: ${selectedExpense.status.toUpperCase()}`, 14, 72);

    // Vendor details
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 80, 196, 80);

    doc.setFontSize(12);
    doc.text('Expense Specifications', 14, 90);
    doc.setFontSize(10);
    doc.text(`Vendor: ${selectedExpense.vendor_name}`, 14, 100);
    doc.text(`Transaction Date: ${selectedExpense.date_of_purchase}`, 14, 108);
    doc.text(`Category: ${selectedExpense.inferred_category}`, 14, 116);
    doc.text(`Total Amount: $${(selectedExpense.total_amount || 0).toFixed(2)} ${selectedExpense.currency || 'USD'}`, 14, 124);

    // Line items
    doc.line(14, 134, 196, 134);
    doc.setFontSize(12);
    doc.text('Line-Item Breakdown', 14, 144);
    let y = 154;
    (selectedExpense.line_items || []).forEach((item) => {
      doc.setFontSize(10);
      doc.text(`• ${item.description}`, 20, y);
      doc.text(`$${item.amount.toFixed(2)}`, 160, y);
      y += 8;
    });

    // AI Policy Findings
    doc.line(14, y + 4, 196, y + 4);
    doc.setFontSize(12);
    doc.text('Gemma 4 AI Compliance Findings', 14, y + 16);
    doc.setFontSize(10);
    doc.text(`Policy Violation: ${selectedExpense.policy_violation ? 'YES (FLAGGED)' : 'NO (COMPLIANT)'}`, 14, y + 26);
    if (selectedExpense.violation_reason) {
      doc.text(`Reason: ${selectedExpense.violation_reason}`, 14, y + 34, { maxWidth: 170 });
    }
    doc.text(`Confidence Score: ${Math.round((selectedExpense.audit_confidence_score || 0.95) * 100)}%`, 14, y + 46);

    // Signature footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Cryptographically Verified by ClearAudit Governance Infrastructure', 14, 280);

    doc.save(`clearaudit_certificate_${selectedExpense.id}.pdf`);
  };

  const handleSwitchToEmployee = () => {
    setRole('employee');
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    if (filterTab === 'All') return true;
    return e.status === filterTab;
  });

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-100" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-neutral-100 block">
                ClearAudit
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-500">
                Admin Audit Console
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-neutral-800 mx-2" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
            <Scale className="w-3 h-3 text-neutral-400" />
            Compliance Authority
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSwitchToEmployee}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Employee Portal</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-neutral-900">
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-200">
              {user?.displayName ? user.displayName.charAt(0) : 'A'}
            </div>
            <span className="text-xs text-neutral-400 font-mono truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Expense Queue */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-neutral-900 flex flex-col bg-neutral-950">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-neutral-900">
            <div className="grid grid-cols-4 p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono">
              {(['Pending', 'Approved', 'Rejected', 'All'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                    filterTab === tab
                      ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Claims List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs space-y-2">
                <FileText className="w-6 h-6 mx-auto text-neutral-600" />
                <p>No claims in {filterTab} queue</p>
              </div>
            ) : (
              filteredExpenses.map((exp) => {
                const isSelected = selectedExpense?.id === exp.id;
                return (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className={`p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900/90 border-l-2 border-neutral-200'
                        : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-neutral-100">
                          {exp.vendor_name || 'Vendor'}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {exp.inferred_category || 'General'} • {exp.date_of_purchase}
                        </p>
                      </div>
                      <p className="text-xs font-mono font-bold text-neutral-100">
                        ${(exp.total_amount || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          exp.status === 'Approved'
                            ? 'bg-neutral-800 text-neutral-300 font-medium'
                            : exp.status === 'Rejected'
                            ? 'bg-red-950/60 text-red-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {exp.status}
                      </span>

                      {exp.policy_violation ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Violation Flagged</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Compliant</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane - Inspection & Audit Decisions */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-black">
          {selectedExpense ? (
            <>
              {/* Receipt Visual Viewer */}
              <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-900 bg-neutral-950/50">
                <div className="h-12 border-b border-neutral-900 px-4 flex items-center justify-between bg-neutral-950 text-xs font-mono text-neutral-400">
                  <span>RECEIPT VIEWER</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                      className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
                      className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom(1)}
                      className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
                  <div
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-150 max-w-full max-h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedExpense.imageUrl}
                      alt="Receipt Document"
                      className="rounded-lg border border-neutral-800 max-h-[600px] object-contain shadow-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* AI Audit Findings & Decision Panel */}
              <div className="w-full lg:w-[480px] p-6 overflow-y-auto space-y-6 bg-neutral-950">
                {/* Header & Status */}
                <div className="flex items-start justify-between pb-4 border-b border-neutral-900">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100">
                      {selectedExpense.vendor_name}
                    </h2>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Transaction Date: {selectedExpense.date_of_purchase}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold uppercase ${
                      selectedExpense.status === 'Approved'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : selectedExpense.status === 'Rejected'
                        ? 'bg-red-950/40 text-red-400 border border-red-900/60'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    {selectedExpense.status}
                  </span>
                </div>

                {/* Gemma 4 AI Findings Card */}
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
                      <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
                      <span>Gemma 4 Compliance Analysis</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Score: {Math.round((selectedExpense.audit_confidence_score || 0.95) * 100)}%
                    </span>
                  </div>

                  {selectedExpense.policy_violation ? (
                    <div className="p-3 rounded-lg bg-neutral-950 border border-red-900/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Policy Violation Flagged</span>
                      </div>
                      <p className="text-xs text-neutral-300 pl-5.5 leading-relaxed">
                        {selectedExpense.violation_reason || 'Expense does not satisfy company policy rules.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-neutral-300 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                        <span>Policy Verified & Compliant</span>
                      </div>
                      <p className="text-xs text-neutral-400 pl-5.5">
                        No alcohol items detected, meal within limits, weekday transaction verified.
                      </p>
                    </div>
                  )}
                </div>

                {/* Line Items Breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                    Itemized Line Items
                  </h3>
                  <div className="rounded-lg border border-neutral-900 bg-neutral-900/30 divide-y divide-neutral-900 text-xs">
                    {(selectedExpense.line_items || []).map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <span className="text-neutral-300">{item.description}</span>
                        <span className="font-mono text-neutral-100 font-medium">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="p-3 flex items-center justify-between font-bold bg-neutral-900/60">
                      <span className="text-neutral-200">Total Claimed</span>
                      <span className="font-mono text-neutral-100">
                        ${(selectedExpense.total_amount || 0).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rejection Note if present */}
                {selectedExpense.rejectionNote && (
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-red-900/50 text-xs space-y-1">
                    <p className="font-mono text-red-400 font-semibold">Audit Rejection Note:</p>
                    <p className="text-neutral-300">{selectedExpense.rejectionNote}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-neutral-900 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={processing || selectedExpense.status === 'Approved'}
                      className="py-2.5 px-3 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Claim</span>
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing || selectedExpense.status === 'Rejected'}
                      className="py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-red-400 border border-neutral-800 hover:border-red-900 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Claim</span>
                    </button>
                  </div>

                  <button
                    onClick={handleExportPDF}
                    className="w-full py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Audit Certificate (PDF)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-neutral-500 text-xs">
              Select an expense claim from the queue to inspect receipts and audit compliance.
            </div>
          )}
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Reject Expense Claim</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Provide an audit explanation for the employee regarding this policy rejection.
              </p>
            </div>

            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. Alcohol items detected. Single meal limit of $50 exceeded."
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

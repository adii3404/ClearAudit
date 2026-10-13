'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
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
  ChevronLeft,
  Loader2,
  FileText,
  LayoutDashboard,
  BarChart3,
  Eye,
  X,
} from 'lucide-react';
import Link from 'next/link';

type FilterTab = 'Pending' | 'Approved' | 'Rejected' | 'All';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('Pending');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Auth + Role guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (profile && profile.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, user, profile, router]);

  // Real-time listener for all expenses
  useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') return;

    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
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

      // Update selected expense if it's in the new data
      if (selectedExpense) {
        const updated = data.find((e) => e.id === selectedExpense.id);
        if (updated) setSelectedExpense(updated);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const filteredExpenses =
    filterTab === 'All' ? expenses : expenses.filter((e) => e.status === filterTab);

  const handleApprove = async (expense: Expense) => {
    if (!expense.id) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'expenses', expense.id), {
        status: 'Approved',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense?.id) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'expenses', selectedExpense.id), {
        status: 'Rejected',
        rejectionNote: rejectionNote || 'No reason provided.',
        updatedAt: serverTimestamp(),
      });
      setShowRejectModal(false);
      setRejectionNote('');
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const generatePDF = (expense: Expense) => {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ClearAudit', 20, 25);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text('Expense Reimbursement Receipt', 20, 32);

    // Divider
    pdf.setDrawColor(200);
    pdf.line(20, 38, 190, 38);

    // Details
    pdf.setTextColor(0);
    pdf.setFontSize(11);
    const y = 48;
    const details = [
      ['Status', expense.status],
      ['Vendor', expense.vendor_name || 'Unknown'],
      ['Date', expense.date_of_purchase || 'N/A'],
      ['Amount', `${expense.currency || 'USD'} ${expense.total_amount?.toFixed(2) || '0.00'}`],
      ['Category', expense.inferred_category || 'N/A'],
      ['Policy Compliant', expense.policy_violation ? 'NO — Flagged' : 'Yes'],
      ['Confidence Score', `${((expense.audit_confidence_score || 0) * 100).toFixed(0)}%`],
      ['Description', expense.userDescription || 'N/A'],
    ];

    details.forEach(([label, value], i) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, 20, y + i * 10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(value), 70, y + i * 10);
    });

    // Line items
    if (expense.line_items && expense.line_items.length > 0) {
      const lineY = y + details.length * 10 + 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Line Items:', 20, lineY);

      expense.line_items.forEach((item, i) => {
        pdf.setFont('helvetica', 'normal');
        pdf.text(`• ${item.description}: $${item.amount?.toFixed(2)}`, 25, lineY + 8 + i * 7);
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Generated by ClearAudit AI Audit Platform — ${new Date().toISOString()}`,
      20,
      280
    );

    pdf.save(`ClearAudit_Receipt_${expense.id}.pdf`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') return null;

  const stats = {
    pending: expenses.filter((e) => e.status === 'Pending').length,
    approved: expenses.filter((e) => e.status === 'Approved').length,
    rejected: expenses.filter((e) => e.status === 'Rejected').length,
    flagged: expenses.filter((e) => e.policy_violation).length,
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-60 flex-col border-r border-neutral-800 bg-neutral-950">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-neutral-50" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-neutral-50">
              ClearAudit
            </span>
          </div>
          <span className="inline-block mt-2 text-[10px] font-medium tracking-widest uppercase text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded">
            Admin Console
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setSelectedExpense(null)}
            className="sidebar-link active w-full"
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
            Audit Queue
          </button>
          <Link href="/dashboard" className="sidebar-link">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Employee View
          </Link>
        </nav>

        {/* Stats */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <p className="text-[10px] font-medium text-neutral-600 uppercase tracking-widest">
            Live Metrics
          </p>
          {[
            { label: 'Pending', value: stats.pending, color: 'text-neutral-300' },
            { label: 'Approved', value: stats.approved, color: 'text-green-400' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
            { label: 'Flagged', value: stats.flagged, color: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{s.label}</span>
              <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-2 py-1 mb-2">
            <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300">
              {profile.displayName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-300 truncate">
                {profile.displayName}
              </p>
              <p className="text-[10px] text-neutral-600 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push('/login'))}
            className="sidebar-link w-full text-neutral-500 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-50" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-neutral-50">ClearAudit Admin</span>
            </div>
            <h1 className="hidden lg:block text-sm font-semibold text-neutral-50 tracking-tight">
              Audit Control Center
            </h1>
          </div>

          {/* Filter tabs */}
          <div className="flex rounded-lg overflow-hidden border border-neutral-800">
            {(['Pending', 'Approved', 'Rejected', 'All'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-neutral-800 text-neutral-50'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="ml-1.5 text-neutral-600">
                    {expenses.filter((e) => e.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Queue list */}
          <div
            className={`${
              selectedExpense ? 'hidden lg:block lg:w-96' : 'w-full'
            } border-r border-neutral-800 overflow-y-auto`}
          >
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-400">No {filterTab.toLowerCase()} expenses</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Expenses will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {filteredExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    type="button"
                    onClick={() => {
                      setSelectedExpense(expense);
                      setZoom(1);
                    }}
                    className={`w-full text-left p-4 transition-colors cursor-pointer hover:bg-neutral-900/50 ${
                      selectedExpense?.id === expense.id ? 'bg-neutral-900/70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-200 truncate">
                          {expense.vendor_name || 'Unknown Vendor'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {expense.date_of_purchase ||
                            new Date(expense.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-mono font-semibold text-neutral-200 ml-3">
                        {expense.currency || '$'}
                        {expense.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-[10px] ${
                          expense.status === 'Pending'
                            ? 'badge-pending'
                            : expense.status === 'Approved'
                            ? 'badge-approved'
                            : 'badge-rejected'
                        }`}
                      >
                        {expense.status}
                      </span>
                      {expense.policy_violation && (
                        <span className="badge badge-flagged text-[10px]">
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                          Flagged
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail pane */}
          {selectedExpense && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left: Receipt image */}
              <div className="lg:flex-1 border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(null)}
                      className="lg:hidden p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-neutral-400">Receipt Image</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-neutral-500 min-w-[3rem] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div
                  ref={imageContainerRef}
                  className="flex-1 overflow-auto flex items-center justify-center bg-neutral-950 p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedExpense.imageUrl}
                    alt="Receipt"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    className="max-w-full transition-transform duration-200"
                  />
                </div>
              </div>

              {/* Right: Audit details */}
              <div className="lg:w-[400px] overflow-y-auto">
                <div className="p-5 space-y-5">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-50">Audit Result</h3>
                    <span
                      className={`badge ${
                        selectedExpense.status === 'Pending'
                          ? 'badge-pending'
                          : selectedExpense.status === 'Approved'
                          ? 'badge-approved'
                          : 'badge-rejected'
                      }`}
                    >
                      {selectedExpense.status}
                    </span>
                  </div>

                  {/* Policy warning */}
                  {selectedExpense.policy_violation && (
                    <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-900/40">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-yellow-400">Policy Violation Detected</p>
                          <p className="text-xs text-yellow-600 mt-0.5">
                            {selectedExpense.violation_reason || 'Unknown violation'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail fields */}
                  <div className="space-y-3">
                    {[
                      { label: 'Vendor', value: selectedExpense.vendor_name },
                      { label: 'Date', value: selectedExpense.date_of_purchase },
                      {
                        label: 'Total Amount',
                        value: `${selectedExpense.currency || 'USD'} ${selectedExpense.total_amount?.toFixed(2)}`,
                      },
                      { label: 'Category', value: selectedExpense.inferred_category },
                      {
                        label: 'AI Confidence',
                        value: `${((selectedExpense.audit_confidence_score || 0) * 100).toFixed(0)}%`,
                      },
                      { label: 'Employee Note', value: selectedExpense.userDescription || '—' },
                    ].map((field) => (
                      <div key={field.label} className="flex items-start justify-between py-2 border-b border-neutral-800/50">
                        <span className="text-xs text-neutral-500">{field.label}</span>
                        <span className="text-xs text-neutral-200 font-medium text-right max-w-[60%]">
                          {field.value || '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Line items */}
                  {selectedExpense.line_items && selectedExpense.line_items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-400 mb-2">Extracted Line Items</p>
                      <div className="card divide-y divide-neutral-800/50">
                        {selectedExpense.line_items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs text-neutral-300">{item.description}</span>
                            <span className="text-xs font-mono text-neutral-200">
                              ${item.amount?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection note if rejected */}
                  {selectedExpense.status === 'Rejected' && selectedExpense.rejectionNote && (
                    <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40">
                      <p className="text-xs font-medium text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-xs text-red-300">{selectedExpense.rejectionNote}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {selectedExpense.status === 'Pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedExpense)}
                        disabled={processing}
                        className="btn-primary flex-1"
                      >
                        {processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing}
                        className="btn-danger flex-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Download PDF */}
                  {selectedExpense.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => generatePDF(selectedExpense)}
                      className="btn-secondary w-full"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}>
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-50">Reject Expense</h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Rejection Reason</label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Provide a brief reason for rejection…"
                  rows={3}
                  className="input-field resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processing}
                  className="btn-danger flex-1"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

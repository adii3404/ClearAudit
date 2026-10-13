'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
import { getLocalExpenses, updateLocalExpenseStatus } from '@/lib/expenses-store';
import jsPDF from 'jspdf';
import {
  Shield,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  FileText,
  Home,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

type FilterTab = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
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

  // Sync real submitted expenses
  useEffect(() => {
    const data = getLocalExpenses();
    setExpenses(data);
    if (data.length > 0 && !selectedExpense) {
      setSelectedExpense(data[0]);
    }

    const handleUpdate = () => {
      const updated = getLocalExpenses();
      setExpenses(updated);
      if (selectedExpense) {
        const found = updated.find((e) => e.id === selectedExpense.id);
        if (found) setSelectedExpense(found);
      }
    };
    window.addEventListener('clearaudit_expenses_updated', handleUpdate);
    return () => window.removeEventListener('clearaudit_expenses_updated', handleUpdate);
  }, [selectedExpense]);

  // Handle Approve
  const handleApprove = () => {
    if (!selectedExpense || !selectedExpense.id) return;
    setProcessing(true);
    const updated = updateLocalExpenseStatus(selectedExpense.id, 'Approved');
    if (updated) setSelectedExpense(updated);
    setProcessing(false);
  };

  // Handle Reject
  const handleReject = () => {
    if (!selectedExpense || !selectedExpense.id) return;
    setRejecting(true);
    const updated = updateLocalExpenseStatus(
      selectedExpense.id,
      'Rejected',
      rejectionNote || 'Expense rejected per compliance policy review.'
    );
    if (updated) setSelectedExpense(updated);
    setShowRejectModal(false);
    setRejectionNote('');
    setRejecting(false);
  };

  // Button to get the receipt (opens/downloads the receipt image)
  const handleGetReceipt = () => {
    if (!selectedExpense) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<html><head><title>Receipt - ${selectedExpense.vendor_name}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000;"><img src="${selectedExpense.imageUrl}" style="max-width:100%;max-height:100vh;object-contain;"/></body></html>`
      );
    }
  };

  // Generate Invoice Button with all things mentioned
  const handleGenerateInvoice = () => {
    if (!selectedExpense) return;

    const doc = new jsPDF();

    // Invoice Header
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(18);
    doc.text('CORPORATE EXPENSE INVOICE', 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`INVOICE NUMBER: INV-${selectedExpense.id?.toUpperCase() || Date.now()}`, 14, 28);

    // Metadata grid
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Initiated By: Employee 1 (${selectedExpense.userId || 'employee@clearaudit.com'})`, 14, 46);
    doc.text(`Reviewer: ${user?.email || 'admin@clearaudit.com'}`, 14, 54);
    doc.text(`Invoice Date: ${new Date().toISOString().split('T')[0]}`, 14, 62);
    doc.text(`Payment Status: ${selectedExpense.status.toUpperCase()}`, 14, 70);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 76, 196, 76);

    // Vendor and Employee Query
    doc.setFontSize(11);
    doc.text('Transaction Details & Employee Description:', 14, 86);
    doc.setFontSize(9);
    doc.text(`Vendor: ${selectedExpense.vendor_name}`, 14, 94);
    doc.text(`Transaction Date: ${selectedExpense.date_of_purchase}`, 14, 102);
    doc.text(`Category: ${selectedExpense.inferred_category}`, 14, 110);
    doc.text(`Employee Note: "${selectedExpense.userDescription || 'None'}"`, 14, 118, { maxWidth: 170 });

    doc.line(14, 126, 196, 126);

    // Itemized Line items
    doc.setFontSize(11);
    doc.text('Itemized Line Items:', 14, 136);
    let y = 146;
    (selectedExpense.line_items || []).forEach((item) => {
      doc.setFontSize(9);
      doc.text(`• ${item.description}`, 20, y);
      doc.text(`$${item.amount.toFixed(2)}`, 160, y);
      y += 8;
    });

    // Total box
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y + 2, 182, 14, 'F');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL INVOICE AMOUNT:', 20, y + 11);
    doc.text(`$${(selectedExpense.total_amount || 0).toFixed(2)} USD`, 160, y + 11);

    // Audit compliance findings
    doc.line(14, y + 24, 196, y + 24);
    doc.setFontSize(11);
    doc.text('Compliance Audit Verification:', 14, y + 34);
    doc.setFontSize(9);
    doc.text(`Compliance Check: ${selectedExpense.policy_violation ? 'FLAGGED FOR VIOLATION' : 'VERIFIED COMPLIANT'}`, 14, y + 42);
    if (selectedExpense.violation_reason) {
      doc.text(`Audit Note: ${selectedExpense.violation_reason}`, 14, y + 50, { maxWidth: 170 });
    }
    if (selectedExpense.rejectionNote) {
      doc.text(`Rejection Reason: ${selectedExpense.rejectionNote}`, 14, y + 58, { maxWidth: 170 });
    }

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Authorized by ClearAudit Corporate Expense Auditor Infrastructure', 14, 280);

    doc.save(`Invoice_${selectedExpense.id}.pdf`);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  const filteredExpenses = expenses.filter((e) => {
    if (filterTab === 'All') return true;
    return e.status === filterTab;
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      {/* Sidebar - Clean Navigation (Admin Dashboard, Expense Policy, Sign Out) */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-neutral-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 block leading-tight">
                ClearAudit
              </span>
              <span className="text-[10px] uppercase font-mono text-neutral-500">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links: ONLY Admin Dashboard and Expense Policy */}
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/admin'
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>

            <Link
              href="/policy"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Expense Policy</span>
            </Link>
          </nav>
        </div>

        {/* Clean Sign Out button at the bottom */}
        <div className="p-4 border-t border-neutral-200 space-y-2">
          <div className="px-3 py-2 text-xs font-mono text-neutral-500 truncate">
            {user?.email || 'admin@clearaudit.com'}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50">
        {/* Top Header - No Badges, No Role Switcher */}
        <header className="h-16 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shadow-2xs">
          <h1 className="text-sm font-bold tracking-tight text-neutral-900">
            ClearAudit Corporate Expense Auditor
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Main Split Screen Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Claims Initiated by Employees */}
          <div className="w-full md:w-80 lg:w-96 border-r border-neutral-200 bg-white flex flex-col">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-neutral-200 bg-neutral-50/50">
              <div className="grid grid-cols-4 p-1 rounded-xl bg-neutral-200/80 border border-neutral-300 text-xs font-mono">
                {(['All', 'Pending', 'Approved', 'Rejected'] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer text-center font-semibold text-[11px] ${
                      filterTab === tab
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of employee queries */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs space-y-2">
                  <Receipt className="w-6 h-6 mx-auto text-neutral-400" />
                  <p>No claims initiated by employees yet</p>
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
                          ? 'bg-neutral-100/90 border-l-3 border-neutral-900 shadow-2xs'
                          : 'hover:bg-neutral-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-neutral-900">
                            {exp.vendor_name || 'Merchant'}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Initiated by: Employee 1
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-900">
                          ${(exp.total_amount || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            exp.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : exp.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {exp.status}
                        </span>

                        {exp.policy_violation ? (
                          <span className="text-red-700 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Flagged</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
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

          {/* Right Column: Exact query initiated by employee, photo/receipt, and controls */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
            {selectedExpense ? (
              <>
                {/* Photo / Receipt Viewer */}
                <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-100/50">
                  {/* Top Bar with "Get Receipt" Button and Zoom */}
                  <div className="h-12 border-b border-neutral-200 px-4 flex items-center justify-between bg-white text-xs font-mono text-neutral-600">
                    <span className="font-bold text-neutral-900">RECEIPT PREVIEW</span>
                    <div className="flex items-center gap-2">
                      {/* BUTTON TO GET THE RECEIPT */}
                      <button
                        onClick={handleGetReceipt}
                        className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Get Receipt</span>
                      </button>

                      <div className="flex items-center gap-1 pl-2 border-l border-neutral-200">
                        <button
                          onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                          className="p-1 hover:bg-neutral-100 rounded text-neutral-700 cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
                          className="p-1 hover:bg-neutral-100 rounded text-neutral-700 cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoom(1)}
                          className="p-1 hover:bg-neutral-100 rounded text-neutral-700 cursor-pointer"
                          title="Reset"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Same photo or receipt */}
                  <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
                    <div
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                      className="transition-transform duration-150 max-w-full max-h-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedExpense.imageUrl}
                        alt="Submitted Receipt"
                        className="rounded-xl border border-neutral-200 max-h-[560px] object-contain shadow-md bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Decision & Invoice Panel */}
                <div className="w-full lg:w-[460px] p-6 overflow-y-auto space-y-6 bg-white">
                  {/* Query Initiated by Employee details */}
                  <div className="space-y-2 pb-4 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                        Employee Claim Query
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                          selectedExpense.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedExpense.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {selectedExpense.status}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-neutral-900">
                      {selectedExpense.vendor_name}
                    </h2>

                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1 text-xs">
                      <p className="font-semibold text-neutral-900">
                        Initiated by: Employee 1 ({selectedExpense.userId || 'employee@clearaudit.com'})
                      </p>
                      <p className="text-neutral-600">
                        Date: {selectedExpense.date_of_purchase} • Category: {selectedExpense.inferred_category}
                      </p>
                      <p className="text-neutral-800 pt-1 border-t border-neutral-200/80">
                        <strong>Description:</strong> &ldquo;{selectedExpense.userDescription || 'No description provided.'}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Compliance findings */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-neutral-600 uppercase">
                      Audit Findings
                    </h3>
                    {selectedExpense.policy_violation ? (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1 text-red-800">
                        <div className="flex items-center gap-1.5 font-bold text-red-700">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>Policy Violation Flagged</span>
                        </div>
                        <p>{selectedExpense.violation_reason}</p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-800">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>Policy Verified & Compliant</span>
                        </div>
                        <p>No prohibited items, meal caps within limits, weekday verified.</p>
                      </div>
                    )}
                  </div>

                  {/* Line Items Breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-neutral-600 uppercase">
                      Itemized Line Items
                    </h3>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 divide-y divide-neutral-200 text-xs">
                      {(selectedExpense.line_items || []).map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <span className="text-neutral-700">{item.description}</span>
                          <span className="font-mono font-bold text-neutral-900">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="p-3 flex items-center justify-between font-bold bg-neutral-100 rounded-b-xl">
                        <span className="text-neutral-900">Total Claimed</span>
                        <span className="font-mono text-neutral-900">
                          ${(selectedExpense.total_amount || 0).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: APPROVE, REJECT, AND INVOICE GENERATION */}
                  <div className="pt-4 border-t border-neutral-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* APPROVE BUTTON */}
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={processing || selectedExpense.status === 'Approved'}
                        className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      {/* REJECT BUTTON */}
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing || selectedExpense.status === 'Rejected'}
                        className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>

                    {/* INVOICE GENERATION BUTTON WITH ALL THINGS MENTIONED */}
                    <button
                      type="button"
                      onClick={handleGenerateInvoice}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Generate Invoice</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-neutral-500 text-xs">
                Select an employee query from the queue to review receipts and approve claims.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Reject Employee Claim</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Provide a reason for the employee regarding this policy rejection.
              </p>
            </div>

            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. Alcohol item detected or weekend receipt missing manager pre-approval."
              className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 rounded-lg text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Download,
  Search,
  LogOut,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertOctagon,
  Sparkles,
  FileText,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { ExpenseRequest, ExpenseStatus } from '../types';
import {
  generateExpenseReportCSV,
  calculateAuditMetrics,
  formatINR
} from '../lib/auditLogic';
import { RevokeModal } from '../components/RevokeModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const {
    expenses,
    acceptExpense,
    rejectExpense,
    revokeExpense,
    seedDemoData,
    clearAllExpenses
  } = useExpenses();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ExpenseStatus>('All');
  const [selectedForRevoke, setSelectedForRevoke] = useState<ExpenseRequest | null>(null);
  const [inspectExpense, setInspectExpense] = useState<ExpenseRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Filter and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const matchesStatus =
        statusFilter === 'All' ? true : item.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.tokenNumber.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeEmail.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [expenses, statusFilter, searchQuery]);

  // Aggregate metrics
  const metrics = useMemo(() => calculateAuditMetrics(expenses), [expenses]);

  const handleAccept = (id: string, token: string) => {
    acceptExpense(id, currentUser?.name || 'Marcus Vance');
    showToast(`Request ${token} approved & disbursed.`);
  };

  const handleReject = (id: string, token: string) => {
    rejectExpense(id, currentUser?.name || 'Marcus Vance');
    showToast(`Request ${token} rejected.`);
  };

  const handleConfirmRevoke = (reason: string) => {
    if (!selectedForRevoke) return;
    revokeExpense(selectedForRevoke.id, reason, currentUser?.name || 'Marcus Vance');
    showToast(`Request ${selectedForRevoke.tokenNumber} revoked with compliance note.`);
    setSelectedForRevoke(null);
  };

  const handleDownloadCSV = () => {
    if (expenses.length === 0) {
      alert('Queue is empty. No expense data to export.');
      return;
    }
    const csvContent = generateExpenseReportCSV(expenses);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `ClearAudit_Reimbursement_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Comprehensive CSV audit report exported.');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white flex flex-col lg:flex-row">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 text-xs font-mono border border-zinc-700 shadow-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar on Admin */}
      <aside className="w-full lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-zinc-50 flex flex-col justify-between p-6 z-20">
        <div>
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 pb-6 border-b border-zinc-200 mb-6">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_kdnznskdnznskdnz_c1f00f87.jpeg"
              alt="ClearAudit"
              className="w-8 h-8 border border-zinc-900 object-cover"
            />
            <span className="text-base font-bold tracking-tight uppercase text-zinc-950">
              ClearAudit
            </span>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-zinc-700" />
                <span>Export Report</span>
              </div>
            </button>

            <button
              type="button"
              onClick={seedDemoData}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <span>Seed Sample Data</span>
              </div>
            </button>

            {expenses.length > 0 && (
              <button
                type="button"
                onClick={clearAllExpenses}
                className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-950 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-zinc-500" />
                  <span>Clear Queue</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Sign Out at Bottom */}
        <div className="pt-6 border-t border-zinc-200 mt-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-10 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 lg:pl-64 min-w-0 pb-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
            <h1 className="text-xl font-bold uppercase tracking-tight text-zinc-950">
              Audit Queue
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={seedDemoData}
                className="h-8 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                <span>Seed Sample Data</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="h-8 px-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Metric Cards (Directly: Pending, Accepted and Disbursed, Revoked, Total - no descriptions) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-zinc-200 bg-zinc-50/50">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                Pending Claims
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-zinc-950">
                  {metrics.pending}
                </span>
                <span className="text-xs font-mono text-zinc-600 font-semibold">
                  {formatINR(metrics.totalPendingAmount)}
                </span>
              </div>
            </div>

            <div className="p-4 border border-zinc-200 bg-zinc-50/50">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                Accepted &amp; Disbursed
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-zinc-950">
                  {metrics.accepted}
                </span>
                <span className="text-xs font-mono text-zinc-950 font-bold">
                  {formatINR(metrics.totalDisbursed)}
                </span>
              </div>
            </div>

            <div className="p-4 border border-zinc-200 bg-zinc-50/50">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                Revoked
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-zinc-950">
                  {metrics.revoked}
                </span>
              </div>
            </div>

            <div className="p-4 border border-zinc-200 bg-zinc-50/50">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                Total Claims
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-zinc-950">
                  {metrics.total}
                </span>
              </div>
            </div>
          </div>

          {/* Switch Tab Below & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 border border-zinc-200 text-xs">
              {(['All', 'Pending', 'Accepted', 'Rejected', 'Revoked'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 font-mono uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  {tab} {tab !== 'All' && `(${expenses.filter(e => e.status === tab).length})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search token, claimant, merchant..."
                className="w-full h-10 pl-9 pr-3 border border-zinc-300 bg-white text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Main Table */}
          <div className="border border-zinc-200 overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Token &amp; Date</th>
                  <th className="py-3 px-4">Claimant</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileText className="w-7 h-7 mx-auto text-zinc-300" />
                        <p className="font-mono text-xs text-zinc-700">No matching requests in audit queue.</p>
                        {expenses.length === 0 && (
                          <button
                            type="button"
                            onClick={seedDemoData}
                            className="mt-2 text-xs font-mono text-zinc-950 underline underline-offset-4 cursor-pointer"
                          >
                            Populate sample requests for testing
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(item => {
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-zinc-950 block select-all">
                            {item.tokenNumber}
                          </span>
                          <span className="text-[11px] text-zinc-400 block">{item.date}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-zinc-900 block">{item.employeeName}</span>
                          <span className="text-[11px] font-mono text-zinc-400 block truncate max-w-[150px]">
                            {item.employeeEmail}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-zinc-900 font-medium truncate" title={item.description}>
                            {item.description}
                          </p>
                          <span className="text-[11px] font-mono uppercase text-zinc-500">
                            {item.category}
                          </span>
                          {item.status === 'Revoked' && item.revocationReason && (
                            <p className="mt-1 text-[11px] text-zinc-700 font-sans italic border-l border-zinc-900 pl-1.5 line-clamp-1">
                              Note: "{item.revocationReason}"
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950">
                          {formatINR(item.amount)}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {item.status === 'Accepted' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-zinc-950 text-white uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {item.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {item.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-zinc-200 text-zinc-900 uppercase">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                          {item.status === 'Revoked' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-950 border border-zinc-950 uppercase font-semibold">
                              <AlertOctagon className="w-3 h-3" /> Revoked
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectExpense(item)}
                              title="Inspect & Download Official Receipt"
                              className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAccept(item.id, item.tokenNumber)}
                              disabled={item.status === 'Accepted'}
                              title="Accept & Authorize Reimbursement"
                              className={`px-2 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                                item.status === 'Accepted'
                                  ? 'opacity-30 cursor-not-allowed bg-zinc-100 text-zinc-400'
                                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
                              }`}
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(item.id, item.tokenNumber)}
                              disabled={item.status === 'Rejected'}
                              title="Reject Reimbursement"
                              className={`px-2 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                                item.status === 'Rejected'
                                  ? 'opacity-30 cursor-not-allowed bg-zinc-100 text-zinc-400'
                                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-300'
                              }`}
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedForRevoke(item)}
                              title="Revoke with Guidance Reason"
                              className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider bg-white text-zinc-950 hover:bg-zinc-100 border border-zinc-900 transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Revocation modal */}
      <RevokeModal
        isOpen={!!selectedForRevoke}
        expense={selectedForRevoke}
        onClose={() => setSelectedForRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />

      {/* Receipt inspection & legitimate voucher modal */}
      <ReceiptViewerModal
        isOpen={!!inspectExpense}
        expense={inspectExpense}
        onClose={() => setInspectExpense(null)}
      />
    </div>
  );
};

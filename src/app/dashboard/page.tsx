'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
import { getLocalExpenses, addLocalExpense } from '@/lib/expenses-store';
import jsPDF from 'jspdf';
import {
  Home,
  FileText,
  LogOut,
  Camera,
  Upload,
  X,
  Loader2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Send,
  Download,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | null>(null);

  // File & Camera states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Meals');
  const [manualAmount, setManualAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Camera stream
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your AI compliance assistant. Ask me anything about corporate spending limits, eligible receipt categories, or audit rules.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Load clean expenses (no mock entries)
  useEffect(() => {
    setExpenses(getLocalExpenses());
    const handleUpdate = () => {
      setExpenses(getLocalExpenses());
    };
    window.addEventListener('clearaudit_expenses_updated', handleUpdate);
    return () => window.removeEventListener('clearaudit_expenses_updated', handleUpdate);
  }, []);

  // Camera controls
  const startCamera = useCallback(async () => {
    setSubmitError('');
    setActiveTab('camera');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setSubmitError('Camera access unavailable or denied. Please use the Upload Receipt option.');
      setCameraActive(false);
      setActiveTab(null);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPreviewUrl(dataUrl);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Drag & drop file handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setSubmitError('Supported formats: PDF, JPG, PNG, WEBP (Max 10MB).');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File exceeds maximum size of 10MB.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  // Submit & analyze receipt
  const handleSubmitReceipt = async () => {
    if (!previewUrl || !user) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewUrl,
          description: description || 'Employee receipt claim',
          categoryHint: category,
          userId: user.uid,
          amount: manualAmount ? parseFloat(manualAmount) : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Audit processing failed. Please try again.');
      }

      const responseData = await res.json();
      const auditResult = responseData.auditResult;

      const newExpense: Expense = {
        id: responseData.expenseId || `exp_${Date.now()}`,
        userId: user.uid,
        imageUrl: previewUrl,
        userDescription: description || 'Business expense',
        vendor_name: auditResult.vendor_name || 'Merchant',
        date_of_purchase: auditResult.date_of_purchase || new Date().toISOString().split('T')[0],
        total_amount: auditResult.total_amount || (manualAmount ? parseFloat(manualAmount) : 0),
        currency: auditResult.currency || 'USD',
        inferred_category: auditResult.inferred_category || category,
        line_items: auditResult.line_items || [],
        policy_violation: auditResult.policy_violation || false,
        violation_reason: auditResult.violation_reason || null,
        audit_confidence_score: auditResult.audit_confidence_score || 0.95,
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addLocalExpense(newExpense);
      setExpenses((prev) => [newExpense, ...prev]);

      // Reset input form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setManualAmount('');
      setActiveTab(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit receipt';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Report
  const handleGenerateReport = (expense: Expense) => {
    const doc = new jsPDF();

    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.text('ClearAudit Expense Reimbursement Report', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('CORPORATE AUDIT RECORD • GEMMA 4 VERIFIED', 14, 26);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Claim ID: ${expense.id}`, 14, 44);
    doc.text(`Employee: ${user?.email || 'Employee 1'}`, 14, 52);
    doc.text(`Vendor: ${expense.vendor_name}`, 14, 60);
    doc.text(`Transaction Date: ${expense.date_of_purchase}`, 14, 68);
    doc.text(`Category: ${expense.inferred_category}`, 14, 76);
    doc.text(`Total Amount: $${(expense.total_amount || 0).toFixed(2)} ${expense.currency || 'USD'}`, 14, 84);
    doc.text(`Current Status: ${expense.status.toUpperCase()}`, 14, 92);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 100, 196, 100);

    doc.setFontSize(11);
    doc.text('Itemized Line Items:', 14, 110);
    let y = 120;
    (expense.line_items || []).forEach((item) => {
      doc.setFontSize(9);
      doc.text(`• ${item.description}`, 20, y);
      doc.text(`$${item.amount.toFixed(2)}`, 160, y);
      y += 8;
    });

    doc.line(14, y + 4, 196, y + 4);
    doc.setFontSize(11);
    doc.text('Compliance Findings:', 14, y + 16);
    doc.setFontSize(9);
    doc.text(`Policy Compliant: ${expense.policy_violation ? 'FLAGGED FOR VIOLATION' : 'YES (VERIFIED)'}`, 14, y + 26);
    if (expense.violation_reason) {
      doc.text(`Flag Details: ${expense.violation_reason}`, 14, y + 34, { maxWidth: 170 });
    }

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleString()} by ClearAudit Corporate Auditor`, 14, 280);

    doc.save(`Expense_Report_${expense.id}.pdf`);
  };

  // Chatbot message send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const q = userMsg.text.toLowerCase();
      let reply =
        'Your question has been noted. Per corporate expense guidelines, receipts must be submitted within 30 days and itemized.';

      if (q.includes('meal') || q.includes('food') || q.includes('dinner') || q.includes('lunch')) {
        reply =
          'Meals have a corporate limit of $50.00 USD per person. Meals exceeding this cap will be automatically flagged for secondary review.';
      } else if (q.includes('alcohol') || q.includes('beer') || q.includes('wine')) {
        reply =
          'Alcohol and tobacco products are strictly non-reimbursable under corporate policy §2.1.';
      } else if (q.includes('weekend') || q.includes('sunday') || q.includes('saturday')) {
        reply =
          'Transactions occurring on weekends are automatically flagged for secondary manager review.';
      } else if (q.includes('receipt') || q.includes('format') || q.includes('file')) {
        reply =
          'Accepted formats are PDF, JPG, and PNG up to 10MB. Itemized receipts showing date, merchant, and line items are required.';
      } else if (q.includes('status') || q.includes('pending') || q.includes('approve')) {
        reply =
          'Pending claims are reviewed by the finance administration team. Once approved, payout processing takes 2-3 business days.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 600);
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

  return (
    <div className="min-h-screen bg-neutral-50 flex text-neutral-900">
      {/* Sidebar - Clean Navigation (Only Dashboard, Expense Policy, and Sign Out) */}
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
                Employee Dashboard
              </span>
            </div>
          </div>

          {/* Navigation Links: ONLY Dashboard and Expense Policy */}
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
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
            {user?.email || 'employee@clearaudit.com'}
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-neutral-50">
        {/* Top Header - No Role Switcher */}
        <header className="h-16 border-b border-neutral-200 px-6 flex items-center justify-between bg-white shadow-2xs">
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

        {/* Main Dashboard Body */}
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
          {submitError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* TWO MAIN BOXES: START CAMERA & UPLOAD RECEIPT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Box 1: Start Camera */}
            <div
              onClick={startCamera}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 bg-white shadow-sm hover:border-neutral-900 group ${
                cameraActive ? 'border-neutral-900 ring-2 ring-neutral-900' : 'border-neutral-200'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors flex items-center justify-center text-neutral-800">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Start Camera</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Snap instant physical receipt photo using device camera
                </p>
              </div>
              <button
                type="button"
                className="mt-2 px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-xs transition-colors"
              >
                Launch Camera
              </button>
            </div>

            {/* Box 2: Upload Receipt Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 bg-white shadow-sm hover:border-neutral-900 group ${
                dragActive ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors flex items-center justify-center text-neutral-800">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Upload Receipt</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Drag and drop receipt file here or click to browse
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                PDF, JPG, PNG (Max 10MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* ACTIVE CAMERA VIEWER */}
          {cameraActive && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Live Receipt Camera</span>
                </h3>
                <button
                  onClick={stopCamera}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-[16/9] max-h-96 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 flex gap-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full border-4 border-white bg-white/30 hover:bg-white/50 transition-all cursor-pointer shadow-xl flex items-center justify-center"
                    title="Capture Photo"
                  >
                    <div className="w-10 h-10 rounded-full bg-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW & AUDIT SUBMISSION BOX */}
          {previewUrl && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-bold text-neutral-900">Receipt Ready for AI Audit</h3>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-100 max-h-64 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Receipt preview" className="object-contain max-h-64 w-full" />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-700">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                    >
                      <option value="Meals">Meals</option>
                      <option value="Travel">Travel & Transport</option>
                      <option value="Supplies">Office Supplies</option>
                      <option value="Lodging">Lodging & Hotel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-700">
                      Amount (Optional override)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Auto-detected by AI"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-700">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Client lunch meeting"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitReceipt}
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Processing with Gemma 4…</span>
                      </>
                    ) : (
                      <>
                        <span>Submit for AI Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBMITTED CLAIMS & "GENERATE REPORT" BUTTON (NO FAKE ENTRIES) */}
          {expenses.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold text-neutral-900">Your Submitted Claims</h2>
                <span className="text-xs font-mono text-neutral-500">{expenses.length} claims</span>
              </div>

              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">
                          {expense.vendor_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            expense.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : expense.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {expense.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {expense.inferred_category} • {expense.date_of_purchase} •{' '}
                        <strong className="text-neutral-900 font-mono">
                          ${(expense.total_amount || 0).toFixed(2)}
                        </strong>
                      </p>
                      {expense.policy_violation ? (
                        <p className="text-xs text-red-700 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Flagged: {expense.violation_reason}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Gemma 4 Verified Compliant</span>
                        </p>
                      )}
                    </div>

                    {/* "GENERATE REPORT" BUTTON */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleGenerateReport(expense)}
                        className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Generate Report</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMPLE CHATBOT (NAME ONLY, NO DESC) */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Title: JUST ITS NAME NOT ANYTHING DESC */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Audit Assistant</h3>
            </div>

            {/* Chat Messages */}
            <div className="p-4 space-y-3 h-64 overflow-y-auto bg-white">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-neutral-900 text-white rounded-br-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[10px] opacity-60 mt-1 block text-right font-mono">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2.5 items-center text-xs text-neutral-500 font-mono">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs flex-shrink-0">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="p-2.5 rounded-2xl bg-neutral-100 text-neutral-600">
                    Assistant is typing…
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-neutral-200 bg-neutral-50/50 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question about corporate spending policy..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

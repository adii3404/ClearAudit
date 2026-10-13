'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
import {
  getLocalExpenses,
  addLocalExpense,
} from '@/lib/expenses-store';
import {
  Home,
  FileText,
  Scale,
  LogOut,
  Plus,
  Camera,
  Upload,
  X,
  Loader2,
  Shield,
  ChevronRight,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading: authLoading, logout, setRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'camera' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Meals');
  const [manualAmount, setManualAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Load initial expenses and sync with both local store and Firestore
  useEffect(() => {
    // 1. Load from synchronized local store immediately
    setExpenses(getLocalExpenses());

    const handleLocalUpdate = () => {
      setExpenses(getLocalExpenses());
    };
    window.addEventListener('clearaudit_expenses_updated', handleLocalUpdate);

    // 2. Real-time Firestore sync with resilient error handling
    if (!user) return () => window.removeEventListener('clearaudit_expenses_updated', handleLocalUpdate);

    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                ...d,
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt),
                updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(d.updatedAt),
              } as Expense;
            });
            setExpenses(data);
          }
        },
        () => {
          // Fallback seamlessly to local store if Firestore rules reject query
          setExpenses(getLocalExpenses());
        }
      );
    } catch {
      setExpenses(getLocalExpenses());
    }

    return () => {
      unsub();
      window.removeEventListener('clearaudit_expenses_updated', handleLocalUpdate);
    };
  }, [user]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setSubmitError('Camera access denied or unavailable. Please use file upload.');
      setUploadMode('file');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

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
      setSubmitError('Only PNG, JPEG, WEBP, and PDF files are supported.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File must be under 10MB.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      let finalImageUrl = previewUrl || '';

      // Try uploading to Firebase Storage if online
      try {
        const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch {
        // Fallback to base64 data URI if storage fails
        if (!finalImageUrl && previewUrl) finalImageUrl = previewUrl;
      }

      // Call AI audit API (Gemma 4 with multi-model fallback)
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          description,
          categoryHint: category,
          userId: user.uid,
          amount: manualAmount ? parseFloat(manualAmount) : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Receipt audit processing failed');
      }

      const responseData = await res.json();
      const auditResult = responseData.auditResult;

      // Construct verified Expense record
      const newExpense: Expense = {
        id: responseData.expenseId || 'exp_' + Date.now(),
        userId: user.uid,
        imageUrl: finalImageUrl,
        userDescription: description || '',
        vendor_name: auditResult.vendor_name || 'Corporate Merchant',
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

      // Store locally and update UI state immediately
      addLocalExpense(newExpense);
      setExpenses((prev) => [newExpense, ...prev]);

      // Attempt non-blocking Firestore document creation
      try {
        await addDoc(collection(db, 'expenses'), {
          ...newExpense,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking
      }

      // Reset and close modal
      closeModal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    stopCamera();
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setSubmitError('');
    setManualAmount('');
  };

  const handleSwitchToAdmin = () => {
    setRole('admin');
    router.push('/admin');
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

  // Calculate Metrics
  const totalAmount = expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const pendingCount = expenses.filter((e) => e.status === 'Pending').length;
  const approvedCount = expenses.filter((e) => e.status === 'Approved').length;
  const compliantCount = expenses.filter((e) => !e.policy_violation).length;
  const complianceRate = expenses.length > 0 ? Math.round((compliantCount / expenses.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-neutral-50 flex text-neutral-900">
      {/* Sidebar - Light Theme */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shadow-xs">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-neutral-900 block leading-tight">
                  ClearAudit
                </span>
                <span className="text-[10px] uppercase font-mono text-neutral-500">
                  Employee Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-200 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <button
              onClick={handleSwitchToAdmin}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-neutral-500 group-hover:text-neutral-800" />
                <span>Admin Audit Center</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700" />
            </button>

            <Link
              href="/policy"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Expense Policy</span>
            </Link>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-neutral-200 space-y-3 bg-neutral-50/50">
          <div className="p-3 rounded-lg bg-white border border-neutral-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-800">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                  {user?.displayName || 'Aditya Bhandari'}
                </p>
                <p className="text-[10px] text-neutral-500 font-mono truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-neutral-150 flex items-center justify-between">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                Employee
              </span>
              <button
                onClick={handleSwitchToAdmin}
                className="text-[10px] text-neutral-600 hover:text-neutral-900 font-medium underline cursor-pointer"
              >
                Go to Admin
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-neutral-50">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200 px-6 flex items-center justify-between bg-white shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight text-neutral-900">
              ClearAudit Corporate Expense Auditor
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 text-neutral-700 border border-neutral-200">
              <Sparkles className="w-3 h-3 text-neutral-800" />
              Gemma 4 AI Enabled
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSwitchToAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Center</span>
            </button>

            <button
              onClick={() => {
                setShowModal(true);
                setUploadMode('file');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Expense</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-1">
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Total Expenses
              </p>
              <p className="text-2xl font-bold font-mono text-neutral-900">
                ${totalAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-neutral-500">{expenses.length} claims submitted</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-1">
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Pending Audit
              </p>
              <p className="text-2xl font-bold font-mono text-neutral-900">{pendingCount}</p>
              <p className="text-[11px] text-neutral-500">Awaiting admin review</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-1">
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Approved
              </p>
              <p className="text-2xl font-bold font-mono text-neutral-900">{approvedCount}</p>
              <p className="text-[11px] text-neutral-500">Processed for payout</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-1">
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Compliance Rate
              </p>
              <p className="text-2xl font-bold font-mono text-neutral-900">{complianceRate}%</p>
              <p className="text-[11px] text-neutral-500">Gemma 4 policy check</p>
            </div>
          </div>

          {/* Real-time Expenses Table */}
          <div className="border border-neutral-200 rounded-xl bg-white shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Expense Claim History</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Real-time status tracking with Gemma 4 automated policy audits
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(true);
                  setUploadMode('camera');
                  startCamera();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Receipt</span>
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="text-sm text-neutral-600">No expenses recorded yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium cursor-pointer"
                >
                  Submit First Receipt
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-mono uppercase tracking-wider bg-neutral-50/80">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Vendor & Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">AI Compliance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                          {exp.date_of_purchase || '2026-10-12'}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-900">{exp.vendor_name || 'Vendor'}</p>
                          <p className="text-[11px] text-neutral-500">
                            {exp.inferred_category || 'General'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          ${(exp.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          {exp.policy_violation ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-red-50 border border-red-200 text-red-700">
                              <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={exp.violation_reason || ''}>
                                Flagged: {exp.violation_reason || 'Policy rule triggered'}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span>Compliant ({Math.round((exp.audit_confidence_score || 0.95) * 100)}%)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                              exp.status === 'Approved'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : exp.status === 'Rejected'
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-neutral-100 border border-neutral-200 text-neutral-700'
                            }`}
                          >
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(exp.imageUrl);
                              setDescription(exp.userDescription);
                              setManualAmount(exp.total_amount.toString());
                              setShowModal(true);
                            }}
                            className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold underline font-mono cursor-pointer"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* NEW EXPENSE MODAL (CAMERA + DRAG-DROP FILE UPLOAD) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Submit Receipt for AI Audit
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Mode Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('file');
                    stopCamera();
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    uploadMode === 'file'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('camera');
                    startCamera();
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    uploadMode === 'camera'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>
              </div>

              {/* Camera or Drop Area */}
              {uploadMode === 'camera' && !previewUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-neutral-900 aspect-[4/3] border border-neutral-300 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-all cursor-pointer shadow-lg"
                      title="Capture Photo"
                    />
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Receipt preview" className="w-full object-contain max-h-64" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (uploadMode === 'camera') startCamera();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-neutral-900 bg-neutral-100'
                      : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
                  <p className="text-xs text-neutral-800 font-semibold">
                    Drag and drop receipt image, or <span className="underline">browse</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                    PNG, JPEG, WEBP or PDF up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Expense Context */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="Meals">Meals</option>
                    <option value="Travel">Travel & Transport</option>
                    <option value="Supplies">Office Supplies</option>
                    <option value="Lodging">Lodging & Hotel</option>
                    <option value="Software">Software & SaaS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">
                    Amount (Optional override)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto-detected by AI"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">
                  Business Purpose / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client kickoff lunch in downtown NYC"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={(!selectedFile && !previewUrl) || submitting}
                className="w-full py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Receipt with Gemma 4…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Execute AI Audit & Submit Claim</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

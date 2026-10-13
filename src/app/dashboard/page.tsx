'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Expense } from '@/lib/types';
import {
  Home,
  Clock,
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
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
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

  // Real-time expense listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsub();
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
      setSubmitError('Camera access denied. Please allow camera access or use file upload.');
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
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    if (showModal && uploadMode === 'camera') {
      startCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, uploadMode]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
      // Upload to Firebase Storage
      const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Call AI audit API
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          description,
          categoryHint: category,
          userId: user.uid,
          amount: manualAmount ? parseFloat(manualAmount) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process receipt');
      }

      // Reset modal
      setShowModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      setCategory('Meals');
      setManualAmount('');
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === 'Pending').length,
    approved: expenses.filter((e) => e.status === 'Approved').length,
    rejected: expenses.filter((e) => e.status === 'Rejected').length,
    totalAmount: expenses
      .filter((e) => e.status === 'Approved')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0),
  };

  const sidebarLinks = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard#history', icon: Clock, label: 'Expense History' },
    { href: '/policy', icon: Scale, label: 'Spending Policy' },
    { href: '/terms', icon: FileText, label: 'Terms & Conditions' },
  ];

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-neutral-800 bg-neutral-950">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-neutral-50" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-neutral-50">
              ClearAudit
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              <link.icon className="w-4 h-4" strokeWidth={1.5} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User + Admin Toggle */}
        <div className="p-4 border-t border-neutral-800 space-y-2">
          {profile?.role === 'admin' && (
            <Link href="/admin" className="sidebar-link text-neutral-400 hover:text-neutral-50">
              <Settings className="w-4 h-4" strokeWidth={1.5} />
              Admin Console
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Link>
          )}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300">
              {profile?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-300 truncate">
                {profile?.displayName}
              </p>
              <p className="text-[10px] text-neutral-600 truncate">{profile?.email}</p>
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
      <main className="flex-1 overflow-auto">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-neutral-50" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-neutral-50">ClearAudit</span>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push('/login'))}
            className="text-neutral-500 hover:text-neutral-300"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-neutral-50">
                Expense Dashboard
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Submit receipts for AI-powered compliance audit
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Submitted', value: stats.total, icon: FileText },
              { label: 'Pending Review', value: stats.pending, icon: Clock },
              { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
              { label: 'Rejected', value: stats.rejected, icon: XCircle },
              {
                label: 'Reimbursed',
                value: `$${stats.totalAmount.toFixed(2)}`,
                icon: DollarSign,
              },
            ].map((stat) => (
              <div key={stat.label} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
                  <span className="text-[11px] text-neutral-500 font-medium tracking-wide uppercase">
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-semibold text-neutral-50">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Expense History Table */}
          <div id="history" className="card">
            <div className="px-5 py-4 border-b border-neutral-800">
              <h2 className="text-sm font-semibold text-neutral-50 tracking-tight">
                Expense History
              </h2>
            </div>

            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-400">No expenses submitted yet</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Click &quot;Add Expense&quot; to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {['Date', 'Vendor', 'Category', 'Amount', 'Policy', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[11px] font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="table-row">
                        <td className="px-5 py-3.5 text-sm text-neutral-300">
                          {expense.date_of_purchase || new Date(expense.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-neutral-200 font-medium">
                          {expense.vendor_name || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-neutral-400">
                            {expense.inferred_category || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-neutral-200 font-mono">
                          {expense.currency || '$'}
                          {expense.total_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-5 py-3.5">
                          {expense.policy_violation ? (
                            <span className="badge badge-flagged">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Flagged
                            </span>
                          ) : (
                            <span className="badge badge-compliant">Compliant</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`badge ${
                              expense.status === 'Pending'
                                ? 'badge-pending'
                                : expense.status === 'Approved'
                                ? 'badge-approved'
                                : 'badge-rejected'
                            }`}
                          >
                            {expense.status}
                          </span>
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

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-50">Submit New Expense</h3>
              <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('camera');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    uploadMode === 'camera'
                      ? 'bg-neutral-800 text-neutral-50'
                      : 'text-neutral-500'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('file');
                    stopCamera();
                  }}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-neutral-800 text-neutral-50'
                      : 'text-neutral-500'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
              </div>

              {/* Camera / File area */}
              {uploadMode === 'camera' && !previewUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-neutral-900 aspect-[4/3]">
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
                      className="w-14 h-14 rounded-full border-4 border-white/80 bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Receipt preview" className="w-full object-contain max-h-64" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (uploadMode === 'camera') startCamera();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-neutral-500 bg-neutral-900/50'
                      : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 text-neutral-600 mb-3" />
                  <p className="text-sm text-neutral-400">
                    Drag & drop or <span className="text-neutral-200 font-medium">browse</span>
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    PNG, JPEG, WEBP, or PDF up to 10MB
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

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="Meals">Meals</option>
                  <option value="Travel">Travel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the expense…"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              {/* Manual amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">
                  Amount (optional — AI will extract)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedFile || submitting}
                className="btn-primary w-full py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing with AI…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit for Audit
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

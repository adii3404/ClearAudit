import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  MessageSquare,
  BookOpen,
  Lock,
  LogOut,
  Send,
  ChevronRight,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { ExpenseRequest, ExpenseCategory, ChatMessage } from '../types';
import { answerPolicyQuery, formatINR, generateExpenseReportCSV } from '../lib/auditLogic';
import { CameraCaptureModal } from '../components/CameraCaptureModal';
import { UploadMetadataModal } from '../components/UploadMetadataModal';
import { ReceiptTokenModal } from '../components/ReceiptTokenModal';
import { ExpensePolicyModal } from '../components/ExpensePolicyModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { expenses, addExpense, seedDemoData } = useExpenses();

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newlyCreatedExpense, setNewlyCreatedExpense] = useState<ExpenseRequest | null>(null);
  const [inspectExpense, setInspectExpense] = useState<ExpenseRequest | null>(null);

  // Staged file for metadata entry
  const [stagedFile, setStagedFile] = useState<{
    name: string;
    previewUrl?: string;
    dataUrl?: string;
  } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  // Ally Chatbot state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_ally_welcome',
      sender: 'agent',
      text: 'Hi, I am Ally. Ask me something regarding company expense policies, daily per diems, flight rules, or receipt limits in INR.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Handle Sign Out
  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Trigger Local File Input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process selected file
  const handleFileSelected = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller receipt.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setStagedFile({
        name: file.name,
        previewUrl: result,
        dataUrl: result
      });
      setIsMetadataOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string, fileName: string) => {
    setIsCameraOpen(false);
    setStagedFile({
      name: fileName,
      previewUrl: imageDataUrl,
      dataUrl: imageDataUrl
    });
    setIsMetadataOpen(true);
  };

  const handleMetadataSubmit = (data: {
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
  }) => {
    setIsMetadataOpen(false);
    const created = addExpense({
      employeeEmail: currentUser?.email || 'employee@clearaudit.internal',
      employeeName: currentUser?.name || 'Employee Staff',
      description: data.description,
      amount: data.amount,
      currency: 'INR',
      date: data.date,
      category: data.category,
      receiptImage: stagedFile?.dataUrl,
      receiptFileName: stagedFile?.name || 'receipt_doc.jpg'
    });

    setStagedFile(null);
    setNewlyCreatedExpense(created);
  };

  const handleSendChat = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const replyText = answerPolicyQuery(query);
    const agentMsg: ChatMessage = {
      id: 'msg_agent_' + Date.now(),
      sender: 'agent',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, agentMsg]);
    if (!customQuery) {
      setChatInput('');
    }
  };

  // Filter expenses for this employee
  const employeeExpenses = expenses.filter(
    e => !currentUser || e.employeeEmail === currentUser.email
  );

  // Generate & Download Report for employee
  const handleDownloadReport = () => {
    if (employeeExpenses.length === 0) {
      alert('No expense submissions to export.');
      return;
    }
    const csvContent = generateExpenseReportCSV(employeeExpenses);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `ClearAudit_My_Expenses_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white flex flex-col lg:flex-row">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Left Sidebar (fixed on desktop, matching user requirement) */}
      <aside className="w-full lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-zinc-50 flex flex-col justify-between p-6 z-20">
        <div>
          {/* Logo & Company Name at top */}
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

          {/* Navigation Options */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-zinc-700" />
                <span>Open Camera</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              onClick={triggerFileInput}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-zinc-700" />
                <span>Upload from Local</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('ally-chat-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  setTimeout(() => chatInputRef.current?.focus(), 400);
                }
              }}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-zinc-700" />
                <span>Ask Query</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsPolicyOpen(true)}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-zinc-700" />
                <span>Expense Policy</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsPasswordOpen(true)}
              className="w-full h-10 px-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-zinc-700" />
                <span>Change Password</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
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

      {/* Main Content Area (on the right) */}
      <main className="flex-1 lg:pl-64 min-w-0 pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8 space-y-8">
          {/* Open Camera Button */}
          <div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white px-5 flex items-center justify-between transition-colors cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Open Camera
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Upload from Local Section */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-zinc-950 bg-zinc-100'
                : 'border-zinc-300 hover:border-zinc-950 bg-zinc-50/50 hover:bg-zinc-50'
            }`}
          >
            <div className="w-10 h-10 mx-auto mb-3 border border-zinc-300 bg-white flex items-center justify-center text-zinc-700">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-1">
              Drag and drop receipt files here, or click to browse files
            </p>
            <p className="text-xs text-zinc-500 mb-3">
              Open Files (.jpg, .png, .pdf up to 5MB)
            </p>
            <span className="inline-block px-3 py-1 bg-white border border-zinc-200 text-[11px] font-mono text-zinc-700 uppercase tracking-wider hover:bg-zinc-100 transition-colors">
              Browse Files
            </span>
          </div>

          {/* Ally Chatbot Tab (with animated bot SVG in the right corner) */}
          <div id="ally-chat-section" className="border border-zinc-200 bg-white overflow-hidden shadow-xs">
            {/* Header banner with Ally Bot SVG */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden border border-zinc-300">
                  <img
                    src="/assets/aistudio/ai_chat_bot_d8c458a3.svg"
                    alt="Ally Bot"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    Ally
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Hi, I am Ally. Ask me something.
                  </p>
                </div>
              </div>

              {/* Bot SVG in right corner */}
              <div className="hidden sm:block absolute right-4 -top-1 pointer-events-none">
                <img
                  src="/assets/aistudio/ai_chat_bot_d8c458a3.svg"
                  alt="Ally Animated Bot"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-xs"
                />
              </div>
            </div>

            {/* Quick chips */}
            <div className="px-4 pt-3 flex flex-wrap gap-2">
              {[
                'Meal per diem limit?',
                'Flight booking rules?',
                'Receipt requirements?',
                'Software subscriptions?',
                'Reimbursement timeline?'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendChat(undefined, chip)}
                  className="px-2 py-0.5 text-[11px] font-mono bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat message thread */}
            <div className="p-4 max-h-64 overflow-y-auto space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-zinc-950 text-white'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800'
                    }`}
                  >
                    {msg.sender === 'agent' && (
                      <span className="block text-[10px] font-mono uppercase text-zinc-400 mb-1 border-b border-zinc-200 pb-0.5">
                        Ally &bull; Policy Assistant
                      </span>
                    )}
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat input form */}
            <form onSubmit={e => handleSendChat(e)} className="p-3 border-t border-zinc-200 flex gap-2 bg-white">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask Ally a policy question (e.g. Can I expense dinner over ₹1,000?)"
                className="flex-1 h-10 px-3 border border-zinc-300 bg-white text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
              />
              <button
                type="submit"
                className="h-10 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>
          </div>

          {/* Recent Submissions Section (at the end) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold uppercase tracking-tight text-zinc-950">
                Recent Submissions
              </h2>
              <div className="flex items-center gap-3">
                {employeeExpenses.length === 0 && (
                  <button
                    type="button"
                    onClick={seedDemoData}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-950 uppercase underline decoration-zinc-300 cursor-pointer"
                  >
                    Load Sample Entries
                  </button>
                )}
                {employeeExpenses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                )}
              </div>
            </div>

            {employeeExpenses.length === 0 ? (
              <div className="p-10 border border-zinc-200 bg-zinc-50 text-center">
                <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-700 mb-1">
                  No Expense Submissions Yet
                </p>
                <p className="text-xs text-zinc-400">
                  Use the camera scanner or local file upload above to submit your first expense slip.
                </p>
              </div>
            ) : (
              <div className="border border-zinc-200 divide-y divide-zinc-200">
                {employeeExpenses.map(item => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => setInspectExpense(item)}
                      className="p-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-zinc-950 select-all">
                              {item.tokenNumber}
                            </span>
                            <span className="text-zinc-300">&bull;</span>
                            <span className="text-xs text-zinc-500 font-mono">{item.date}</span>
                            <span className="text-zinc-300">&bull;</span>
                            <span className="text-[11px] uppercase tracking-wider text-zinc-600 truncate">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-900 font-medium truncate">
                            {item.description}
                          </p>

                          {/* Revocation Warning Box if status is Revoked */}
                          {item.status === 'Revoked' && item.revocationReason && (
                            <div className="mt-2 p-2.5 bg-zinc-50 border-l-2 border-zinc-950 border-y border-r border-zinc-200 text-xs">
                              <span className="font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1 mb-0.5">
                                <AlertOctagon className="w-3.5 h-3.5" /> Auditor Revocation Note:
                              </span>
                              <span className="text-zinc-800">{item.revocationReason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 gap-1">
                          <span className="text-sm font-bold font-mono text-zinc-950">
                            {formatINR(item.amount)}
                          </span>
                          <div>
                            {item.status === 'Accepted' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-zinc-950 text-white uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            )}
                            {item.status === 'Pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                            {item.status === 'Rejected' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-zinc-200 text-zinc-900 uppercase">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            )}
                            {item.status === 'Revoked' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-zinc-100 text-zinc-950 border border-zinc-950 uppercase font-semibold">
                                <AlertOctagon className="w-3 h-3" /> Revoked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <UploadMetadataModal
        isOpen={isMetadataOpen}
        fileInfo={stagedFile}
        onClose={() => {
          setIsMetadataOpen(false);
          setStagedFile(null);
        }}
        onSubmit={handleMetadataSubmit}
      />

      <ReceiptTokenModal
        isOpen={!!newlyCreatedExpense}
        expense={newlyCreatedExpense}
        onClose={() => setNewlyCreatedExpense(null)}
      />

      <ExpensePolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />

      <ReceiptViewerModal
        isOpen={!!inspectExpense}
        expense={inspectExpense}
        onClose={() => setInspectExpense(null)}
      />
    </div>
  );
};

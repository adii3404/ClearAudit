import React, { useRef } from 'react';
import { Download, Printer, CheckCircle2, Clock, AlertOctagon, XCircle } from 'lucide-react';
import { ExpenseRequest } from '../types';
import { formatINR } from '../lib/auditLogic';

interface LegitReceiptSlipProps {
  expense: ExpenseRequest;
  onClose?: () => void;
}

export const LegitReceiptSlip: React.FC<LegitReceiptSlipProps> = ({ expense, onClose }) => {
  const slipRef = useRef<HTMLDivElement>(null);

  const netAmount = Math.round((expense.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((expense.amount - netAmount) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    // Generate clean printable receipt as an HTML canvas image download
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1000);

    // Outer border
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 740, 940);

    // Inner header
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('CLEARAUDIT INDIA CORPORATE VOUCHER', 60, 80);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#52525b';
    ctx.fillText('GSTIN: 27AAAC1892B1ZK | PAN: AAAC1892B | REG: MUMBAI BKC', 60, 105);
    ctx.fillText('TAX REIMBURSEMENT INVOICE & AUDIT SLIP', 60, 125);

    // Divider
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 145);
    ctx.lineTo(740, 145);
    ctx.stroke();

    // Token & Status box
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(60, 160, 680, 80);
    ctx.strokeStyle = '#18181b';
    ctx.strokeRect(60, 160, 680, 80);

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`TOKEN: ${expense.tokenNumber}`, 80, 205);

    ctx.font = 'bold 16px monospace';
    ctx.fillText(`STATUS: ${expense.status.toUpperCase()}`, 520, 205);

    // Details Grid
    ctx.font = '14px monospace';
    ctx.fillStyle = '#27272a';
    ctx.fillText(`CLAIMANT:      ${expense.employeeName} (${expense.employeeEmail})`, 60, 280);
    ctx.fillText(`EXPENSE DATE:  ${expense.date}`, 60, 310);
    ctx.fillText(`CATEGORY:      ${expense.category}`, 60, 340);
    ctx.fillText(`DESCRIPTION:   ${expense.description}`, 60, 370);
    ctx.fillText(`LOGGED AT:     ${new Date(expense.submittedAt).toLocaleString('en-IN')}`, 60, 400);

    // Items table header
    ctx.fillStyle = '#18181b';
    ctx.fillRect(60, 440, 680, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ITEM PARTICULARS', 80, 460);
    ctx.fillText('HSN/SAC', 380, 460);
    ctx.fillText('TAX RATE', 500, 460);
    ctx.fillText('AMOUNT (INR)', 620, 460);

    // Row
    ctx.fillStyle = '#18181b';
    ctx.font = '13px monospace';
    ctx.fillText(expense.description.substring(0, 32), 80, 500);
    ctx.fillText('998311', 380, 500);
    ctx.fillText('18% GST', 500, 500);
    ctx.fillText(formatINR(expense.amount), 620, 500);

    // Summary lines
    ctx.beginPath();
    ctx.moveTo(60, 540);
    ctx.lineTo(740, 540);
    ctx.stroke();

    ctx.fillText(`NET TAXABLE AMOUNT:          ${formatINR(netAmount)}`, 380, 580);
    ctx.fillText(`CGST (9.0%):                  ${formatINR(cgst)}`, 380, 610);
    ctx.fillText(`SGST (9.0%):                  ${formatINR(sgst)}`, 380, 640);

    ctx.font = 'bold 18px monospace';
    ctx.fillText(`TOTAL DISBURSABLE:   ${formatINR(expense.amount)}`, 350, 690);

    if (expense.revocationReason) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('AUDIT REVOCATION NOTE:', 60, 750);
      ctx.fillStyle = '#18181b';
      ctx.font = '12px monospace';
      ctx.fillText(`"${expense.revocationReason}"`, 60, 780);
    }

    // Footer & Sign off
    ctx.fillStyle = '#71717a';
    ctx.font = '11px monospace';
    ctx.fillText('ELECTRONICALLY VERIFIED & AUDITED UNDER CLEARAUDIT SYSTEM', 60, 870);
    ctx.fillText('AUTHORIZED SIGNATORY: FINANCE & DISBURSEMENT CELL', 60, 890);

    // Download blob
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ClearAudit_Voucher_${expense.tokenNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white border border-zinc-300 p-6 sm:p-8 font-mono text-zinc-950 relative max-w-2xl mx-auto shadow-sm">
      {/* Printable Voucher Slip */}
      <div ref={slipRef} className="space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-950 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_kdnznskdnznskdnz_c1f00f87.jpeg"
              alt="ClearAudit"
              className="w-12 h-12 border border-zinc-900 object-cover"
            />
            <div>
              <h2 className="text-base font-bold tracking-tight uppercase">
                ClearAudit Corporate Services
              </h2>
              <p className="text-[11px] text-zinc-500">
                GSTIN: 27AAAC1892B1ZK &bull; PAN: AAAC1892B
              </p>
              <p className="text-[10px] text-zinc-400">
                Bandra Kurla Complex, Mumbai, MH 400051
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
              Official Tax Slip
            </span>
            <span className="text-xs font-bold text-zinc-900">
              REF: {expense.tokenNumber}
            </span>
          </div>
        </div>

        {/* Token & Status Banner */}
        <div className="p-3 bg-zinc-50 border border-zinc-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block">
              Receipt Audit Token
            </span>
            <span className="text-lg font-bold tracking-wider select-all">
              {expense.tokenNumber}
            </span>
          </div>
          <div>
            {expense.status === 'Accepted' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-white text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" /> Approved
              </span>
            )}
            {expense.status === 'Pending' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-700 border border-zinc-300 text-xs font-bold uppercase">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
            {expense.status === 'Revoked' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-950 border-2 border-zinc-950 text-xs font-bold uppercase">
                <AlertOctagon className="w-4 h-4" /> Revoked
              </span>
            )}
            {expense.status === 'Rejected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-200 text-zinc-900 text-xs font-bold uppercase">
                <XCircle className="w-4 h-4" /> Rejected
              </span>
            )}
          </div>
        </div>

        {/* Claim Details */}
        <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-200 pb-4">
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Claimant</span>
            <span className="font-semibold">{expense.employeeName}</span>
            <span className="text-[11px] text-zinc-500 block">{expense.employeeEmail}</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Expense Date</span>
            <span className="font-semibold">{expense.date}</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Category</span>
            <span>{expense.category}</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] uppercase block">Submission Timestamp</span>
            <span>{new Date(expense.submittedAt).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Particulars Breakdown Table */}
        <div className="text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-300 text-[10px] text-zinc-500 uppercase">
                <th className="py-2">Particulars / Merchant</th>
                <th className="py-2">SAC/HSN</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-2 font-medium">{expense.description}</td>
                <td className="py-2 text-zinc-500">998311</td>
                <td className="py-2 text-right text-zinc-500">18% GST</td>
                <td className="py-2 text-right font-bold">{formatINR(expense.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Tax summary */}
          <div className="mt-3 text-right space-y-1 text-xs">
            <div className="flex justify-end gap-6 text-zinc-500">
              <span>Net Taxable Value:</span>
              <span className="font-mono">{formatINR(netAmount)}</span>
            </div>
            <div className="flex justify-end gap-6 text-zinc-500">
              <span>CGST (9%):</span>
              <span className="font-mono">{formatINR(cgst)}</span>
            </div>
            <div className="flex justify-end gap-6 text-zinc-500">
              <span>SGST (9%):</span>
              <span className="font-mono">{formatINR(sgst)}</span>
            </div>
            <div className="flex justify-end gap-6 pt-2 border-t border-zinc-950 font-bold text-sm text-zinc-950">
              <span>Gross Reimbursable:</span>
              <span className="font-mono">{formatINR(expense.amount)}</span>
            </div>
          </div>
        </div>

        {/* Revocation note if present */}
        {expense.revocationReason && (
          <div className="p-3 bg-zinc-50 border-l-2 border-zinc-950 border-y border-r border-zinc-200 text-xs">
            <span className="font-bold uppercase text-zinc-950 block mb-0.5">
              Auditor Compliance Note:
            </span>
            <span className="text-zinc-800 font-sans italic">
              "{expense.revocationReason}"
            </span>
          </div>
        )}

        {/* Attached image if any */}
        {expense.receiptImage && (
          <div className="pt-2 border-t border-zinc-200 text-center">
            <span className="text-[10px] uppercase text-zinc-400 block mb-2">
              Attached Physical Receipt Capture
            </span>
            <img
              src={expense.receiptImage}
              alt="Receipt Attachment"
              className="max-h-56 mx-auto border border-zinc-300 object-contain bg-zinc-50"
            />
          </div>
        )}

        {/* Footer sign-off */}
        <div className="pt-4 border-t border-dashed border-zinc-300 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Electronically Signed &amp; Audited</span>
          <span>ClearAudit Central Disbursement Engine</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrint}
          className="h-9 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-300"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Slip</span>
        </button>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs uppercase tracking-wider font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadSlip}
            className="h-9 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Slip (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

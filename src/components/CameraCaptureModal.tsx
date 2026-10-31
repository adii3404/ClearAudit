import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, AlertCircle, Sparkles, Check } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, fileName: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedPreview(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Unable to access camera device. You may use a sample document capture.');
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedPreview(null);
      setCameraError(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  if (!isOpen) return null;

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPreview(dataUrl);
      }
    } catch (e) {
      console.error('Error capturing frame from video:', e);
    }
  };

  const handleConfirmCaptured = () => {
    if (capturedPreview) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      stopStream();
      onCapture(capturedPreview, `cam_receipt_${timestamp}.jpg`);
    }
  };

  const handleUseMockSample = () => {
    // Generate a clean monochrome SVG data url representing a scanned receipt
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fbfbfb';
      ctx.fillRect(0, 0, 600, 800);

      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('THE OBEROI GRAND & BISTRO', 50, 70);

      ctx.font = '14px monospace';
      ctx.fillStyle = '#52525b';
      ctx.fillText('GSTIN: 27AABCT8491K1Z2 | PAN: AABCT8491K', 50, 100);
      ctx.fillText('TAX INVOICE NO: OB-MUM-2026-894', 50, 125);
      ctx.fillText('DATE: ' + new Date().toLocaleDateString('en-IN') + '  TIME: 13:45 IST', 50, 150);
      ctx.fillText('TABLE: T-14 | WAITER: Sunil K.', 50, 175);

      ctx.strokeStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.moveTo(50, 195);
      ctx.lineTo(550, 195);
      ctx.stroke();

      ctx.fillStyle = '#18181b';
      ctx.font = '14px monospace';
      ctx.fillText('2x Executive Business Thali       Rs 1,600.00', 50, 230);
      ctx.fillText('2x Fresh Himalayan Spring Water   Rs   250.00', 50, 265);
      ctx.fillText('2x Artisanal Espresso Roast       Rs   350.00', 50, 300);
      ctx.fillText('Subtotal (Net Taxable)            Rs 2,200.00', 50, 350);
      ctx.fillText('CGST (2.5%)                       Rs    55.00', 50, 380);
      ctx.fillText('SGST (2.5%)                       Rs    55.00', 50, 410);

      ctx.beginPath();
      ctx.moveTo(50, 435);
      ctx.lineTo(550, 435);
      ctx.stroke();

      ctx.font = 'bold 20px monospace';
      ctx.fillText('TOTAL DUE (INR):                  Rs 2,310.00', 50, 475);

      ctx.font = '13px monospace';
      ctx.fillStyle = '#71717a';
      ctx.fillText('MODE: CORPORATE HDFC VISA (**** 4109)', 50, 520);
      ctx.fillText('UPI / BANK RRN: 629841029381', 50, 545);
      ctx.fillText('THANK YOU FOR VISITING THE OBEROI', 50, 580);

      ctx.font = '14px monospace';
      ctx.fillStyle = '#71717a';
      ctx.fillText('STATUS: PAID VIA CORPORATE VISA (**** 8841)', 50, 520);
      ctx.fillText('AUTH CODE: CA-77821-OK', 50, 550);
    }
    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopStream();
    onCapture(sampleDataUrl, 'scanned_receipt_sample.jpg');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xl bg-white border border-zinc-200 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close camera"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-zinc-950" />
            <h2 id="camera-modal-title" className="text-base font-semibold text-zinc-950 uppercase tracking-wider">
              Document Camera Scanner
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Position receipt within the frame and capture in good lighting.
          </p>
        </div>

        {/* Viewfinder or captured frame */}
        <div className="relative w-full aspect-4/3 bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center mb-4">
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured receipt snapshot"
              className="w-full h-full object-contain bg-black"
            />
          ) : cameraActive ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Document Scanner Guide Overlay */}
              <div className="absolute inset-8 border border-white/40 pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-white"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-white"></span>
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-white"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-white"></span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center max-w-xs space-y-3">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs text-zinc-300">
                {cameraError || 'Camera feed not available. You can load a simulated high-res receipt capture.'}
              </p>
              <button
                type="button"
                onClick={handleUseMockSample}
                className="h-9 px-4 bg-zinc-100 hover:bg-white text-zinc-950 text-xs uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Receipt</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleUseMockSample}
            className="text-xs text-zinc-500 hover:text-zinc-950 underline underline-offset-4"
          >
            Use Sample Document
          </button>

          <div className="flex items-center gap-2">
            {capturedPreview ? (
              <>
                <button
                  type="button"
                  onClick={() => setCapturedPreview(null)}
                  className="h-9 px-4 text-xs uppercase tracking-wider font-medium text-zinc-700 hover:bg-zinc-100 border border-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCaptured}
                  className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Frame</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={cameraActive ? handleCaptureFrame : startCamera}
                className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>{cameraActive ? 'Capture Photo' : 'Retry Camera'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

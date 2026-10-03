import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
  UserCheck,
  Play,
  Square,
  RefreshCw,
} from 'lucide-react';
import { Competition, DbVerificationPhoto } from '../../types';
import { useApp } from '../../context/AppContext';

interface ExamCameraVerificationModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (photo: DbVerificationPhoto) => void;
}

export const ExamCameraVerificationModal: React.FC<ExamCameraVerificationModalProps> = ({
  competition,
  isOpen,
  onClose,
  onVerified,
}) => {
  const { currentAuthUser, currentStudent, saveExamVerificationPhoto, language } = useApp();

  const [stage, setStage] = useState<'explanation' | 'camera' | 'preview' | 'success'>('explanation');
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');

  // Camera & Media Streams
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Video Clip Recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number>(3);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<any>(null);

  // Stop camera tracks helper
  const stopCameraStream = (mediaStream: MediaStream | null) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    }
  };

  // Clean up media tracks & intervals on unmount or close
  useEffect(() => {
    return () => {
      stopCameraStream(stream);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  const candidateName = currentAuthUser?.fullName || currentStudent?.name || 'Registered Student';

  const handleStartCamera = async (targetMode: 'photo' | 'video' = activeTab) => {
    setCameraError(null);
    setStage('camera');
    setActiveTab(targetMode);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera and video verification API is not supported on this device/browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: targetMode === 'video', // enable audio for video clip
      });

      setStream(mediaStream);

      // Connect to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      setCameraError(
        err?.message ||
          'Camera / Microphone permission denied. Please grant permission in your browser.'
      );
    }
  };

  // Capture Photo Snapshot
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image horizontally for front-facing view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Watermark with timestamp and student metadata
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(
        `HNC VERIFIED: ${candidateName} | ${new Date().toLocaleString()} | ${competition.title.slice(0, 24)}`,
        12,
        canvas.height - 13
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoUrl(dataUrl);

      // Stop camera stream
      stopCameraStream(stream);
      setStream(null);

      setStage('preview');
    }
  };

  // Start Short 3-Second Video Clip Verification Recording
  const handleStartVideoRecording = () => {
    if (!stream) return;

    videoChunksRef.current = [];
    setIsRecordingVideo(true);
    setRecordingCountdown(3);

    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideoUrl(videoUrl);

        // Also capture a photo snapshot from the video for fallback
        if (videoRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedPhotoUrl(dataUrl);
          }
        }

        stopCameraStream(stream);
        setStream(null);
        setIsRecordingVideo(false);
        setStage('preview');
      };

      recorder.start();

      // Countdown 3, 2, 1 seconds then stop automatically
      let count = 3;
      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        setRecordingCountdown(count);
        if (count <= 0) {
          clearInterval(countdownIntervalRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      // Fallback to photo capture if MediaRecorder fails
      handleCapturePhoto();
    }
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setRecordedVideoUrl(null);
    handleStartCamera(activeTab);
  };

  const handleConfirmAndSave = async () => {
    if (!capturedPhotoUrl && !recordedVideoUrl) return;
    setIsSaving(true);

    try {
      const verificationRecord = await saveExamVerificationPhoto(
        competition.id,
        capturedPhotoUrl || '',
        recordedVideoUrl || undefined
      );
      setStage('success');
      setTimeout(() => {
        onVerified(verificationRecord);
      }, 1000);
    } catch (err) {
      console.error('Failed to save verification:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    stopCameraStream(stream);
    setStream(null);
    onClose();
  };

  return (
    <div
      id="camera-verification-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={handleCancel}
    >
      <div
        id="camera-verification-modal-card"
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/30">
                  <Camera className="h-3.5 w-3.5 text-blue-300" />
                  {language === 'ta' ? 'கேமரா & வீடியோ சரிபார்ப்பு' : 'Camera & Video Verification Access'}
                </span>
                {competition.requireVideoVerification && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-200 ring-1 ring-purple-400/30">
                    <Video className="h-3.5 w-3.5 text-purple-300" />
                    Video Access Enabled
                  </span>
                )}
              </div>

              <h2 className="mt-2.5 text-xl sm:text-2xl font-bold text-white tracking-tight">
                {language === 'ta' ? 'தேர்வு முகவரி & வீடியோ சரிபார்ப்பு' : 'Candidate Camera & Video Verification'}
              </h2>
              <p className="mt-0.5 text-xs text-blue-200/80">
                {competition.title} • Official Identity Check
              </p>
            </div>

            <button
              id="close-camera-modal-btn"
              onClick={handleCancel}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body based on Stage */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {stage === 'explanation' && (
            <div className="space-y-5">
              {/* Explanation Card */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {language === 'ta' ? 'கேமரா & வீடியோ சரிபார்ப்பு விளக்கம்' : 'Identity & Video Access Verification'}
                  </h4>
                  <p className="leading-relaxed">
                    {language === 'ta'
                      ? 'போட்டியின் நம்பகத்தன்மையை உறுதி செய்ய மாணவர்கள் தங்களின் முகப் புகைப்படம் அல்லது 3 வினாடி நேரலை வீடியோ பதிவைச் சமர்ப்பிக்க வேண்டும்.'
                      : 'To ensure exam integrity, candidates must verify identity via live webcam selfie photo or a 3-second live video clip before starting.'}
                  </p>
                </div>
              </div>

              {/* Verification Mode Selector */}
              <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'photo'
                      ? 'bg-white text-blue-900 shadow-2xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>{language === 'ta' ? 'புகைப்படச் சரிபார்ப்பு (Photo)' : 'Photo Snapshot'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'video'
                      ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>{language === 'ta' ? 'வீடியோ சரிபார்ப்பு (Video Clip)' : 'Video Clip Verification'}</span>
                </button>
              </div>

              {/* Checklist */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50/50 text-xs text-slate-700">
                <h5 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  Institutional Security & Privacy Rules
                </h5>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{activeTab === 'photo' ? 'Single Snapshot:' : 'Short 3s Video Clip:'}</strong>{' '}
                      {activeTab === 'photo'
                        ? 'Captures strictly 1 photo watermark snapshot upon click.'
                        : 'Records a quick 3-second verification clip to confirm presence.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Camera Turns Off:</strong> Device camera stops immediately after verification.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="enable-camera-btn"
                  onClick={() => handleStartCamera(activeTab)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-md transition cursor-pointer"
                >
                  {activeTab === 'photo' ? <Camera className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  <span>
                    {language === 'ta'
                      ? 'கேமரா அனுமதி அளித்து தொடங்குக'
                      : 'Enable Camera & Proceed'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {stage === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900">Camera Permission Required</h4>
                    <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
                      {cameraError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartCamera(activeTab)}
                    className="px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition cursor-pointer"
                  >
                    Retry Permission
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Camera Live Viewfinder */}
                  <div className="relative w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Target Alignment Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-blue-400/40 rounded-2xl flex items-center justify-center">
                      <div className="w-48 h-56 border-2 border-dashed border-white/60 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                          {isRecordingVideo
                            ? `Recording Video: ${recordingCountdown}s...`
                            : 'Position Face in Center'}
                        </span>
                      </div>
                    </div>

                    {/* Recording Countdown Badge */}
                    {isRecordingVideo && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-md">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>RECORDING ({recordingCountdown}s)</span>
                      </div>
                    )}
                  </div>

                  {/* Mode Action Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    {activeTab === 'photo' ? (
                      <button
                        type="button"
                        id="capture-photo-btn"
                        onClick={handleCapturePhoto}
                        className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{language === 'ta' ? 'புகைப்படம் எடு' : 'Capture Photo Snapshot'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isRecordingVideo}
                        onClick={handleStartVideoRecording}
                        className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Video className="w-4 h-4" />
                        <span>
                          {isRecordingVideo
                            ? `Recording (${recordingCountdown}s)...`
                            : language === 'ta'
                            ? '3 வினாடி வீடியோ பதிவு செய்'
                            : 'Record 3s Video Verification'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'preview' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  {language === 'ta' ? 'சரிபார்ப்பு முன்னோட்டம் (Verification Preview)' : 'Verification Preview'}
                </h4>
                <p className="text-xs text-slate-500">
                  {recordedVideoUrl
                    ? '3-second video verification clip captured successfully.'
                    : 'Watermarked identity photo snapshot captured successfully.'}
                </p>
              </div>

              {/* Render Recorded Video or Captured Photo */}
              <div className="relative w-full aspect-video rounded-2xl bg-slate-950 overflow-hidden border-2 border-slate-200 shadow-md">
                {recordedVideoUrl ? (
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={capturedPhotoUrl || ''}
                    alt="Captured Verification Snapshot"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'மீண்டும் எடுக்க' : 'Retake Verification'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Verification...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'ta' ? 'உறுதிசெய்து தேர்வைத் தொடங்குக' : 'Confirm & Start Exam'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'ta' ? 'சரிபார்ப்பு வெற்றியடைந்தது!' : 'Verification Verified Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Redirecting to exam interface. Good luck with your competition!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

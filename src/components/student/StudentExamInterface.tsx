import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Send,
  RotateCcw,
  Sparkles,
  Lock,
  ZoomIn,
  X,
  Camera,
  Video,
  VideoOff,
  Shield,
  ShieldCheck,
  Minimize2,
  Maximize2,
  Bell,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Competition, DbAttempt, QuestionItem, ProctorWarning } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCompetitionQuestions } from '../../data/questionPool';
import { SubmissionConfirmationView } from './SubmissionConfirmationView';
import { subscribeToSingleProctorSession } from '../../services/firebaseService';
import { VoiceTypingInput } from '../common/VoiceTypingInput';
import { ExamCountdownTimer } from './ExamCountdownTimer';

interface StudentExamInterfaceProps {
  competition: Competition;
  onExit: () => void;
  onViewResults?: () => void;
}

export const StudentExamInterface: React.FC<StudentExamInterfaceProps> = ({
  competition,
  onExit,
  onViewResults,
}) => {
  const {
    currentAuthUser,
    currentStudent,
    getStudentAttempt,
    saveAttemptAnswers,
    submitCompetitionAttempt,
    saveLiveProctorSession,
    endProctorSession,
    language,
  } = useApp();

  const questions: QuestionItem[] = useMemo(() => {
    return getCompetitionQuestions(competition);
  }, [competition]);

  const totalQuestions = questions.length;
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Load existing attempt or create memory fallback
  const existingAttempt = getStudentAttempt(competition.id);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    return existingAttempt?.answers || {};
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submittedAttempt, setSubmittedAttempt] = useState<DbAttempt | null>(() => {
    if (existingAttempt && (existingAttempt.status === 'submitted' || existingAttempt.status === 'completed' || existingAttempt.status === 'timeout')) {
      return existingAttempt;
    }
    return null;
  });

  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);

  // Admin-configured duration in minutes. IMPORTANT: NOT calculated from question count!
  const durationMinutes = competition.duration || 60;
  const totalDurationSeconds = durationMinutes * 60;

  // Calculate remaining seconds based on attempt startedAt timestamp
  const calculateInitialSeconds = useCallback(() => {
    if (existingAttempt?.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
      return Math.max(0, totalDurationSeconds - elapsed);
    }
    return totalDurationSeconds;
  }, [existingAttempt?.startedAt, totalDurationSeconds]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(calculateInitialSeconds);
  const isLocked = submittedAttempt !== null || secondsRemaining <= 0;

  // Auto-save debounced ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attempt ID ref
  const attemptIdRef = useRef<string>(
    existingAttempt?.attemptId || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  );

  // Live Video Proctoring State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'active' | 'denied' | 'unsupported'>('starting');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProctorMinimized, setIsProctorMinimized] = useState<boolean>(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const [showTabWarningBanner, setShowTabWarningBanner] = useState<boolean>(false);
  const [latestWarningModal, setLatestWarningModal] = useState<ProctorWarning | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesCountRef = useRef<number>(0);
  const tabSwitchesRef = useRef<number>(0);
  const lastSeenWarningIdRef = useRef<string | null>(null);

  // Stop camera tracks helper
  const stopCameraStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    }
  }, []);

  // Request & Start Student Webcam Stream for exam proctoring
  const startExamWebcam = useCallback(async () => {
    setCameraError(null);
    setCameraStatus('starting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('unsupported');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraStatus('active');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Exam proctor camera request notice:', err);
      setCameraStatus('denied');
      setCameraError(
        err?.message ||
          'Camera access was denied. Please allow camera permissions so the proctor can observe your exam.'
      );
    }
  }, []);

  // Auto-start webcam on mount
  useEffect(() => {
    startExamWebcam();
    return () => {
      stopCameraStream(cameraStream);
      endProctorSession(attemptIdRef.current);
    };
  }, []);

  // Bind video element whenever stream changes or minimized toggles
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, isProctorMinimized]);

  // Periodic frame capture & sync to Firestore (every 20 seconds)
  useEffect(() => {
    if (isLocked || submittedAttempt) return;

    const frameInterval = setInterval(() => {
      if (!videoRef.current || cameraStatus !== 'active') return;
      try {
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, 320, 240);

        // Security Stamp
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 215, 320, 25);
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`● PROCTOR LIVE | ${new Date().toLocaleTimeString()}`, 8, 231);

        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.62);
        framesCountRef.current += 1;

        saveLiveProctorSession({
          sessionId: attemptIdRef.current,
          attemptId: attemptIdRef.current,
          competitionId: competition.id,
          competitionTitle: competition.title,
          studentId: currentAuthUser?.uid || currentStudent.id,
          studentName: currentAuthUser?.fullName || currentStudent.name,
          studentInstitution: currentStudent.institution || currentAuthUser?.school,
          studentGrade: currentStudent.gradeLevel || currentAuthUser?.grade,
          studentAvatarUrl: currentStudent.avatarUrl || currentAuthUser?.avatarUrl,
          startedAt: existingAttempt?.startedAt || new Date().toISOString(),
          lastPingAt: new Date().toISOString(),
          status: 'active',
          cameraActive: true,
          latestFrameUrl: frameDataUrl,
          framesCount: framesCountRef.current,
          tabSwitchesCount: tabSwitchesRef.current,
          questionsAnswered: Object.keys(answers).length,
          totalQuestions,
          timeRemainingSeconds: secondsRemaining,
        });
      } catch (e) {
        console.warn('Proctor frame sync note:', e);
      }
    }, 20000);

    return () => clearInterval(frameInterval);
  }, [
    answers,
    cameraStatus,
    competition,
    currentAuthUser,
    currentStudent,
    existingAttempt,
    isLocked,
    saveLiveProctorSession,
    secondsRemaining,
    submittedAttempt,
    totalQuestions,
  ]);

  // Tab switch detection (integrity monitoring)
  useEffect(() => {
    if (isLocked || submittedAttempt) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchesRef.current += 1;
        setTabSwitchesCount(tabSwitchesRef.current);
        setShowTabWarningBanner(true);
        setTimeout(() => setShowTabWarningBanner(false), 7000);

        saveLiveProctorSession({
          sessionId: attemptIdRef.current,
          tabSwitchesCount: tabSwitchesRef.current,
          lastPingAt: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLocked, saveLiveProctorSession, submittedAttempt]);

  // Real-time proctor alert listener (when Admin sends warning)
  useEffect(() => {
    const unsub = subscribeToSingleProctorSession(attemptIdRef.current, (session) => {
      if (!session) return;
      if (session.warningsSent && session.warningsSent.length > 0) {
        const latest = session.warningsSent[session.warningsSent.length - 1];
        if (latest && (!lastSeenWarningIdRef.current || lastSeenWarningIdRef.current !== latest.id)) {
          lastSeenWarningIdRef.current = latest.id;
          setLatestWarningModal(latest);
        }
      }
    });
    return () => unsub();
  }, []);

  // Handle final submission (manual or timeout)
  const handleFinalSubmit = useCallback(
    async (isTimeout: boolean = false) => {
      if (isSubmitting || submittedAttempt) return;
      setIsSubmitting(true);
      setShowSubmitModal(false);

      // Cleanly stop webcam upon submission
      stopCameraStream(cameraStream);
      endProctorSession(attemptIdRef.current, isTimeout ? 'timeout' : 'completed');

      try {
        const res = await submitCompetitionAttempt(
          attemptIdRef.current,
          competition.id,
          answers,
          isTimeout
        );
        setSubmittedAttempt(res.attempt);
      } catch (err) {
        console.error('Error submitting exam attempt:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, cameraStream, competition.id, endProctorSession, isSubmitting, stopCameraStream, submitCompetitionAttempt, submittedAttempt]
  );

  // Countdown timer effect
  useEffect(() => {
    if (isLocked || submittedAttempt) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when timer reaches 00:00
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleFinalSubmit, isLocked, submittedAttempt]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleSelectAnswer = (qId: string, answerValue: string) => {
    if (isLocked) return;

    const updated = {
      ...answers,
      [qId]: answerValue,
    };
    setAnswers(updated);

    // Auto save to Firestore with slight debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAttemptAnswers(attemptIdRef.current, updated);
    }, 500);
  };

  const handleClearAnswer = (qId: string) => {
    if (isLocked) return;
    const updated = { ...answers };
    delete updated[qId];
    setAnswers(updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAttemptAnswers(attemptIdRef.current, updated);
    }, 500);
  };

  // Current question data
  const currentQuestion = questions[currentIdx] || questions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';

  // Stats
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // If already submitted, show Submission Confirmation View
  if (submittedAttempt) {
    return (
      <SubmissionConfirmationView
        attempt={submittedAttempt}
        competition={competition}
        onReturnToCompetitions={onExit}
        onViewResults={onViewResults}
      />
    );
  }

  // Safe fallback if competition has no questions yet
  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">
          {language === 'ta'
            ? 'கேள்விகள் எதுவும் காணப்படவில்லை'
            : language === 'si'
            ? 'ප්‍රශ්න කිසිවක් හමු නොවීය'
            : 'No questions found for this competition'}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md">
          {language === 'ta'
            ? 'இந்த போட்டிக்கான கேள்விகள் இன்னும் வெளியிடப்படவில்லை அல்லது சேர்க்கப்பட்டு வருகின்றன.'
            : language === 'si'
            ? 'මෙම තරඟය සඳහා ප්‍රශ්න තවම ප්‍රකාශයට පත් කර නොමැත.'
            : 'Questions for this competition have not been published yet.'}
        </p>
        <button
          onClick={onExit}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-md transition"
        >
          {language === 'ta' ? 'போட்டிகளுக்குத் திரும்புக' : language === 'si' ? 'තරඟ වෙත ආපසු යන්න' : 'Return to Competitions'}
        </button>
      </div>
    );
  }

  return (
    <div
      id="student-exam-interface"
      className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white pb-12"
    >
      {/* Distraction-Free Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            {competition.category?.charAt(0) || 'H'}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
              {competition.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-blue-400 font-medium">{competition.category}</span>
              <span>•</span>
              <span>{competition.grade || 'Open'}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">Total Marks: {competition.totalMarks || 100}</span>
            </div>
          </div>
        </div>

        {/* Center: Interactive Visual Countdown Timer with Auto-Submit */}
        <div className="flex items-center gap-2">
          <ExamCountdownTimer
            totalSeconds={totalDurationSeconds}
            remainingSeconds={secondsRemaining}
            isLocked={isLocked}
            onTimeUp={() => handleFinalSubmit(true)}
            language={language}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right: Answered Progress & Finish Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs text-slate-300">
              {language === 'ta' ? 'விடையளிக்கப்பட்ட நிலை' : language === 'si' ? 'පිළිතුරු සැපයූ තත්වය' : 'Answered Status'}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {answeredCount} / {totalQuestions} {language === 'ta' ? 'முடிந்தது' : language === 'si' ? 'අවසන්' : 'Done'}
            </span>
          </div>

          <button
            id="header-submit-btn"
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting || isLocked}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{language === 'ta' ? 'சமர்ப்பிக்கவும்' : language === 'si' ? 'විභාගය යොමු කරන්න' : 'Submit Exam'}</span>
          </button>
        </div>
      </header>

      {/* Visual Time Progress Indicator Bar */}
      <div className="sticky top-[61px] z-30 w-full bg-slate-800/90 backdrop-blur-xs h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            secondsRemaining <= 60
              ? 'bg-red-500 animate-pulse'
              : secondsRemaining <= 300
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
          style={{
            width: `${Math.max(0, Math.min(100, (secondsRemaining / totalDurationSeconds) * 100))}%`,
          }}
        />
      </div>

      {/* Main Exam Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Area: Active Question Card (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div
            id={`question-card-${currentIdx + 1}`}
            className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-6"
          >
            {/* Question Header Status */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {language === 'ta'
                    ? `வினா ${currentIdx + 1} / ${totalQuestions}`
                    : language === 'si'
                    ? `ප්‍රශ්නය ${currentIdx + 1} / ${totalQuestions}`
                    : `Question ${currentIdx + 1} of ${totalQuestions}`}
                </span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                  {currentQuestion.type === 'multiple_choice'
                    ? (language === 'ta' ? 'பல்தேர்வு வினா (MCQ)' : language === 'si' ? 'බහුවරණ (MCQ)' : 'Multiple Choice')
                    : currentQuestion.type === 'true_false'
                    ? (language === 'ta' ? 'சரி / பிழை' : language === 'si' ? 'හරි / වැරදි' : 'True / False')
                    : currentQuestion.type === 'short_answer'
                    ? (language === 'ta' ? 'குறுகிய விடை' : language === 'si' ? 'කෙටි පිළිතුරු' : 'Short Answer')
                    : (language === 'ta' ? 'பட வினா' : language === 'si' ? 'පින්තූර ප්‍රශ්නය' : 'Picture Question')}
                </span>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1">
                {currentQuestion.marks || 10} {language === 'ta' ? 'புள்ளிகள்' : language === 'si' ? 'ලකුණු' : 'Marks'}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
                {currentQuestion.questionText}
              </h2>

              {/* Picture Question Reference (if present) */}
              {currentQuestion.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 relative group max-w-lg">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question visual reference"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-80 object-contain rounded-xl cursor-pointer hover:opacity-95 transition"
                    onClick={() => setImageZoomUrl(currentQuestion.imageUrl || null)}
                  />
                  <button
                    type="button"
                    onClick={() => setImageZoomUrl(currentQuestion.imageUrl || null)}
                    className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg p-2 text-xs flex items-center gap-1.5 backdrop-blur-sm transition"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Enlarge Image
                  </button>
                </div>
              )}
            </div>

            {/* Answer Options by Question Type */}
            <div className="pt-4 space-y-3">
              {/* Type 1: Multiple Choice or Picture Question with options */}
              {(currentQuestion.type === 'multiple_choice' ||
                (currentQuestion.type === 'picture_question' && currentQuestion.options && currentQuestion.options.length > 0)) && (
                <div className="space-y-2.5">
                  {currentQuestion.options?.map((option, idx) => {
                    const isSelected = currentAnswer === option;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D

                    return (
                      <button
                        key={idx}
                        id={`option-${currentQuestion.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                        disabled={isLocked}
                        className={`w-full text-left rounded-2xl border p-4 sm:p-5 flex items-center gap-4 transition duration-150 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span
                          className={`text-sm sm:text-base leading-snug flex-1 ${
                            isSelected ? 'font-semibold text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {option}
                        </span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: True / False */}
              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(currentQuestion.options && currentQuestion.options.length === 2
                    ? currentQuestion.options
                    : (language === 'ta' ? ['சரி (True)', 'தவறு (False)'] : ['True', 'False'])
                  ).map((choice) => {
                    const normAnswer = (currentAnswer || '').toLowerCase();
                    const normChoice = choice.toLowerCase();
                    const isSelected =
                      normAnswer === normChoice ||
                      (normChoice.includes('true') && (normAnswer === 'true' || normAnswer.includes('சரி') || normAnswer === 'a')) ||
                      (normChoice.includes('false') && (normAnswer === 'false' || normAnswer.includes('தவறு') || normAnswer === 'b')) ||
                      (normChoice.includes('சரி') && normAnswer.includes('true'));

                    return (
                      <button
                        key={choice}
                        id={`tf-${currentQuestion.id}-${choice.replace(/\s+/g, '-').toLowerCase()}`}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.id, choice)}
                        disabled={isLocked}
                        className={`rounded-2xl border p-6 text-center flex flex-col items-center justify-center gap-2 transition duration-150 ${
                          isSelected
                            ? choice.toLowerCase().includes('true') || choice.includes('சரி')
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-bold'
                              : 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/30 font-bold'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className="text-xl font-bold">{choice}</span>
                        <span className="text-xs text-slate-500">
                          {isSelected ? (language === 'ta' ? '✓ தேர்ந்தெடுக்கப்பட்ட விடை' : '✓ Selected Answer') : (language === 'ta' ? 'தேர்ந்தெடுக்க கிளிக் செய்க' : 'Click to select')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 3: Short Answer with Voice Typing */}
              {currentQuestion.type === 'short_answer' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`short-answer-${currentQuestion.id}`}
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {language === 'ta'
                        ? 'உங்கள் விடை (Your Answer)'
                        : language === 'si'
                        ? 'ඔබේ පිළිතුර (Your Answer)'
                        : 'Your Answer'}
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                      <span>🎙️ Voice Typing Supported</span>
                    </span>
                  </div>

                  <VoiceTypingInput
                    id={`short-answer-${currentQuestion.id}`}
                    value={currentAnswer}
                    onChange={(val) => handleSelectAnswer(currentQuestion.id, val)}
                    disabled={isLocked}
                    portalLanguage={language}
                    placeholder={
                      language === 'ta'
                        ? 'உங்கள் விடையைத் தட்டச்சு செய்யவும் அல்லது மைக்ரோஃபோனை அழுத்திப் பேசவும்...'
                        : language === 'si'
                        ? 'ඔබේ පිළිතුර ටයිප් කරන්න හෝ මයික්‍රෆෝනය ඔබා කතා කරන්න...'
                        : 'Enter your answer or use voice typing...'
                    }
                  />

                  <p className="text-xs text-slate-500">
                    {language === 'ta'
                      ? 'உங்கள் விடை தானாக மதிப்பீடு செய்யப்படும். எழுத்துப்பிழையின்றி தட்டச்சு செய்யவோ அல்லது குரல் வழியாகக் கூறவோ முடியும்.'
                      : language === 'si'
                      ? 'ඔබගේ පිළිතුර ස්වයංක්‍රීයව ඇගයීමට ලක් කෙරේ. ටයිප් කිරීමට හෝ හඬින් ප්‍රකාශ කිරීමට හැක.'
                      : 'Your answer will be evaluated with standard case-insensitive trimmed comparison. You can type or speak.'}
                  </p>
                </div>
              )}

              {/* Type 4: Picture Question without predefined options */}
              {currentQuestion.type === 'picture_question' &&
                (!currentQuestion.options || currentQuestion.options.length === 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`picture-answer-${currentQuestion.id}`}
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {language === 'ta'
                          ? 'உங்கள் விளக்கம் / விடை (Your Analysis)'
                          : language === 'si'
                          ? 'ඔබේ පිළිතුර (Your Analysis)'
                          : 'Your Analysis / Identification'}
                      </label>
                      <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                        <span>🎙️ Voice Typing Supported</span>
                      </span>
                    </div>

                    <VoiceTypingInput
                      id={`picture-answer-${currentQuestion.id}`}
                      value={currentAnswer}
                      onChange={(val) => handleSelectAnswer(currentQuestion.id, val)}
                      disabled={isLocked}
                      portalLanguage={language}
                      placeholder={
                        language === 'ta'
                          ? 'படத்தின் அடிப்படையில் விடையைத் தட்டச்சு செய்யவும் அல்லது பேசவும்...'
                          : language === 'si'
                          ? 'පින්තූරය අනුව පිළිතුර ටයිප් කරන්න හෝ කතා කරන්න...'
                          : 'Type or speak your answer based on the image...'
                      }
                    />
                  </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="prev-question-btn"
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0 || isLocked}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {language === 'ta' ? 'முந்தையது' : language === 'si' ? 'පෙර' : 'Previous'}
                </button>

                {currentAnswer && (
                  <button
                    id="clear-answer-btn"
                    type="button"
                    onClick={() => handleClearAnswer(currentQuestion.id)}
                    disabled={isLocked}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {language === 'ta' ? 'அழி' : language === 'si' ? 'මකන්න' : 'Clear Choice'}
                  </button>
                )}
              </div>

              <div>
                {currentIdx < totalQuestions - 1 ? (
                  <button
                    id="next-question-btn"
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    disabled={isLocked}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
                  >
                    {language === 'ta' ? 'அடுத்தது' : language === 'si' ? 'ඊළඟ' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    id="review-and-submit-btn"
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={isSubmitting || isLocked}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
                  >
                    <Send className="h-4 w-4" />
                    {language === 'ta' ? 'சரிபார்த்து சமர்ப்பி' : language === 'si' ? 'පරීක්ෂා කර යොමු කරන්න' : 'Review & Submit'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Question Navigation Palette (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div
            id="question-palette-card"
            className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-6 sticky top-24"
          >
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                {language === 'ta' ? 'வினா வழிகாட்டி பலகம்' : language === 'si' ? 'ප්‍රශ්න සංචාලන පුවරුව' : 'Question Navigation Palette'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ta'
                  ? 'நேரடியாக அந்த வினாவிற்கு செல்ல எண்ணை அழுத்தவும்.'
                  : language === 'si'
                  ? 'එම ප්‍රශ්නය වෙත කෙලින්ම යාමට අංකය ක්ලික් කරන්න.'
                  : 'Click any number to jump directly to that question.'}
              </p>
            </div>

            {/* Questions Number Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    id={`palette-btn-${idx + 1}`}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-xl font-bold text-sm flex items-center justify-center transition ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 border-2 border-blue-600 shadow-sm ' +
                          (isAnswered ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-700')
                        : isAnswered
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Visual Time Status Inside Palette */}
            <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
              secondsRemaining <= 60
                ? 'bg-red-50 border-red-300 text-red-900 animate-pulse'
                : secondsRemaining <= 300
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${
                  secondsRemaining <= 60
                    ? 'text-red-600'
                    : secondsRemaining <= 300
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`} />
                <span className="text-xs font-bold">
                  {language === 'ta' ? 'மீதமுள்ள நேரம்' : language === 'si' ? 'ඉතිරි කාලය' : 'Time Left'}
                </span>
              </div>
              <span className="font-mono font-black text-sm">
                {formatTime(secondsRemaining)}
              </span>
            </div>

            {/* Legend & Stats */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-md bg-emerald-500 inline-block" />
                  Answered
                </span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-md bg-slate-200 border border-slate-300 inline-block" />
                  Unanswered
                </span>
                <span className="font-bold text-slate-500">{unansweredCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-md border-2 border-blue-600 bg-blue-50 inline-block" />
                  Currently Viewing
                </span>
                <span className="font-bold text-blue-700">Question {currentIdx + 1}</span>
              </div>
            </div>

            {/* Big Submit Button */}
            <div className="pt-2">
              <button
                id="palette-submit-exam-btn"
                type="button"
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting || isLocked}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>Submit Competition</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal before Submit */}
      {showSubmitModal && (
        <div
          id="submit-confirmation-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div
            id="submit-confirmation-modal-card"
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {language === 'ta'
                  ? 'போட்டியை சமர்ப்பிக்க விரும்புகிறீர்களா?'
                  : language === 'si'
                  ? 'ඔබගේ තරඟ විභාගය යොමු කිරීමට තහවුරු කරනවාද?'
                  : 'Are you sure you want to submit your competition?'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'சமர்ப்பித்தவுடன், உங்கள் விடைகள் பதிவு செய்யப்பட்டு மதிப்பிடப்படும். விடைகளை பின்னர் மாற்ற முடியாது.'
                  : language === 'si'
                  ? 'යොමු කළ පසු, ඔබගේ පිළිතුරු ස්ථිරව සටහන් වන අතර ලකුණු ලබා දෙනු ලැබේ. පිළිතුරු වෙනස් කළ නොහැක.'
                  : 'Once submitted, your responses will be permanently recorded and graded in Firestore. You will not be able to change your answers or retake this exam.'}
              </p>
            </div>

            {/* Answer Summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {language === 'ta' ? 'விடையளித்த வினாக்கள்:' : language === 'si' ? 'පිළිතුරු සැපයූ ප්‍රශ්න:' : 'Answered Questions:'}
                </span>
                <span className="font-bold text-emerald-700">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {language === 'ta' ? 'விடையளிக்காத வினாக்கள்:' : language === 'si' ? 'පිළිතුරු නොදුන් ප්‍රශ්න:' : 'Unanswered Questions:'}
                </span>
                <span className="font-bold text-slate-700">{unansweredCount}</span>
              </div>
              {unansweredCount > 0 && (
                <p className="text-amber-700 pt-1 text-[11px] font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {language === 'ta'
                    ? `இன்னும் ${unansweredCount} வினாக்களுக்கு விடையளிக்கவில்லை.`
                    : language === 'si'
                    ? `තවමත් පිළිතුරු නොදුන් ප්‍රශ්න ${unansweredCount} ක් ඉතිරිව ඇත.`
                    : `You have ${unansweredCount} unanswered questions remaining.`}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="submit-modal-cancel-btn"
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                {language === 'ta' ? 'ரத்துசெய்' : language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                id="submit-modal-confirm-btn"
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
              >
                {isSubmitting
                  ? (language === 'ta' ? 'சமர்ப்பிக்கப்படுகிறது...' : language === 'si' ? 'යොමු වෙමින් පවතී...' : 'Submitting...')
                  : (language === 'ta' ? 'சமர்ப்பி' : language === 'si' ? 'යොමු කරන්න' : 'Submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {imageZoomUrl && (
        <div
          id="image-zoom-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setImageZoomUrl(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setImageZoomUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2"
              aria-label="Close image zoom"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageZoomUrl}
              alt="Enlarged question diagram"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Tab Switch Integrity Warning Banner */}
      {showTabWarningBanner && (
        <div className="fixed top-18 inset-x-4 sm:inset-x-auto sm:right-6 z-50 max-w-lg bg-red-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-400 flex items-start gap-3 animate-bounce">
          <AlertTriangle className="w-6 h-6 text-yellow-300 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-sm tracking-tight">
              {language === 'ta'
                ? '⚠️ எச்சரிக்கை: உலாவி தாவல் மாற்றம் கண்டறியப்பட்டது!'
                : language === 'si'
                ? '⚠️ අනතුරු ඇඟවීමයි: බ්‍රවුසරයේ ටැබ් මාරුවක් හඳුනා ගැනිණි!'
                : '⚠️ Warning: Browser Tab Switch Detected!'}
            </div>
            <p className="text-red-100">
              {language === 'ta'
                ? `தேர்வுப் பக்கத்தை விட்டு வெளியேறியது நேரலை கண்காணிப்பு பதிவேட்டில் பதிவாகியுள்ளது (மொத்தம்: ${tabSwitchesCount} தடவைகள்). தேவையின்றி தாவல் மாறினால் தேர்வு ரத்தாகலாம்.`
                : `Leaving the exam interface has been logged in the proctor audit trail (Total: ${tabSwitchesCount} switch(es)). Continuous violations may result in exam disqualification.`}
            </p>
          </div>
          <button
            onClick={() => setShowTabWarningBanner(false)}
            className="p-1 hover:bg-red-700 rounded-lg text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Proctor Live Directive Alert Modal */}
      {latestWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-500 space-y-5 animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                {language === 'ta' ? 'தேர்வு கண்காணிப்பாளர் செய்தி' : 'Live Proctor Directive'}
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {language === 'ta'
                  ? 'கண்காணிப்பாளரிடமிருந்து முக்கிய செய்தி!'
                  : 'Important Proctor Alert!'}
              </h3>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                "{latestWarningModal.message}"
              </div>
              <p className="text-[11px] text-slate-400">
                Sent by {latestWarningModal.sentBy} at{' '}
                {new Date(latestWarningModal.sentAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setLatestWarningModal(null)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              {language === 'ta' ? 'புரிந்துகொண்டேன் (I Understand)' : 'Acknowledge & Continue Exam'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Student Live Webcam Proctor Box */}
      <div className="fixed bottom-4 right-4 z-40 select-none">
        <div
          className={`bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 ${
            cameraStatus === 'active' ? 'border-emerald-500 shadow-emerald-950/40' : 'border-amber-500 shadow-amber-950/40'
          } shadow-2xl overflow-hidden transition-all duration-300 ${
            isProctorMinimized ? 'w-48' : 'w-64 sm:w-72'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${cameraStatus === 'active' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-[11px] tracking-wide">
                {language === 'ta' ? 'நேரலை கேமரா' : 'Live Proctor'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsProctorMinimized(!isProctorMinimized)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition"
                title={isProctorMinimized ? 'Expand video box' : 'Minimize video box'}
              >
                {isProctorMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Video Stream Container */}
          {!isProctorMinimized && (
            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  cameraStatus !== 'active' ? 'hidden' : 'block'
                }`}
              />

              {cameraStatus === 'starting' && (
                <div className="text-center p-3 space-y-1.5 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span className="text-[11px]">{language === 'ta' ? 'கேமரா தயாராகிறது...' : 'Starting camera...'}</span>
                </div>
              )}

              {cameraStatus === 'denied' && (
                <div className="text-center p-3 space-y-2 text-amber-300 text-xs">
                  <VideoOff className="w-7 h-7 mx-auto text-amber-400" />
                  <p className="text-[10px] leading-tight">
                    {language === 'ta' ? 'கேமரா அனுமதி மறுக்கப்பட்டுள்ளது' : 'Camera permission blocked'}
                  </p>
                  <button
                    type="button"
                    onClick={startExamWebcam}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-[10px] font-bold shadow-xs"
                  >
                    {language === 'ta' ? 'மீண்டும் இயக்கு' : 'Retry Camera'}
                  </button>
                </div>
              )}

              {/* Security Watermark on video */}
              {cameraStatus === 'active' && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>MONITORED</span>
                </div>
              )}

              {/* Hidden canvas for capturing proctor frames */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Footer Bar: Candidate Name & Live Telemetry */}
          <div className="px-3 py-2 bg-slate-950/80 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800">
            <span className="truncate max-w-[140px] font-medium text-white">
              {currentAuthUser?.fullName || currentStudent?.name || 'Candidate'}
            </span>
            {tabSwitchesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                {tabSwitchesCount} Tabs
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

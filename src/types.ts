export type PortalRole = 'super_admin' | 'admin' | 'student';

// -------------------------------------------------------------
// Real Firestore Database Foundation Schemas (Phase 2)
// -------------------------------------------------------------

export interface DbUser {
  uid: string;
  fullName: string;
  email: string;
  authEmail?: string;
  phone?: string;
  role: PortalRole;
  status: 'active' | 'inactive';
  createdAt: string;
  passwordHash?: string;
  initialPassword?: string;
  grade?: string;
  school?: string;
  studentId?: string;
  username?: string;
  district?: string;
  address?: string;
  dateOfBirth?: string;
  department?: string;
  staffId?: string;
  avatarUrl?: string;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  totalReferrals?: number;
  sharesCount?: number;
  redeemedPerks?: string[];
  guardianName?: string;
  bio?: string;
}

export interface DbStudent {
  uid: string;
  studentId: string;
  username?: string;
  fullName: string;
  email: string;
  authEmail?: string;
  phone?: string;
  grade: string;
  school: string;
  district?: string;
  address?: string;
  dateOfBirth?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  avatarUrl?: string;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  totalReferrals?: number;
  sharesCount?: number;
  redeemedPerks?: string[];
}

export interface DbAdmin {
  uid: string;
  fullName: string;
  email: string;
  username?: string;
  initialPassword?: string;
  phone?: string;
  department?: string;
  staffId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type CompetitionType = 'Quiz' | 'Exam' | 'Competition';
export type SupportedLanguage = 'English' | 'Tamil' | 'Sinhala';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'picture_question';

export interface QuestionItem {
  id: string;
  type: QuestionType;
  questionText: string;
  imageUrl?: string;
  options?: string[]; // Multiple choice / Picture choice options
  correctAnswer: string;
  marks: number;
  order: number;
  explanation?: string;
}

export interface CompetitionPrizeDetails {
  firstPrize?: string;
  secondPrize?: string;
  thirdPrize?: string;
  participationCertificate?: string;
}

export interface CompetitionParticipant {
  studentId: string;
  studentName: string;
  email: string;
  school: string;
  grade: string;
  registeredAt: string;
}

export type StudyGamingMode = 'kahoot' | 'quizizz' | 'trivia_crack' | 'brain_out' | 'standard';

export interface DbCompetition {
  competitionId: string;
  title: string;
  description: string;
  competitionType: 'Quiz' | 'Exam' | string;
  category: string;
  grade: string;
  language: 'English' | 'Tamil' | 'Sinhala' | string;
  duration?: number; // In minutes
  entryType?: 'Free' | 'Paid';
  entryFee?: number; // LKR when paid
  prizesEnabled?: boolean;
  prizeDetails?: CompetitionPrizeDetails;
  registrationStart?: string;
  registrationEnd?: string;
  competitionStart?: string;
  competitionEnd?: string;
  competitionStartTime?: string;
  competitionEndTime?: string;
  status: CompetitionStatus;
  questions?: QuestionItem[];
  questionsCount?: number;
  totalMarks?: number;
  participants?: CompetitionParticipant[];
  enrolledCount?: number;
  createdAt: string;
  // Companion metadata
  code?: string;
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  leadAdminId?: string;
  leadAdminName?: string;
  eligibility?: string;
  prizePool?: string;
  evaluationMode?: 'Automated' | 'Manual Panel' | 'Hybrid';
  roundsCount?: number;
  requireCameraVerification?: boolean;
  requireVideoVerification?: boolean;
  membershipRequired?: boolean;
  district?: string;
  province?: string;
  scope?: 'all_island' | 'district' | 'province';
  gamingMode?: StudyGamingMode;
}

export interface DbResult {
  resultId: string;
  competitionId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  submittedAt: string;
  prizeStatus?: string;
  // Companion metadata
  competitionTitle?: string;
  studentName?: string;
  studentInstitution?: string;
  award?: string;
  publishStatus?: 'draft' | 'under_review' | 'published';
  certificateId?: string;
}

export interface DbPayment {
  paymentId: string;
  studentId: string;
  competitionId: string;
  amount: number; // in LKR
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  createdAt: string;
  // Companion metadata
  studentName?: string;
  competitionTitle?: string;
  currency?: string;
  paymentMethod?: string;
  transactionReference?: string;
  slipUrl?: string;
  slipName?: string;
  bankName?: string;
  branchName?: string;
  walletNumber?: string;
  paymentNote?: string;
}

export interface BankAccountDetails {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  isPrimary?: boolean;
}

export interface PaymentGatewayConfig {
  enableCardPayments: boolean;
  enableBankTransfer: boolean;
  enableLankaQR: boolean;
  enableMobileWallets: boolean;
  bankAccounts: BankAccountDetails[];
  lankaQrMerchantName: string;
  lankaQrMerchantId: string;
  lankaQrAccountNo: string;
  lankaQrBank: string;
  mobileWalletNumbers: {
    dialogGenie?: string;
    ezCash?: string;
    mcash?: string;
  };
}

export interface DbVerificationPhoto {
  verificationId: string;
  studentId: string;
  competitionId: string;
  photoUrl: string; // Base64 data URL
  videoUrl?: string; // Short video clip Base64 or Blob URL
  verificationType?: 'photo' | 'video' | 'both';
  createdAt: string;
  // Companion metadata
  studentName?: string;
  competitionTitle?: string;
}

export interface ProctorWarning {
  id: string;
  message: string;
  sentAt: string;
  sentBy: string;
}

export interface DbLiveProctorSession {
  sessionId: string; // usually attemptId or `${competitionId}_${studentId}`
  attemptId: string;
  competitionId: string;
  competitionTitle: string;
  studentId: string;
  studentName: string;
  studentInstitution?: string;
  studentGrade?: string;
  studentAvatarUrl?: string;
  startedAt: string;
  lastPingAt: string;
  status: 'active' | 'completed' | 'timeout' | 'flagged';
  cameraActive: boolean;
  latestFrameUrl?: string;
  framesCount: number;
  tabSwitchesCount: number;
  warningsSent: ProctorWarning[];
  questionsAnswered: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface DbAttempt {
  attemptId: string;
  competitionId: string;
  studentId: string;
  answers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
  status: 'in-progress' | 'submitted' | 'completed' | 'timeout';
  score: number;
  totalMarks: number;
  competitionTitle?: string;
  studentName?: string;
  duration?: number; // In minutes
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: PortalRole;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  department: string;
  staffId: string;
  username?: string;
  initialPassword?: string;
  assignedCompetitionsCount: number;
  phone?: string;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  studentId: string;
  username?: string;
  institution: string;
  gradeLevel: string;
  district?: string;
  address?: string;
  dateOfBirth?: string;
  competitionsEnrolled: number;
  awardsCount: number;
  phone?: string;
  guardianName?: string;
  bio?: string;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  totalReferrals?: number;
  sharesCount?: number;
  redeemedPerks?: string[];
}

export interface ReferralPerk {
  id: string;
  title: string;
  titleTa: string;
  titleSi: string;
  pointsCost: number;
  description: string;
  descriptionTa: string;
  descriptionSi: string;
  icon: string;
  category: 'entry_waiver' | 'certificate' | 'badge' | 'perk';
}

export type AnnouncementCategory =
  | 'points_referral'
  | 'competition'
  | 'award'
  | 'general'
  | 'urgent';

export interface DbAnnouncement {
  id: string;
  title: string;
  titleTa?: string;
  titleSi?: string;
  content: string;
  contentTa?: string;
  contentSi?: string;
  category: AnnouncementCategory;
  targetAudience: 'all' | 'students' | 'admins';
  pointsReward?: number;
  badgeText?: string;
  badgeTextTa?: string;
  actionUrl?: string; // 'referral' | 'competitions' | 'results' | etc.
  actionLabel?: string;
  actionLabelTa?: string;
  isPinned?: boolean;
  publishedAt: string;
  publishedBy: string;
  authorName: string;
  expiresAt?: string;
}

export interface SuperAdminUser extends BaseUser {
  role: 'super_admin';
  title: string;
  systemPermissions: string[];
}

export type CompetitionCategory = 
  | 'Mathematics'
  | 'Science'
  | 'English'
  | 'Tamil'
  | 'General Knowledge'
  | 'IQ & Logic'
  | 'Informatics & AI' 
  | 'Science & STEM' 
  | 'Creative Writing' 
  | 'Business & Debate' 
  | 'Engineering & Robotics'
  | string;

export type CompetitionStatus = 
  | 'Draft' 
  | 'Published' 
  | 'Registration Open' 
  | 'Ongoing' 
  | 'Completed' 
  | 'Closed'
  | 'draft' 
  | 'upcoming' 
  | 'ongoing' 
  | 'evaluation' 
  | 'completed';

export interface Competition {
  id: string;
  title: string;
  code?: string;
  category: CompetitionCategory;
  description: string;
  competitionType?: 'Quiz' | 'Exam' | string;
  grade?: string;
  language?: 'English' | 'Tamil' | 'Sinhala' | string;
  duration?: number; // In minutes
  entryType?: 'Free' | 'Paid';
  entryFee?: number; // In LKR when paid
  prizesEnabled?: boolean;
  prizeDetails?: CompetitionPrizeDetails;
  registrationStart?: string;
  registrationEnd?: string;
  competitionStart?: string;
  competitionEnd?: string;
  competitionStartTime?: string;
  competitionEndTime?: string;
  status: CompetitionStatus;
  questions?: QuestionItem[];
  questionsCount?: number;
  totalMarks?: number;
  participants?: CompetitionParticipant[];
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  enrolledCount: number;
  leadAdminId?: string;
  leadAdminName?: string;
  eligibility?: string;
  prizePool?: string;
  evaluationMode?: 'Automated' | 'Manual Panel' | 'Hybrid';
  requireCameraVerification?: boolean;
  requireVideoVerification?: boolean;
  membershipRequired?: boolean;
  roundsCount?: number;
  createdAt?: string;
  district?: string;
  province?: string;
  scope?: 'all_island' | 'district' | 'province';
  gamingMode?: StudyGamingMode;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  competitionTitle: string;
  studentId: string;
  studentName: string;
  studentInstitution: string;
  score: number;
  maxScore: number;
  totalMarks?: number;
  percentage?: number;
  rank: number;
  percentile: number;
  award: 'Grand Champion' | 'Gold Medal' | 'Silver Medal' | 'Bronze Medal' | 'Honorary Mention' | 'Participation' | string;
  prizeStatus?: string;
  publishStatus: 'draft' | 'under_review' | 'published';
  publishedAt?: string;
  submittedAt?: string;
  feedback?: string;
  certificateId: string;
}

export interface SystemAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
}

export interface MembershipSettings {
  enabled: boolean;
  monthlyFeeLkr: number;
  durationDays: number;
  accessRulesNote?: string;
}

export interface PlatformSettings {
  academicYear: string;
  platformName: string;
  supportEmail: string;
  supportPhone?: string;
  whatsappPhone?: string;
  whatsappChannelUrl?: string;
  facebookPageUrl?: string;
  allowStudentRegistration: boolean;
  competitionApprovalWorkflow: 'strict' | 'relaxed';
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
  paymentSettings?: PaymentGatewayConfig;
  membershipSettings?: MembershipSettings;
}

export type MembershipStatus = 'inactive' | 'pending' | 'active' | 'expiring_soon' | 'expired';

export interface MembershipHistoryItem {
  id: string;
  startDate: string;
  expiryDate: string;
  amount: number;
  paymentReference?: string;
  approvedAt: string;
}

export interface DbMembership {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  status: MembershipStatus;
  planName?: string;
  monthlyFee: number;
  startDate?: string;
  expiryDate?: string;
  paymentStatus: 'pending' | 'active' | 'expired' | 'unpaid' | 'rejected';
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  history?: MembershipHistoryItem[];
}

export interface DbMembershipPayment {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  amount: number;
  paymentReference: string;
  paymentMethod?: string;
  slipUrl?: string;
  slipName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  membershipPeriodDays?: number;
  notes?: string;
}

export interface AdMenuItem {
  name: string;
  price: string;
  description?: string;
}

export interface DbAdvertisement {
  id: string;
  brandName: string;
  title: string;
  tagline?: string;
  description: string;
  badgeText?: string;
  category?: string;
  mediaType?: 'image' | 'video';
  imageUrl?: string;
  galleryImages?: string[];
  videoUrl?: string;
  promoCode?: string;
  discountPercentage?: number;
  actionButtonText?: string;
  actionUrl?: string;
  menuItems?: AdMenuItem[];
  targetAudience: 'all' | 'students' | 'admins';
  status: 'active' | 'inactive';
  priority?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    uid: string;
    name: string;
    role: string;
  };
  clicksCount?: number;
}


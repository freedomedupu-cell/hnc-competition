import {
  AdminUser,
  StudentUser,
  SuperAdminUser,
  Competition,
  CompetitionResult,
  SystemAuditLog,
  PlatformSettings,
} from '../types';

/**
 * Institutional Super Admin configuration
 */
export const initialSuperAdmin: SuperAdminUser = {
  id: 'sa_freedomedupu',
  name: 'Chief Academic Registrar',
  email: 'freedomedupu@gmail.com',
  role: 'super_admin',
  title: 'Chief Academic Director & Registrar',
  createdAt: '2026-01-01',
  status: 'active',
  systemPermissions: [
    'admin_management',
    'system_configuration',
    'competition_governance',
    'results_final_approval',
    'audit_inspection',
  ],
};

/**
 * Production empty collections - all data dynamically populates from Firebase Firestore
 */
export const initialAdmins: AdminUser[] = [];

export const initialStudents: StudentUser[] = [];

export const initialCompetitions: Competition[] = [];

export const initialResults: CompetitionResult[] = [];

export const initialAuditLogs: SystemAuditLog[] = [];

export const initialSettings: PlatformSettings = {
  academicYear: '2025-2026 Academic Term',
  platformName: 'Higher Novas College (HNC) Competition Platform',
  supportEmail: 'highernovascollege01@gmail.com',
  supportPhone: '+94741760710',
  whatsappPhone: '+94741760710',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VaEAS90Gk1FwJW7arA23',
  facebookPageUrl: 'https://www.facebook.com/share/18cWgwEKmy/',
  allowStudentRegistration: true,
  competitionApprovalWorkflow: 'strict',
  maintenanceMode: false,
  maxUploadSizeMb: 50,
  paymentSettings: {
    enableCardPayments: true,
    enableBankTransfer: true,
    enableLankaQR: true,
    enableMobileWallets: true,
    bankAccounts: [
      {
        id: 'bank-1',
        bankName: 'Commercial Bank of Ceylon',
        accountName: 'HNC Competition Academic Council',
        accountNumber: '1000845920',
        branch: 'Colombo Fort Branch',
        swiftCode: 'CCEYLKX',
        isPrimary: true,
      },
      {
        id: 'bank-2',
        bankName: 'Bank of Ceylon (BOC)',
        accountName: 'HNC Competition Educational Fund',
        accountNumber: '8492019482',
        branch: 'Colombo Central Corporate Branch',
        swiftCode: 'BCEYLKLX',
        isPrimary: false,
      },
      {
        id: 'bank-3',
        bankName: 'Sampath Bank',
        accountName: 'HNC Competition Foundation',
        accountNumber: '019230048123',
        branch: 'Head Office City Branch',
        swiftCode: 'BSAMLKLX',
        isPrimary: false,
      },
    ],
    lankaQrMerchantName: 'HNC Competition National Olympiad',
    lankaQrMerchantId: 'LQR-HNC-9482',
    lankaQrAccountNo: '1000845920',
    lankaQrBank: 'Commercial Bank of Ceylon',
    mobileWalletNumbers: {
      dialogGenie: '077 123 4567',
      ezCash: '#111*9482# (Merchant: HNC Competition)',
      mcash: '071 987 6543 (HNC Competition)',
    },
  },
};

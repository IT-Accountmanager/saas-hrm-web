import { CorporateModuleId } from './saasModules';
export * from './saasModules';
export * from './finance';
export * from './manager';

export type UserRole =
  | 'saas_owner'
  | 'org_owner'
  | 'org_admin'
  | 'hr_admin'
  | 'hr_executive'
  | 'recruiter'
  | 'payroll_admin'
  | 'manager'
  | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  organizationId: string;
  organizationName: string;
  departmentId?: string;
  departmentName?: string;
  designation?: string;
  employeeId?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string;
  plan?: string;
  status: 'active' | 'trial' | 'inactive' | 'suspended';
  industry: string;
  totalEmployees: number;
  maxEmployees: number;
  contactPerson?: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  website: string;
  createdAt: string;
  billingCycle: 'monthly' | 'annual';
  monthlyFee: number;
  subscribedModules?: CorporateModuleId[];
  disabledSubModules?: Record<string, string[]>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxEmployees: number;
  features: string[];
  popular?: boolean;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  headOfDepartmentId?: string;
  headName?: string;
  employeeCount: number;
  color: string;
  budget?: number;
  description?: string;
  location?: string;
  createdAt?: string;
}

export interface Designation {
  id: string;
  organizationId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  level: string;
  employeeCount: number;
  salaryBandMin?: number;
  salaryBandMax?: number;
  bandTrack?: 'IC' | 'Management' | 'Executive';
  description?: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  departmentId?: string;
  department: string;
  leadName: string;
  leadRole: string;
  leadEmployeeId?: string;
  memberCount: number;
  memberIds?: string[];
  color: string;
  description?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  employeeId: string; // e.g. EMP001
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  personalEmail: string;
  phone: string;
  avatar: string;
  department: string;
  departmentId: string;
  designation: string;
  designationId: string;
  managerId?: string;
  managerName?: string;
  joiningDate: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married' | 'Divorced';
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  workLocation: 'On-site' | 'Remote' | 'Hybrid';
  officeLocation: string; // e.g. "Hyderabad", "Bengaluru", "Delhi"
  status: 'Active' | 'On Leave' | 'Terminated' | 'Probation';
  salary: {
    basic: number;
    hra: number;
    allowances: number;
    gross: number;
    deductions: {
      providentFund: number;
      professionalTax: number;
      incomeTax: number;
      insurance: number;
    };
    net: number;
  };
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm:ss or '--:--'
  clockOut: string; // HH:mm:ss or '--:--'
  workingHours: number; // in hours
  breakHours: number;
  overtimeHours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Work From Home' | 'Holiday';
  ipAddress?: string;
  location?: string;
  notes?: string;
}

export interface ShiftSchedule {
  id: string;
  organizationId: string;
  name: string; // e.g. "Morning Shift", "General Shift", "Night Shift"
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  breakDurationMinutes: number; // 60
  graceTimeMinutes: number; // 15
  color: string;
}

export interface LeaveBalance {
  employeeId: string;
  annual: { total: number; used: number; remaining: number };
  casual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  maternityPaternity: { total: number; used: number; remaining: number };
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  leaveType: 'Annual' | 'Casual' | 'Sick' | 'Maternity' | 'Paternity' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedDate: string;
  approverId?: string;
  approverName?: string;
  approvedOrRejectedDate?: string;
  rejectionReason?: string;
  attachmentUrl?: string;
}

export interface Holiday {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  day: string;
  type: 'Public' | 'Optional' | 'Company';
  location?: string;
  description?: string;
}

export interface PayrollRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  designation: string;
  month: string; // e.g. "May 2024"
  monthKey: string; // e.g. "2024-05"
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  overtimePay: number;
  grossSalary: number;
  providentFund: number;
  taxDeduction: number;
  insuranceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Direct Deposit';
  paymentDate: string;
  status: 'Paid' | 'Processing' | 'Pending' | 'Draft';
  payslipUrl?: string;
}

export type CandidateStage =
  | 'Applied'
  | 'Under Review'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview'
  | 'Technical Round'
  | 'HR Round'
  | 'Selected'
  | 'Offer'
  | 'Offer Accepted'
  | 'Joining'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn'
  | 'Hold'
  | 'Joined';

export interface JobOpening {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  designation?: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  workMode?: 'On-site' | 'Remote' | 'Hybrid';
  experienceRequired: string;
  education?: string;
  skills?: string[];
  positions: number;
  applicationsCount: number;
  status: 'Active' | 'Draft' | 'Closed' | 'On Hold' | 'Expired';
  salaryRange: string;
  postedDate: string;
  deadline: string;
  description: string;
  responsibilities?: string[];
  requirements: string[];
  benefits?: string[];
  hiringManager?: string;
  recruiterName?: string;
  viewsCount?: number;
  shortlistedCount?: number;
  interviewsCount?: number;
  selectedCount?: number;
  hiredCount?: number;
}

export interface Candidate {
  id: string;
  organizationId: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  currentCompany?: string;
  currentRole?: string;
  experienceYears: number;
  stage: CandidateStage;
  rating: number; // 1-5
  appliedDate: string;
  expectedSalary: string;
  noticePeriod: string;
  resumeUrl: string;
  notes: string;
  interviews: Interview[];
  location?: string;
  source?: string;
  skills?: string[];
  education?: string;
  recruiterId?: string;
  recruiterName?: string;
  priority?: 'High' | 'Medium' | 'Low';
  talentPool?: boolean;
  status?: 'Active' | 'Archived' | 'Hired' | 'Rejected';
  screeningScore?: number; // 0-100%
  screeningStatus?: 'Pending' | 'Passed' | 'Failed' | 'On Hold' | 'Hold' | 'Rejected';
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewerId: string;
  interviewerName: string;
  stage: string;
  date: string;
  time: string;
  durationMinutes: number;
  meetingLink: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  feedback?: string;
  score?: number;
}

export interface GoalOKR {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  department: string;
  startDate: string;
  dueDate: string;
  progress: number; // 0 - 100
  status: 'In Progress' | 'Completed' | 'At Risk' | 'Not Started';
  category: 'Company' | 'Department' | 'Individual';
  keyResults: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
  }[];
}

export interface PerformanceReview {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  reviewerId: string;
  reviewerName: string;
  cycle: string; // e.g. "Q1 2024", "Annual 2023"
  rating: number; // 1 to 5
  status: 'Completed' | 'Pending Review' | 'Draft';
  submissionDate: string;
  strengths: string;
  areasOfImprovement: string;
  feedback: string;
}

export interface ExpenseClaim {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  category: 'Travel' | 'Meals' | 'Software' | 'Equipment' | 'Office Supplies' | 'Other';
  amount: number;
  currency: string;
  date: string;
  description: string;
  project: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
  approvedDate?: string;
  approverName?: string;
}

export interface Asset {
  id: string;
  organizationId: string;
  assetTag: string; // e.g. "AST-0941"
  name: string; // e.g. "MacBook Pro 16 M3"
  category: 'Laptop' | 'Monitor' | 'Mobile' | 'Furniture' | 'Accessory';
  serialNumber: string;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedDate?: string;
  condition: 'Brand New' | 'Good' | 'Fair' | 'Needs Repair';
  status: 'Assigned' | 'Available' | 'Maintenance' | 'Retired';
  purchaseDate: string;
  purchaseCost: number;
}

export interface DocumentItem {
  id: string;
  organizationId: string;
  employeeId?: string; // empty if company document
  employeeName?: string;
  title: string;
  category: 'Offer Letter' | 'Appointment Letter' | 'ID Proof' | 'Address Proof' | 'Certificate' | 'Payslip' | 'Policy' | 'Other';
  fileType: string;
  fileSize: string;
  uploadedDate: string;
  expiryDate?: string;
  isExpired?: boolean;
  status: 'Verified' | 'Pending' | 'Rejected';
  downloadUrl: string;
}

export interface TrainingCourse {
  id: string;
  organizationId: string;
  title: string;
  category: 'Technical' | 'Leadership' | 'Compliance' | 'Soft Skills';
  description: string;
  instructor: string;
  durationHours: number;
  totalEnrolled: number;
  completedCount: number;
  rating: number;
  thumbnail: string;
  status: 'Active' | 'Archived';
  enrolledEmployees: {
    employeeId: string;
    employeeName: string;
    progress: number;
    status: 'In Progress' | 'Completed' | 'Not Started';
    completedDate?: string;
    score?: number;
  }[];
}

export interface CalendarEvent {
  id: string;
  organizationId: string;
  title: string;
  type: 'Leave' | 'Holiday' | 'Birthday' | 'Work Anniversary' | 'Interview' | 'Training' | 'Meeting' | 'Company Event';
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  description?: string;
  participants?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'payroll' | 'interview' | 'system' | 'performance';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Failed';
  details: string;
}

// =========================================================================
// TALENT ACQUISITION & RECRUITMENT ATS TYPES
// =========================================================================

export interface ManpowerRequirement {
  id: string;
  organizationId: string;
  department: string;
  position: string;
  requiredHeadcount: number;
  existingHeadcount: number;
  requiredDate: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  requestedBy: string;
  requestedByRole: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected' | 'In Review';
  approvedBy?: string;
  reason: string;
  budgetAllocated: string;
  notes?: string;
  createdAt: string;
}

export interface JobRequisition {
  id: string;
  organizationId: string;
  manpowerRequirementId?: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  positions: number;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  requestedBy: string;
  hiringManager: string;
  recruiterId?: string;
  recruiterName?: string;
  approvalStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Open' | 'Closed';
  businessJustification: string;
  requiredSkills: string[];
  experienceRequired: string;
  salaryRange: string;
  targetJoiningDate: string;
  createdDate: string;
  deadline: string;
  approvalHistory: {
    approver: string;
    role: string;
    status: 'Approved' | 'Rejected' | 'Pending';
    date?: string;
    comment?: string;
  }[];
  recruitmentProgress?: {
    applications: number;
    screened: number;
    interviewing: number;
    offered: number;
    hired: number;
  };
}

export interface JobApplication {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  source: 'Career Page' | 'LinkedIn' | 'Referral' | 'Job Portal' | 'Agency' | 'Direct';
  currentStage: CandidateStage;
  recruiterName: string;
  experienceYears: number;
  currentCompany?: string;
  resumeUrl: string;
  resumeFileName: string;
  status: 'Active' | 'Rejected' | 'Withdrawn' | 'Hired';
  rating: number;
  notesCount: number;
  notes?: string;
  interviewsCount: number;
  timeline: {
    stage: string;
    date: string;
    updatedBy: string;
    comment?: string;
  }[];
}

export interface ResumeDocument {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobApplied: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  resumeStatus: 'Verified' | 'Pending' | 'Needs Update' | 'Parsed';
  screeningStatus: 'Pending' | 'Screened' | 'Shortlisted' | 'Rejected';
  extractedSkills: string[];
  extractedExperience: string;
  extractedEducation: string;
  matchScore: number; // 0-100%
  downloadUrl: string;
}

export interface InterviewEvaluation {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  interviewId: string;
  interviewRound: string;
  interviewerId: string;
  interviewerName: string;
  interviewerRole: string;
  evaluationDate: string;
  status: 'Pending' | 'Completed';
  scores: {
    technicalSkills: number; // 1-5
    communication: number; // 1-5
    problemSolving: number; // 1-5
    experience: number; // 1-5
    cultureFit: number; // 1-5
  };
  overallRating: number; // 1-5
  strengths: string[];
  weaknesses: string[];
  comments: string;
  recommendation: 'Strong Hire' | 'Hire' | 'Hold' | 'Reject';
}

export interface JobOffer {
  id: string;
  organizationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  department: string;
  salaryAnnual: number;
  salaryFormatted: string;
  joiningDate: string;
  employmentType: 'Full-time' | 'Contract' | 'Part-time';
  offerStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  sentDate?: string;
  responseDeadline: string;
  benefitsSummary: string[];
  notes?: string;
  createdAt: string;
}

export interface OnboardingHandover {
  id: string;
  organizationId: string;
  candidateId: string;
  applicantId: string; // e.g. APP-2025-081
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar: string;
  jobTitle: string;
  department: string;
  designation: string;
  joiningDate: string;
  offerStatus: 'Accepted';
  documentsStatus: 'Verified' | 'Pending' | 'Under Review' | 'Pending Upload';
  handoverStatus:
  | 'Joining Pending'
  | 'Joining Confirmed'
  | 'Ready for Handover'
  | 'Handover to HR'
  | 'Onboarding in Progress'
  | 'Completed';
  bgvStatus?: 'Not Started' | 'Initiated' | 'In Progress' | 'Cleared' | 'Failed';
  employeeId?: string;
  checklist: {
    offerAccepted: boolean;
    personalInfoComplete: boolean;
    resumeAvailable: boolean;
    documentsUploaded: boolean;
    joiningDateConfirmed: boolean;
    salaryDetailsApproved: boolean;
    jobDepartmentConfirmed: boolean;
    jobConfirmed?: boolean;
    [key: string]: boolean | undefined;
  };
  assignedHrName?: string;
  handoverDate?: string;
  notes?: string;
}


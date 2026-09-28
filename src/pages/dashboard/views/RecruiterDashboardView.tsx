import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  Video,
  Layers,
  FileText,
  CreditCard,
  Target,
  Send,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Modal, Input, Select, Button, Badge } from '../../../components/ui';
import { DashboardHeroBanner } from '../../../components/common/DashboardHeroBanner';
import { recruitmentService } from '../../../services/recruitmentService';
import {
  JobOpening,
  Candidate,
  JobRequisition,
  Interview,
  JobOffer,
  OnboardingHandover,
} from '../../../types';
import { useAppStore } from '../../../store/useAppStore';
import { useSubModuleAccess } from '../../../hooks/useSubModuleAccess';

export const RecruiterDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const { isSubModuleEnabled } = useSubModuleAccess();

  const recruiterName =
    currentUser?.role === 'recruiter' && currentUser.name
      ? currentUser.name
      : 'Elena Rostova';

  // Data states
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [handovers, setHandovers] = useState<OnboardingHandover[]>([]);

  // Modals
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isNewReqOpen, setIsNewReqOpen] = useState(false);
  const [isAddCandOpen, setIsAddCandOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);

  // Form states
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [newJobLoc, setNewJobLoc] = useState('San Francisco HQ');
  const [newJobPositions, setNewJobPositions] = useState(1);
  const [newJobSalary, setNewJobSalary] = useState('$120,000 - $150,000');

  const [reqTitle, setReqTitle] = useState('');
  const [reqDept, setReqDept] = useState('Engineering');
  const [reqJustification, setReqJustification] = useState('');

  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candJob, setCandJob] = useState('');

  const [intCandidateId, setIntCandidateId] = useState('');
  const [intDate, setIntDate] = useState('2025-05-25');
  const [intTime, setIntTime] = useState('02:00 PM');
  const [intRound, setIntRound] = useState('Technical Interview');

  const [offerCandidateId, setOfferCandidateId] = useState('');
  const [offerSalary, setOfferSalary] = useState('145000');
  const [offerJoiningDate, setOfferJoiningDate] = useState('2025-07-01');

  const loadData = async () => {
    const [jList, cList, rList, oList, hList] = await Promise.all([
      recruitmentService.getJobs(),
      recruitmentService.getCandidates(),
      recruitmentService.getJobRequisitions(),
      recruitmentService.getOffers(),
      recruitmentService.getHandovers(),
    ]);
    setJobs(jList);
    setCandidates(cList);
    setRequisitions(rList);
    setOffers(oList);
    setHandovers(hList);
    if (jList.length > 0 && !candJob) setCandJob(jList[0].id);
    if (cList.length > 0 && !intCandidateId) setIntCandidateId(cList[0].id);
    if (cList.length > 0 && !offerCandidateId) setOfferCandidateId(cList[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute 8 Compact KPI Cards
  const openPositionsCount = jobs.reduce((acc, j) => acc + (j.status === 'Active' ? j.positions : 0), 0);
  const activeRequisitionsCount = requisitions.filter(
    (r) => r.approvalStatus === 'Approved' || r.approvalStatus === 'Open'
  ).length;
  const totalCandidatesCount = candidates.length;
  const newApplicationsCount = candidates.filter((c) => c.stage === 'Applied' || c.stage === 'Under Review').length + 18;
  const interviewsThisWeekCount = 12;
  const offersPendingCount = offers.filter((o) => o.offerStatus === 'Sent' || o.offerStatus === 'Draft').length;
  const joiningPendingCount = handovers.filter((h) => h.handoverStatus === 'Ready for Handover').length;
  const positionsFilledCount = candidates.filter((c) => c.stage === 'Hired' || c.stage === 'Joined').length + 7;

  const allKpis = [
    {
      id: 'open-positions',
      title: 'Open Positions',
      value: openPositionsCount || 12,
      trend: '+3 new',
      isPositive: true,
      comparison: 'vs last month',
      icon: Briefcase,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
      path: '/recruiter/jobs',
      subModule: 'Job creation & publishing',
    },
    {
      id: 'active-reqs',
      title: 'Active Requisitions',
      value: activeRequisitionsCount || 4,
      trend: '2 pending',
      isNeutral: true,
      comparison: 'across 4 depts',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
      path: '/recruiter/requisitions',
      subModule: 'Job requisitions',
    },
    {
      id: 'total-candidates',
      title: 'Total Candidates',
      value: totalCandidatesCount || 148,
      trend: '+24 this week',
      isPositive: true,
      comparison: 'in active pipeline',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
      path: '/recruiter/candidates',
      subModule: 'Candidate database',
    },
    {
      id: 'new-apps',
      title: 'New Applications',
      value: newApplicationsCount || 34,
      trend: '+12 today',
      isPositive: true,
      comparison: '4 active job posts',
      icon: Target,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/60',
      path: '/recruiter/applications',
      subModule: 'Application tracking',
    },
    {
      id: 'interviews-week',
      title: 'Interviews This Week',
      value: interviewsThisWeekCount,
      trend: '4 today',
      isPositive: true,
      comparison: '8 completed',
      icon: Calendar,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      path: '/recruiter/interviews',
      subModule: 'Interview scheduling',
    },
    {
      id: 'offers-pending',
      title: 'Offers Pending',
      value: offersPendingCount || 3,
      trend: '1 ready to send',
      isNeutral: true,
      comparison: '2 sent to candidates',
      icon: CreditCard,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/60',
      path: '/recruiter/offers',
      subModule: 'Selection & offer management',
    },
    {
      id: 'joining-pending',
      title: 'Joining Pending',
      value: joiningPendingCount || 3,
      trend: '2 confirmed',
      isPositive: true,
      comparison: 'next 14 days',
      icon: UserCheck,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/60',
      path: '/recruiter/handover',
      subModule: 'Joining & onboarding handover',
    },
    {
      id: 'positions-filled',
      title: 'Positions Filled',
      value: positionsFilledCount,
      trend: '90% of target',
      isPositive: true,
      comparison: 'Q2 hiring goal',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      path: '/recruiter/pipeline',
      subModule: 'Recruitment analytics',
    },
  ];

  const kpis = allKpis.filter((kpi) => isSubModuleEnabled('recruitment_management', kpi.subModule, 'read'));

  // 11-Stage Recruitment Funnel
  const allFunnelStages = [
    { name: 'Manpower Req', count: 5, path: '/recruiter/manpower-requirements', color: 'from-blue-600 to-blue-500', subModule: 'Manpower requirements' },
    { name: 'Requisition', count: 4, path: '/recruiter/requisitions', color: 'from-blue-500 to-indigo-500', subModule: 'Job requisitions' },
    { name: 'Job Published', count: 4, path: '/recruiter/jobs', color: 'from-indigo-500 to-indigo-600', subModule: 'Job creation & publishing' },
    { name: 'Applications', count: 96, path: '/recruiter/applications', color: 'from-indigo-600 to-purple-500', subModule: 'Application tracking' },
    { name: 'Screening', count: 42, path: '/recruiter/screening', color: 'from-purple-500 to-purple-600', subModule: 'Screening & shortlisting' },
    { name: 'Shortlisted', count: 24, path: '/recruiter/candidates?tab=shortlisted', color: 'from-purple-600 to-pink-500', subModule: 'Candidate database' },
    { name: 'Interview', count: 14, path: '/recruiter/interviews', color: 'from-pink-500 to-pink-600', subModule: 'Interview scheduling' },
    { name: 'Selected', count: 6, path: '/recruiter/candidates?stage=Selected', color: 'from-pink-600 to-amber-500', subModule: 'Interview evaluation' },
    { name: 'Offer', count: 4, path: '/recruiter/offers', color: 'from-amber-500 to-amber-600', subModule: 'Selection & offer management' },
    { name: 'Joined', count: 3, path: '/recruiter/candidates?tab=hired', color: 'from-amber-600 to-teal-500', subModule: 'Joining & onboarding handover' },
    { name: 'Handover', count: 3, path: '/recruiter/handover', color: 'from-teal-500 to-emerald-600', subModule: 'Joining & onboarding handover' },
  ];

  const funnelStages = allFunnelStages.filter((stage) => isSubModuleEnabled('recruitment_management', stage.subModule, 'read'));

  // Sourcing Channels data for chart
  const sourcingData = [
    { name: 'LinkedIn', value: 48, color: '#0A66C2' },
    { name: 'Career Page', value: 26, color: '#3B82F6' },
    { name: 'Referral', value: 16, color: '#10B981' },
    { name: 'Job Portal', value: 10, color: '#8B5CF6' },
  ];

  // Today's interviews
  const upcomingInterviews: (Interview & { candidateAvatar?: string })[] = [
    {
      id: 'int-1',
      candidateId: 'cand-1',
      candidateName: 'Aarav Patel',
      jobTitle: 'Frontend Developer',
      interviewerId: 'user-manager',
      interviewerName: 'Amit Verma',
      stage: 'Technical Coding Round',
      date: '2025-05-22',
      time: '02:00 PM',
      durationMinutes: 60,
      meetingLink: 'https://meet.google.com/xyz-hrm-test',
      status: 'Scheduled',
      candidateAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'int-2',
      candidateId: 'cand-2',
      candidateName: 'Maya Chen',
      jobTitle: 'Frontend Developer',
      interviewerId: 'user-manager',
      interviewerName: 'David Miller',
      stage: 'Hiring Manager Screen',
      date: '2025-05-23',
      time: '11:00 AM',
      durationMinutes: 45,
      meetingLink: 'https://meet.google.com/maya-interview',
      status: 'Scheduled',
      candidateAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'int-4',
      candidateId: 'cand-4',
      candidateName: 'Sophia Reynolds',
      jobTitle: 'UI/UX Product Designer',
      interviewerId: 'user-hr-admin',
      interviewerName: 'Rachel Green',
      stage: 'Portfolio Review',
      date: '2025-05-23',
      time: '03:30 PM',
      durationMinutes: 45,
      meetingLink: 'https://meet.google.com/sophia-portfolio',
      status: 'Scheduled',
      candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  ];

  // Quick action form handlers
  const handleQuickPostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    await recruitmentService.createJob({
      title: newJobTitle,
      department: newJobDept,
      location: newJobLoc,
      positions: Number(newJobPositions),
      salaryRange: newJobSalary,
    });
    setIsPostJobOpen(false);
    setNewJobTitle('');
    loadData();
  };

  const handleQuickNewReq = async (e: React.FormEvent) => {
    e.preventDefault();
    await recruitmentService.createJobRequisition({
      jobTitle: reqTitle,
      department: reqDept,
      businessJustification: reqJustification,
    });
    setIsNewReqOpen(false);
    setReqTitle('');
    setReqJustification('');
    loadData();
  };

  const handleQuickAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedJob = jobs.find((j) => j.id === candJob);
    await recruitmentService.createCandidate({
      name: candName,
      email: candEmail,
      jobId: candJob,
      jobTitle: matchedJob ? matchedJob.title : 'Software Engineer',
      stage: 'Applied',
    });
    setIsAddCandOpen(false);
    setCandName('');
    setCandEmail('');
    loadData();
  };

  const handleQuickScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    await recruitmentService.scheduleInterview(intCandidateId, {
      date: intDate,
      time: intTime,
      stage: intRound,
    });
    setIsScheduleInterviewOpen(false);
    loadData();
  };

  const handleQuickCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedCand = candidates.find((c) => c.id === offerCandidateId);
    await recruitmentService.createOffer({
      candidateId: offerCandidateId,
      candidateName: matchedCand ? matchedCand.name : 'Candidate',
      candidateEmail: matchedCand ? matchedCand.email : 'candidate@email.com',
      salaryAnnual: Number(offerSalary),
      salaryFormatted: `$${Number(offerSalary).toLocaleString()} / year`,
      joiningDate: offerJoiningDate,
      offerStatus: 'Draft',
    });
    setIsCreateOfferOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP HERO BANNER + WORK TIMER WITH COMPACT QUICK ACTIONS */}
      <DashboardHeroBanner
        actions={
          <>
            {isSubModuleEnabled('recruitment_management', 'Job creation & publishing', 'create') && (
              <button
                onClick={() => setIsPostJobOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold text-white px-3 py-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Job</span>
              </button>
            )}

            {(isSubModuleEnabled('recruitment_management', 'Job requisitions', 'create') || isSubModuleEnabled('recruitment_management', 'Manpower requirements', 'create')) && (
              <button
                onClick={() => setIsNewReqOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>New Requisition</span>
              </button>
            )}

            {isSubModuleEnabled('recruitment_management', 'Candidate database', 'create') && (
              <button
                onClick={() => setIsAddCandOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Add Candidate</span>
              </button>
            )}

            {isSubModuleEnabled('recruitment_management', 'Interview scheduling', 'create') && (
              <button
                onClick={() => setIsScheduleInterviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Schedule Interview</span>
              </button>
            )}

            {isSubModuleEnabled('recruitment_management', 'Selection & offer management', 'create') && (
              <button
                onClick={() => setIsCreateOfferOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Create Offer</span>
              </button>
            )}
          </>
        }
      />

      {/* RECRUITMENT OPERATING SYSTEM MODULE NAVIGATION BAR */}
      <div className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1">
          {[
            { label: 'Overview', path: '/recruiter/dashboard', active: true, subModule: undefined },
            { label: 'Manpower Reqs', path: '/recruiter/manpower-requirements', badge: '5', subModule: 'Manpower requirements' },
            { label: 'Requisitions', path: '/recruiter/requisitions', badge: '3', subModule: 'Job requisitions' },
            { label: 'Job Openings', path: '/recruiter/jobs', badge: '5', subModule: 'Job creation & publishing' },
            { label: 'Candidates', path: '/recruiter/candidates', subModule: 'Candidate database' },
            { label: 'CV Bank', path: '/recruiter/resumes', subModule: 'Resume management' },
            { label: 'Screening', path: '/recruiter/screening', subModule: 'Screening & shortlisting' },
            { label: 'ATS Pipeline', path: '/recruiter/pipeline', subModule: 'Recruitment pipeline' },
            { label: 'Interviews', path: '/recruiter/interviews', badge: '6', subModule: 'Interview scheduling' },
            { label: 'Scorecards', path: '/recruiter/evaluations', badge: '2', subModule: 'Interview evaluation' },
            { label: 'Offer Letters', path: '/recruiter/offers', badge: '3', subModule: 'Selection & offer management' },
            { label: 'Pre-Onboarding', path: '/recruiter/handover', badge: '3', subModule: 'Joining & onboarding handover' },
            { label: 'Analytics', path: '/recruiter/analytics', subModule: 'Recruitment analytics' },
          ]
            .filter((navItem) => !navItem.subModule || isSubModuleEnabled('recruitment_management', navItem.subModule, 'read'))
            .map((navItem) => (
              <button
                key={navItem.label}
                onClick={() => navigate(navItem.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${navItem.active
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <span>{navItem.label}</span>
                {navItem.badge && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${navItem.active
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {navItem.badge}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* =========================================================================
          2. 8 COMPACT PROFESSIONAL KPI CARDS
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              onClick={() => navigate(kpi.path)}
              className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-dark-card flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-900/60 transition-all duration-150 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.bgColor} ${kpi.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                  {kpi.title}
                </p>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  {kpi.value}
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span
                  className={`text-[10px] font-bold ${kpi.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-blue-600 dark:text-blue-400'
                    }`}
                >
                  {kpi.trend}
                </span>
                <span className="block text-[9px] text-slate-400 truncate mt-0.5">
                  {kpi.comparison}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          3. RECRUITMENT FUNNEL VISUALIZATION (11-STAGE INTERACTIVE)
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-dark-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive Recruitment Funnel
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                11 Stages
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any stage to inspect the filtered candidates, requisitions, or applications.
            </p>
          </div>
          <button
            onClick={() => navigate('/recruiter/pipeline')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <span>Open Kanban Pipeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Funnel Nodes Row */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-[960px]">
            {funnelStages.map((stage, idx) => (
              <React.Fragment key={stage.name}>
                <div
                  onClick={() => navigate(stage.path)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50/80 dark:bg-slate-800/40 dark:border-slate-800 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group text-center"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 block truncate">
                    {stage.name}
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block mt-0.5 tabular-nums">
                    {stage.count}
                  </span>
                  <span className="text-[9px] text-slate-400 block">candidates</span>
                </div>
                {idx < funnelStages.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none">
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TWO-COLUMN ROW: TODAY'S INTERVIEWS & ACTIVE REQUISITIONS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Today's Interviews (Span 7) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-dark-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Today's Interview Schedule</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">3 sessions confirmed for today</p>
              </div>
              <button
                onClick={() => navigate('/recruiter/interviews')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
              >
                View Calendar ↗
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.candidateAvatar}
                      alt={item.candidateName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {item.candidateName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.jobTitle} • <span className="font-semibold text-blue-600">{item.stage}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Interviewer: {item.interviewerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700">
                      {item.time}
                    </span>
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-2xs"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Meet</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Video conferencing link automatically shared with candidate & panel</span>
            <button
              onClick={() => setIsScheduleInterviewOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
            >
              + Add Interview
            </button>
          </div>
        </div>

        {/* Right: Sourcing Channels Chart (Span 5) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-dark-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Candidate Sourcing Channels
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Q2 2025</span>
            </div>
            <p className="text-xs text-slate-400">Percentage distribution of applicants by channel</p>

            <div className="flex items-center justify-between gap-4 mt-3">
              <div className="relative h-44 w-44 flex-shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourcingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 dark:text-white">148</span>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                {sourcingData.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Top Source: LinkedIn (48%)</span>
            <button
              onClick={() => navigate('/recruiter/analytics')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
            >
              Analytics Deep Dive ↗
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. ACTIVE JOB REQUISITIONS & OPEN POSITIONS TABLE
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-dark-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Open Positions & Requisitions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live job postings receiving applications and candidate evaluations
            </p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            All Openings ↗
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 rounded-l-xl">Role Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Location / Mode</th>
                <th className="py-2.5 px-3">Open Vacancies</th>
                <th className="py-2.5 px-3">Applicants</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <span>{job.title}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{job.salaryRange}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">{job.department}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{job.location}</td>
                  <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">{job.positions} Positions</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {job.applicationsCount || 24} Candidates
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={job.status === 'Active' ? 'success' : 'neutral'} size="sm" dot>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/recruiter/candidates')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <span>Pipeline</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODALS FOR QUICK ACTIONS
         ========================================================================= */}
      {/* 1. Post Job Modal */}
      <Modal isOpen={isPostJobOpen} onClose={() => setIsPostJobOpen(false)} title="Create New Job Opening" size="lg">
        <form onSubmit={handleQuickPostJob} className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Staff Distributed Systems Engineer"
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={newJobDept}
              onChange={(e) => setNewJobDept(e.target.value)}
              options={[
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Design', label: 'Design' },
                { value: 'Product', label: 'Product' },
                { value: 'Human Resources', label: 'Human Resources' },
                { value: 'Sales & Growth', label: 'Sales & Growth' },
              ]}
            />
            <Input
              label="Workplace Location"
              value={newJobLoc}
              onChange={(e) => setNewJobLoc(e.target.value)}
              placeholder="e.g. San Francisco HQ / Hybrid"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vacancies"
              type="number"
              value={newJobPositions}
              onChange={(e) => setNewJobPositions(Number(e.target.value))}
              min={1}
            />
            <Input
              label="Salary Range"
              value={newJobSalary}
              onChange={(e) => setNewJobSalary(e.target.value)}
              placeholder="e.g. $130,000 - $160,000"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsPostJobOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish Job Opening
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. New Requisition Modal */}
      <Modal isOpen={isNewReqOpen} onClose={() => setIsNewReqOpen(false)} title="Submit New Job Requisition" size="lg">
        <form onSubmit={handleQuickNewReq} className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Senior Security Architect"
            value={reqTitle}
            onChange={(e) => setReqTitle(e.target.value)}
            required
          />
          <Select
            label="Department"
            value={reqDept}
            onChange={(e) => setReqDept(e.target.value)}
            options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Product & Design', label: 'Product & Design' },
              { value: 'Sales & Growth', label: 'Sales & Growth' },
              { value: 'Customer Success', label: 'Customer Success' },
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Justification
            </label>
            <textarea
              rows={3}
              value={reqJustification}
              onChange={(e) => setReqJustification(e.target.value)}
              placeholder="Explain the necessity, headcount impact, and project timeline..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsNewReqOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Add Candidate Modal */}
      <Modal isOpen={isAddCandOpen} onClose={() => setIsAddCandOpen(false)} title="Add Candidate to Database" size="md">
        <form onSubmit={handleQuickAddCandidate} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Clara Oswald"
            value={candName}
            onChange={(e) => setCandName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. clara@example.com"
            value={candEmail}
            onChange={(e) => setCandEmail(e.target.value)}
            required
          />
          <Select
            label="Applying For"
            value={candJob}
            onChange={(e) => setCandJob(e.target.value)}
            options={jobs.map((j) => ({ value: j.id, label: j.title }))}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddCandOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Candidate
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Schedule Interview Modal */}
      <Modal isOpen={isScheduleInterviewOpen} onClose={() => setIsScheduleInterviewOpen(false)} title="Schedule Candidate Interview" size="md">
        <form onSubmit={handleQuickScheduleInterview} className="space-y-4">
          <Select
            label="Candidate"
            value={intCandidateId}
            onChange={(e) => setIntCandidateId(e.target.value)}
            options={candidates.map((c) => ({ value: c.id, label: `${c.name} (${c.jobTitle})` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={intDate}
              onChange={(e) => setIntDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              value={intTime}
              onChange={(e) => setIntTime(e.target.value)}
              placeholder="e.g. 02:00 PM"
              required
            />
          </div>
          <Select
            label="Interview Round"
            value={intRound}
            onChange={(e) => setIntRound(e.target.value)}
            options={[
              { value: 'Technical Coding Round', label: 'Technical Coding Round' },
              { value: 'Hiring Manager Screen', label: 'Hiring Manager Screen' },
              { value: 'System Architecture Review', label: 'System Architecture Review' },
              { value: 'HR & Culture Fit', label: 'HR & Culture Fit' },
              { value: 'Final Executive Round', label: 'Final Executive Round' },
            ]}
          />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsScheduleInterviewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm & Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Create Offer Modal */}
      <Modal isOpen={isCreateOfferOpen} onClose={() => setIsCreateOfferOpen(false)} title="Draft Candidate Job Offer" size="md">
        <form onSubmit={handleQuickCreateOffer} className="space-y-4">
          <Select
            label="Candidate"
            value={offerCandidateId}
            onChange={(e) => setOfferCandidateId(e.target.value)}
            options={candidates.map((c) => ({ value: c.id, label: `${c.name} (${c.jobTitle})` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Annual Base Salary ($)"
              type="number"
              value={offerSalary}
              onChange={(e) => setOfferSalary(e.target.value)}
              required
            />
            <Input
              label="Target Joining Date"
              type="date"
              value={offerJoiningDate}
              onChange={(e) => setOfferJoiningDate(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateOfferOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Offer Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

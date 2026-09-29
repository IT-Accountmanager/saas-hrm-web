import { getFromStorage, saveToStorage } from './storage';
import { CandidateStage } from '../types';

export interface WorkflowRuleNode {
    id: string;
    name: string;
    approverRole: string;
    approverName?: string;
    order: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
    comment?: string;
    updatedAt?: string;
}

export interface WorkflowDefinition {
    id: string;
    organizationId: string;
    module: 'Hiring Request' | 'Job Requisition' | 'Compensation Approval' | 'Offer Release';
    name: string;
    nodes: WorkflowRuleNode[];
    active: boolean;
}

export interface RecruitmentTask {
    id: string;
    organizationId: string;
    relatedEntityId: string; // Candidate ID, Application ID, etc.
    type: 'BGV' | 'IT Provisioning' | 'Department Onboarding' | 'Interview Feedback' | 'Offer Approval';
    title: string;
    assignedRole: string;
    assignedTo: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
    createdAt: string;
}

export interface SlaConfig {
    screeningDays: number;
    interviewFeedbackDays: number;
    offerApprovalDays: number;
    offerAcceptanceDays: number;
    bgvCompletionDays: number;
}

export const DEFAULT_SLA_CONFIG: SlaConfig = {
    screeningDays: 2,
    interviewFeedbackDays: 1,
    offerApprovalDays: 2,
    offerAcceptanceDays: 5,
    bgvCompletionDays: 5,
};

// State Machine Stage Progression Enforcement
export const VALID_STAGE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
    Applied: ['Screening', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn', 'Hold'],
    'Under Review': ['Screening', 'Shortlisted', 'Rejected', 'Hold'],
    Screening: ['Shortlisted', 'Interview', 'Technical Round', 'Rejected', 'Hold'],
    Shortlisted: ['Interview', 'Technical Round', 'HR Round', 'Rejected', 'Hold'],
    Interview: ['Technical Round', 'HR Round', 'Selected', 'Rejected', 'Hold'],
    'Technical Round': ['HR Round', 'Selected', 'Rejected', 'Hold'],
    'HR Round': ['Selected', 'Offer', 'Rejected', 'Hold'],
    Selected: ['Offer', 'Offer Accepted', 'Rejected', 'Hold'],
    Offer: ['Offer Accepted', 'Rejected', 'Withdrawn', 'Hold'],
    'Offer Accepted': ['Joining', 'Hired', 'Joined', 'Withdrawn'],
    Joining: ['Joined', 'Hired', 'Withdrawn'],
    Hired: ['Joined'],
    Joined: [],
    Rejected: ['Applied', 'Shortlisted'], // Can re-evaluate if reopened
    Withdrawn: [],
    Hold: ['Screening', 'Shortlisted', 'Interview', 'Offer'],
};

export const recruitmentWorkflowEngine = {
    // Validate candidate stage transition
    canTransitionStage: (currentStage: CandidateStage, nextStage: CandidateStage): boolean => {
        if (currentStage === nextStage) return true;
        const allowed = VALID_STAGE_TRANSITIONS[currentStage] || [];
        return allowed.includes(nextStage);
    },

    // Calculate SLA status
    getSlaStatus: (
        startDate: string,
        allowedDays: number
    ): { isOverdue: boolean; daysRemaining: number } => {
        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        const daysRemaining = allowedDays - elapsedDays;
        return {
            isOverdue: daysRemaining < 0,
            daysRemaining: daysRemaining >= 0 ? daysRemaining : 0,
        };
    },

    // Dynamic Workflow Approvals Storage
    getWorkflows: async (): Promise<WorkflowDefinition[]> => {
        return getFromStorage<WorkflowDefinition[]>('recruitment_workflows', [
            {
                id: 'wf-req-1',
                organizationId: 'org-1',
                module: 'Hiring Request',
                name: 'Standard Hiring Request Approval Chain',
                active: true,
                nodes: [
                    { id: 'n1', name: 'Department Head Approval', approverRole: 'Department Head', order: 1, status: 'Pending' },
                    { id: 'n2', name: 'Finance Review', approverRole: 'Finance Approver', order: 2, status: 'Pending' },
                    { id: 'n3', name: 'HR Director Final Signoff', approverRole: 'HR Director', order: 3, status: 'Pending' },
                ],
            },
            {
                id: 'wf-comp-1',
                organizationId: 'org-1',
                module: 'Compensation Approval',
                name: 'Executive Compensation Approval Chain',
                active: true,
                nodes: [
                    { id: 'c1', name: 'Recruitment Lead Review', approverRole: 'TA Lead', order: 1, status: 'Pending' },
                    { id: 'c2', name: 'Finance Budget Check', approverRole: 'Finance Approver', order: 2, status: 'Pending' },
                    { id: 'c3', name: 'VP Operations Signoff', approverRole: 'VP Operations', order: 3, status: 'Pending' },
                ],
            },
        ]);
    },

    // Recruitment Tasks Management
    getTasks: async (): Promise<RecruitmentTask[]> => {
        return getFromStorage<RecruitmentTask[]>('recruitment_tasks', [
            {
                id: 'tsk-bgv-101',
                organizationId: 'org-1',
                relatedEntityId: 'cand-1',
                type: 'BGV',
                title: 'Verify Candidate Identity & Education Documents',
                assignedRole: 'BGV Officer',
                assignedTo: 'Ananya Sharma',
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                priority: 'High',
                status: 'In Progress',
                createdAt: new Date().toISOString().split('T')[0],
            },
            {
                id: 'tsk-it-102',
                organizationId: 'org-1',
                relatedEntityId: 'cand-1',
                type: 'IT Provisioning',
                title: 'Provision Corporate Laptop, Email & Slack Access',
                assignedRole: 'IT Admin',
                assignedTo: 'Vikram Singh',
                dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
                priority: 'Medium',
                status: 'Pending',
                createdAt: new Date().toISOString().split('T')[0],
            },
        ]);
    },

    createTask: async (taskData: Partial<RecruitmentTask>): Promise<RecruitmentTask> => {
        const tasks = await recruitmentWorkflowEngine.getTasks();
        const newTask: RecruitmentTask = {
            id: `tsk-${Date.now()}`,
            organizationId: taskData.organizationId || 'org-1',
            relatedEntityId: taskData.relatedEntityId || 'cand-gen',
            type: taskData.type || 'BGV',
            title: taskData.title || 'Recruitment Action Required',
            assignedRole: taskData.assignedRole || 'Recruiter',
            assignedTo: taskData.assignedTo || 'Elena Rostova',
            dueDate: taskData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            priority: taskData.priority || 'Medium',
            status: 'Pending',
            createdAt: new Date().toISOString().split('T')[0],
        };
        const updated = [newTask, ...tasks];
        saveToStorage('recruitment_tasks', updated);
        return newTask;
    },

    updateTaskStatus: async (id: string, status: RecruitmentTask['status']): Promise<RecruitmentTask> => {
        const tasks = await recruitmentWorkflowEngine.getTasks();
        const idx = tasks.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error('Task not found');
        tasks[idx].status = status;
        saveToStorage('recruitment_tasks', tasks);
        return tasks[idx];
    },
};

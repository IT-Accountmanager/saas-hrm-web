import { getFromStorage, saveToStorage } from './storage';

export interface RecruitmentEmailTemplate {
    id: string;
    name: string;
    category:
    | 'Hiring Request'
    | 'Application'
    | 'Screening'
    | 'Assessment'
    | 'Interview'
    | 'Offer'
    | 'BGV'
    | 'Pre-Joining'
    | 'Onboarding';
    subject: string;
    body: string;
    variables: string[];
    channel: 'Email' | 'SMS' | 'In-App' | 'WhatsApp';
    isDefault: boolean;
    updatedAt: string;
}

export interface RecruitmentCommunicationLog {
    id: string;
    organizationId: string;
    candidateId?: string;
    candidateName?: string;
    candidateEmail?: string;
    templateId?: string;
    templateName?: string;
    channel: 'Email' | 'SMS' | 'In-App' | 'WhatsApp';
    senderName: string;
    recipientEmail: string;
    subject: string;
    body: string;
    status: 'Queued' | 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Bounced' | 'Failed';
    sentAt: string;
    deliveredAt?: string;
    openedAt?: string;
    metadata?: Record<string, string>;
}

export const INITIAL_RECRUITMENT_TEMPLATES: RecruitmentEmailTemplate[] = [
    {
        id: 'tpl-app-rec',
        name: 'Application Received Confirmation',
        category: 'Application',
        subject: 'Application Received: {{job_title}} at {{company_name}}',
        body: 'Dear {{candidate_name}},\n\nThank you for applying for the {{job_title}} position at {{company_name}}. We have successfully received your application. Our recruitment team is currently reviewing your profile.\n\nBest regards,\n{{recruiter_name}}\n{{company_name}} Talent Acquisition',
        variables: ['candidate_name', 'job_title', 'company_name', 'recruiter_name'],
        channel: 'Email',
        isDefault: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl-cand-short',
        name: 'Candidate Shortlisted Alert',
        category: 'Screening',
        subject: 'Update on your application for {{job_title}}',
        body: 'Hi {{candidate_name}},\n\nGreat news! Your application for {{job_title}} has been shortlisted for the next stage. Our team will contact you shortly to schedule your interview.\n\nRegards,\n{{company_name}} Recruitment Team',
        variables: ['candidate_name', 'job_title', 'company_name'],
        channel: 'Email',
        isDefault: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl-int-sched',
        name: 'Interview Scheduled Invitation',
        category: 'Interview',
        subject: 'Interview Scheduled: {{job_title}} - {{interview_round}}',
        body: 'Dear {{candidate_name}},\n\nYou are invited for a {{interview_round}} for the {{job_title}} role at {{company_name}}.\n\nDetails:\n- Date: {{interview_date}}\n- Time: {{interview_time}}\n- Meeting Link: {{meeting_link}}\n\nPlease let us know if you need to reschedule.\n\nBest regards,\n{{recruiter_name}}',
        variables: ['candidate_name', 'job_title', 'interview_round', 'company_name', 'interview_date', 'interview_time', 'meeting_link', 'recruiter_name'],
        channel: 'Email',
        isDefault: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl-off-send',
        name: 'Employment Offer Letter',
        category: 'Offer',
        subject: 'Employment Offer - {{job_title}} at {{company_name}}',
        body: 'Dear {{candidate_name}},\n\nWe are thrilled to extend an offer of employment for the position of {{job_title}} at {{company_name}}!\n\nKey Details:\n- Offered Salary: {{offered_ctc}}\n- Joining Date: {{joining_date}}\n- Response Deadline: {{expiry_date}}\n\nPlease review and sign your offer letter online.\n\nWarm regards,\n{{company_name}} HR Team',
        variables: ['candidate_name', 'job_title', 'company_name', 'offered_ctc', 'joining_date', 'expiry_date'],
        channel: 'Email',
        isDefault: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl-bgv-init',
        name: 'Background Verification Initiated',
        category: 'BGV',
        subject: 'Action Required: Background Verification for {{company_name}}',
        body: 'Hello {{candidate_name}},\n\nCongratulations on accepting our offer! As part of our pre-joining process, background verification has been initiated. Please upload your identity and address proof documents in your pre-joining portal.\n\nThank you,\n{{company_name}} BGV Cell',
        variables: ['candidate_name', 'company_name'],
        channel: 'Email',
        isDefault: true,
        updatedAt: new Date().toISOString(),
    }
];

export const recruitmentCommunicationService = {
    getTemplates: async (): Promise<RecruitmentEmailTemplate[]> => {
        return getFromStorage<RecruitmentEmailTemplate[]>('recruitment_templates', INITIAL_RECRUITMENT_TEMPLATES);
    },

    getTemplateById: async (id: string): Promise<RecruitmentEmailTemplate | undefined> => {
        const list = await recruitmentCommunicationService.getTemplates();
        return list.find((t) => t.id === id);
    },

    renderTemplate: (body: string, variables: Record<string, string>): string => {
        let rendered = body;
        Object.entries(variables).forEach(([key, val]) => {
            const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            rendered = rendered.replace(reg, val || '');
        });
        return rendered;
    },

    getLogs: async (): Promise<RecruitmentCommunicationLog[]> => {
        return getFromStorage<RecruitmentCommunicationLog[]>('recruitment_comm_logs', []);
    },

    getCandidateLogs: async (candidateId: string): Promise<RecruitmentCommunicationLog[]> => {
        const logs = await recruitmentCommunicationService.getLogs();
        return logs.filter((l) => l.candidateId === candidateId);
    },

    sendCommunication: async (payload: {
        organizationId?: string;
        candidateId?: string;
        candidateName?: string;
        candidateEmail: string;
        templateId?: string;
        templateName?: string;
        channel?: 'Email' | 'SMS' | 'In-App' | 'WhatsApp';
        senderName?: string;
        subject: string;
        body: string;
        variables?: Record<string, string>;
    }): Promise<RecruitmentCommunicationLog> => {
        const logs = await recruitmentCommunicationService.getLogs();
        const renderedBody = payload.variables
            ? recruitmentCommunicationService.renderTemplate(payload.body, payload.variables)
            : payload.body;

        const renderedSubject = payload.variables
            ? recruitmentCommunicationService.renderTemplate(payload.subject, payload.variables)
            : payload.subject;

        const newLog: RecruitmentCommunicationLog = {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            organizationId: payload.organizationId || 'org-1',
            candidateId: payload.candidateId,
            candidateName: payload.candidateName,
            candidateEmail: payload.candidateEmail,
            templateId: payload.templateId,
            templateName: payload.templateName,
            channel: payload.channel || 'Email',
            senderName: payload.senderName || 'Talent Acquisition Team',
            recipientEmail: payload.candidateEmail,
            subject: renderedSubject,
            body: renderedBody,
            status: 'Delivered',
            sentAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
            openedAt: new Date().toISOString(),
        };

        const updated = [newLog, ...logs];
        saveToStorage('recruitment_comm_logs', updated);
        return newLog;
    },
};

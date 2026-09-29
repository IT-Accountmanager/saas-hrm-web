import { Holiday } from '../types';

export interface ParsedHolidayRow {
    name: string;
    date: string;
    type: 'Public' | 'Company' | 'Optional';
    location: string;
    description: string;
    isValid: boolean;
    errorReason?: string;
}

export function downloadSampleHolidayExcelTemplate() {
    const csvContent = [
        'Holiday Name,Date (YYYY-MM-DD),Type (Public/Company/Optional),Office Scope,Description',
        'New Year\'s Day,2025-01-01,Public,Global / All Offices,Official paid start of the year holiday',
        'Republic Day,2025-01-26,Public,India Offices,National public holiday',
        'Good Friday,2025-04-18,Public,Global / All Offices,Religious observance holiday',
        'Memorial Day,2025-05-26,Public,US Offices,National paid holiday',
        'Juneteenth,2025-06-19,Public,US Offices,Federal holiday',
        'Independence Day,2025-07-04,Public,Global / All Offices,National Independence Day',
        'Company Founders Day,2025-08-15,Company,Global / All Offices,Special annual company observance day',
        'Labor Day,2025-09-01,Public,Global / All Offices,Workers national holiday',
        'Diwali,2025-10-20,Optional,APAC Offices,Optional floating holiday',
        'Thanksgiving Day,2025-11-27,Public,US Offices,Federal holiday',
        'Christmas Day,2025-12-25,Public,Global / All Offices,Official paid holiday'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Holidays_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function parseHolidayFile(file: File): Promise<{ rows: ParsedHolidayRow[]; totalValid: number; totalInvalid: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string || '';
                const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);

                if (lines.length === 0) {
                    resolve({ rows: [], totalValid: 0, totalInvalid: 0 });
                    return;
                }

                // Determine if first line is a header
                const firstLine = lines[0].toLowerCase();
                const hasHeader = firstLine.includes('name') || firstLine.includes('date') || firstLine.includes('type');
                const dataLines = hasHeader ? lines.slice(1) : lines;

                const rows: ParsedHolidayRow[] = [];
                let validCount = 0;
                let invalidCount = 0;

                dataLines.forEach((line) => {
                    // Parse CSV with double quote support
                    const cols = parseCsvLine(line);
                    if (cols.length < 2) return;

                    const rawName = cols[0]?.trim() || '';
                    const rawDate = cols[1]?.trim() || '';
                    const rawType = cols[2]?.trim() || 'Public';
                    const rawLocation = cols[3]?.trim() || 'Global / All Offices';
                    const rawDesc = cols[4]?.trim() || '';

                    // Validate date (YYYY-MM-DD or MM/DD/YYYY or DD-MM-YYYY)
                    const parsedDateStr = normalizeDate(rawDate);
                    let isValid = true;
                    let errorReason = undefined;

                    if (!rawName) {
                        isValid = false;
                        errorReason = 'Missing holiday name';
                    } else if (!parsedDateStr) {
                        isValid = false;
                        errorReason = `Invalid date format (${rawDate}). Use YYYY-MM-DD.`;
                    }

                    let type: 'Public' | 'Company' | 'Optional' = 'Public';
                    const typeLower = rawType.toLowerCase();
                    if (typeLower.includes('company') || typeLower.includes('observance')) {
                        type = 'Company';
                    } else if (typeLower.includes('optional') || typeLower.includes('floating')) {
                        type = 'Optional';
                    }

                    if (isValid) {
                        validCount++;
                    } else {
                        invalidCount++;
                    }

                    rows.push({
                        name: rawName || 'Untitled Holiday',
                        date: parsedDateStr || rawDate || new Date().toISOString().split('T')[0],
                        type,
                        location: rawLocation,
                        description: rawDesc,
                        isValid,
                        errorReason,
                    });
                });

                resolve({
                    rows,
                    totalValid: validCount,
                    totalInvalid: invalidCount,
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
}

function parseCsvLine(text: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

function normalizeDate(input: string): string | null {
    if (!input) return null;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
    }

    // MM/DD/YYYY or DD/MM/YYYY
    const parts = input.split(/[\/\-\.]/);
    if (parts.length === 3) {
        let y = parts[2];
        let m = parts[0];
        let d = parts[1];

        if (y.length === 4) {
            if (parseInt(m) > 12 && parseInt(d) <= 12) {
                // DD/MM/YYYY
                const tmp = m;
                m = d;
                d = tmp;
            }
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        if (parts[0].length === 4) {
            // YYYY/MM/DD
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
    }

    const dateObj = new Date(input);
    if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
    }

    return null;
}

export interface ParsedTimesheetRow {
    date: string;
    day: string;
    project: string;
    category: string;
    checkIn: string;
    checkOut: string;
    breakMins: number;
    totalHours: string;
    hoursDecimal: number;
    status: 'Present' | 'Absent' | 'Holiday' | 'Leave';
    billable: boolean;
    taskNotes: string;
    isValid: boolean;
    errorReason?: string;
}

export function downloadSampleTimesheetExcelTemplate() {
    const csvContent = [
        'Date (YYYY-MM-DD),Day,Project Name,Task Category,Check In (HH:MM AM/PM),Check Out (HH:MM AM/PM),Break (Mins),Status (Present/Absent/Holiday/Leave),Billable (Yes/No),Task Notes',
        '2025-04-21,Mon,SASS HRMS Portal,Frontend Architecture,09:00 AM,06:00 PM,60,Present,Yes,Configured timesheet UI and built Excel import parser logic.',
        '2025-04-22,Tue,SASS HRMS Portal,Backend API,09:15 AM,06:15 PM,60,Present,Yes,Developed REST APIs for attendance tracking and overtime calculations.',
        '2025-04-23,Wed,Client Mobile App,Database Design,09:05 AM,06:10 PM,45,Present,Yes,Indexed database schemas and optimized multi-tenant RBAC queries.',
        '2025-04-24,Thu,Client Mobile App,QA & Testing,09:00 AM,06:30 PM,60,Present,Yes,Executed end-to-end user acceptance tests and fixed edge case bugs.',
        '2025-04-25,Fri,Internal Operations,Client Meeting,09:10 AM,07:00 PM,60,Present,No,Participated in sprint review and milestone signoff with key stakeholders.',
        '2025-04-26,Sat,SASS HRMS Portal,Documentation,—,—,0,Absent,No,Weekend Off',
        '2025-04-27,Sun,SASS HRMS Portal,Documentation,—,—,0,Holiday,No,Weekly Holiday Off'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Timesheets_Complete_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function parseTimesheetFile(file: File): Promise<{ rows: ParsedTimesheetRow[]; totalValid: number; totalInvalid: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string || '';
                const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);

                if (lines.length === 0) {
                    resolve({ rows: [], totalValid: 0, totalInvalid: 0 });
                    return;
                }

                const firstLine = lines[0].toLowerCase();
                const hasHeader = firstLine.includes('date') || firstLine.includes('check') || firstLine.includes('project') || firstLine.includes('task');
                const dataLines = hasHeader ? lines.slice(1) : lines;

                const rows: ParsedTimesheetRow[] = [];
                let validCount = 0;
                let invalidCount = 0;

                dataLines.forEach((line) => {
                    const cols = parseCsvLine(line);
                    if (cols.length < 1) return;

                    const rawDate = cols[0]?.trim() || '';
                    const rawDay = cols[1]?.trim() || '';
                    const rawProject = cols[2]?.trim() || 'SASS HRMS Portal';
                    const rawCategory = cols[3]?.trim() || 'Development';
                    const rawCheckIn = cols[4]?.trim() || '—';
                    const rawCheckOut = cols[5]?.trim() || '—';
                    const rawBreakMins = parseInt(cols[6]?.trim() || '60', 10) || 0;
                    const rawStatus = cols[7]?.trim() || 'Present';
                    const rawBillable = cols[8]?.trim()?.toLowerCase() || 'yes';
                    const rawTaskNotes = cols[9]?.trim() || cols[5]?.trim() || '';

                    const parsedDateStr = normalizeDate(rawDate);
                    let isValid = true;
                    let errorReason = undefined;

                    if (!rawDate) {
                        isValid = false;
                        errorReason = 'Missing date field';
                    } else if (!parsedDateStr) {
                        isValid = false;
                        errorReason = `Invalid date (${rawDate}). Use YYYY-MM-DD.`;
                    } else if (!rawTaskNotes && rawStatus.toLowerCase() === 'present') {
                        isValid = false;
                        errorReason = 'Missing required Task Note for work day.';
                    }

                    // Format date nicely as DD Mon YYYY
                    let formattedDate = rawDate;
                    let dayName = rawDay;
                    if (parsedDateStr) {
                        const dObj = new Date(parsedDateStr);
                        if (!isNaN(dObj.getTime())) {
                            formattedDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            if (!dayName) {
                                dayName = dObj.toLocaleDateString('en-GB', { weekday: 'short' });
                            }
                        }
                    }

                    // Normalize Status
                    let status: 'Present' | 'Absent' | 'Holiday' | 'Leave' = 'Present';
                    const sLower = rawStatus.toLowerCase();
                    if (sLower.includes('absent')) status = 'Absent';
                    else if (sLower.includes('holiday')) status = 'Holiday';
                    else if (sLower.includes('leave')) status = 'Leave';

                    const isBillable = rawBillable.includes('yes') || rawBillable.includes('true') || rawBillable === '1';

                    // Compute total hours after break subtraction
                    let totalHours = '8 h 00 m';
                    let hoursDecimal = 8;
                    if (status === 'Absent' || status === 'Holiday') {
                        totalHours = '0 h 00 m';
                        hoursDecimal = 0;
                    } else {
                        if (rawCheckIn !== '—' && rawCheckOut !== '—') {
                            const computed = calculateHoursDiff(rawCheckIn, rawCheckOut, rawBreakMins);
                            totalHours = computed.formatted;
                            hoursDecimal = computed.decimal;
                        }
                    }

                    if (isValid) validCount++;
                    else invalidCount++;

                    rows.push({
                        date: formattedDate,
                        day: dayName || 'Mon',
                        project: rawProject,
                        category: rawCategory,
                        checkIn: rawCheckIn,
                        checkOut: rawCheckOut,
                        breakMins: rawBreakMins,
                        totalHours,
                        hoursDecimal,
                        status,
                        billable: isBillable,
                        taskNotes: rawTaskNotes || (status === 'Absent' ? 'Absent Log' : status === 'Holiday' ? 'Holiday Off' : 'No description provided'),
                        isValid,
                        errorReason,
                    });
                });

                resolve({ rows, totalValid: validCount, totalInvalid: invalidCount });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
}

function calculateHoursDiff(inTimeStr: string, outTimeStr: string, breakMins: number = 0): { formatted: string; decimal: number } {
    try {
        const parseTime = (tStr: string) => {
            const clean = tStr.trim().toUpperCase();
            let [time, modifier] = clean.split(' ');
            if (!modifier) {
                if (clean.endsWith('AM')) { modifier = 'AM'; time = clean.replace('AM', ''); }
                else if (clean.endsWith('PM')) { modifier = 'PM'; time = clean.replace('PM', ''); }
            }
            let [hoursStr, minsStr] = time.split(':');
            let hours = parseInt(hoursStr, 10) || 9;
            let mins = parseInt(minsStr, 10) || 0;

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return hours * 60 + mins;
        };

        const inMins = parseTime(inTimeStr);
        const outMins = parseTime(outTimeStr);
        let diffMins = outMins - inMins;
        if (diffMins < 0) diffMins += 24 * 60; // Overnight shift support

        const netMins = Math.max(0, diffMins - breakMins);
        const h = Math.floor(netMins / 60);
        const m = netMins % 60;
        const dec = parseFloat((h + m / 60).toFixed(2));
        return {
            formatted: `${h} h ${m < 10 ? '0' : ''}${m} m`,
            decimal: dec
        };
    } catch {
        return { formatted: '8 h 00 m', decimal: 8 };
    }
}



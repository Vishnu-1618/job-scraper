import { Job } from './store';

export interface AnalyticsData {
  total: number;
  remoteCount: number;
  onsiteCount: number;
  byPlatform: { label: string; count: number; color?: string }[];
  topTitles: { label: string; count: number }[];
  topLocations: { label: string; count: number }[];
  // Advanced features
  byJobType: { label: string; count: number }[];
  byExperience: { label: string; count: number }[];
  topCompanies: { label: string; count: number }[];
  jobsByDate: { label: string; count: number }[];
}

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: '#0077b5',
  Indeed: '#2164f3',
  Glassdoor: '#0caa41',
  Naukri: '#ff6b6b',
  Other: '#94a3b8',
};

function getPlatform(url: string): string {
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('indeed.')) return 'Indeed';
  if (url.includes('glassdoor.')) return 'Glassdoor';
  if (url.includes('naukri.com')) return 'Naukri';
  return 'Other';
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .replace(/\s*[-–|].*$/, '')
    .replace(/^(senior|junior|lead|staff|principal|sr\.?|jr\.?)\s+/i, '')
    .trim()
    .toLowerCase();
}

function topN<T extends { count: number }>(arr: T[], n = 5): T[] {
  return arr.sort((a, b) => b.count - a.count).slice(0, n);
}

export function computeAnalytics(jobs: Job[]): AnalyticsData {
  const total = jobs.length;
  const remoteCount = jobs.filter(j => j.is_remote).length;
  const onsiteCount = total - remoteCount;

  const platformMap = new Map<string, number>();
  const titleMap = new Map<string, number>();
  const locationMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  const expMap = new Map<string, number>();
  const dateMap = new Map<string, number>();

  let totalMin = 0;
  let totalMax = 0;
  let salaryCount = 0;

  const now = new Date();

  for (const job of jobs) {
    // Platform
    const p = getPlatform(job.url);
    platformMap.set(p, (platformMap.get(p) ?? 0) + 1);

    // Title
    const t = normalizeTitle(job.title);
    if (t) titleMap.set(t, (titleMap.get(t) ?? 0) + 1);

    // Location
    const loc = (job.location || '').split(',')[0].trim();
    if (loc && loc.length > 1) {
      locationMap.set(loc, (locationMap.get(loc) ?? 0) + 1);
    }

    // Job Type
    const jt = job.job_type || 'Unspecified';
    typeMap.set(jt, (typeMap.get(jt) ?? 0) + 1);

    // Experience
    const exp = job.experience_level || 'Not specified';
    expMap.set(exp, (expMap.get(exp) ?? 0) + 1);

    // Salary
    if (job.salary_min) {
      totalMin += job.salary_min;
      totalMax += (job.salary_max || job.salary_min);
      salaryCount++;
    }

    // Posting Timeline (Last 30 days grouped by week approx, or just days ago)
    const dt = job.parsedDate || (job.created_at ? new Date(job.created_at) : null);
    if (dt) {
      const daysAgo = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
      let timeLabel = '';
      if (daysAgo <= 1) timeLabel = '0-1d ago';
      else if (daysAgo <= 7) timeLabel = '2-7d ago';
      else if (daysAgo <= 14) timeLabel = '8-14d ago';
      else if (daysAgo <= 30) timeLabel = '15-30d ago';
      else timeLabel = 'Older';

      if (timeLabel !== 'Older') {
        dateMap.set(timeLabel, (dateMap.get(timeLabel) ?? 0) + 1);
      }
    }
  }

  const byPlatform = Array.from(platformMap.entries()).map(([label, count]) => ({
    label, count, color: PLATFORM_COLORS[label] ?? '#94a3b8',
  }));

  const topTitles = topN(
    Array.from(titleMap.entries()).map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
    })), 7
  );

  const topLocations = topN(
    Array.from(locationMap.entries()).map(([label, count]) => ({ label, count })), 7
  );

  const byJobType = topN(Array.from(typeMap.entries()).map(([label, count]) => ({ label, count })));
  const byExperience = topN(Array.from(expMap.entries()).map(([label, count]) => ({ label, count })));

  // Top Companies
  const companyMap = new Map<string, number>();
  for (const job of jobs) {
      if (job.company) {
          const c = job.company.trim();
          companyMap.set(c, (companyMap.get(c) ?? 0) + 1);
      }
  }
  const topCompanies = topN(
      Array.from(companyMap.entries()).map(([label, count]) => ({ label, count })), 7
  );

  // Ensure right order for timeline
  const timelineOrder = ['0-1d ago', '2-7d ago', '8-14d ago', '15-30d ago'];
  const jobsByDate = timelineOrder.map(label => ({
    label, count: dateMap.get(label) || 0
  }));

  return {
    total, remoteCount, onsiteCount,
    byPlatform, topTitles, topLocations,
    byJobType, byExperience,
    topCompanies,
    jobsByDate
  };
}

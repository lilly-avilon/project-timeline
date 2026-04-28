import { isThaiHoliday } from './thaiHolidays';

export function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTotalDaysLeft(deadlineStr) {
  const today = startOfDay(new Date());
  const deadline = parseLocalDate(deadlineStr);
  return Math.round((deadline - today) / (1000 * 60 * 60 * 24));
}

export function getWorkdaysLeft(deadlineStr) {
  const today = startOfDay(new Date());
  const deadline = parseLocalDate(deadlineStr);
  if (deadline <= today) return 0;
  let count = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= deadline) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6 && !isThaiHoliday(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function getUrgencyLevel(totalDays) {
  if (totalDays < 0) return 'overdue';
  if (totalDays < 15) return 'red';
  if (totalDays < 31) return 'orange';
  if (totalDays < 90) return 'yellow';
  return 'green';
}

export const URGENCY = {
  overdue: {
    primary:  '#dc2626',
    dark:     '#991b1b',
    light:    '#fef2f2',
    mid:      '#fecaca',
    text:     '#b91c1c',
    gradient: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
    label: 'Overdue',
  },
  red: {
    primary:  '#ef4444',
    dark:     '#dc2626',
    light:    '#fff5f5',
    mid:      '#fecaca',
    text:     '#dc2626',
    gradient: 'linear-gradient(135deg, #fff5f5 0%, #fffbfb 100%)',
    label: 'Critical',
  },
  orange: {
    primary:  '#f97316',
    dark:     '#ea580c',
    light:    '#fff7ed',
    mid:      '#fed7aa',
    text:     '#c2410c',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #fffcf7 100%)',
    label: 'At Risk',
  },
  yellow: {
    primary:  '#d97706',
    dark:     '#b45309',
    light:    '#fffbeb',
    mid:      '#fde68a',
    text:     '#92400e',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fffef7 100%)',
    label: 'On Track',
  },
  green: {
    primary:  '#059669',
    dark:     '#047857',
    light:    '#ecfdf5',
    mid:      '#a7f3d0',
    text:     '#065f46',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #f5fffb 100%)',
    label: 'Healthy',
  },
};

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

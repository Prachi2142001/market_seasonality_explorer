export function getWeekNumber(date: Date): number {
    const copiedDate = new Date(date.getTime());
    copiedDate.setHours(0, 0, 0, 0);
    copiedDate.setDate(copiedDate.getDate() + 4 - (copiedDate.getDay() || 7));
    const yearStart = new Date(copiedDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((copiedDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }
  
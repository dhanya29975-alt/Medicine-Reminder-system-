import { Medicine } from '../types';
import { formatTo12Hour } from '../components/AddEditMedicineModal';

/**
 * Generates an iCalendar (.ics) file with VALARM triggers.
 * When opened on iOS or Android, it imports native phone alarms and reminders
 * that ring even if the browser is closed or phone is locked.
 */
export function generateMedicineICS(medicines: Medicine[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediAlarm//Medicine Reminder Alarm//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MediAlarm Prescriptions',
    'X-WR-TIMEZONE:UTC'
  ];

  const now = new Date();
  const todayStr = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  medicines.forEach((med) => {
    if (!med.active) return;

    med.times.forEach((timeStr) => {
      const [hStr, mStr] = timeStr.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      // Create start time for today
      const startDate = new Date();
      startDate.setHours(h, m, 0, 0);

      // Event formatting (YYYYMMDDTHHMMSS)
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const mins = String(startDate.getMinutes()).padStart(2, '0');

      const dtStart = `${year}${month}${day}T${hours}${mins}00`;
      const dtEnd = `${year}${month}${day}T${hours}${String(m + 10).padStart(2, '0')}00`;
      const uid = `med_${med.id}_${timeStr}_${Date.now()}@medialarm.local`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${todayStr}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        'RRULE:FREQ=DAILY', // Repeat daily
        `SUMMARY:💊 Time for ${med.name} (${med.dosage})`,
        `DESCRIPTION:Take ${med.dosage} of ${med.name}. Instructions: ${med.instructions}. Notes: ${med.notes || 'None'}`,
        'STATUS:CONFIRMED',
        // Native System Alarm (rings phone)
        'BEGIN:VALARM',
        'TRIGGER:-PT0M',
        'ACTION:AUDIO',
        'SOUND:Basso',
        `DESCRIPTION:MediAlarm: It is time to take ${med.name} (${med.dosage})`,
        'END:VALARM',
        'END:VEVENT'
      );
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarICS(medicines: Medicine[]): void {
  const icsData = generateMedicineICS(medicines);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'medialarm_phone_calendar.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

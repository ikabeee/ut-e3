export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  zone: string | null;
}

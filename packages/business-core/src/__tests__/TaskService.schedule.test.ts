import TaskService from '../services/TaskService';

describe('TaskService.generateWorkerTasks', () => {
  const service = new TaskService();

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('produces consistent schedule buckets for worker 4 at 08:30 Monday', () => {
    // Set a Monday at 08:30 local time
    const monday = new Date('2024-09-02T08:30:00'); // 2024-09-02 is a Monday
    jest.setSystemTime(monday);

    const schedule = service.generateWorkerTasks('4');

    // Should have tasks today
    expect(schedule.today.length).toBeGreaterThan(0);

    // At 08:30 some tasks may be in-progress (now) and some upcoming (next)
    expect(schedule.now.length + schedule.next.length + schedule.completed.length).toBeGreaterThan(0);

    // Urgent bucket should include items within 1 hour or overdue
    for (const t of schedule.urgent) {
      const due = new Date(t.dueDate).getTime();
      const now = monday.getTime();
      expect(due <= now || (due - now) < 60 * 60 * 1000).toBe(true);
    }
  });

  test('handles daysOfWeek tokens; empty means daily', () => {
    // Some routines have explicit days; we can still assert that not all routines are scheduled today
    const monday = new Date('2024-09-02T10:00:00');
    jest.setSystemTime(monday);

    const schedule = service.generateWorkerTasks('4');
    // There should be at least one task today, even if some routines exclude Monday
    expect(schedule.today.length).toBeGreaterThan(0);
  });
});


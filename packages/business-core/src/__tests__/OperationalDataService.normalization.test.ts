import { OperationalDataService } from '../services/OperationalDataService';

describe('OperationalDataService normalization', () => {
  let svc: OperationalDataService;

  beforeAll(async () => {
    svc = OperationalDataService.getInstance();
    await svc.initialize();
  });

  test('getBuildingByName normalizes 148 Chambers variants', () => {
    const a = svc.getBuildingByName('148 Chambers Street');
    const b = svc.getBuildingByName('148 Chambers St');
    const c = svc.getBuildingByName('ChAmbers 148 St.');

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(c).toBeTruthy();

    // All resolve to the same building id
    const ids = [a?.id, b?.id, c?.id].filter(Boolean);
    expect(new Set(ids).size).toBe(1);
  });
});


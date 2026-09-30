import { resolvePickedTime, defaultPickerTime } from '../pickTime';

const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m);

describe('resolvePickedTime', () => {
  it('keeps a later time today', () => {
    expect(resolvePickedTime(at(29, 19, 30), at(29, 17, 0))).toEqual(at(29, 19, 30));
  });

  it('rolls a past clock time to tomorrow when it is within 12 hours', () => {
    expect(resolvePickedTime(at(29, 0, 30), at(29, 23, 0))).toEqual(at(30, 0, 30));
  });

  it('rejects times more than 12 hours away', () => {
    // 22:50 picked at 23:00 would be tomorrow night: a mis-pick
    expect(resolvePickedTime(at(29, 22, 50), at(29, 23, 0))).toBeNull();
    expect(resolvePickedTime(at(29, 23, 30), at(29, 8, 0))).toBeNull();
  });

  it("treats the current minute as now, not tomorrow", () => {
    const now = new Date(2026, 8, 29, 12, 0, 30);
    expect(resolvePickedTime(at(29, 12, 0), now)).toEqual(at(29, 12, 0));
  });
});

describe('defaultPickerTime', () => {
  it('is 30 minutes out, rounded up to 5 minutes', () => {
    expect(defaultPickerTime(at(29, 12, 2))).toEqual(at(29, 12, 35));
    expect(defaultPickerTime(at(29, 12, 30))).toEqual(at(29, 13, 0));
  });
});

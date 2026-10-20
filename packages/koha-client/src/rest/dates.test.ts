import { describe, expect, it } from 'vitest';

import { daysBetween, localDate, toLocalDay } from './dates.js';
import { mapHoldError, mapRenewalError, mapRenewalMessage } from './errors.js';

describe('tarihler', () => {
  it('UTC zamanı kurum gününe çevirir', () => {
    // 21:30 UTC → İstanbul'da ertesi gün 00:30
    expect(localDate('2026-10-10T21:30:00Z', 'Europe/Istanbul')).toBe('2026-10-11');
    expect(toLocalDay('2026-10-10', 'Europe/Istanbul')).toBe('2026-10-10');
  });

  it('gün farkını hesaplar', () => {
    expect(daysBetween('2026-10-10', '2026-10-13')).toBe(3);
    expect(daysBetween('2026-10-10', '2026-10-07')).toBe(-3);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('hata eşleme', () => {
  it.each([
    ['on_reserve', 'LOAN_RENEWAL_ON_HOLD'],
    ['too_many', 'LOAN_RENEWAL_TOO_MANY'],
    ['bilinmeyen_kod', 'LOAN_RENEWAL_NOT_ALLOWED'],
    [null, 'LOAN_RENEWAL_NOT_ALLOWED'],
  ])('yenileme %s → %s', (input, expected) => {
    expect(mapRenewalError(input)).toBe(expected);
  });

  it('serbest metindeki yenileme kodunu bulur', () => {
    expect(mapRenewalMessage('Renewal not authorized (on_reserve)')).toBe('LOAN_RENEWAL_ON_HOLD');
    expect(mapRenewalMessage('auto_too_soon')).toBe('LOAN_RENEWAL_TOO_SOON');
    expect(mapRenewalMessage('???')).toBe('LOAN_RENEWAL_NOT_ALLOWED');
  });

  it.each([
    ['Hold cannot be placed. Reason: tooManyReserves', 'HOLD_TOO_MANY'],
    ['Hold cannot be placed. Reason: alreadyReserved', 'HOLD_ALREADY_EXISTS'],
    ['Hold cannot be placed. Reason: libraryNotPickupLocation', 'HOLD_PICKUP_LOCATION_INVALID'],
    ['Hold cannot be placed. Reason: notReservable', 'HOLD_NOT_ALLOWED'],
    ['tamamen başka bir şey', 'HOLD_NOT_ALLOWED'],
  ])('rezervasyon %s', (input, expected) => {
    expect(mapHoldError(input)).toBe(expected);
  });
});

import { formatStatValue, calculateDiscount, truncateDslName } from '../utils/dslUtils';

describe('VisualDSL Utility Functions', () => {
  test('formatStatValue: formats thousands to "k"', () => {
    expect(formatStatValue(1500)).toBe('1.5k');
    expect(formatStatValue(500)).toBe('500');
  });

  test('calculateDiscount: subtracts percent correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
    expect(calculateDiscount(50, 0)).toBe(50);
  });

  test('truncateDslName: cuts long strings', () => {
    expect(truncateDslName('Very Long Visual DSL Project Name', 10)).toBe('Very Long ...');
    expect(truncateDslName('Short Name', 20)).toBe('Short Name');
  });
});
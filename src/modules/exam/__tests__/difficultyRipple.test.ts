import { describe, it, expect } from 'vitest';
import {
  adjustDifficultyWeights,
  DEFAULT_DIFFICULTY_WEIGHTS,
  mapDbDifficultyToExam,
  DifficultyWeights,
} from '../difficultyRipple';

describe('Block A: Difficulty Ripple Cascade Algorithm & Mapping', () => {
  it('1. Mapping: 2-2-2-2-1 DB difficulty to Exam difficulty', () => {
    expect(mapDbDifficultyToExam(1)).toBe(1);
    expect(mapDbDifficultyToExam(2)).toBe(1);
    expect(mapDbDifficultyToExam(3)).toBe(2);
    expect(mapDbDifficultyToExam(4)).toBe(2);
    expect(mapDbDifficultyToExam(5)).toBe(3);
    expect(mapDbDifficultyToExam(6)).toBe(3);
    expect(mapDbDifficultyToExam(7)).toBe(4);
    expect(mapDbDifficultyToExam(8)).toBe(4);
    expect(mapDbDifficultyToExam(9)).toBe(5);
  });

  it('2. Invariant: Default weights sum strictly equals 100', () => {
    const sum = DEFAULT_DIFFICULTY_WEIGHTS.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('3. Ripple: Changing left endpoint L1 (index 0) absorbs purely from right neighbor L2', () => {
    const initial: DifficultyWeights = [25, 30, 25, 15, 5];
    // Increase L1 by 10 (from 25 to 35). L2 (index 1) has 30, which can easily absorb 10.
    const res = adjustDifficultyWeights(initial, 0, 35);
    expect(res[0]).toBe(35);
    expect(res[1]).toBe(20); // 30 - 10 = 20
    expect(res[2]).toBe(25); // untouched
    expect(res[3]).toBe(15); // untouched
    expect(res[4]).toBe(5);  // untouched
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('4. Ripple: Changing right endpoint L5 (index 4) absorbs purely from left neighbor L4', () => {
    const initial: DifficultyWeights = [25, 30, 25, 15, 5];
    // Increase L5 from 5 to 15 (+10). L4 (index 3) has 15, absorbs 10 -> becomes 5.
    const res = adjustDifficultyWeights(initial, 4, 15);
    expect(res[4]).toBe(15);
    expect(res[3]).toBe(5);
    expect(res[2]).toBe(25);
    expect(res[1]).toBe(30);
    expect(res[0]).toBe(25);
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('5. Ripple: Changing middle slot L3 (index 2) symmetrically absorbs from L2 and L4', () => {
    const initial: DifficultyWeights = [25, 30, 25, 15, 5];
    // Increase L3 from 25 to 35 (+10). Needs -10. Left L2 absorbs 5, Right L4 absorbs 5.
    const res = adjustDifficultyWeights(initial, 2, 35);
    expect(res[2]).toBe(35);
    expect(res[1]).toBe(25); // 30 - 5 = 25
    expect(res[3]).toBe(10); // 15 - 5 = 10
    expect(res[0]).toBe(25); // untouched
    expect(res[4]).toBe(5);  // untouched
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('6. Cascade: When direct neighbor hits 0%, excess radiates outward to next neighbor', () => {
    const initial: DifficultyWeights = [25, 10, 25, 35, 5];
    // Increase L1 (index 0) from 25 to 45 (+20).
    // Right neighbor L2 only has 10, so L2 drops to 0, remaining 10 cascades to L3!
    const res = adjustDifficultyWeights(initial, 0, 45);
    expect(res[0]).toBe(45);
    expect(res[1]).toBe(0);  // 10 - 10 = 0
    expect(res[2]).toBe(15); // 25 - 10 = 15
    expect(res[3]).toBe(35); // untouched
    expect(res[4]).toBe(5);  // untouched
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('7. Extreme Boundary: Pulling a slot to 100% reduces all other slots to 0%', () => {
    const initial: DifficultyWeights = [25, 30, 25, 15, 5];
    const res = adjustDifficultyWeights(initial, 2, 100);
    expect(res[2]).toBe(100);
    expect(res[0]).toBe(0);
    expect(res[1]).toBe(0);
    expect(res[3]).toBe(0);
    expect(res[4]).toBe(0);
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('8. Extreme Boundary: Pulling a slot to 0% distributes to other slots without negative values', () => {
    const initial: DifficultyWeights = [25, 30, 25, 15, 5];
    const res = adjustDifficultyWeights(initial, 0, 0);
    expect(res[0]).toBe(0);
    res.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    });
    expect(res.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('9. Property: 100 iterations of random drags always preserve sum === 100 and 0 <= W_i <= 100', () => {
    let current: DifficultyWeights = [...DEFAULT_DIFFICULTY_WEIGHTS];
    for (let i = 0; i < 100; i++) {
      const targetIdx = Math.floor(Math.random() * 5);
      const targetVal = Math.floor(Math.random() * 101);
      current = adjustDifficultyWeights(current, targetIdx, targetVal);

      expect(current[targetIdx]).toBe(targetVal);
      const sum = current.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
      current.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
        expect(Number.isInteger(val)).toBe(true);
      });
    }
  });
});

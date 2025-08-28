import { describe, it, expect } from 'vitest';

// MVAR Calculation Tests
describe('MVAR Calculations', () => {
  const calculateMVAR = (mw: number, mva: number) => {
    if (mw < 0 || mva < 0) {
      return { mvar: 0, isValid: false, error: 'Values must be non-negative' };
    }
    if (mw > mva) {
      return { mvar: 0, isValid: false, error: 'MVA must be greater than or equal to MW' };
    }
    const mvarSquared = Math.pow(mva, 2) - Math.pow(mw, 2);
    const mvar = Math.sqrt(Math.max(0, mvarSquared));
    return { mvar, isValid: true };
  };

  it('should calculate MVAR correctly for valid inputs', () => {
    const result = calculateMVAR(3, 5);
    expect(result.mvar).toBeCloseTo(4, 3);
    expect(result.isValid).toBe(true);
  });

  it('should return error when MW > MVA', () => {
    const result = calculateMVAR(10, 5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('MVA must be greater than or equal to MW');
  });

  it('should return error for negative values', () => {
    const result = calculateMVAR(-5, 10);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Values must be non-negative');
  });

  it('should handle equal MW and MVA', () => {
    const result = calculateMVAR(5, 5);
    expect(result.mvar).toBe(0);
    expect(result.isValid).toBe(true);
  });
});

// Consumption Calculation Tests
describe('Consumption Calculations', () => {
  const calculateConsumption = (inputs: {
    today33: number;
    previous33: number;
    today132: number;
    previous132: number;
    adjustment: string;
  }) => {
    const { today33, previous33, today132, previous132, adjustment } = inputs;
    
    if (today33 < 0 || previous33 < 0 || today132 < 0 || previous132 < 0) {
      return { isValid: false, error: 'Values must be non-negative' };
    }

    const diff33 = today33 - previous33;
    const net33 = diff33 * 1000;

    let today132_adj = today132;
    let targetDifference = 0;

    if (adjustment !== 'Auto') {
      if (adjustment === 'Equal') {
        targetDifference = 0;
      } else {
        targetDifference = parseInt(adjustment);
      }
      today132_adj = previous132 + (net33 + targetDifference) / 4000;
      today132_adj = Math.round(today132_adj);

      if (today132_adj < 0) {
        return { isValid: false, error: 'Adjustment results in invalid Today132 value' };
      }
    }

    const diff132 = today132_adj - previous132;
    const net132 = diff132 * 4000;
    const displayedDifference = net132 - net33;

    return {
      diff33,
      net33,
      today132_adj,
      diff132,
      net132,
      displayedDifference,
      isValid: true
    };
  };

  it('should calculate consumption correctly with Auto adjustment', () => {
    const result = calculateConsumption({
      today33: 100,
      previous33: 90,
      today132: 50,
      previous132: 45,
      adjustment: 'Auto'
    });

    expect(result.diff33).toBe(10);
    expect(result.net33).toBe(10000);
    expect(result.today132_adj).toBe(50);
    expect(result.diff132).toBe(5);
    expect(result.net132).toBe(20000);
    expect(result.displayedDifference).toBe(10000);
    expect(result.isValid).toBe(true);
  });

  it('should calculate consumption correctly with Equal adjustment', () => {
    const result = calculateConsumption({
      today33: 100,
      previous33: 90,
      today132: 50,
      previous132: 45,
      adjustment: 'Equal'
    });

    expect(result.net33).toBe(10000);
    expect(result.today132_adj).toBe(Math.round(45 + 10000 / 4000)); // 47.5 rounded to 48
    expect(result.displayedDifference).toBe(0);
    expect(result.isValid).toBe(true);
  });

  it('should calculate consumption correctly with numeric adjustment', () => {
    const result = calculateConsumption({
      today33: 100,
      previous33: 90,
      today132: 50,
      previous132: 45,
      adjustment: '200'
    });

    expect(result.net33).toBe(10000);
    expect(result.today132_adj).toBe(Math.round(45 + (10000 + 200) / 4000)); // 47.55 rounded to 48
    expect(result.displayedDifference).toBe(200);
    expect(result.isValid).toBe(true);
  });

  it('should return error for negative inputs', () => {
    const result = calculateConsumption({
      today33: -10,
      previous33: 90,
      today132: 50,
      previous132: 45,
      adjustment: 'Auto'
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Values must be non-negative');
  });
});

// Integration Tests
describe('Integration Tests', () => {
  it('should handle complete workflow with Auto adjustment', () => {
    const inputs = {
      today33: 1000,
      previous33: 950,
      today132: 500,
      previous132: 475,
      adjustment: 'Auto'
    };

    const result = calculateConsumption(inputs);
    
    expect(result.isValid).toBe(true);
    expect(result.net33).toBe(50000); // (1000-950) * 1000
    expect(result.net132).toBe(100000); // (500-475) * 4000
    expect(result.displayedDifference).toBe(50000); // 100000 - 50000
  });

  it('should handle complete workflow with numeric adjustment', () => {
    const inputs = {
      today33: 1000,
      previous33: 950,
      today132: 500,
      previous132: 475,
      adjustment: '300'
    };

    const result = calculateConsumption(inputs);
    
    expect(result.isValid).toBe(true);
    expect(result.net33).toBe(50000);
    // today132_adj = 475 + (50000 + 300) / 4000 = 475 + 12.575 = 487.575 rounded to 488
    expect(result.today132_adj).toBe(488);
    expect(result.net132).toBe(52000); // (488-475) * 4000
    expect(result.displayedDifference).toBe(2000); // Should be close to 300 due to rounding
  });
});

function calculateConsumption(inputs: {
  today33: number;
  previous33: number;
  today132: number;
  previous132: number;
  adjustment: string;
}) {
  const { today33, previous33, today132, previous132, adjustment } = inputs;
  
  if (today33 < 0 || previous33 < 0 || today132 < 0 || previous132 < 0) {
    return { isValid: false, error: 'Values must be non-negative' };
  }

  const diff33 = today33 - previous33;
  const net33 = diff33 * 1000;

  let today132_adj = today132;
  let targetDifference = 0;

  if (adjustment !== 'Auto') {
    if (adjustment === 'Equal') {
      targetDifference = 0;
    } else {
      targetDifference = parseInt(adjustment);
    }
    today132_adj = previous132 + (net33 + targetDifference) / 4000;
    today132_adj = Math.round(today132_adj);

    if (today132_adj < 0) {
      return { isValid: false, error: 'Adjustment results in invalid Today132 value' };
    }
  }

  const diff132 = today132_adj - previous132;
  const net132 = diff132 * 4000;
  const displayedDifference = net132 - net33;

  return {
    diff33,
    net33,
    today132_adj,
    diff132,
    net132,
    displayedDifference,
    isValid: true
  };
}
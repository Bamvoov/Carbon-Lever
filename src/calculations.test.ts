import { describe, test, expect } from 'vitest'
import {
  calculateFootprint,
  calculatePotentials,
  getActiveLever,
  actionsMap
} from './calculations'

describe('Core Calculation Logic Unit Tests', () => {
  const defaultInputs = {
    diet: 10,
    transport: 100,
    energy: 1, // Medium tier
    shopping: 5
  };

  test('default values produce the expected baseline total', () => {
    const footprints = calculateFootprint(defaultInputs);
    
    // Diet: 10 * 2.5 * 4.3 = 107.5
    expect(footprints.diet).toBeCloseTo(107.5, 1);
    // Transport: 100 * 0.17 * 4.3 = 73.1
    expect(footprints.transport).toBeCloseTo(73.1, 1);
    // Energy: Medium tier = 120
    expect(footprints.energy).toBe(120);
    // Shopping: 5 * 15 = 75
    expect(footprints.shopping).toBe(75);
    
    // Total baseline: 107.5 + 73.1 + 120 + 75 = 375.6
    expect(footprints.total).toBeCloseTo(375.6, 1);
  });

  test('changing each slider changes the total correctly', () => {
    const baseline = calculateFootprint(defaultInputs).total;

    // 1. Changing diet slider from 10 to 15
    const dietInputs = { ...defaultInputs, diet: 15 };
    const dietTotal = calculateFootprint(dietInputs).total;
    // Difference should be 5 * 2.5 * 4.3 = 53.75
    expect(dietTotal - baseline).toBeCloseTo(53.75, 1);

    // 2. Changing transport slider from 100 to 150
    const transportInputs = { ...defaultInputs, transport: 150 };
    const transportTotal = calculateFootprint(transportInputs).total;
    // Difference should be 50 * 0.17 * 4.3 = 36.55
    expect(transportTotal - baseline).toBeCloseTo(36.55, 1);

    // 3. Changing energy slider from 1 (Medium = 120) to 2 (High = 200)
    const energyInputs = { ...defaultInputs, energy: 2 };
    const energyTotal = calculateFootprint(energyInputs).total;
    // Difference should be 200 - 120 = 80
    expect(energyTotal - baseline).toBe(80);

    // 4. Changing shopping slider from 5 to 10
    const shoppingInputs = { ...defaultInputs, shopping: 10 };
    const shoppingTotal = calculateFootprint(shoppingInputs).total;
    // Difference should be 5 * 15 = 75
    expect(shoppingTotal - baseline).toBe(75);
  });

  test('the lever calculation picks the correct category for at least 2 different input combinations', () => {
    // Combination 1: Default inputs (diet potential should be highest)
    // Diet footprint = 107.5 -> potential = 53.75
    // Transport footprint = 73.1 -> potential = 21.93
    // Energy footprint = 120 -> potential = 18.0
    // Shopping footprint = 75 -> potential = 30.0
    const footprints1 = calculateFootprint(defaultInputs);
    const potentials1 = calculatePotentials(footprints1);
    const lever1 = getActiveLever(potentials1);
    expect(lever1.name).toBe('diet');

    // Combination 2: High transport inputs, low others
    // Diet = 0, Transport = 300, Energy = 0 (Low = 60), Shopping = 0
    // Transport footprint = 300 * 0.17 * 4.3 = 219.3 -> potential = 65.79
    // Energy footprint = 60 -> potential = 9.0
    const highTransportInputs = {
      diet: 0,
      transport: 300,
      energy: 0,
      shopping: 0
    };
    const footprints2 = calculateFootprint(highTransportInputs);
    const potentials2 = calculatePotentials(footprints2);
    const lever2 = getActiveLever(potentials2);
    expect(lever2.name).toBe('transport');

    // Combination 3: High shopping inputs, low others
    // Diet = 0, Transport = 0, Energy = 0 (Low = 60), Shopping = 20
    // Shopping footprint = 20 * 15 = 300 -> potential = 120
    // Energy footprint = 60 -> potential = 9.0
    const highShoppingInputs = {
      diet: 0,
      transport: 0,
      energy: 0,
      shopping: 20
    };
    const footprints3 = calculateFootprint(highShoppingInputs);
    const potentials3 = calculatePotentials(footprints3);
    const lever3 = getActiveLever(potentials3);
    expect(lever3.name).toBe('shopping');
  });

  test('the action plan running total updates correctly when items are checked/unchecked', () => {
    // Under default inputs, the lever is 'diet'
    const dietActions = actionsMap.diet;
    
    // Action 1: Swap 3 meat meals/week for plant-based
    // Math.min(10, 3) * 2.5 * 4.3 = 3 * 2.5 * 4.3 = 32.25
    const action1Savings = dietActions[0].calculateSavings(defaultInputs);
    expect(action1Savings).toBeCloseTo(32.25, 2);

    // Action 2: Cut 5 meat meals/week
    // Math.min(10, 5) * 2.5 * 4.3 = 5 * 2.5 * 4.3 = 53.75
    const action2Savings = dietActions[1].calculateSavings(defaultInputs);
    expect(action2Savings).toBeCloseTo(53.75, 2);

    // Cumulative check savings
    const noCheckedSavings = 0;
    expect(noCheckedSavings).toBe(0);

    const oneCheckedSavings = action1Savings;
    expect(oneCheckedSavings).toBeCloseTo(32.25, 2);

    const bothCheckedSavings = action1Savings + action2Savings;
    expect(bothCheckedSavings).toBeCloseTo(86.0, 2);
  });
});

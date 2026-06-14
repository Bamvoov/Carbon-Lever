import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from './App'

describe('Carbon Lever Component Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('the app renders without crashing', () => {
    render(<App />);
    
    // Check that header titles are in the document
    expect(screen.getAllByText(/Carbon Lever/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Habit Analysis & Opportunity Study')).toBeInTheDocument();
    expect(screen.getByText('Estimated Monthly Footprint')).toBeInTheDocument();
  });

  test('moving a slider updates the displayed hero number', () => {
    render(<App />);

    // The initial hero number should be 376 (rounded from 375.6)
    const heroNumber = document.getElementById('hero-co2-number');
    expect(heroNumber).not.toBeNull();
    expect(heroNumber!.textContent).toBe('376');

    // Find the Diet slider (Dietary Choices)
    // The range input has id "diet-slider"
    const dietSlider = document.getElementById('diet-slider') as HTMLInputElement;
    expect(dietSlider).not.toBeNull();

    // Change the value from 10 to 20
    fireEvent.change(dietSlider, { target: { value: '20' } });
    expect(dietSlider.value).toBe('20');

    // Wait for animated number hook to complete the transition
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // New total should be:
    // Diet: 20 * 2.5 * 4.3 = 215.0
    // Transport: 100 * 0.17 * 4.3 = 73.1
    // Energy: 120
    // Shopping: 75
    // Total: 215 + 73.1 + 120 + 75 = 483.1 -> 483
    expect(heroNumber!.textContent).toBe('483');
  });

  test('checking an action plan item updates the savings total', () => {
    render(<App />);

    const savingsContainer = screen.getByText('Estimated Plan Savings').closest('div');
    expect(savingsContainer).not.toBeNull();

    // Initially, plan savings should be 0.0
    expect(savingsContainer!.textContent).toContain('~0.0');

    // The default active lever is diet.
    // The checkbox for "Swap 3 meat meals/week for plant-based" should be present.
    const checkbox = screen.getByLabelText(/Swap 3 meat meals\/week/i) as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);

    // Click/check the checkbox
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Check if the savings updates to ~32.3
    // Savings = Math.min(10, 3) * 2.5 * 4.3 = 3 * 2.5 * 4.3 = 32.25 -> ~32.3
    expect(savingsContainer!.textContent).toContain('~32.3');
  });
});

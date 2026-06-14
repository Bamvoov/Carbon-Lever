export interface InputValues {
  diet: number;
  transport: number;
  energy: number;
  shopping: number;
}

export interface Footprints {
  diet: number;
  transport: number;
  energy: number;
  shopping: number;
  total: number;
}

export interface Potential {
  name: 'diet' | 'transport' | 'energy' | 'shopping';
  label: string;
  potential: number;
  current: number;
}

export function getEnergyFootprint(tier: number): number {
  if (tier === 0) return 60;
  if (tier === 1) return 120;
  return 200;
}

export function calculateFootprint(inputs: InputValues): Footprints {
  const dietFootprint = inputs.diet * 2.5 * 4.3;
  const transportFootprint = inputs.transport * 0.17 * 4.3;
  const energyFootprint = getEnergyFootprint(inputs.energy);
  const shoppingFootprint = inputs.shopping * 15;
  const total = dietFootprint + transportFootprint + energyFootprint + shoppingFootprint;

  return {
    diet: dietFootprint,
    transport: transportFootprint,
    energy: energyFootprint,
    shopping: shoppingFootprint,
    total,
  };
}

export function calculatePotentials(footprints: Omit<Footprints, 'total'>): Potential[] {
  const dietPotential = footprints.diet * 0.50;
  const transportPotential = footprints.transport * 0.30;
  const energyPotential = footprints.energy * 0.15;
  const shoppingPotential = footprints.shopping * 0.40;

  return [
    { name: 'diet', label: 'dietary choices', potential: dietPotential, current: footprints.diet },
    { name: 'transport', label: 'transportation', potential: transportPotential, current: footprints.transport },
    { name: 'energy', label: 'household energy', potential: energyPotential, current: footprints.energy },
    { name: 'shopping', label: 'consumer goods', potential: shoppingPotential, current: footprints.shopping },
  ];
}

export function getActiveLever(potentials: Potential[]): Potential {
  return potentials.reduce((prev, current) => {
    return (current.potential > prev.potential) ? current : prev;
  }, potentials[0]);
}

export interface ActionOption {
  id: string;
  label: string;
  calculateSavings: (inputs: InputValues) => number;
}

export const actionsMap: Record<'diet' | 'transport' | 'energy' | 'shopping', ActionOption[]> = {
  diet: [
    {
      id: 'diet-1',
      label: 'Swap 3 meat meals/week for plant-based',
      calculateSavings: (inputs) => Math.min(inputs.diet, 3) * 2.5 * 4.3,
    },
    {
      id: 'diet-2',
      label: 'Cut 5 meat meals/week',
      calculateSavings: (inputs) => Math.min(inputs.diet, 5) * 2.5 * 4.3,
    },
  ],
  transport: [
    {
      id: 'transport-1',
      label: 'Carpool 2 days/week',
      calculateSavings: (inputs) => (inputs.transport * 0.17 * 4.3) * 0.25,
    },
    {
      id: 'transport-2',
      label: 'Combine errands into one weekly trip',
      calculateSavings: (inputs) => (inputs.transport * 0.17 * 4.3) * 0.10,
    },
    {
      id: 'transport-3',
      label: 'Work from home 1 day/week',
      calculateSavings: (inputs) => (inputs.transport * 0.17 * 4.3) * 0.20,
    },
  ],
  energy: [
    {
      id: 'energy-1',
      label: 'Switch to LED lighting throughout',
      calculateSavings: (inputs) => Math.min(getEnergyFootprint(inputs.energy), 10),
    },
    {
      id: 'energy-2',
      label: 'Lower heating/AC by 2°C',
      calculateSavings: (inputs) => getEnergyFootprint(inputs.energy) * 0.15,
    },
  ],
  shopping: [
    {
      id: 'shopping-1',
      label: 'Cut impulse purchases by half',
      calculateSavings: (inputs) => (inputs.shopping * 15) * 0.50,
    },
    {
      id: 'shopping-2',
      label: 'Buy 2 fewer items/month',
      calculateSavings: (inputs) => Math.min(inputs.shopping, 2) * 15,
    },
  ],
};

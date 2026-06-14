import { useState, useEffect, useRef } from 'react'
import './App.css'

// Custom hook to animate numbers smoothly
function useAnimatedNumber(targetValue: number, duration: number = 350) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === targetValueRef.current) return;
    
    startValueRef.current = currentValue;
    targetValueRef.current = targetValue;
    startTimeRef.current = null;

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing out quad
      const ease = progress * (2 - progress);
      
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * ease;
      setCurrentValue(newValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration, currentValue]);

  return currentValue;
}

interface ActionOption {
  id: string;
  label: string;
  calculateSavings: (inputs: { diet: number; transport: number; energy: number; shopping: number }) => number;
}

export default function App() {
  // 1. Slider states with sensible defaults
  const [dietMeals, setDietMeals] = useState<number>(10); // 0-21, default 10
  const [transportKm, setTransportKm] = useState<number>(100); // 0-300, default 100
  const [energyTier, setEnergyTier] = useState<number>(1); // 0 = low, 1 = medium, 2 = high, default medium
  const [shoppingItems, setShoppingItems] = useState<number>(5); // 0-20, default 5

  const [selectedActionsByLever, setSelectedActionsByLever] = useState<Record<string, string[]>>({});
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // 2. Calculations
  const dietFootprint = dietMeals * 2.5 * 4.3;
  const transportFootprint = transportKm * 0.17 * 4.3;
  
  const getEnergyFootprint = (tier: number) => {
    if (tier === 0) return 60;
    if (tier === 1) return 120;
    return 200;
  };
  const energyFootprint = getEnergyFootprint(energyTier);
  const shoppingFootprint = shoppingItems * 15;

  const totalFootprint = dietFootprint + transportFootprint + energyFootprint + shoppingFootprint;
  const animatedTotal = useAnimatedNumber(totalFootprint, 300);

  // 3. Category reduction potentials
  const dietPotential = dietFootprint * 0.50;
  const transportPotential = transportFootprint * 0.30;
  const energyPotential = energyFootprint * 0.15;
  const shoppingPotential = shoppingFootprint * 0.40;

  const potentials = [
    { name: 'diet', label: 'dietary choices', potential: dietPotential, current: dietFootprint },
    { name: 'transport', label: 'transportation', potential: transportPotential, current: transportFootprint },
    { name: 'energy', label: 'household energy', potential: energyPotential, current: energyFootprint },
    { name: 'shopping', label: 'consumer goods', potential: shoppingPotential, current: shoppingFootprint },
  ];

  // The category with the highest resulting kg CO2e savings is "the lever"
  const activeLeverObj = potentials.reduce((prev, current) => {
    return (current.potential > prev.potential) ? current : prev;
  }, potentials[0]);

  const activeLever = activeLeverObj.name;

  // Get selected actions for the active lever
  const selectedActions = selectedActionsByLever[activeLever] || [];

  // Actions catalog corresponding to the lever
  const actionsMap: Record<string, ActionOption[]> = {
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

  const isLowFootprint = totalFootprint < 200;

  const rawActions = actionsMap[activeLever] || [];
  
  const currentActions = (() => {
    if (!isLowFootprint) return rawActions;

    // Calculate savings for each action
    const actionsWithSavings = rawActions.map(action => {
      const savings = action.calculateSavings({
        diet: dietMeals,
        transport: transportKm,
        energy: energyTier,
        shopping: shoppingItems
      });
      return { action, savings };
    });

    // Filter to those with savings > 0
    const availableActions = actionsWithSavings.filter(item => item.savings > 0);

    if (availableActions.length === 0) {
      // Fallback: if all savings are 0, return the first action
      return rawActions.slice(0, 1);
    }

    // Sort to find the one with the smallest positive savings
    availableActions.sort((a, b) => a.savings - b.savings);
    return [availableActions[0].action];
  })();

  const handleToggleAction = (id: string) => {
    setSelectedActionsByLever(prev => {
      const currentSelected = prev[activeLever] || [];
      const updated = currentSelected.includes(id)
        ? currentSelected.filter(a => a !== id)
        : [...currentSelected, id];
      return {
        ...prev,
        [activeLever]: updated
      };
    });
  };

  // Calculate savings of the checked options
  const planSavings = currentActions
    .filter(action => selectedActions.includes(action.id))
    .reduce((sum, action) => sum + action.calculateSavings({
      diet: dietMeals,
      transport: transportKm,
      energy: energyTier,
      shopping: shoppingItems
    }), 0);

  // Equivalencies:
  // 1. Not driving X km: savings / 0.17
  // 2. Annual absorption of Y trees: (savings * 12) / 20 = savings * 0.6
  const equivalentKm = planSavings / 0.17;
  const equivalentTrees = planSavings * 0.6;

  const handleSavePlan = () => {
    setShowSummary(true);
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for the shares
  const totalShares = dietFootprint + transportFootprint + energyFootprint + shoppingFootprint || 1;
  const dietShare = (dietFootprint / totalShares) * 100;
  const transportShare = (transportFootprint / totalShares) * 100;
  const energyShare = (energyFootprint / totalShares) * 100;
  const shoppingShare = (shoppingFootprint / totalShares) * 100;

  return (
    <div className="max-w-[720px] mx-auto px-6 py-12 md:py-20 font-sans min-h-screen flex flex-col justify-between">
      
      {/* Masthead */}
      <header className="border-b border-[#E2E2DC] pb-8 mb-10 no-print">
        <div className="flex justify-between items-baseline">
          <span className="font-sans text-sm font-bold tracking-[0.2em] uppercase text-[#4A4A45]">Carbon Lever</span>
          <span className="font-serif text-sm italic text-[#575753]">Habit Analysis & Opportunity Study</span>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-10 md:py-16 no-print">
          <p className="font-sans text-sm uppercase tracking-widest text-[#575753] mb-2 font-semibold">Estimated Monthly Footprint</p>
          <div className="flex items-baseline justify-center select-none">
            <span id="hero-co2-number" className="font-serif text-7xl md:text-9xl text-brand-accent tracking-tighter">
              {Math.round(animatedTotal)}
            </span>
            <span className="font-sans text-base text-[#4A4A45] ml-2 font-semibold">kg CO2e</span>
          </div>
          <p className="text-[#575753] text-xs font-mono mt-4">
            based on your weekly habits and monthly purchases
          </p>
        </section>

        {/* Why This Matters Section */}
        <section className="border-t border-[#E2E2DC] py-10 no-print">
          <div className="border border-brand-accent p-6 bg-[#5B7B5E]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-brand-accent mb-2">
              WHY THIS MATTERS
            </h3>
            <p className="font-sans text-xl leading-relaxed text-brand-text">
              Atmospheric CO2 levels are now higher than at any point in at least <span className="text-brand-accent font-bold">800,000 years</span>, based on ice core records. The IPCC links rising emissions to more frequent and severe heatwaves, droughts, and extreme rainfall events worldwide — a trend visible in recent record-breaking years. Small, realistic changes to everyday habits are part of how that trajectory shifts.
            </p>
          </div>
        </section>

        {/* Section 1: Inputs */}
        <section className="border-t border-[#E2E2DC] py-10 no-print">
          <h2 className="font-serif text-2xl mb-8 font-normal text-brand-text">Habit Inputs</h2>
          
          <div className="space-y-8">
            {/* Diet Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="font-sans text-sm font-bold uppercase tracking-widest text-[#4A4A45]" htmlFor="diet-slider">Dietary Choices</label>
                <span className="font-serif text-lg text-brand-text font-semibold">
                  {dietMeals} meat-based meals / week
                </span>
              </div>
              <input 
                id="diet-slider"
                type="range" 
                min="0" 
                max="21" 
                value={dietMeals} 
                onChange={(e) => setDietMeals(Number(e.target.value))}
                className="minimal-slider"
              />
              <div className="flex justify-between text-xs text-[#575753] font-mono mt-1">
                <span>0 meals (fully plant-based)</span>
                <span>21 meals (meat daily)</span>
              </div>
            </div>

            {/* Transport Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="font-sans text-sm font-bold uppercase tracking-widest text-[#4A4A45]" htmlFor="transport-slider">Transportation</label>
                <span className="font-serif text-lg text-brand-text font-semibold">
                  {transportKm} km driven by car / week
                </span>
              </div>
              <input 
                id="transport-slider"
                type="range" 
                min="0" 
                max="300" 
                value={transportKm} 
                onChange={(e) => setTransportKm(Number(e.target.value))}
                className="minimal-slider"
              />
              <div className="flex justify-between text-xs text-[#575753] font-mono mt-1">
                <span>0 km (no car travel)</span>
                <span>300 km</span>
              </div>
            </div>

            {/* Energy Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="font-sans text-sm font-bold uppercase tracking-widest text-[#4A4A45]" htmlFor="energy-slider">Household Energy</label>
                <span className="font-serif text-lg text-brand-text font-semibold">
                  {energyTier === 0 ? 'Low Tier (~60 kg CO2e/mo)' : energyTier === 1 ? 'Medium Tier (~120 kg CO2e/mo)' : 'High Tier (~200 kg CO2e/mo)'}
                </span>
              </div>
              <input 
                id="energy-slider"
                type="range" 
                min="0" 
                max="2" 
                step="1"
                value={energyTier} 
                onChange={(e) => setEnergyTier(Number(e.target.value))}
                className="minimal-slider"
              />
              <div className="flex justify-between text-xs text-[#575753] font-mono mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Shopping Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="font-sans text-sm font-bold uppercase tracking-widest text-[#4A4A45]" htmlFor="shopping-slider">Online Purchases</label>
                <span className="font-serif text-lg text-brand-text font-semibold">
                  {shoppingItems} new online purchases / month
                </span>
              </div>
              <input 
                id="shopping-slider"
                type="range" 
                min="0" 
                max="20" 
                value={shoppingItems} 
                onChange={(e) => setShoppingItems(Number(e.target.value))}
                className="minimal-slider"
              />
              <div className="flex justify-between text-xs text-[#575753] font-mono mt-1">
                <span>0 purchases</span>
                <span>20 purchases</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Share and The Lever */}
        <section className="border-t border-[#E2E2DC] py-10 no-print">
          <h2 className="font-serif text-2xl mb-6 font-normal text-brand-text">Footprint Analysis</h2>
          
          {/* Stacked bar */}
          <div className="w-full h-3 flex overflow-hidden border border-[#E2E2DC] mb-4">
            <div 
              style={{ width: `${dietShare}%` }} 
              className="h-full bg-[#1C1C1A] transition-all duration-300"
              title={`Diet: ${Math.round(dietFootprint)} kg (${Math.round(dietShare)}%)`}
            />
            <div 
              style={{ width: `${transportShare}%` }} 
              className="h-full bg-[#575753] transition-all duration-300"
              title={`Transport: ${Math.round(transportFootprint)} kg (${Math.round(transportShare)}%)`}
            />
            <div 
              style={{ width: `${energyShare}%` }} 
              className="h-full bg-[#9E9E96] transition-all duration-300"
              title={`Energy: ${Math.round(energyFootprint)} kg (${Math.round(energyShare)}%)`}
            />
            <div 
              style={{ width: `${shoppingShare}%` }} 
              className="h-full bg-[#D6D6CF] transition-all duration-300"
              title={`Shopping: ${Math.round(shoppingFootprint)} kg (${Math.round(shoppingShare)}%)`}
            />
          </div>

          {/* Bar Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm font-mono text-[#4A4A45]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#1C1C1A] inline-block"></span>
              <span>Diet: {Math.round(dietShare)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#575753] inline-block"></span>
              <span>Transport: {Math.round(transportShare)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#9E9E96] inline-block"></span>
              <span>Energy: {Math.round(energyShare)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#D6D6CF] inline-block"></span>
              <span>Shopping: {Math.round(shoppingShare)}%</span>
            </div>
          </div>

          {/* The Lever Highlight */}
          <div className="border border-brand-accent p-6 bg-[#5B7B5E]/5 my-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-brand-accent mb-2">
              {isLowFootprint ? 'WELL BELOW AVERAGE' : 'YOUR PRIMARY LEVER'}
            </h3>
            {isLowFootprint ? (
              <p className="font-sans text-xl leading-relaxed text-brand-text">
                Your estimated footprint of <span className="text-brand-accent font-bold">{Math.round(totalFootprint)}</span> kg CO2e/month is well below the global average of roughly 350 kg/month per person. If habits like these were adopted widely, it would meaningfully shift global emissions trends. There's no urgent change needed here — though if you're curious, there's still one small step below that could lower it even further.
              </p>
            ) : (
              <>
                <p className="font-serif text-xl leading-relaxed text-brand-text">
                  Your biggest opportunity is <span className="font-bold border-b border-brand-accent/30">{activeLeverObj.label}</span> — a realistic change here could save ~{Math.round(activeLeverObj.potential)} kg CO2/month.
                </p>
                <p className="text-xs text-[#575753] font-mono mt-3">
                  This category has the highest impact-reduction potential given your current habit configuration.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Section 3: Action Plan */}
        <section className="border-t border-[#E2E2DC] py-10 no-print">
          <h2 className="font-serif text-2xl mb-6 font-normal text-brand-text">
            {isLowFootprint ? 'Going Further (Optional)' : 'Personalized Action Plan'}
          </h2>
          <p className="text-base text-[#4A4A45] mb-6 font-sans">
            {isLowFootprint ? (
              "If you'd like to push even lower, here's one option:"
            ) : (
              <>Build a targeted plan for your <span className="italic font-serif">{activeLeverObj.label}</span> lever by selecting the commitments below:</>
            )}
          </p>

          <div className="space-y-4 mb-8">
            {currentActions.map((action) => {
              const savings = action.calculateSavings({
                diet: dietMeals,
                transport: transportKm,
                energy: energyTier,
                shopping: shoppingItems
              });
              const isChecked = selectedActions.includes(action.id);
              const isDisabled = savings <= 0;

              return (
                <label 
                  key={action.id}
                  className={`flex items-start gap-4 p-4 border transition-colors duration-150 cursor-pointer ${
                    isChecked 
                      ? 'border-brand-accent bg-[#5B7B5E]/5' 
                      : 'border-[#E2E2DC] hover:border-[#4A4A45]'
                  } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => handleToggleAction(action.id)}
                    className="mt-1.5 h-4 w-4 accent-brand-accent rounded border-[#E2E2DC]"
                  />
                  <div className="flex-grow">
                    <span className="font-serif text-[#1C1C1A] text-base block md:text-lg leading-snug font-medium">
                      {action.label}
                    </span>
                    <span className="font-mono text-sm text-[#575753] mt-1 block">
                      {isDisabled 
                        ? 'Habit already at zero' 
                        : `Saves ~${savings.toFixed(1)} kg CO2e / month`
                      }
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Running total info */}
          <div className="border border-[#E2E2DC] p-6 mb-8 text-center bg-[#FAFAF8]">
            <p className="font-sans text-xs uppercase tracking-widest text-[#575753] mb-2 font-semibold">Estimated Plan Savings</p>
            <p className="font-serif text-5xl text-brand-text mb-4">
              ~{planSavings.toFixed(1)} <span className="text-lg font-sans text-[#575753] font-medium">kg CO2/month</span>
            </p>
            
            {planSavings > 0 ? (
              <p className="text-sm text-[#4A4A45] leading-relaxed max-w-[500px] mx-auto font-sans">
                This is equivalent to not driving <span className="text-brand-text font-semibold">{Math.round(equivalentKm)} km</span> in a standard passenger vehicle, or the annual carbon absorbed by <span className="text-brand-text font-semibold">{Math.round(equivalentTrees)} mature trees</span>.
              </p>
            ) : (
              <p className="text-sm italic text-[#575753]">
                Select one or more options above to quantify your potential impact.
              </p>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleSavePlan}
              disabled={planSavings === 0}
              className={`px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold transition-colors duration-150 ${
                planSavings > 0 
                  ? 'bg-brand-accent text-white hover:bg-[#4E6B51]' 
                  : 'bg-[#E2E2DC] text-[#575753] cursor-not-allowed'
              }`}
            >
              Save my plan
            </button>
          </div>
        </section>

        {/* Section 4: Summary Card */}
        {showSummary && (
          <div ref={summaryRef} className="border-t border-[#E2E2DC] py-12">
            <div className="print-only max-w-[580px] mx-auto p-8 border border-brand-text bg-white text-brand-text flex flex-col justify-between min-h-[400px]">
              <div>
                {/* Card Header */}
                <div className="border-b border-brand-text pb-4 mb-6 flex justify-between items-baseline">
                  <div>
                    <h1 className="font-sans text-sm font-bold tracking-[0.2em] uppercase">Carbon Lever</h1>
                    <p className="text-xs text-[#575753] font-mono uppercase mt-1">Impact Mitigation Report</p>
                  </div>
                  <span className="font-mono text-sm text-[#4A4A45]">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Footprint metrics */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-[#575753] mb-1 font-semibold">Starting Footprint</p>
                    <p className="font-serif text-2xl font-bold">{Math.round(totalFootprint)} kg CO2e/mo</p>
                  </div>
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-[#575753] mb-1 font-semibold">Primary Lever Identified</p>
                    <p className="font-serif text-2xl font-bold uppercase tracking-tight text-brand-accent">{activeLeverObj.name}</p>
                  </div>
                </div>

                {/* Selected actions */}
                <div className="mb-6">
                  <p className="font-sans text-xs uppercase tracking-wider text-[#575753] mb-2 border-b border-[#E2E2DC] pb-1 font-semibold">Commitments Made</p>
                  <ul className="space-y-3">
                    {currentActions
                      .filter(action => selectedActions.includes(action.id))
                      .map((action) => {
                        const savings = action.calculateSavings({
                          diet: dietMeals,
                          transport: transportKm,
                          energy: energyTier,
                          shopping: shoppingItems
                        });
                        return (
                          <li key={action.id} className="flex justify-between items-start gap-4">
                            <span className="font-serif text-base leading-tight font-medium">— {action.label}</span>
                            <span className="font-mono text-sm whitespace-nowrap text-[#5B7B5E] font-bold">-{savings.toFixed(1)} kg</span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>

              {/* Card Footer / Totals */}
              <div className="border-t border-brand-text pt-6 mt-6">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-sans text-xs uppercase tracking-widest font-bold">Estimated Monthly Savings</span>
                  <span className="font-serif text-3xl font-bold text-brand-accent">~{planSavings.toFixed(1)} kg CO2e</span>
                </div>
                <div className="bg-[#5B7B5E]/5 p-4 text-xs font-mono leading-relaxed border border-brand-accent/20 text-[#4A4A45]">
                  <span className="text-[#575753] font-bold">Equivalencies: </span>
                  This reduction is equivalent to avoiding driving <span className="font-bold text-brand-text">{Math.round(equivalentKm)} km</span>, or the annual carbon absorbed by <span className="font-bold text-brand-text">{Math.round(equivalentTrees)} mature trees</span>.
                </div>
              </div>
            </div>

            {/* Print action button */}
            <div className="text-center mt-6 no-print">
              <button
                onClick={handlePrint}
                className="px-6 py-3 border border-brand-text text-xs uppercase tracking-[0.15em] font-bold hover:bg-brand-text hover:text-brand-bg transition-colors duration-150"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E2DC] pt-8 mt-12 text-center text-xs font-mono text-[#575753] no-print">
        <p>Carbon Lever — fully client-side calculations.</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#575753]/80">factors: meat meal ≈ 2.5kg CO2e, car driving ≈ 0.17kg/km, energy low/med/high ≈ 60/120/200kg, shopping item ≈ 15kg.</p>
      </footer>

    </div>
  )
}

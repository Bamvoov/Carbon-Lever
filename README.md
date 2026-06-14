# ⚖️ Carbon Lever

An elegant, single-page carbon footprint analysis and commitment tool designed with a clean, editorial, data-forward aesthetic.

Unlike traditional carbon calculators that focus purely on guilt-inducing totals, **Carbon Lever** evaluates your habits in real-time, highlights your single highest-impact opportunity ("Your Primary Lever"), and builds a personalized, quantified action plan to reduce emissions.

---

<img width="1736" height="974" alt="image" src="https://github.com/user-attachments/assets/0def49a6-58b2-4431-a4da-9330b2b8ab96" />
<img width="1738" height="970" alt="image" src="https://github.com/user-attachments/assets/46192ee1-0511-4f14-bec5-557386db37e8" />



## ✨ Features

- **Real-Time Calculation**: A smooth, animated counting interface updating your carbon footprint instantly as you adjust habit inputs.
- **Dynamic "Primary Lever" Identification**: Automatically identifies the category where you have the highest realistic reduction potential.
- **Low-Footprint Acknowledgment State**: If your monthly footprint is well below the global average (< 200 kg CO2e/mo), the app transitions into an encouraging state, suggesting a single small step forward rather than preaching big lifestyle overhauls.
- **"Why This Matters" Context Panel**: Provides immediate scientific framing on atmospheric emissions trends inline without relying on alarmist disaster framing.
- **Personalized commitments**: A dynamic action plan builder containing checkable options whose savings potentials scale intelligently relative to your current habits.
- **Equivalency Indicators**: Translates metric savings into visual real-world comparisons (e.g. vehicle-kilometers avoided or mature trees planted).
- **Print & PDF Export**: A custom print stylesheet generates a beautiful, minimalist certificate-style "Impact Mitigation Report" summary card when you click **Print / Save PDF**.

---

## 🧮 Calculations & Formulas

All metrics are calculated entirely client-side using validated ecological factors:

### 1. Habit Categories (Baseline)
- **Diet**: $\text{meat meals/week} \times 2.5 \text{ kg CO2e} \times 4.3 \text{ weeks/month}$
- **Transportation**: $\text{km driven/week} \times 0.17 \text{ kg CO2e/km} \times 4.3 \text{ weeks/month}$
- **Household Energy**:
  - *Low Tier*: $60$ kg CO2e/month
  - *Medium Tier*: $120$ kg CO2e/month
  - *High Tier*: $200$ kg CO2e/month
- **Online Purchases**: $\text{new items/month} \times 15$ kg CO2e

### 2. Opportunity Potentials (The Lever)
To prioritize where change is most realistic and impactful, each category has a scaled reduction limit:
- **Diet Opportunity**: $50\%$ of Diet Footprint
- **Transport Opportunity**: $30\%$ of Transport Footprint
- **Energy Opportunity**: $15\%$ of Energy Footprint
- **Shopping Opportunity**: $40\%$ of Shopping Footprint

### 3. Plan Equivalencies
- **Driving Equivalent**: $\text{Savings (kg)} \div 0.17 \text{ kg/km}$
- **Mature Trees planted**: $\frac{\text{Savings (kg)} \times 12 \text{ months/year}}{20 \text{ kg/tree/year}} = \text{Savings} \times 0.6$

---

## 🎨 Design System

Carbon Lever adopts an editorial, editorial-column typography style reminiscent of *The New York Times* or *The Economist*:
- **Color Palette**:
  - **Background**: `#FAFAF8` (Warm off-white)
  - **Main Text**: `#1C1C1A` (Rich near-black)
  - **Secondary Text**: `#575753` (Warm charcoal gray - WCAG AAA Compliant contrast)
  - **Accent**: `#5B7B5E` (Muted Sage Green, used selectively for hero number highlights and check bounds)
- **Typography**:
  - **Headings & Accents**: `Fraunces` (Google Font - elegant display serif)
  - **Body Copy**: `Inter` (Google Font - clean, legible sans-serif)
- **Sliders**: Custom range input styles featuring an editorial 2px baseline track and sharp square black thumbs turning green on hover/focus.

---

## 💻 Tech Stack
- **Core**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 + Custom CSS resets
- **Linter**: ESLint (Flat Config)
- **Package Manager**: npm

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:Bamvoov/Carbon-Lever.git
   cd Carbon-Lever
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the local development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Production Build
Compile and optimize for static hosting (Vercel, Netlify, GitHub Pages, etc.):
```bash
npm run build
```
The production assets will be outputted to the `dist/` directory.

### Linter
Verify code style and rules:
```bash
npm run lint
```

### Running Tests
Execute the unit and component test suite using Vitest:
```bash
npm run test
```

# GSS - Grid Station System

A professional web application for electrical power system calculations including MVAR calculation and consumption tracking.

## Features

### MVAR Calculator
- Calculate reactive power (MVAR) from MW and MVA inputs
- Real-time validation and error handling
- Formula: MVAR = √(MVA² - MW²)

### Consumption Tracker
- Track 33kV Incomer and 132kV Transformer consumption
- Automatic calculations with adjustment options
- Audit logging for non-Auto adjustments

### Technical Features
- Progressive Web App (PWA) capabilities
- Theme support (Default, Light, Dark)
- Mobile-responsive design
- Touch-optimized numpad interface
- Real-time calculations

## Calculation Formulas

### MVAR Calculation
```
MVAR = √(MVA² - MW²)
```
Where MVA ≥ MW and both values are non-negative.

### Consumption Calculations

#### 33kV Incomer
```
Diff33 = Today33 - Previous33
Net33 = Diff33 × 1000
```

#### 132kV Transformer
```
If Adjustment = Auto:
  Today132_adj = Today132

If Adjustment = Equal:
  target_difference = 0
  Today132_adj = Previous132 + (Net33 + target_difference) / 4000

If Adjustment = <N>:
  target_difference = N
  Today132_adj = Previous132 + (Net33 + target_difference) / 4000

Diff132 = Today132_adj - Previous132
Net132 = Diff132 × 4000
DisplayedDifference = Net132 - Net33
```

## Audit Logging

When Adjustment ≠ Auto, the system logs:
- Timestamp
- Today132_adj (calculated adjusted value)
- Selected adjustment type
- Original Today132 value
- Net33 and Net132 values

Logs are stored in localStorage for demo purposes. In production, these would be sent to a backend service.

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Development Server
```bash
npm run dev
```

## Architecture

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Vitest** for testing
- **Lucide React** for icons

## File Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and tests
└── App.tsx            # Main application component
```

## Browser Support

- Modern browsers with ES2020 support
- Progressive Web App features
- Offline functionality
- Mobile-optimized interface
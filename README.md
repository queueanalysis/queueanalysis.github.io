# Queueing Theory Decision Support Tool

A comprehensive web-based application for analyzing queueing systems using Kendall notation models. This single-page application provides instant computation of steady-state metrics for various queueing models with real-time validation and visualization.

## Features

- **Multiple Queueing Models**: Support for 7 different Kendall notation models
- **Real-time Validation**: Input validation with immediate feedback
- **Comprehensive Metrics**: Computes all standard queueing metrics (Ls, Lq, Ws, Wq, c̄, p₀, pₙ)
- **Model Comparison**: Side-by-side comparison of two different models with visual charts
- **Export Capabilities**: Copy results to clipboard or export as PDF
- **Formula Reference**: Interactive formula viewer for each metric
- **Responsive Design**: Modern, user-friendly interface that works on all devices
- **No Dependencies**: Pure client-side application, no build process required

## Installation & Setup

No installation or build process is required. Simply:

1. Download or clone the repository
2. Open `index.html` in any modern web browser
3. The application is ready to use

**Requirements**: A modern web browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)

## Supported Models

The application supports the following queueing models:

### 1. M/M/1:GD/∞/∞
Single server, infinite capacity, infinite population. Classic exponential queueing model.

### 2. M/M/1:GD/N/∞
Single server, finite capacity N, infinite population. Includes blocking probability (pN), effective arrival rate (λeff), and lost customers (λlost).

### 3. M/M/c:GD/∞/∞
Multiple servers (c), infinite capacity, infinite population. Handles parallel service with multiple servers.

### 4. M/M/c:GD/N/∞
Multiple servers (c), finite capacity N (where N ≥ c), infinite population. Includes blocking-related metrics for finite systems.

### 5. M/M/∞:GD/∞/∞
Infinite servers, self-service model. No waiting occurs as every customer is immediately served.

### 6. M/M/R:GD/K/K
Finite-source repair shop model. R repair servers serving K total units in the population. Models machine repair scenarios.

### 7. M/G/1:GD/∞/∞ (Pollaczek-Khinchine)
Single server with general service time distribution. Uses Pollaczek-Khinchine formula for L- and W-metrics. Note: pₙ uses geometric approximation as full service-time distribution is not provided.

## Usage Instructions

### Basic Workflow

1. **Select a Model**: Choose a queueing model from the dropdown menu
2. **Enter Parameters**: Required parameter fields will appear automatically
   - Parameters are validated in real-time
   - Red borders indicate validation errors
3. **Compute**: Click the "Compute" button to calculate steady-state metrics
4. **View Results**: Results are displayed in the output section with:
   - Key metrics (p₀, pN, λeff, λlost, Ls, Lq, Ws, Wq, c̄)
   - Probability distribution pₙ for n ≤ 20
   - Warnings for unstable systems (ρ ≥ 1) or edge cases
5. **Export**: Use "Copy results" or "Export as PDF" to save your computation

### Model Comparison

1. Compute a model and click "Set as Model A"
2. Compute another model (or modify parameters) and click "Set as Model B"
3. View side-by-side comparison chart showing Ls, Lq, Ws, Wq, and c̄
4. Export comparison results or download the chart as PNG

### Formula Reference

Click the "i" button next to any metric to view its mathematical formula in LaTeX notation.

### Reset

Click "Reset" to clear all inputs, outputs, and comparison data.

## Quick Test Examples

Use these test inputs to verify the application:

| Model | Parameters |
|-------|------------|
| M/M/1:GD/∞/∞ | λ = 2, μ = 4 |
| M/M/1:GD/N/∞ | λ = 3, μ = 5, N = 10 |
| M/M/c:GD/∞/∞ | λ = 6, μ = 3, c = 3 |
| M/M/c:GD/N/∞ | λ = 8, μ = 3, c = 3, N = 12 |
| M/M/∞:GD/∞/∞ | λ = 5, μ = 2 |
| M/M/R:GD/K/K | λ = 0.5, μ = 1, R = 2, K = 8 |
| M/G/1 (P-K) | λ = 2, E{t} = 0.3, Var{t} = 0.02 |

## File Structure

```
web-dst/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── app.js          # Application logic and queueing calculations
└── README.md       # This file
```

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (ES6+)
- **External Libraries**:
  - Chart.js for comparison visualizations
  - MathJax for LaTeX formula rendering
- **No Backend**: All computations performed client-side
- **Browser Compatibility**: Modern browsers with ES6 support

## Notes

- **Stability Warnings**: The application warns when ρ ≥ 1 (system unstable)
- **Finite Capacity Models**: Models with finite capacity (N) include additional metrics for blocking and lost customers
- **Numerical Precision**: Results are displayed with appropriate precision (4-6 decimal places)
- **Probability Distribution**: pₙ values are computed for n = 0 to n = 20

## Copyright

Copyright © 2025

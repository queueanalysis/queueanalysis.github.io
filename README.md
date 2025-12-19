# Queueing DST (Web)

Single-page, client-side tool for the required Kendall models. Open `index.html` in a browser; no build or backend is needed.

## Supported models & notes
- M/M/1:GD/∞/∞ and M/M/1:GD/N/∞ (finite capacity includes pN, λeff, λlost).
- M/M/c:GD/∞/∞ and M/M/c:GD/N/∞ (finite capacity includes blocking-related metrics).
- M/M/∞:GD/∞/∞ (self-service).
- M/M/R:GD/K/K (finite-source repair shop: R total units, K repair servers; pN is pR).
- M/G/1:GD/∞/∞ (P-K): L- and W-metrics use Pollaczek–Khinchine; pn uses a geometric approximation because full service-time distribution is not provided.

## Quick test inputs
- M/M/1:GD/∞/∞ → λ=2, μ=4
- M/M/1:GD/N/∞ → λ=3, μ=5, N=10
- M/M/c:GD/∞/∞ → λ=6, μ=3, c=3
- M/M/c:GD/N/∞ → λ=8, μ=3, c=3, N=12
- M/M/∞ → λ=5, μ=2
- M/M/R:GD/K/K → λ=0.5, μ=1, R=8, K=2
- M/G/1 (P-K) → λ=2, E{t}=0.3, Var{t}=0.02

## Usage
1) Select a model; required fields appear automatically.
2) Enter parameters (validated for positivity/integers as appropriate).
3) Click Compute. Warnings highlight instability (ρ ≥ 1) or tiny λeff.
4) Reset clears inputs and outputs.


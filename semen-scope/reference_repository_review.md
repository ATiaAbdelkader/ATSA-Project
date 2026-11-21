# Simple Sperm Analyzer Review

Reference reviewed: <https://github.com/elemeng/simple-sperm-analyzer> (MIT licensed).

## Compatible upgrades selected for SemenScope

The reference project separates detection, tracking, CASA analysis, visualization, and reproducibility artifacts. SemenScope will adopt the compatible concepts without executing or embedding its Python/OpenCV implementation in the deployed web application.

| Reference concept | SemenScope adaptation |
| --- | --- |
| Direction-first, weighted association | Browser tracker scores candidate links using distance, directional continuity, and speed consistency rather than nearest distance alone. |
| Short occlusion tolerance | Method control for maximum missed frames before a live track becomes inactive. |
| Association confidence | Per-track confidence calculated from accepted motion-aware links and exposed in live inspection and the final review table. |
| VAP smoothing window | Configurable average-path smoothing window used in VAP, ALH, BCF, and DANCE calculations. |
| Track-quality diagnostics | Quality flags and review controls for confidence, minimum track length, and nonlinear/noisy trajectories. |
| Visualization provenance | Downloadable run manifest containing the source, calibration, method controls, and metrics snapshot. |
| Enriched CASA review | ALH maximum and trajectory fractal-dimension estimates shown alongside the existing CASA-style measures. |

## Guardrail

These methods remain browser-local automated estimates for scientific review. They are not a validated diagnostic, fertility, breeding, or treatment decision. All species-specific parameter choices require laboratory validation against the user’s own protocol and ground-truth material.

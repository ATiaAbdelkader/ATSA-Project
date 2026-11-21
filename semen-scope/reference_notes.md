# Reference Findings

## OpenCASA source reference

The pinned `51d1024` revision of OpenCASA is an ImageJ 1.x Java plugin for sperm analysis. Its source separates motility, accumulation, chemotaxis, morphometry, viability, and multifluorescence workflows. The browser application will use the **motility-analysis concepts** rather than represent itself as an implementation validated against the desktop plugin.

OpenCASA's motility output includes tracked trajectories, total and progressive motility, and the kinematic measures **VCL, VSL, VAP, LIN, WOB, STR, ALH, BCF, DANCE, and MAD**. Its historical README states it was tested with AVI footage, whereas the supplied inputs are MPEG-4 MP4 clips; the web application will surface the actual source format and ensure its own intake supports browser-decodable MP4.

## Supplied sample footage

The five provided files are 780 × 580 pixel MPEG-4 MP4 clips at 25 fps with 25 frames and one-second duration. Representative frames show microscope fields with dense, colored trajectory overlays. They are appropriate for presentation as **reference analysis previews**, but the app will label all metrics as automated estimates requiring laboratory review and method-specific calibration.

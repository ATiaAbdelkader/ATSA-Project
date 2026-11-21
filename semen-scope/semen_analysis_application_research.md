# Semen-Analysis Application Feature Research

## Initial official-platform findings — 22 August 2026

| Platform | Documented capabilities | SemenScope relevance | Source |
|---|---|---|---|
| Hamilton Thorne CASA portfolio | Modular analysis of concentration, motility, morphology, DNA fragmentation, vitality, and acrosome reaction; IVOS II/CEROS II report count, static, motile, progressive, slow-cell, and total concentration. A remote capture station supports satellite video capture for centralized analysis. | Strengthens the case for a composable method architecture, concentration-aware workflow, specimen-status categories, and reviewable remote-capture handoff. Fluorescence and DNA/acrosome modules require dedicated acquisition and cannot be inferred from ordinary bright-field video. | [Hamilton Thorne CASA systems](https://www.hamiltonthorne.com/products/casa-systems/) |
| Minitube AndroVision | Motility, concentration, morphology, fluorescence-based functional assessments, multi-species profiles, database/video retention, export, adjustable analysis profiles, barcoded animal-data handling, dose calculation, and quality-control modules. | Supports adding sample/donor traceability, profile management, concentration/dose-planning inputs, audit export, and configurable quality-review checklists. Functional fluorescent endpoints remain out of scope without validated fluorescent imaging. | [Minitube AndroVision](https://www.minitube.com/catalog/en/androvision-casa-software-with-touchscreen-p1157/) |
| IMV IVOS Pro | Motility, concentration, morphology, and velocity assessment with fixed/standardized optics, auto-focus, auto-illumination, auto-brightness, multi-species configuration, lab-system transfer, and abnormality analysis across total, motile, and progressive populations. | Reinforces method-readiness controls, an explicit optics/capture checklist, species-specific presets, laboratory system handoff, and analysis-population segmentation. Automated morphology findings require a validated morphology model and imaging protocol, so should not be inferred from current footage. | [IMV IVOS Pro](https://www.imv-technologies.com/product/ivos-pro) |
| iSperm mCASA | Portable field/clinic/lab workflow, track visualization, rapid concentration and total/progressive-motility outputs, and organized data/cloud workflows for animal breeding and research. | Supports a responsive field-ready interface, device-camera intake, offline/local-first operation, explicit analysis-time feedback, and structured longitudinal record management. SemenScope already covers much of the video and track workflow; next improvements should focus on structured specimen and protocol records rather than unsupported fertility conclusions. | [iSperm mCASA](https://www.isperm.co/) |
| OpenCASA research platform | Open-source modules for motility, morphometry, membrane integrity/viability, and guided-movement experiments such as chemotaxis, thermotaxis, and rheotaxis. The publication validates individual modules against reference methods in specific settings. | Confirms that an extensible, transparent method architecture is valuable. Morphometry, membrane integrity, and guided-movement work require separate images, staining/fluorescence or controlled experimental stimuli; they are future validated modules, not derivable from ordinary bright-field tracking alone. | [OpenCASA publication](https://pmc.ncbi.nlm.nih.gov/articles/PMC6355034/) |

## Preliminary scientific guardrails

1. SemenScope must preserve its **laboratory-review-required** designation. It must not turn automated estimates into fertility, breeding, or treatment decisions.
2. Features that require hardware-specific validation—fluorescence endpoints, morphology classifiers, DNA integrity, acrosome integrity, or viability—must be introduced only with their required acquisition modality, calibration, and validation workflow.
3. The most appropriate near-term upgrades are therefore **traceability, protocol management, review workflow, and explicitly entered laboratory measurements**, rather than unsupported biological inference from bright-field video.

## Cross-platform selection principle

Commercial and open platforms converge on a common pattern: **method standardization, specimen traceability, repeatable acquisition, audit-ready export, and careful interpretation of modular measurements**. SemenScope will prioritize improvements that can be validated against its existing bright-field/video workflow. It will not claim morphology, concentration, dose planning, viability, acrosome integrity, DNA integrity, or fertility assessment unless the required assay, data source, and laboratory validation are explicitly present.

## Selected upgrade package

| Candidate feature | Evidence across reviewed platforms | Fit with SemenScope today | Decision |
|---|---|---|---|
| Structured specimen and donor traceability | Minitube documents barcode-linked animal data; iSperm emphasizes organized longitudinal records; IMV documents lab-system transfer. | Can be stored in the existing immutable analysis metadata without storing video bytes or adding unverified biological inference. | **Implement:** optional specimen ID, donor/animal ID, collection reference, chamber reference, dilution, and analyst note. |
| Explicit laboratory readiness gate | IMV emphasizes standardized optics; Minitube emphasizes species profiles and quality-control modules. | SemenScope already records calibration and capture quality; a pre-run checklist can make the evidence visible without blocking appropriate workflows. | **Implement:** an evidence-derived acquisition-readiness checklist shown before analysis, recorded with the saved snapshot. |
| Non-inferential dose-planning worksheet | Minitube and IMV describe dose-calculation workflows dependent on measured concentration and validated chamber data. | SemenScope does not measure concentration from the current bright-field tracking workflow, but it can safely calculate a planning value from **operator-entered measured concentration** and an entered target dose. | **Implement:** a clearly labeled planning calculator that never estimates concentration, never treats output as a release decision, and stores entered values with the record. |
| Morphology or morphometry module | Hamilton Thorne, Minitube, IMV, and OpenCASA all support morphology-oriented modules under dedicated imaging/validation conditions. | Current SemenScope footage lacks a validated morphology model and standard acquisition/stain protocol. | **Defer:** add only after a calibrated imaging/ground-truth validation project. |
| Fluorescence viability, acrosome, mitochondrial, and DNA endpoints | Hamilton Thorne and Minitube offer dedicated assay modules; OpenCASA treats membrane integrity as a distinct module. | These endpoints need fluorescent/assay images and validated interpretation. | **Defer:** do not infer from bright-field video. |
| Automated fertility or breeding recommendation | Several commercial pages use productivity-oriented language, but appropriate scientific use requires protocol-specific validation. | Conflicts with SemenScope’s current review-required safety model. | **Exclude:** retain estimates for laboratory review only. |

## Browser-local upgrade selection — multi-field repeatability review

The next compatible capability is a **local multi-field repeatability review**. It will aggregate only user-selected field outputs processed in the browser under the same active species, calibration, and threshold draft. It will report field count, mean, sample standard deviation, and range for motility, progressive motility, VCL, and valid tracks, while retaining individual field results and flags.

This feature is deliberately a **technical repeatability review**, not a pooled concentration estimate, a morphology assay, or a fertility/breeding conclusion. The user must confirm that selected clips represent independent fields from the same prepared specimen; bundled reference footage remains labeled as demonstration material and should not be used for clinical aggregation.

## Additional GitHub review — auditability selection

| Repository | Relevant capability | Fit with SemenScope | Decision |
|---|---|---|---|
| [SpermQ](https://github.com/hansenjn/SpermQ) | Flagellar-beat, ciliary-beat, and steering analysis from time-lapse imagery. | Requires flagellum-resolved imagery and a species-/acquisition-specific validation workflow that SemenScope does not yet provide. | **Defer.** Do not infer beat or steering measurements from current head-tracking outputs. |
| [CASA2](https://github.com/jgbaldwinbrown/CASA2) | Better debris discrimination, net-distance/net-velocity thresholds, and track identifiers in raw coordinate output. | Existing SemenScope tracking already records ID-tagged paths and has local motion/confidence safeguards. Exporting the existing point-level track data would add auditable review value without altering measurement pixels. | **Select:** add a browser-local, analysis-specific trajectory-coordinate CSV export. |
| [Sperm detection and tracking](https://github.com/mr7495/Sperm_detection_and_tracking) | Deep-learning detection with a modified multi-target tracker. | Model weights, dataset fit, and validation are not available in the browser-local product path; the repository also carries no stated license metadata. | **Exclude:** do not ship or adapt model-dependent detection code. |

The selected coordinate export will contain track IDs, frame/time positions in pixels and calibration-derived microns, plus method context and a review-only notice. It will be a transparent record of the app’s existing browser-local outputs—not a new biological assay or a diagnostic conclusion.

## Second GitHub-informed selection — non-predictive kinematic landscape

The [sperm_move](https://github.com/Polfe94/sperm_move) repository demonstrates multivariate exploration of sperm-motion data but also includes external embeddings and fertility-prediction modelling. Those prediction components are **not compatible** with SemenScope’s current scientific-use boundary, and its repository does not declare a license.

The compatible concept is therefore limited to a **browser-local descriptive kinematic landscape**: a selectable VCL-versus-LIN distribution of tracks from the current analysis. It will retain existing track classifications, expose no inferred clusters or biological outcomes, and let an analyst select a track for the existing detailed review panel. A visible note will state that the view is a technical distribution of the current run only—not a fertility, breeding, or diagnostic model.

## Third GitHub-informed selection — current-run technical review queue

The [BioMedia 2020](https://github.com/simula/biomedia-2020) challenge includes a sperm-tracking support-tool task focused on helping experts observe and choose trajectories. Its morphology and prediction tasks require ground-truth labels and data modalities that SemenScope does not claim to provide, so those components are excluded.

The compatible adaptation is a **current-run technical review queue**. It will rank trajectories for manual inspection using transparent, existing technical signals: short linkage duration, link confidence below the active threshold, and a static classification despite nonzero movement. Selecting an item will open the existing trajectory inspector. The queue will state that it identifies technical review candidates only; it will not reject sperm, redefine automated estimates, or make fertility, breeding, or diagnostic claims.

## Continuous-improvement selection — field-stability monitor

The [BioMedia 2020](https://github.com/simula/biomedia-2020) tracking description notes that microscope movement can change the observed sample view, which makes cross-view trajectory interpretation inappropriate. SemenScope will adapt only the corresponding technical safeguard: a **browser-local field-stability monitor** that estimates global frame-to-frame background displacement from reduced luminance grids. The monitor will classify capture stability as acceptable, review, or poor and add a review flag when excessive global motion may compromise one-field tracking.

It will not stabilize, transform, or restore measurement frames, and it will not adjust individual trajectories. The signal is a capture-quality indicator for laboratory review—not a biological motion estimate or clinical outcome.

## Trajectory audit selection — point-level playback review

The previously reviewed [CASA2](https://github.com/jgbaldwinbrown/CASA2) project demonstrates the value of serial track identifiers in raw coordinate output for post-hoc inspection. SemenScope already exports those coordinates. The compatible next step is a **browser-local point-level audit control** for the currently selected trajectory: reviewers can inspect each linked point’s frame/time and pixel/calibrated position, then seek the active video to that frame.

This workflow is read-only. It does not edit coordinates, relink trajectories, alter measurement pixels, or overrule calculated classifications. It provides transparent evidence for laboratory review of the current run only.

## Confidence-distribution selection — transparent association evidence

SemenScope’s motion-aware association model, informed by the previously reviewed Simple Sperm Analyzer approach, already records a per-track linkage confidence. The compatible next improvement is a **descriptive association-confidence distribution** for the current run. It will show the number of tracks below the active confidence threshold, at or above the threshold, and the current mean confidence.

This display will not change which tracks are accepted, recalculate classifications, or infer sample quality, fertility, or clinical status. It simply exposes the technical association evidence already used by the tracker so a reviewer can decide whether additional trajectory review is warranted.

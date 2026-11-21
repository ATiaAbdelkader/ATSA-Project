# Open-source semen-analysis and microscopy feature survey

**Prepared for SemenScope · 23 August 2026**

## Scope and conclusion

This is a high-relevance survey of open-source repositories, research code, and public datasets discovered for CASA, semen microscopy, sperm tracking, morphology, preprocessing, and review. It is not literally every repository on GitHub: repositories without meaningful documentation, a relevant technical focus, or a verifiable public source were excluded. Feature claims below were checked against primary repository pages, project documentation, publications, and GitHub metadata. Repository popularity is treated only as a discovery signal, never as evidence of scientific validity.

The strongest safe direction for SemenScope is **not** to copy a desktop Python/ImageJ pipeline into the web application. Instead, retain the browser-local TypeScript/Canvas architecture and import the best workflow ideas: explicit staged tuning, track-level review and correction, provenance-rich preprocessing, benchmark-quality trajectory evaluation, processing-performance evidence, and opt-in annotation adapters. Keep morphology, concentration, viability, fertility, DNA, dose-release, and biological-outcome claims outside the automated SemenScope result boundary.

## Comparison matrix

| Project or resource | Best documented features and tools | License / operational constraint | Best SemenScope lesson | Safe integration decision |
|---|---|---|---|---|
| [OpenCASA](https://github.com/calquezar/OpenCASA) | Modular ImageJ CASA system covering motility, morphometry, membrane integrity, concentration-related tooling, stimulus-guided movement, simulation, scatter, settings, and research-oriented analysis. The publication describes validation against simulated populations and 36 ram ejaculates with correlation and Bland–Altman comparisons. | GPL-3.0; Java/ImageJ; README emphasizes Windows-era testing, AVI/JPEG/PNG inputs, and high heap requirements. | Modular analysis modes, method panels, calibration, and validation evidence. | **Conceptual reference only** unless GPL obligations are deliberately handled. Do not copy code into the browser bundle. |
| [Simple Sperm Analyzer](https://github.com/elemeng/simple-sperm-analyzer) | OpenCV pipeline with motion-aware detection, track linking, VCL/VSL/VAP, batch processing, JSON configuration, CSV/text/JSON reports, detection and tracking overlays, overview plots, and exported tracks. Its README gives a useful tuning order: detection, tracking geometry, matching, immotile mining, then CASA parameters. | MIT; Python/OpenCV; designed for a locally managed Python environment and batch files. | Staged parameter tuning and clear separation of detection, tracking, metrics, and artifacts. | **Highest practical workflow reference.** Re-express the tuning order, evidence panels, and export shape in TypeScript rather than importing Python/OpenCV. |
| [CASABee](https://github.com/jodivaso/CASABee) | Honey-bee drone sperm workflow with motile/static detection and tracking, CSV export, labeled-video generation, and an edit mode for adding, deleting, moving, and correcting tracks; includes undo and recomputation after edits. | GPL-3.0; Python GUI; tested with AVI and desktop operating systems; concentration is a biological output. | Human-in-the-loop review and an explicit distinction between motile and static objects. | **Adapt the review interaction only.** Any future correction tool must be technical, local, provenance-tracked, and non-diagnostic. |
| [SpermQ](https://github.com/hansenjn/SpermQ) | ImageJ/Java flagellar-beat and steering analysis; preprocessing, automated analysis, batch execution, and a separate evaluator for overview tables and plots. Documentation stresses high-speed acquisition, contrast, and limiting overlap. | GPL-3.0; Java/ImageJ; TIFF stacks and high-speed microscopy assumptions. | Separate preprocessing, analysis, batch review, and evaluator layers; acquisition-quality guidance. | **Conceptual reference only.** A future flagellar-beat mode would require independent scientific validation and must not be mixed with current head-trajectory metrics. |
| [SpermQ Preparator](https://github.com/hansenjn/SpermQ_Preparator) | Dedicated ImageJ preprocessing plugin for the SpermQ pipeline. | GPL-3.0; Java/ImageJ. | Preprocessing should be explicit and traceable rather than hidden inside analysis. | **Use as workflow inspiration.** Add browser-local preprocessing evidence and reversible settings, not Java code. |
| [Sperm detection and tracking](https://github.com/mr7495/Sperm_detection_and_tracking) | RetinaNet detection notebooks, modified CSR-DCF multi-target tracking, sample annotations, detections/tracks JSON, and a motility-parameter extractor. README reports precision/recall/F1/accuracy comparisons. | No SPDX license metadata surfaced; notebooks/model weights and Python dependencies; code expects detected-object CSV input. | Separate detector and tracker contracts, annotated data, and track-quality evaluation. | **Do not copy or ship weights/code without license clearance.** Reuse the interface idea and add an optional benchmark import. |
| [CAS-ReproLab/Sperm_Object_Tracking](https://github.com/CAS-ReproLab/Sperm_Object_Tracking) | Unified Framework for evaluating predicted sperm trajectories in crowded microscopy videos; associated publication provides sperm-specific tracking metrics and labeled examples. | GPL-3.0; Python; research benchmark rather than a production UI. | Evaluate tracking validity independently of kinematic metrics; handle crossovers, ambiguity, and signal loss explicitly. | **Strong next research upgrade.** Add a local track-integrity scorecard or benchmark adapter; keep it distinct from biological interpretation. |
| [Sperm-Density](https://github.com/Avinash439/Sperm-Density) | Transparent frame pipeline: grayscale conversion, Canny edges, morphology/dilation, contours, area thresholding, and annotated output video. | No SPDX license metadata surfaced; Python/OpenCV; hard-coded local paths in the documented script. | Show preprocessing stages and make threshold effects inspectable. | **Use only for explainable preprocessing UI ideas.** Do not import density/count claims into the current technical-only product boundary. |
| [MHSMA](https://github.com/soroushj/mhsma-dataset) | Grayscale single-sperm crops from 235 patients; labels for acrosome, head, vacuole, and tail normal/abnormal status; documented 128×128 and 64×64 splits with class balance and metrics. | README states CC BY-NC-SA 4.0; GitHub API reports NOASSERTION, so both must be reconciled before reuse. | Dataset-card metadata, split provenance, class-balance reporting, and uncertainty around labels. | **Benchmark/annotation reference only.** No model or abnormality label should enter production without permission, governance, and a separate non-diagnostic mode. |
| [Mask-RCNN morphology project](https://github.com/Kimchi21/Sperm-Morphological-Quality-ImageSegmentation) | LabelMe annotations, custom Mask R-CNN/ResNet-101 segmentation, morphology classes, model-training curves, mAP reporting, and inference overlays. | No SPDX license metadata surfaced; assembled public datasets and augmentation complicate provenance; “good/bad” is a biological quality judgment. | Segmentation overlays, annotation provenance, and honest performance reporting. | **Do not import model or labels.** A future annotation-only overlay could be considered after licensing review. |
| [VISEM-Tracking dataset](https://pmc.ncbi.nlm.nih.gov/articles/PMC10167330/) | 20 human-sperm videos, 30 seconds each, 29,196 frames, 656,334 annotated objects, bounding boxes, tracking details, and expert-associated characteristics; acquired with phase contrast at 400× on a heated stage. | Dataset requires source-specific access and responsible handling of human data; includes participant/biological attributes in the broader VISEM family. | Benchmark schema for detection/tracking, consent-aware dataset cards, and acquisition metadata. | **Optional offline benchmark adapter only.** Keep participant data out of the app and never train or infer fertility-related outcomes in the product. |
| [MediaEval VISEM task](https://datasets.simula.no/visem-tracking/) | Real-time tracking, mAP/MAE/MSE/FPS/MAPE evaluation, fastest-cell highlighting, viewpoint changes, explainability, and 20 videos at 640×480/50 FPS with bounding boxes. | Dataset/task participation and usage agreement may apply; prediction subtasks are biological or fertility-adjacent. | Performance evidence, viewpoint-change warnings, and explainable track review. | **Strong benchmark design reference.** Add local FPS, frame coverage, and viewpoint-change evidence without predictive claims. |

## Feature inventory by workflow stage

| Workflow stage | Best open-source ideas | SemenScope-compatible implementation boundary |
|---|---|---|
| Intake and acquisition | OpenCASA’s method-centered modules; SpermQ’s acquisition guidance; VISEM’s detailed microscope metadata. | Browser-local upload/camera capture, codec and metadata preflight, calibration evidence, provenance, and capture-quality checks. |
| Preprocessing | SpermQ Preparator’s explicit preparation layer; Sperm-Density’s inspectable grayscale/edge/morphology stages. | Reversible local preprocessing presets with recorded settings and preview overlays; no hidden transformation of measurement frames. |
| Detection | Simple Sperm Analyzer’s priority ordering; RetinaNet-based research repository’s detector/tracker split; VISEM annotations. | Expose detection threshold, candidate counts, and confidence distribution as technical evidence; preserve the current TypeScript detector. |
| Tracking | Motion-aware matching, CSR-DCF multi-target tracking, and the crowded-video evaluation framework. | Add track continuity, crossover/ambiguity, spatial coverage, duration, boundary, temporal-placement, and directional-balance evidence; keep measurements unchanged. |
| Review | CASABee edit mode with add/delete/move/undo; SpermQ evaluator reports; explainability task framing. | A future technical correction layer could be local, reversible, per-track, and exported with an audit trail. It must never silently rewrite the original run. |
| Metrics and exports | Simple Sperm Analyzer CSV/JSON outputs; OpenCASA validation comparisons; VISEM task metrics. | Preserve the immutable run context, output fingerprint, method manifest, trajectory CSV, summary, and review-only disclaimers. |
| Benchmarking | CAS-ReproLab track metrics; VISEM-Tracking annotations; MediaEval FPS and error metrics. | Add an opt-in local benchmark/import mode with no participant data, no server video storage, and no biological-outcome interpretation. |

## Ranked upgrade opportunities

### 1. Local trajectory-integrity scorecard
This is the highest-value research-compatible upgrade. Compare predicted trajectories against an imported local ground-truth CSV or manually reviewed reference, reporting identity continuity, gap spans, crossover ambiguity, frame coverage, and point-level error. Keep the score separate from VCL/VSL/VAP and label it as **technical tracking evaluation**, not accuracy of semen quality.

### 2. Reversible preprocessing and threshold evidence
Expose a compact “what the detector saw” panel with grayscale/contrast/edge or threshold previews, selected settings, and before/after frame counts. Preserve the original frame and record all changes in the method manifest. This borrows the transparency of SpermQ Preparator and Sperm-Density without importing their code.

### 3. Technical track correction workspace
CASABee’s edit mode is valuable, but SemenScope should implement a safer version: corrections are a separate review layer, every change is timestamped and attributed to a local review session, the original automated tracks remain immutable, and exports distinguish automated from reviewed coordinates. Do not automatically recompute or relabel biological categories without explicit protocol approval.

### 4. Acquisition-performance and viewpoint evidence
Use VISEM/MediaEval ideas to show effective FPS, processed versus available frames, timing jitter, camera/microscope metadata, and a warning when field motion or viewpoint changes make long-track interpretation weaker. This is compatible with the existing technical evidence system and does not infer biology.

### 5. Dataset-card and benchmark import
Add an offline, local-only import format for anonymized videos, ground-truth coordinates, acquisition metadata, license, consent/usage restrictions, and dataset version. Never upload the video bytes or participant metadata to the database. Require explicit acknowledgement of license and data-use constraints before benchmark execution.

### 6. Optional flagellar-beat analysis mode
SpermQ demonstrates a valuable but distinct scientific mode. It should be considered only as a separately labeled research experiment with high-speed acquisition requirements, different input structures, its own calibration/quality rules, and no automatic mixing with CASA head-trajectory outputs.

## What should not be imported

The following should remain outside SemenScope’s current automated product boundary: morphology “good/bad” classification, acrosome/head/vacuole/tail abnormality prediction, concentration or density estimation, viability or membrane-integrity inference, DNA or fertility prediction, participant-linked multimodal modeling, dose release decisions, and any claim that a trajectory metric determines breeding, treatment, or biological outcome. The open projects are useful references, but their labels, datasets, and licenses do not transfer automatically to a browser application.

## Recommended implementation order

1. Build a local trajectory-integrity benchmark adapter using CSV coordinates and an explicit dataset card.
2. Add reversible preprocessing evidence and threshold previews to the current browser-local analysis run.
3. Add a separate technical correction layer with immutable automated coordinates and audit events.
4. Add acquisition-performance and viewpoint-change evidence to the existing quality review.
5. Revisit flagellar-beat mode only after separate scientific requirements, validation data, and license review are approved.

## References

[1]: https://github.com/calquezar/OpenCASA "calquezar/OpenCASA repository"
[2]: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1006691 "OpenCASA: A new open-source and scalable tool for sperm quality analysis"
[3]: https://github.com/elemeng/simple-sperm-analyzer "elemeng/simple-sperm-analyzer repository"
[4]: https://github.com/jodivaso/CASABee "jodivaso/CASABee repository"
[5]: https://github.com/hansenjn/SpermQ "hansenjn/SpermQ repository"
[6]: https://github.com/hansenjn/SpermQ_Preparator "hansenjn/SpermQ_Preparator repository"
[7]: https://github.com/mr7495/Sperm_detection_and_tracking "Sperm detection and tracking repository"
[8]: https://github.com/CAS-ReproLab/Sperm_Object_Tracking "CAS-ReproLab/Sperm_Object_Tracking repository"
[9]: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013955 "A framework for evaluating predicted sperm trajectories in crowded microscopy videos"
[10]: https://github.com/Avinash439/Sperm-Density "Avinash439/Sperm-Density repository"
[11]: https://github.com/soroushj/mhsma-dataset "MHSMA repository"
[12]: https://github.com/Kimchi21/Sperm-Morphological-Quality-ImageSegmentation "Mask-RCNN sperm morphology repository"
[13]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10167330/ "VISEM-Tracking, a human spermatozoa tracking dataset"
[14]: https://datasets.simula.no/visem-tracking/ "Medico Multimedia - VISEM Tracking dataset/task"
[15]: https://github.com/Avinash439/Sperm-Density "Sperm-Density repository"

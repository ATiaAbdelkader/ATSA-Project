# Open-source semen-analysis research notes

## Candidate inputs for parallel inspection

1. calquezar/OpenCASA — https://github.com/calquezar/OpenCASA
2. elemeng/simple-sperm-analyzer — https://github.com/elemeng/simple-sperm-analyzer
3. jodivaso/CASABee — https://github.com/jodivaso/CASABee
4. hansenjn/SpermQ — https://github.com/hansenjn/SpermQ
5. mr7495/Sperm_detection_and_tracking — https://github.com/mr7495/Sperm_detection_and_tracking
6. Avinash439/Sperm-Density — https://github.com/Avinash439/Sperm-Density

## Initial discovery

Search results identify OpenCASA as an open-source sperm-quality analysis system; CASABee as a tool focused on honey-bee drone sperm motility and concentration; SpermQ as an ImageJ plugin for flagellar beat and steering analysis; Sperm_detection_and_tracking as a phase-contrast microscopy detection/tracking implementation; and Sperm-Density as a video-based density-estimation project. These are candidate inputs only; feature claims must be verified from repository files, documentation, publications, and license metadata before use.

## Verified repository findings

### OpenCASA
The repository is GPL-3.0 and is an ImageJ/Java plugin. Its README documents sperm-quality analysis, with v2.0 source pinned to a specific commit. The documented workflow is Windows/ImageJ-oriented, tested primarily with AVI video and JPEG/PNG images, and recommends substantial heap memory. The repository credits modules for concentration, motility, viability, morphometry, accumulation, chemotaxis, scatter, simulation, and settings. Candidate SemenScope lessons are modular analysis modes, explicit calibration and parameter panels, and reproducible method context; direct code reuse is constrained by GPL-3.0 and desktop/ImageJ assumptions.

### Simple Sperm Analyzer
The repository is MIT-licensed and Python/OpenCV-based. It documents motion-aware detection, tracking, VCL/VSL/VAP calculations, batch processing, JSON parameter files, CSV/text/JSON outputs, detection overlays, tracking overlays, overview plots, and track exports. Its tuning guidance prioritizes detection threshold and geometry, then tracking distance/angle/age, matching weights, immotile mining, and finally CASA parameters such as pixel size, FPS, and motility cut-offs. Candidate SemenScope lessons are a staged tuning order, transparent configuration export, and separate detection/tracking/output artifacts; its Python/OpenCV pipeline is not directly deployable in the browser-local TypeScript architecture.

### CASABee
The repository is GPL-3.0 and targets honey-bee drone sperm. It documents automatic detection/tracking of motile and static sperm, concentration computation, manual edit mode, tracked-video generation, and CSV export. Its GUI supports adding, deleting, moving, and correcting motile/static labels, undo, and automatic result recomputation. Candidate SemenScope lessons are reviewer correction tools and explicit separation of static and motile labels; concentration and biological interpretations remain outside the current non-diagnostic browser safeguards.

### SpermQ
The repository is GPL-3.0 and is an ImageJ plugin plus Java evaluator. It analyzes 2D time-lapse stacks for flagellar beat and steering, recommends high-speed acquisition and controlled contrast, and documents a three-step workflow: preprocessing, automated batch analysis, and evaluator-generated overview tables/PDF plots. Candidate SemenScope lessons are preprocessing provenance, batch-oriented review, flagellar-specific analysis as a separate mode, and evaluator summaries; TIFF-stack/ImageJ/Java requirements mean it is a conceptual reference rather than a browser code dependency.

## Additional verified findings

### Sperm detection and tracking in phase-contrast microscopy
The repository has no license metadata surfaced on its GitHub page and contains a modified CSR-DCF multi-target tracker, RetinaNet notebooks for detection, sample annotations, detections/tracks JSON, and a motility-parameter extractor. Its README reports evaluation tables for precision, recall, F1, and accuracy, and emphasizes that the tracker expects detected-object CSV input. Candidate lessons are separated detection/tracking interfaces, ground-truth annotations, and explicit tracker evaluation; model weights and deep-learning inference requirements are not suitable for direct browser deployment without a separate client-compatible model strategy.

### CAS-ReproLab/Sperm_Object_Tracking
The repository is GPL-3.0 and contains the Unified Framework code associated with a framework for evaluating predicted sperm trajectories in crowded microscopy videos. Candidate lesson: trajectory-quality benchmarking and a reproducible evaluation contract are valuable additions to SemenScope’s technical review, but GPL licensing and the research-framework scope require careful separation from product code.

### Sperm-Density
The repository has no license metadata surfaced on its GitHub page and uses Python/OpenCV. Its documented pipeline converts frames to grayscale, applies Canny edges, morphology/dilation, contours, an area threshold, and frame-level counts. Candidate lessons are transparent preprocessing and evidence display; density/count estimation is deliberately not imported as a biological or diagnostic conclusion into SemenScope.

### SpermQ_Preparator
The repository is GPL-3.0 and is a small ImageJ preprocessing plugin intended for SpermQ. Its value is workflow separation: preprocessing should be explicit and traceable before downstream motion analysis. Direct reuse is constrained by the ImageJ/Java environment and GPL license.

## Authoritative publications and datasets

### OpenCASA publication
The 2019 PLOS Computational Biology paper describes OpenCASA as a minimally centralized, GitHub-hosted open-source CASA project with motility, morphometry, membrane-integrity, and stimulus-guided movement modules. It reports validation against simulated populations and 36 ejaculates from 12 fertile rams, comparing results with other systems using correlation and Bland–Altman analyses. Safe SemenScope lessons are modularity, validation evidence, and community-maintainable method contracts; claims about fertility prediction or biological quality are outside SemenScope’s technical-only UI boundary.

### Sperm trajectory evaluation framework
The 2026 PLOS Computational Biology paper associated with CAS-ReproLab addresses crowded phase-contrast videos and evaluates tracking independently from derived kinematic outputs. It adapts cell-tracking metrics to sperm-specific ambiguity, crossovers, signal loss, and 2D projection challenges, provides five fully labeled videos and 340 labeled sperm trajectories, and reports that configuration changes can improve evaluation metrics by up to 30%. Safe SemenScope lessons are a separate trajectory-quality scorecard, track-level ground-truth comparison, and clear separation between tracking validity and downstream kinematic summaries.

### VISEM-Tracking
The 2023 Scientific Data paper documents 20 human-sperm videos of 30 seconds and 29,196 frames, with 656,334 annotated objects, bounding boxes, tracking details, and expert-associated sperm characteristics. The source data were acquired at 400× on a heated stage with phase-contrast microscopy and a camera, and were anonymized with ethics approval and consent. The dataset paper lists related morphology datasets and the earlier VISEM dataset, making it a useful benchmark source but not a direct application dependency. SemenScope should not import participant attributes or predictive fertility modeling into the local lab workspace.

### MediaEval/VISEM task documentation
The task description emphasizes real-time tracking FPS, sample-wise motility tasks, fastest-sperm highlighting, viewpoint changes, and explainability. It documents 20 videos at 640×480 and 50 FPS, with bounding boxes and expert-verified ground truth, and evaluation by mAP, MAE/MSE, FPS, and MAPE. Safe SemenScope lessons are processing-performance evidence, viewpoint-change warnings, explainability-oriented track review, and benchmark adapters that remain opt-in and local.

## Additional open datasets and morphology projects

Search discovery identified MHSMA (a GitHub-hosted modified human sperm morphology dataset), Sperm-Morphological-Quality-ImageSegmentation (a small four-class morphology image project), SCIAN-related morphology resources, SVIA video/image analysis data, and newer segmentation/tracking datasets such as EVISAN and Hi-LabSpermTracking. These resources are candidates for benchmark and annotation design rather than direct production dependencies. Their labels may involve morphology, participant data, or inferred quality categories, so SemenScope should keep any future import explicitly opt-in, anonymized, and review-only, with no automated diagnostic or fertility conclusions.

## Morphology and segmentation verification

### MHSMA
MHSMA is CC BY-NC-SA 4.0 and contains grayscale single-sperm crops from 235 patients, with expert labels for acrosome, head, vacuole, and tail normal/abnormal status. It provides 1,000 training, 240 validation, and 300 test images in 128×128 and 64×64 formats. The repository exposes class balance and evaluation metrics such as precision, recall, ROC AUC, and MCC. Safe lessons are dataset metadata, class-balance reporting, and explicit split provenance; its non-commercial license and abnormality labels make direct product-model reuse inappropriate without separate permission and scientific governance.

### Mask-RCNN morphology project
The repository describes LabelMe annotations, custom Mask R-CNN/ResNet-101 segmentation, and a small two-class good/bad morphology dataset assembled from public sources with augmentation. It reports validation mAP variability and inference examples, but the repository has no license metadata surfaced on its GitHub page and the classification labels are biological quality judgments. Safe lessons are annotation provenance, segmentation overlays, and model-evaluation disclosure; the trained model and “good/bad” output should not be imported into SemenScope’s non-diagnostic browser-local workflow.

### Overall dataset boundary
Open datasets often include expert biological labels, participant metadata, or fertility-adjacent outcomes. They can support an offline benchmark/annotation import with consent and license review, but they should not be silently bundled into a production analysis model, uploaded to the server, or presented as diagnostic, fertility, viability, DNA, or breeding conclusions.

## GitHub metadata cross-check (retrieved 2026-08-23)

GitHub API metadata confirms: OpenCASA is GPL-3.0/Java; simple-sperm-analyzer is MIT/Python; CASABee is GPL-3.0/Python; SpermQ and SpermQ_Preparator are GPL-3.0/Java; Sperm_Object_Tracking is GPL-3.0/Python; MHSMA reports `NOASSERTION` in the API despite its README stating CC BY-NC-SA 4.0; Sperm_detection_and_tracking, Sperm-Density, and the Mask-RCNN morphology repository expose no SPDX license metadata. The absence of repository license metadata is a legal reuse warning, not permission. Repository stars/forks and update dates are discovery signals only and are not quality or validation evidence.

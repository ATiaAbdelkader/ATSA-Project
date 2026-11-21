# Computer Vision Projects Review

Reference reviewed: <https://github.com/Aryan-Chharia/Computer-Vision-Projects>.

## Relevant concepts and SemenScope adaptation

| Reference area | SemenScope adaptation |
| --- | --- |
| Camera calibration | Preserve acquisition dimensions, frame rate, and micrometres-per-pixel as a visible method snapshot; prompt review of calibration before interpreting distances and velocities. |
| Image restoration and denoising | Add an **image-quality monitor** that measures frame brightness, contrast, and edge-detail/focus during analysis. It does not alter the scientific input pixels. |
| Object detection and segmentation | Retain SemenScope’s candidate and motion-aware tracking workflow, augmented with an explicit quality signal so detection confidence is interpreted with acquisition quality. |
| Before/after review | Surface live quality status and include quality data in the downloadable analysis summary and reproducibility manifest. |

## Excluded approaches

The reference repository includes super-resolution, colorization, generic object detectors, and generic segmentation examples. SemenScope will not apply generative restoration, colorization, or unvalidated generic AI models to microscopy measurement inputs because such transforms may change the image evidence used for trajectory and kinematic estimates.

## Guardrail

Frame-quality outputs are technical capture indicators, not a diagnostic or a substitute for laboratory validation, optics checks, or species-specific protocol review.

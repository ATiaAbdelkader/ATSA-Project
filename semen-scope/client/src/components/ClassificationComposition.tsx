import type { ClassificationComposition as Composition } from "@shared/classificationComposition";

export function ClassificationComposition({ composition }: { composition: Composition }) {
  return <section className="classification-composition" aria-label="Motion classification composition"><div><p className="eyebrow">CLASSIFICATION COMPOSITION</p><h3>Current-run track classes</h3><small>Transparent counts from existing threshold-based track classifications only. This panel does not infer fertility, viability, or other biological outcomes.</small></div><div className="classification-composition-grid"><span><strong>{composition.total}</strong> accepted tracks</span><span><strong>{composition.progressive}</strong> progressive</span><span><strong>{composition.motileNonProgressive}</strong> motile, non-progressive</span><span><strong>{composition.nonMotile}</strong> non-motile</span></div></section>;
}

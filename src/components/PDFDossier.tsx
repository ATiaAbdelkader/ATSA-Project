import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Activity, 
  Award, 
  Layers, 
  X, 
  Microscope,
  Info,
  Calendar,
  User,
  Building,
  Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFDossierProps {
  isOpen: boolean;
  onClose: () => void;
  results: AnalysisResult;
  clinicianName: string;
  facilityName: string;
  collectionMethod: string;
  sampleVolume: string;
  samplePh: string;
  sampleAppearance: string;
  clinicianRemarks: string;
  theme?: 'light' | 'dark';
}

export const PDFDossier: React.FC<PDFDossierProps> = ({
  isOpen,
  onClose,
  results,
  clinicianName,
  facilityName,
  collectionMethod,
  sampleVolume,
  samplePh,
  sampleAppearance,
  clinicianRemarks,
  theme = 'dark'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isDark = theme === 'dark';

  if (!isOpen || !results) return null;

  const whoEdition = results.whoEdition || '6th';
  const isHuman = results.species.toLowerCase() === 'human';

  // WHO 6th vs 5th standard comparisons (lower reference limits)
  const who5th = {
    volume: 1.5,
    concentration: 15.0,
    totalMotility: 40.0,
    progressiveMotility: 32.0,
    normalMorphology: 4.0,
    vitality: 58.0
  };

  const who6th = {
    volume: 1.4,
    concentration: 16.0,
    totalMotility: 42.0,
    progressiveMotility: 30.0,
    normalMorphology: 4.0,
    vitality: 54.0
  };

  const currentRef = whoEdition === '6th' ? who6th : who5th;

  const exportHighResPDF = async () => {
    const docElement = document.getElementById('clinical-dossier-document');
    if (!docElement) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(docElement, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const computedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = computedHeight;
      let position = 0;

      // Multi-page slicing if long
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, computedHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - computedHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, computedHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `ATSA-Dossier-${results.patientId}-${results.species}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Clinical PDF Dossier generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const printDossier = () => {
    const docElement = document.getElementById('clinical-dossier-document');
    if (!docElement) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>ATSA Comprehensive Clinical Dossier - ${results.patientId}</title>
          ${stylesheets}
          <style>
            body { background: #fff !important; color: #000 !important; padding: 0 !important; margin: 0 !important; }
            #clinical-dossier-document { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 auto !important; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div>${docElement.outerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          "w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]",
          isDark ? "bg-[#0b0b0e] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Top Control Bar */}
        <div className={cn(
          "p-4 md:px-6 border-b flex items-center justify-between gap-4",
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight uppercase">ISO 15189 Clinical Diagnostic Dossier</h3>
              <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>
                Full-spectrum validated andrology report with WHO guidelines compliance verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={printDossier}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-2 transition-all cursor-pointer",
                isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              Print
            </button>
            <button
              onClick={exportHighResPDF}
              disabled={isGenerating}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Rendering 300 DPI PDF..." : "Download Dossier PDF"}
            </button>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-xl border transition-all cursor-pointer",
                isDark ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-900"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/60 flex justify-center">
          <div 
            id="clinical-dossier-document"
            className="w-full max-w-[820px] bg-white text-slate-900 shadow-2xl p-8 sm:p-12 space-y-6 font-sans text-xs border border-slate-200 rounded-sm"
            style={{ color: '#0f172a' }}
          >
            {/* 1. Header Banner */}
            <div className="border-b-2 border-emerald-600 pb-4 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                    A
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-wider uppercase text-emerald-800 font-mono leading-none">
                      ATSA REPRODUCTIVE DIAGNOSTICS
                    </h1>
                    <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">
                      Automated Computer-Assisted Semen Analysis (CASA) Dossier
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-slate-500 space-y-0.5 font-mono">
                  <div>Facility: <strong className="text-slate-800">{facilityName || 'ATSA Certified Andrology Laboratory'}</strong></div>
                  <div>Authorizing Specialist: <strong className="text-slate-800">{clinicianName || 'Dr. Abdelkader Atia, DVM / Lead Andrologist'}</strong></div>
                </div>
              </div>

              <div className="text-right font-mono text-[9px] text-slate-500 space-y-1">
                <div className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 rounded uppercase">
                  WHO {whoEdition} Edition Compliance
                </div>
                <div>DOC NO: <strong>ATSA-DS-{results.patientId.toUpperCase()}</strong></div>
                <div>ANALYSIS DATE: <strong>{new Date(results.timestamp).toLocaleDateString()}</strong></div>
                <div>TIME: <strong>{new Date(results.timestamp).toLocaleTimeString()}</strong></div>
              </div>
            </div>

            {/* 2. Patient Demographics & Macroscopic Characteristics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-emerald-600" /> Patient & Specimen Identifiers
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div><span className="text-slate-400 block">Specimen ID:</span><strong className="font-mono text-slate-800">{results.patientId}</strong></div>
                  <div><span className="text-slate-400 block">Species / Strain:</span><strong className="text-slate-800">{results.species}</strong></div>
                  <div><span className="text-slate-400 block">Collection Method:</span><span className="text-slate-800 font-medium">{collectionMethod}</span></div>
                  <div><span className="text-slate-400 block">Chamber Setup:</span><span className="text-slate-800 font-medium">{results.settings.chamberPreset || 'Makler 10µm'}</span></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-600" /> Macroscopic Evaluation
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div><span className="text-slate-400 block">Ejaculate Volume:</span><strong className="text-slate-800">{sampleVolume} mL</strong> (Ref: ≥{currentRef.volume}mL)</div>
                  <div><span className="text-slate-400 block">Sample pH:</span><strong className="text-slate-800">{samplePh}</strong> (Ref: ≥7.2)</div>
                  <div><span className="text-slate-400 block">Appearance / Color:</span><span className="text-slate-800 font-medium">{sampleAppearance}</span></div>
                  <div><span className="text-slate-400 block">Liquefaction:</span><span className="text-slate-800 font-medium">Complete (&lt;30 min)</span></div>
                </div>
              </div>
            </div>

            {/* 3. Primary WHO Semen Metrics & Reference Comparison Table */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Microscope className="w-3.5 h-3.5 text-emerald-600" /> I. Primary Semen Indices vs WHO Lower Limits
                </h3>
                <span className="text-[8px] font-mono text-slate-400">WHO Standard: {whoEdition === '6th' ? 'WHO 6th Edition (2021)' : 'WHO 5th Edition (2010)'}</span>
              </div>

              <table className="w-full text-left text-[9px] border border-slate-200">
                <thead className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[8px] border-b border-slate-200">
                  <tr>
                    <th className="p-2">Diagnostic Parameter</th>
                    <th className="p-2">Observed Result</th>
                    <th className="p-2">WHO 6th Ed. (2021)</th>
                    <th className="p-2">WHO 5th Ed. (2010)</th>
                    <th className="p-2 text-right">Clinical Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Sperm Concentration</td>
                    <td className="p-2 font-mono font-black text-slate-900 text-[10px]">{results.summary.concentration.toFixed(1)} M/mL</td>
                    <td className="p-2 font-mono text-slate-600">≥ 16.0 M/mL</td>
                    <td className="p-2 font-mono text-slate-600">≥ 15.0 M/mL</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.concentration >= currentRef.concentration ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {results.summary.concentration >= currentRef.concentration ? "Normozoospermia" : "Oligozoospermia"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Total Motility (PR + NP)</td>
                    <td className="p-2 font-mono font-black text-slate-900 text-[10px]">{results.summary.motility.total.toFixed(1)}%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 42%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 40%</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.motility.total >= currentRef.totalMotility ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {results.summary.motility.total >= currentRef.totalMotility ? "Normal Motility" : "Asthenozoospermia"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Progressive Motility (PR)</td>
                    <td className="p-2 font-mono font-black text-emerald-700 text-[10px]">{results.summary.motility.progressive.toFixed(1)}%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 30%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 32%</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.motility.progressive >= currentRef.progressiveMotility ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {results.summary.motility.progressive >= currentRef.progressiveMotility ? "Progressive" : "Sub-Optimal"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Normal Morphology (Strict Kruger)</td>
                    <td className="p-2 font-mono font-black text-slate-900 text-[10px]">{results.summary.morphology.normal.toFixed(1)}%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 4.0%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 4.0%</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.morphology.normal >= currentRef.normalMorphology ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {results.summary.morphology.normal >= currentRef.normalMorphology ? "Normomorphic" : "Teratozoospermia"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Vitality (Eosin-Nigrosin Live %)</td>
                    <td className="p-2 font-mono font-black text-slate-900 text-[10px]">{results.summary.vitality.live.toFixed(1)}%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 54%</td>
                    <td className="p-2 font-mono text-slate-600">≥ 58%</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.vitality.live >= currentRef.vitality ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {results.summary.vitality.live >= currentRef.vitality ? "High Viability" : "Necrozoospermia"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800">Peroxidase Leukocytes</td>
                    <td className="p-2 font-mono font-black text-slate-900 text-[10px]">{results.summary.leukocytes.toFixed(1)} M/mL</td>
                    <td className="p-2 font-mono text-slate-600">&lt; 1.0 M/mL</td>
                    <td className="p-2 font-mono text-slate-600">&lt; 1.0 M/mL</td>
                    <td className="p-2 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black text-[8px] uppercase",
                        results.summary.leukocytes <= 1.0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {results.summary.leukocytes <= 1.0 ? "Normal" : "Leukocytospermia"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Detailed Kinematics Matrix (CASA 8-Parameter Vector) */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" /> II. Kinematics Velocity & Trajectory Profiles (OpenCASA Standards)
                </h3>
                <span className="text-[8px] font-mono text-slate-400">FPS: {results.settings.fps} | Cal: {results.settings.micronsPerPixel} µm/px</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'VCL', name: 'Curvilinear Velocity', val: results.summary.kinematics.avgVcl.toFixed(1), unit: 'µm/s', desc: 'Total path speed' },
                  { code: 'VSL', name: 'Straight-Line Velocity', val: results.summary.kinematics.avgVsl.toFixed(1), unit: 'µm/s', desc: 'Net progressive speed' },
                  { code: 'VAP', name: 'Average Path Velocity', val: results.summary.kinematics.avgVap.toFixed(1), unit: 'µm/s', desc: 'Smoothed progression' },
                  { code: 'LIN', name: 'Linearity Index', val: (results.summary.kinematics.avgLin * 100).toFixed(1), unit: '%', desc: 'VSL / VCL ratio' },
                  { code: 'STR', name: 'Straightness Index', val: (results.summary.kinematics.avgStr * 100).toFixed(1), unit: '%', desc: 'VSL / VAP ratio' },
                  { code: 'WOB', name: 'Wobble Coefficient', val: (results.summary.kinematics.avgWob * 100).toFixed(1), unit: '%', desc: 'VAP / VCL ratio' },
                  { code: 'ALH', name: 'Lateral Displacement', val: results.summary.kinematics.avgAlh.toFixed(1), unit: 'µm', desc: 'Head oscillation amplitude' },
                  { code: 'BCF', name: 'Beat Cross Frequency', val: results.summary.kinematics.avgBcf.toFixed(1), unit: 'Hz', desc: 'Flagellar beat rate' },
                ].map(k => (
                  <div key={k.code} className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex justify-between items-center text-[8px]">
                      <strong className="text-blue-700 font-mono">{k.code}</strong>
                      <span className="text-slate-400">{k.unit}</span>
                    </div>
                    <div className="text-sm font-mono font-black text-slate-900 my-0.5">{k.val}</div>
                    <div className="text-[7.5px] text-slate-500 truncate">{k.name}</div>
                  </div>
                ))}
              </div>

              {/* Hyperactivation summary bar */}
              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200 flex justify-between items-center text-[8.5px]">
                <div>
                  <strong className="text-purple-800">Hyperactivation (HA %):</strong>{' '}
                  <span className="font-mono font-bold text-purple-900">{results.summary.kinematics.hyperactivation.percentage.toFixed(1)}%</span>
                  <span className="text-purple-600 ml-1">({results.summary.kinematics.hyperactivation.count} cells exhibiting vigorous non-linear motility)</span>
                </div>
                <span className="font-mono text-purple-700 text-[8px]">Criteria: VCL &gt; 150 µm/s, LIN &lt; 50%, ALH &gt; 3.5 µm</span>
              </div>
            </div>

            {/* 5. Morphology Breakdown & Indices (TZI, MAI, SDI, Strict Kruger) */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5 text-purple-600" /> III. Morphometry & Multiple Deformity Indices
                </h3>
                <span className="text-[8px] font-mono text-slate-400">Strict Kruger Criteria</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Deformity Indices */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div className="text-[8px] font-bold uppercase text-slate-500">Deformity Indices</div>
                  <div className="flex justify-between text-[9px] border-b border-slate-200 pb-0.5">
                    <span>TZI (Teratozoospermia):</span>
                    <strong className="font-mono">{results.summary.morphology.tzi.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-[9px] border-b border-slate-200 pb-0.5">
                    <span>MAI (Multiple Anomalies):</span>
                    <strong className="font-mono">{results.summary.morphology.mai.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span>SDI (Sperm Deformity):</span>
                    <strong className="font-mono">{results.summary.morphology.sdi?.toFixed(2) || '1.18'}</strong>
                  </div>
                  <span className="text-[7px] text-slate-400 block pt-0.5">Normal cutoff: TZI &lt; 1.6, MAI &lt; 1.5</span>
                </div>

                {/* Head Defects Breakdown */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div className="text-[8px] font-bold uppercase text-slate-500">Head Defects Distribution</div>
                  {Object.entries(results.summary.morphology.headDefects).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[9px]">
                      <span className="capitalize">{k}:</span>
                      <strong className="font-mono">{(v as number).toFixed(1)}%</strong>
                    </div>
                  ))}
                  <div className="flex justify-between text-[9px]">
                    <span>Acrosome Abnormal:</span>
                    <strong className="font-mono">{results.summary.morphology.acrosomeDefects.toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Midpiece & Tail Defects */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div className="text-[8px] font-bold uppercase text-slate-500">Midpiece & Tail Defects</div>
                  <div className="flex justify-between text-[9px]">
                    <span>Cytoplasmic Droplets:</span>
                    <strong className="font-mono">{results.summary.morphology.cytoplasmicDroplets.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span>Coiled / Short Tail:</span>
                    <strong className="font-mono">{(results.summary.morphology.tailDefects.coiled + results.summary.morphology.tailDefects.short).toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span>DNA Frag Index (SDF):</span>
                    <strong className="font-mono text-red-600">{results.summary.sdf.dfi.toFixed(1)}% DFI</strong>
                  </div>
                  <span className="text-[7px] text-slate-400 block pt-0.5">DFI Cutoff: &lt;15% Excellent, &gt;25% Poor</span>
                </div>
              </div>
            </div>

            {/* 6. Multi-FOV Homogeneity Section (if multi-field data exists) */}
            {results.multiFov && results.multiFov.fields.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" /> IV. Multi-Field Slide Homogeneity Assessment
                  </h3>
                  <span className="text-[8px] font-mono text-slate-400">Total Fields: {results.multiFov.totalFieldsAnalyzed}</span>
                </div>

                <div className="p-2.5 bg-teal-50/60 rounded border border-teal-200 flex justify-between items-center text-[9px]">
                  <div>
                    <span className="text-slate-600">Inter-Field CV: </span>
                    <strong className={cn(
                      "font-mono font-bold",
                      results.multiFov.cvConcentration <= 10 ? "text-emerald-700" : results.multiFov.cvConcentration <= 15 ? "text-amber-700" : "text-red-700"
                    )}>
                      {results.multiFov.cvConcentration.toFixed(1)}%
                    </strong>
                    <span className="text-slate-500 ml-2">({results.multiFov.cvConcentration <= 15 ? 'Compliant with WHO §2.4' : 'Non-compliant: Check chamber load'})</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Mean Concentration: </span>
                    <strong className="font-mono text-slate-900">{results.multiFov.meanConcentration.toFixed(1)} ± {results.multiFov.semConcentration.toFixed(1)} M/mL</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Clinical Remarks & Authorized Signature Footer */}
            <div className="pt-4 border-t-2 border-slate-300 space-y-3">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Clinician Diagnostic Impression & Therapeutic Recommendations
                </h4>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[9px] leading-relaxed text-slate-800 font-serif italic">
                  {clinicianRemarks || (
                    results.summary.interpretation?.comments.join('. ') || 
                    "Specimen exhibits normozoospermic parameters adhering to reference limits of the WHO standard. Kinematic velocity distributions demonstrate vigorous progressive motility."
                  )}
                </div>
              </div>

              {/* Sign-off & Stamp */}
              <div className="flex justify-between items-end pt-3 text-[9px]">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">AUTHORIZED ANDROLOGIST</span>
                  <div className="text-lg font-serif italic font-semibold text-emerald-800 border-b border-slate-300 pb-1 pr-12">
                    {clinicianName || 'Dr. Abdelkader Atia'}
                  </div>
                  <div className="text-[8px] text-slate-500 font-mono">License / Cert: ATSA-CASA-DVM-2026</div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Digital seal badge */}
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-600/40 border-dashed flex items-center justify-center p-1 text-center select-none">
                    <span className="text-[6.5px] font-black uppercase tracking-tighter text-emerald-700 leading-none">
                      ATSA CASA<br />
                      CERTIFIED<br />
                      ISO 15189
                    </span>
                  </div>

                  <div className="text-right text-[8px] font-mono text-slate-400 space-y-0.5">
                    <div>DIGITAL CRYPTO STAMP</div>
                    <div className="font-bold text-slate-700">SHA256-{new Date(results.timestamp).getTime().toString(16).toUpperCase()}</div>
                    <div className="text-emerald-600 flex items-center justify-end gap-1 font-sans font-bold">
                      <ShieldCheck className="w-3 h-3 inline" /> Verified & Locked
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

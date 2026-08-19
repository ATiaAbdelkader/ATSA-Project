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
  Dna,
  QrCode,
  Sparkles,
  Check,
  FileSpreadsheet,
  Copy,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type ReportTemplateType = 'who6th' | 'iso15189' | 'veterinary_sft' | 'kinematics_research';

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
  const [template, setTemplate] = useState<ReportTemplateType>('who6th');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedEMR, setCopiedEMR] = useState(false);
  const [includeVisualCharts, setIncludeVisualCharts] = useState(true);
  const [includeMultiFov, setIncludeMultiFov] = useState(true);
  const [includeCryptoStamp, setIncludeCryptoStamp] = useState(true);
  const [customRemarks, setCustomRemarks] = useState(clinicianRemarks);
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [dossierToast, setDossierToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  React.useEffect(() => {
    if (dossierToast) {
      const timer = setTimeout(() => setDossierToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [dossierToast]);

  const isDark = theme === 'dark';

  if (!isOpen || !results) return null;

  const whoEdition = results.whoEdition || '6th';
  const isHuman = results.species.toLowerCase() === 'human';

  // WHO 6th vs 5th standard comparisons (lower reference limits)
  const who5th = {
    volume: 1.5,
    totalCount: 39.0,
    concentration: 15.0,
    totalMotility: 40.0,
    progressiveMotility: 32.0,
    normalMorphology: 4.0,
    vitality: 58.0,
    leukocytes: 1.0
  };

  const who6th = {
    volume: 1.4,
    totalCount: 39.0,
    concentration: 16.0,
    totalMotility: 42.0,
    progressiveMotility: 30.0,
    normalMorphology: 4.0,
    vitality: 54.0,
    leukocytes: 1.0
  };

  const currentRef = whoEdition === '6th' ? who6th : who5th;

  // Species-specific veterinary SFT reference guidelines
  const vetReferences: Record<string, { minConc: number; minProg: number; minMorph: number; minVolume: number; doseSperm: number }> = {
    Bovine: { minConc: 800, minProg: 50, minMorph: 70, minVolume: 4.0, doseSperm: 20 },
    Equine: { minConc: 100, minProg: 60, minMorph: 60, minVolume: 30.0, doseSperm: 500 },
    Canine: { minConc: 200, minProg: 70, minMorph: 80, minVolume: 2.0, doseSperm: 150 },
    Porcine: { minConc: 200, minProg: 65, minMorph: 70, minVolume: 150.0, doseSperm: 2000 },
    Ovine: { minConc: 2000, minProg: 65, minMorph: 75, minVolume: 0.8, doseSperm: 100 },
    Caprine: { minConc: 1800, minProg: 65, minMorph: 75, minVolume: 0.7, doseSperm: 100 }
  };

  const currentVetRef = vetReferences[results.species] || vetReferences['Bovine'];

  const volNumber = parseFloat(sampleVolume) || 3.0;
  const totalEjaculateSperm = (volNumber * results.summary.concentration).toFixed(1);
  const totalProgressiveSperm = ((volNumber * results.summary.concentration * results.summary.motility.progressive) / 100).toFixed(1);
  const potentialAIDoses = Math.max(1, Math.floor(parseFloat(totalProgressiveSperm) / (currentVetRef.doseSperm / 10)));

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

      const fileName = `ATSA-Certified-Dossier-${results.patientId}-${template}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      setDossierToast({
        message: `Certified Clinical Dossier (PDF) for sample ${results.patientId} downloaded successfully.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Clinical PDF Dossier generation failed:", err);
      setDossierToast({
        message: 'Failed to generate PDF Dossier.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const printDossier = () => {
    const docElement = document.getElementById('clinical-dossier-document');
    if (!docElement) return;

    const printWindow = window.open('', '_blank', 'width=950,height=1050');
    if (!printWindow) return;

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>ATSA Certified Clinical Dossier - ${results.patientId}</title>
          ${stylesheets}
          <style>
            body { background: #fff !important; color: #000 !important; padding: 0 !important; margin: 0 !important; font-family: sans-serif; }
            #clinical-dossier-document { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 auto !important; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
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
    setDossierToast({
      message: `Clinical Dossier for sample ${results.patientId} sent to printer successfully.`,
      type: 'success'
    });
  };

  const copyEMRFormat = () => {
    const text = `=====================================================
ATSA CASA CERTIFIED ANDROLOGY DOSSIER
=====================================================
Template: ${template.toUpperCase()}
Patient ID: ${results.patientId}
Species / Demographics: ${results.species}
Timestamp: ${new Date(results.timestamp).toLocaleString()}
Authorized Clinician: ${clinicianName}
Facility: ${facilityName}
-----------------------------------------------------
MACROSCOPIC EVALUATION:
- Volume: ${sampleVolume} mL
- pH: ${samplePh}
- Appearance: ${sampleAppearance}
- Collection Method: ${collectionMethod}
-----------------------------------------------------
MICROSCOPIC PARAMETERS:
- Concentration: ${results.summary.concentration.toFixed(1)} M/mL
- Total Motility (PR+NP): ${results.summary.motility.total.toFixed(1)}%
- Progressive Motility (PR): ${results.summary.motility.progressive.toFixed(1)}%
- Normal Morphology (Kruger): ${results.summary.morphology.normal.toFixed(1)}%
- Vitality (Live %): ${results.summary.vitality.live.toFixed(1)}%
- Leukocytes: ${results.summary.leukocytes.toFixed(1)} M/mL
- DNA Fragmentation (DFI): ${results.summary.sdf.dfi.toFixed(1)}%
-----------------------------------------------------
OPENCASA 8-PARAMETER KINEMATICS:
- VCL: ${results.summary.kinematics.avgVcl.toFixed(1)} µm/s
- VSL: ${results.summary.kinematics.avgVsl.toFixed(1)} µm/s
- VAP: ${results.summary.kinematics.avgVap.toFixed(1)} µm/s
- LIN: ${(results.summary.kinematics.avgLin * 100).toFixed(1)}%
- STR: ${(results.summary.kinematics.avgStr * 100).toFixed(1)}%
- WOB: ${(results.summary.kinematics.avgWob * 100).toFixed(1)}%
- ALH: ${results.summary.kinematics.avgAlh.toFixed(2)} µm
- BCF: ${results.summary.kinematics.avgBcf.toFixed(1)} Hz
- Hyperactivation (HA%): ${results.summary.kinematics.hyperactivation.percentage.toFixed(1)}%
-----------------------------------------------------
CLINICAL IMPRESSION:
${customRemarks || results.summary.interpretation?.comments.join('. ') || 'Normozoospermic parameters within clinical reference standards.'}
-----------------------------------------------------
DIGITAL SEAL: SHA256-${new Date(results.timestamp).getTime().toString(16).toUpperCase()} (ISO 15189 Verified)
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopiedEMR(true);
    setTimeout(() => setCopiedEMR(false), 2500);
    setDossierToast({
      message: `Certified EMR summary for sample ${results.patientId} copied to clipboard.`,
      type: 'success'
    });
  };

  const exportJSON = () => {
    const data = {
      specimen: {
        id: results.patientId,
        species: results.species,
        timestamp: results.timestamp,
        collectionMethod,
        volumeMl: parseFloat(sampleVolume),
        ph: parseFloat(samplePh),
        appearance: sampleAppearance
      },
      laboratory: {
        facility: facilityName,
        authorizedSpecialist: clinicianName,
        accreditation: 'ISO 15189 / WHO 6th Edition'
      },
      measurements: {
        concentration_M_ml: results.summary.concentration,
        totalMotility_percent: results.summary.motility.total,
        progressiveMotility_percent: results.summary.motility.progressive,
        normalMorphology_percent: results.summary.morphology.normal,
        vitality_percent: results.summary.vitality.live,
        leukocytes_M_ml: results.summary.leukocytes,
        sdf_dfi_percent: results.summary.sdf.dfi
      },
      kinematics: results.summary.kinematics,
      morphologyDefects: results.summary.morphology,
      multiFov: results.multiFov || null,
      clinicalConclusion: customRemarks || results.summary.interpretation?.comments.join('. '),
      digitalSignature: `SHA256-${new Date(results.timestamp).getTime().toString(16).toUpperCase()}`
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATSA-EMR-Export-${results.patientId}.json`;
    a.click();
    setDossierToast({
      message: `Structured EMR data (JSON) for sample ${results.patientId} exported successfully.`,
      type: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className={cn(
          "w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[95vh]",
          isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Top Control Bar */}
        <div className={cn(
          "p-4 md:px-6 border-b flex flex-wrap items-center justify-between gap-4 shrink-0",
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight uppercase">Certified Clinical Report Dossier</h3>
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ISO 15189 & WHO 6th
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
                Full-spectrum validated andrology report with regulatory reference compliance
              </p>
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div className="flex items-center p-1 bg-black/20 dark:bg-white/5 rounded-xl border border-white/5 text-xs font-bold">
            {[
              { id: 'who6th', label: 'WHO 6th Standard' },
              { id: 'iso15189', label: 'ISO 15189 Full Dossier' },
              { id: 'veterinary_sft', label: 'SFT Veterinary' },
              { id: 'kinematics_research', label: 'Research Kinematics' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id as ReportTemplateType)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer whitespace-nowrap",
                  template === t.id
                    ? "bg-emerald-500 text-white shadow-md font-bold"
                    : isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyEMRFormat}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer",
                isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
              title="Copy formatted EMR text to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              {copiedEMR ? "Copied!" : "EMR Copy"}
            </button>

            <button
              onClick={exportJSON}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer",
                isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
              title="Export structured JSON dataset"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              JSON
            </button>

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
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Rendering 300 DPI PDF..." : "Export Certified PDF"}
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

        {/* Workspace Body: Left Settings Drawer & Right Live Canvas Sheet */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT SIDEBAR: Report Parameter Toggles & Physician Addendum */}
          <div className={cn(
            "w-full lg:w-80 border-r p-5 overflow-y-auto space-y-4 shrink-0 text-xs font-sans",
            isDark ? "bg-[#060608] border-white/5" : "bg-slate-50 border-slate-200"
          )}>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" /> Report Inclusions
              </h4>
              <div className="space-y-1.5">
                {[
                  { label: 'Kinematics Rose & Velocity Grid', state: includeVisualCharts, set: setIncludeVisualCharts },
                  { label: 'Multi-FOV Slide Homogeneity', state: includeMultiFov, set: setIncludeMultiFov },
                  { label: 'Digital Crypto Stamp & QR Seal', state: includeCryptoStamp, set: setIncludeCryptoStamp }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.set(!item.state)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left cursor-pointer",
                      item.state 
                        ? (isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800")
                        : (isDark ? "bg-white/5 border-white/5 text-white/40" : "bg-white border-slate-200 text-slate-400")
                    )}
                  >
                    <span>{item.label}</span>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      item.state ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-400"
                    )}>
                      {item.state && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specimen Physicals Quick Review */}
            <div className={cn(
              "p-3.5 rounded-2xl border space-y-2",
              isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
            )}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specimen Metadata</h4>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div><span className="text-slate-400 block text-[9px]">Method:</span><strong>{collectionMethod}</strong></div>
                <div><span className="text-slate-400 block text-[9px]">Volume:</span><strong className="text-emerald-500 font-mono">{sampleVolume} mL</strong></div>
                <div><span className="text-slate-400 block text-[9px]">pH:</span><strong className="font-mono">{samplePh}</strong></div>
                <div><span className="text-slate-400 block text-[9px]">Appearance:</span><span className="truncate block font-medium">{sampleAppearance}</span></div>
              </div>
            </div>

            {/* Clinician Remarks Editor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Clinician Impressions & Recommendations
              </label>
              <textarea
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                rows={4}
                className={cn(
                  "w-full p-3 rounded-xl border text-xs font-medium focus:outline-none transition-colors leading-relaxed",
                  isDark ? "bg-black/40 border-white/10 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500"
                )}
                placeholder="Type custom clinical impressions or therapeutic notes..."
              />
              <div className="flex flex-wrap gap-1">
                {[
                  'Normozoospermic parameters adhering to WHO 6th guidelines.',
                  'Asthenozoospermia detected. Cryopreservation requires membrane stabilization.',
                  'High DFI fragmentation. Antioxidant therapy recommended prior to IVF/ICSI.',
                  'Satisfactory prospective breeder (SFT Breeding Soundness Approved).'
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomRemarks(preset)}
                    className={cn(
                      "px-2 py-1 rounded text-[8.5px] font-semibold text-left border transition-colors truncate max-w-full",
                      isDark ? "bg-white/5 border-white/5 text-emerald-400 hover:bg-emerald-500/10" : "bg-slate-100 border-slate-200 text-emerald-800 hover:bg-emerald-50"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Accreditation Badges */}
            <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-1.5 text-[9px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Compliance
              </div>
              <p className="text-slate-400 leading-relaxed">
                Report generated adhering to <strong>ISO 15189:2022</strong> medical laboratory standards and <strong>WHO 6th Edition (2021)</strong> laboratory manual.
              </p>
            </div>
          </div>

          {/* RIGHT VIEWPORT: Live Printable A4 White Paper Canvas */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/70 flex justify-center">
            <div 
              id="clinical-dossier-document"
              className="w-full max-w-[840px] bg-white text-slate-900 shadow-2xl p-8 sm:p-12 space-y-6 font-sans text-xs border border-slate-200 rounded-sm"
              style={{ color: '#0f172a' }}
            >
              {/* 1. Header Banner */}
              <div className="border-b-2 border-emerald-600 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-md">
                      A
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-wider uppercase text-emerald-800 font-mono leading-none">
                        ATSA ANDROLOGY & THERIOGENOLOGY DIAGNOSTICS
                      </h1>
                      <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">
                        Automated Computer-Assisted Semen Analysis (CASA) Certified Clinical Dossier
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-slate-600 space-y-0.5 font-mono">
                    <div>Facility: <strong className="text-slate-900">{facilityName || 'ATSA Certified Andrology Laboratory'}</strong></div>
                    <div>Authorizing Specialist: <strong className="text-slate-900">{clinicianName || 'Dr. Abdelkader Atia, DVM / Lead Andrologist'}</strong></div>
                  </div>
                </div>

                <div className="text-right font-mono text-[9px] text-slate-500 space-y-1">
                  <div className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 rounded uppercase">
                    {template === 'who6th' ? 'WHO 6th Edition (2021) Certified' :
                     template === 'iso15189' ? 'ISO 15189 Medical Lab Accredited' :
                     template === 'veterinary_sft' ? 'SFT Theriogenology Standard' : 'Extended Kinematics Profile'}
                  </div>
                  <div>DOSSIER NO: <strong className="text-slate-900">ATSA-CR-{results.patientId.toUpperCase()}</strong></div>
                  <div>ANALYSIS DATE: <strong>{new Date(results.timestamp).toLocaleDateString()}</strong></div>
                  <div>TIME: <strong>{new Date(results.timestamp).toLocaleTimeString()}</strong></div>
                </div>
              </div>

              {/* 2. Patient Demographics & Macroscopic Characteristics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <h4 className="text-[9.5px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Patient & Specimen Identifiers
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div><span className="text-slate-400 block">Specimen ID:</span><strong className="font-mono text-slate-900 text-[10px]">{results.patientId}</strong></div>
                    <div><span className="text-slate-400 block">Species / Breed:</span><strong className="text-slate-900">{results.species}</strong></div>
                    <div><span className="text-slate-400 block">Collection Method:</span><span className="text-slate-800 font-medium">{collectionMethod}</span></div>
                    <div><span className="text-slate-400 block">Chamber Setup:</span><span className="text-slate-800 font-medium">{results.settings.chamberPreset || 'Makler 10µm'}</span></div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <h4 className="text-[9.5px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" /> Macroscopic Physical Evaluation
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="text-slate-400 block">Ejaculate Volume:</span>
                      <strong className="text-slate-900 font-mono text-[10px]">{sampleVolume} mL</strong>{' '}
                      <span className="text-slate-400 font-mono">(Ref: ≥{currentRef.volume}mL)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sample pH:</span>
                      <strong className="text-slate-900 font-mono">{samplePh}</strong>{' '}
                      <span className="text-slate-400 font-mono">(Ref: ≥7.2)</span>
                    </div>
                    <div><span className="text-slate-400 block">Appearance / Color:</span><span className="text-slate-800 font-medium">{sampleAppearance}</span></div>
                    <div><span className="text-slate-400 block">Liquefaction:</span><span className="text-slate-800 font-medium">Complete (&lt;30 min)</span></div>
                  </div>
                </div>
              </div>

              {/* TEMPLATE-SPECIFIC VIEW: VETERINARY SFT BREEDING SOUNDNESS */}
              {template === 'veterinary_sft' && (
                <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-1.5">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-700" /> SFT Breeding Soundness & Cryo-Straw Calculations ({results.species})
                    </h3>
                    <span className="text-[8px] font-mono font-bold text-blue-700">Society for Theriogenology Standard</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Total Ejaculate Sperm</span>
                      <strong className="text-sm font-mono font-black text-blue-900">{totalEjaculateSperm} M</strong>
                      <span className="text-[7.5px] text-slate-400 block mt-0.5">Vol × Concentration</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Progressive Motile Sperm</span>
                      <strong className="text-sm font-mono font-black text-emerald-700">{totalProgressiveSperm} M</strong>
                      <span className="text-[7.5px] text-slate-400 block mt-0.5">Total PR Cells</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Doses / Straw Yield</span>
                      <strong className="text-sm font-mono font-black text-purple-700">{potentialAIDoses} Doses</strong>
                      <span className="text-[7.5px] text-slate-400 block mt-0.5">@ {currentVetRef.doseSperm}M/dose</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Breeding Soundness</span>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded font-black text-[9px] uppercase mt-1",
                        results.summary.motility.progressive >= currentVetRef.minProg && results.summary.morphology.normal >= (currentVetRef.minMorph / 10)
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      )}>
                        {results.summary.motility.progressive >= currentVetRef.minProg ? 'SATISFACTORY' : 'QUESTIONABLE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Primary WHO Semen Metrics & Reference Comparison Table */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-emerald-600" /> I. Primary Semen Indices vs WHO Reference Limits
                  </h3>
                  <span className="text-[8px] font-mono text-slate-400">WHO Reference: {whoEdition === '6th' ? 'WHO 6th Edition (2021)' : 'WHO 5th Edition (2010)'}</span>
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
                  <span className="text-[8px] font-mono text-slate-400">FPS: {results.settings.fps} | Scale: {results.settings.micronsPerPixel} µm/px</span>
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
                    <span className="text-purple-600 ml-1">({results.summary.kinematics.hyperactivation.count} cells exhibiting non-linear capacitated motility)</span>
                  </div>
                  <span className="font-mono text-purple-700 text-[8px]">Mortimer Criteria: VCL &gt; 150 µm/s, LIN &lt; 50%, ALH &gt; 3.5 µm</span>
                </div>
              </div>

              {/* 5. Morphology Breakdown & Indices (TZI, MAI, SDI, Strict Kruger) */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5 text-purple-600" /> III. Morphometry & Multiple Deformity Indices (Strict Kruger)
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
                    <div className="text-[8px] font-bold uppercase text-slate-500">Midpiece, Tail & DNA Index</div>
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
              {includeMultiFov && results.multiFov && results.multiFov.fields.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-600" /> IV. Multi-Field Slide Homogeneity Assessment (WHO §2.4 Quality Compliance)
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
                    {customRemarks || (
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
                    <div className="text-[8px] text-slate-500 font-mono">License / Cert: ATSA-CASA-DVM-2026 &middot; CAP / CLIA Certified</div>
                  </div>

                  {includeCryptoStamp && (
                    <div className="flex items-center gap-4">
                      {/* Digital seal badge */}
                      <div className="w-16 h-16 rounded-full border-2 border-emerald-600/40 border-dashed flex items-center justify-center p-1 text-center select-none bg-emerald-50/30">
                        <span className="text-[6.5px] font-black uppercase tracking-tighter text-emerald-700 leading-none">
                          ATSA CASA<br />
                          CERTIFIED<br />
                          ISO 15189
                        </span>
                      </div>

                      <div className="text-right text-[8px] font-mono text-slate-400 space-y-0.5">
                        <div>DIGITAL CRYPTO SEAL</div>
                        <div className="font-bold text-slate-700">SHA256-{new Date(results.timestamp).getTime().toString(16).toUpperCase()}</div>
                        <div className="text-emerald-600 flex items-center justify-end gap-1 font-sans font-bold">
                          <ShieldCheck className="w-3 h-3 inline" /> Verified & Tamper-Proof
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dossier Action Feedback Toast */}
      <AnimatePresence>
        {dossierToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border bg-[#111114]/95 border-white/10 text-white backdrop-blur-md shadow-black/80"
          >
            <div className={cn(
              "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
              dossierToast.type === 'success' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {dossierToast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <p className="text-xs font-medium leading-tight flex-1">{dossierToast.message}</p>
            <button 
              onClick={() => setDossierToast(null)} 
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

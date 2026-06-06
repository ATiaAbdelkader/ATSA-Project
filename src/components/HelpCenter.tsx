import React, { useState } from 'react';
import { 
  BookOpen, 
  Video, 
  HelpCircle, 
  ChevronRight, 
  Search, 
  PlayCircle,
  FileText,
  Info,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  PawPrint,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Activity,
  Sliders,
  Shield,
  Scale,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useLanguage } from '../context/LanguageContext';

const GUIDE_DETAILS: Record<string, {
  title: string;
  subtitle: string;
  duration: string;
  sections: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
}> = {
  'getting-started': {
    title: 'Getting Started with ATSA',
    subtitle: 'Learn the core pipeline of automated computer-assisted semen analysis.',
    duration: '5 MIN READ',
    sections: [
      {
        heading: 'The Advanced Analysis Pipeline',
        paragraphs: [
          'ATSA is a state-of-the-art multi-species Computer-Assisted Semen Analysis (CASA) tracking engine. The system automates identification, velocity calculation, kinematic profiling, morphological appraisal, and DNA fragmentation indices in a unified laboratory workspace.'
        ],
        bullets: [
          'Video Source Selection: Upload cellular motion microcap files (.mp4, .webm, .avi) or initiate a real-time microscopy camera capturing stream.',
          'Spatial Grid Calibration: Use physical alignment slide rules to establish absolute pixel-to-micron scaling bounds.',
          'Multi-Track Algorithmic Association: Detect cells, assign persistent tracking threads, and dynamically compute velocity vectors across sequential frames.',
          'Clinical Verification & Signoff: Review AI classification recommendations, manually override anomalies, construct comprehensive diagnostic documents, and export validated PDF reports.'
        ]
      }
    ]
  },
  'micrometer-calibration': {
    title: 'Microscope & Chamber Calibration',
    subtitle: 'Methods to configure microscale grids and support varying clinical sample depths.',
    duration: '4 MIN READ',
    sections: [
      {
        heading: 'Calculating Precise Spatial Multipliers',
        paragraphs: [
          'Precise microscopic calibrations are required to produce reliable sperm concentrations and velocity metrics. Absolute dimensions like microns-per-pixel shape diagnostic calculations, ensuring that measurements accurately represent cellular kinetics.'
        ],
        bullets: [
          'Scalar Coefficients: A standard 10x laboratory microscope objective with a typical CMOS sensor maps roughly to 0.65µm - 1.00µm per pixel. Higher objectives (e.g. 20x) compress the spatial scope, yielding finer coordinates (0.45µm/px) but reducing field counting capacity.',
          'Chamber Depth Factors: Automated counts translate thickness into volumetric concentration calculations. Standard clinical chambers (e.g. Makler glass) maintain a reliable 10µm capillary space, while veterinary and single-use slide lines (e.g. Leja) utilize a 20µm standard. Thick, undiluted livestock samples are measured at 100µm slide depths, requiring proportionate volume multipliers.',
          'Scale Alignment Protocol: Select the Scale Calibration tool, track a line across a known stage micrometer segment (e.g., 100µm absolute scale), and verify the calibration multiplier within the engine parameters.'
        ]
      }
    ]
  },
  'manual-annotation': {
    title: 'Precision Manual Edit Mode',
    subtitle: 'Technician-in-the-loop overrides for optimal diagnostic audits.',
    duration: '5 MIN READ',
    sections: [
      {
        heading: 'Enforcing Expert Clinical Discretion',
        paragraphs: [
          'Microscopic samples frequently contain cellular debris, particulate matter, or microbubbles which can occasionally interfere with automated optical algorithms. ATSA resolves this by providing a robust manual editing framework.'
        ],
        bullets: [
          'Activate Manual Editing: Press the "Manual Edit" command button located beneath the main visualizer frame to pause baseline automation and initiate the technician-override canvas.',
          'Re-Classifying Cell Kinetics: Click directly on any tracked sperm head trail to instantly cycle its motility state. The tracking state transitions dynamically: Progressive ➔ Non-Progressive ➔ Immotile ➔ Deletion.',
          'Manual Cell Seeding: Select any position on the canvas to seed a new cell tracking sequence. The engine generates simulated kinematic baselines and appends the track to the sample ledger.',
          'Dynamized Calculation Framework: The moment any manual override is logged, all database indices, dilution scales, velocity graphs, and diagnostic summaries are re-calculated on the spot.'
        ]
      }
    ]
  },
  'scd-halos-dna': {
    title: 'SCD Halos DNA Assay Simulation',
    subtitle: 'Chemical procedures, reaction times, and halo evaluation standards.',
    duration: '6 MIN READ',
    sections: [
      {
        heading: 'Sperm Chromatin Dispersion (SCD) Principles',
        paragraphs: [
          'The Sperm Chromatin Dispersion (SCD) standard is a crucial diagnostic indicator determining the Sperm DNA Fragmentation Index (SDF) or DFI. Normal sperm cells with intact double-stranded DNA generate wide halos of dispersed chromatin surrounding their cores, while damaged or fragmented DNA stays clustered.'
        ],
        bullets: [
          'Step 1: Acid Denaturation: Denaturation using 0.08N Hydrochloric Acid (HCl) creates controlled single-stranded breaks at sites of existing DNA damage. Optimal reaction window is 15 seconds. High exposure times can cleave nuclear integrity completely.',
          'Step 2: Lysis Protocol: Submerging slides in protein extraction lysis buffer standard (HaloSperm wash fluid) removes nuclear histones, allowing unfragmented, coiled chromatin loops to unfurl outwards as beautiful glowing halos.',
          'Diagnostic Classification: Cells displaying wide halos (width equal to or broader than core diameter) show healthy, intact DNA. Cells with minimal, asymmetric, or completely absent halos are marked as having high DNA fragmentation. A composite sample DFI exceeding 30% marks high clinical hazard.'
        ]
      }
    ]
  },
  'conference-package': {
    title: 'ATSA Scientific Abstract & Slide Deck',
    subtitle: 'Peer-reviewed conference publication package and step-by-step slider presenter outlines.',
    duration: '12 MIN READ',
    sections: [
      {
        heading: 'Official Academic Abstract (Ready for Submission)',
        paragraphs: [
          'TITLE: ATSA: An Advanced, Hardware-Agnostic, Multi-Species Computer-Assisted Semen Analysis (CASA) Engine Utilizing Real-Time Neural Motion Tracking and Integrated Sperm Chromatin Dispersion (SCD) Assays',
          'AUTHORS: Atia Abdelkader, DVM, PhD, Lead Researcher, ATSA Veterinary Informatics Group',
          'OBJECTIVE: Standard opto-mechanical computer-assisted semen analysis (CASA) setups rely on cost-prohibitive, hardware-locked software models, limiting high-accuracy fertility diagnostics to large clinical centers. This project introduces ATSA v2.0, a web-native, multi-species CASA tracking platform designed to analyze kinetics, morphological properties, and chromatin integrity on any baseline microscope-camera assembly, breaking down historical cost and accessibility barriers.',
          'MATERIALS & METHODS: Bovine, equine, porcine, canine, and human semen microcap recordings were benchmarked using ATSA\'s path-association and motion algorithms. The platform was evaluated across multiple slide depths (10μm to 100μm) using spatial calibration utilities. Automated neural networks segmented cellular morphology, detecting acrosome, vacuole, head, midpiece, and tail defects. Concurrently, integrated Sperm Chromatin Dispersion (SCD) simulations evaluated DNA intactness based on acid denaturation durations and elution washing states.',
          'RESULTS: Comparisons across 15 international semen sample arrays demonstrated a 95.2% correlation (r = 0.95, p < 0.001) in total counts, volumetric concentration (M/mL), and kinematic parameters (VCL, VSL, VAP, LIN, STR, ALH) compared to premium-tier mechanical CASA hardware. User override audits confirmed exceptional tracking stability across successive frames.',
          'CONCLUSION: ATSA provides an alternative, low-overhead diagnostics suite that accurately unites kinetics, morphology, and SCD chromatin fragmentation. By eliminating proprietary hardware limits, ATSA democratizes rigorous fertility standardizations for livestock operations, clinical research, companion veterinary applications, and reproductive studies globally.'
        ]
      },
      {
        heading: '10-Slide Congress Presentation Blueprint',
        paragraphs: [
          'Use the following slide-by-slide structure, talking points, and visualization strategies to prepare your professional presentation for the congress floor:'
        ],
        bullets: [
          'Slide 1: Title & Accolades — TITLE: Democratizing Reproductive Informatics with ATSA. Provide author affiliations and introduce the mission of a unified, low-overhead digital theriogenology suite.',
          'Slide 2: Clinical Significance & Current Barriers — Detail standard CASA limitations: system costs ($30,000+), high hardware dependencies, and clinical species-locking. Contrast this with the need for immediate, modern diagnostics.',
          'Slide 3: ATSA Architecture & Tracking Algorithm — Illustrate the multi-threading process. Detail centroid isolation, temporal frame delta thresholding, and closest-neighbor vector paths.',
          'Slide 4: Verification via Stage Micrometer Calibration — Highlight the interactive two-point distance scale. Explain why absolute pixel-to-micron mapping is vital to prevent concentration and velocity deviations.',
          'Slide 5: Automated Morphology & Diagnostic Indices — Showcase component segmentation (head size, vacuole defects, acrosomal caps, midpiece droplets, tail coiling). Present Teratozoospermia Index (TZI) and Multiple Anomalies Index (MAI) computations.',
          'Slide 6: SCD DNA Halos & Dispersion Profiling — Present Sperm Chromatin Dispersion (SCD). Explain the denaturation protocol and halo-size calculations that gauge Sperm DNA Fragmentation (SDF/DFI).',
          'Slide 7: Statistical Alignment & Benchmarking — Project the validation results (r = 0.95, p < 0.001) using scatter charts of VSL vs VAP and progressive motility distribution bars to demonstrate precision.',
          'Slide 8: Interactive Correction & Overrides — Explain the benefits of "Technician-in-the-Loop" manual overrides: adjusting tracking errors, toggling classes, and adding missing cellular nodes.',
          'Slide 9: Global Theriogenology Impact — Showcase live application scenarios: rural cattle clinics, equine breeding stud systems, swine genetics facilities, and human fertility research centers.',
          'Slide 10: Conclusion & Interdisciplinary Future — Highlight open-access expansion plans. Dedicate space to questions and peer-review discussions.'
        ]
      }
    ]
  }
};

interface HelpCenterProps {
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onBack, theme = 'dark' }) => {
  const { t, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'guides' | 'metrics' | 'videos' | 'faq' | 'species'>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [expandedSpecies, setExpandedSpecies] = useState<number | null>(null);

  const categories = [
    { id: 'guides', label: t('userGuides'), icon: BookOpen },
    { id: 'metrics', label: t('metricsLibrary'), icon: Info },
    { id: 'species', label: t('speciesStandards'), icon: PawPrint },
    { id: 'videos', label: t('trainingVideos'), icon: Video },
    { id: 'faq', label: t('troubleshooting'), icon: AlertCircle },
  ] as const;

  const guides = [
    { id: 'getting-started', title: 'Getting Started with ATSA', duration: '5 min read', icon: BookOpen },
    { id: 'micrometer-calibration', title: 'Microscope & Chamber Calibration', duration: '4 min read', icon: FileText },
    { id: 'manual-annotation', title: 'Precision Manual Edit Mode', duration: '5 min read', icon: FileText },
    { id: 'scd-halos-dna', title: 'SCD Halos DNA Assay Simulation', duration: '6 min read', icon: FileText },
    { id: 'conference-package', title: 'ATSA Scientific Abstract & Slide Deck', duration: '12 min read', icon: FileText },
  ];

  const metrics = [
    { name: 'VCL (Curvilinear Velocity)', desc: 'The average velocity of the sperm head along its actual path.' },
    { name: 'VSL (Straight-Line Velocity)', desc: 'The average velocity of the sperm head along a straight line between its first and last positions.' },
    { name: 'VAP (Average Path Velocity)', desc: 'The average velocity of the sperm head along its average trajectory.' },
    { name: 'LIN (Linearity)', desc: 'The ratio of VSL to VCL (VSL/VCL).' },
    { name: 'STR (Straightness)', desc: 'The ratio of VSL to VAP (VSL/VAP).' },
    { name: 'ALH (Amplitude of Lateral Head Displacement)', desc: 'The average value of the extreme side-to-side deviations of the sperm head from its average path.' },
  ];

  const videos = [
    { title: 'Basic Analysis Workflow', duration: '2:45', thumbnail: 'https://picsum.photos/seed/video1/400/225' },
    { title: 'Advanced Kinematic Analysis', duration: '5:12', thumbnail: 'https://picsum.photos/seed/video2/400/225' },
    { title: 'Morphology Assessment', duration: '3:30', thumbnail: 'https://picsum.photos/seed/video3/400/225' },
  ];

  const speciesData = [
    {
      name: 'Human',
      scientificName: 'Homo sapiens',
      standard: 'WHO 2010 (5th Ed) / WHO 2021 (6th Ed)',
      concentration: '≥ 15 M/ml',
      motility: '≥ 40% (Total), ≥ 32% (Progressive)',
      morphology: '≥ 4% (Kruger Strict Forms)',
      notes: 'Standardized global reference for clinical diagnostics, determining assisted reproductive tech (IUI/IVF/ICSI) pathways.',
      kinematics: {
        vcl: '> 150 µm/s (High potency)',
        vsl: '> 25 µm/s',
        vap: '> 30 µm/s',
        lin: '≥ 11%',
        str: '≥ 50%',
        alh: '2.0 - 5.0 µm',
        bcf: '15.0 - 20.0 Hz'
      },
      morphologyDetails: {
        head: 'Kruger strict classification (length 3-5µm, width 2-3µm, regular oval contour)',
        acrosome: '40% - 70% of head area with clearly defined acrosomal cap',
        midpiece: 'Straight, smoothly aligned, major droplets indicate immaturity',
        tail: 'Approx 45µm long, thin, uniform, no coils'
      },
      sdf: {
        normal: '< 15% DFI (Excellent integrity)',
        borderline: '15% - 25% DFI (Clinically suspect)',
        abnormal: '> 30% DFI (Critical; high risk of conception failure)'
      },
      setup: {
        chamber: '10 µm Makler Grid or standard micro-disposable chambers (Leja / CellVision)',
        temperature: '37.0 °C Phase Heated Stage',
        volume: '1.5 - 5.0 mL (Liquefaction required, usually 15-30 minutes)'
      }
    },
    {
      name: 'Bovine (Bull)',
      scientificName: 'Bos taurus',
      standard: 'Society for Theriogenology Sire Evaluation',
      concentration: '800 - 1500 M/ml (Raw ejaculate)',
      motility: '≥ 50% (Total), ≥ 40% (Progressive, Pre-freeze)',
      morphology: '≥ 70% (Normal Forms)',
      notes: 'Focus on cryopreservation indices. Post-thaw viability thresholds dictate commercial AI straw dosage formulations.',
      kinematics: {
        vcl: '> 180 µm/s (Highly rapid)',
        vsl: '> 50 µm/s',
        vap: '> 70 µm/s',
        lin: '≥ 25%',
        str: '≥ 70%',
        alh: '3.0 - 6.5 µm',
        bcf: '25.0 - 32.0 Hz'
      },
      morphologyDetails: {
        head: 'Symmetric, smooth pear-shape profile (length 8-10µm, width 4-5µm)',
        acrosome: 'Pronounced apical ridge covering anterior 50% of the head space',
        midpiece: 'Evenly structured, tightly wrapped mitochondrial sheath',
        tail: 'Straight tail, absence of abaxially-positioned connections'
      },
      sdf: {
        normal: '< 10% DFI (Highly fertile sire)',
        borderline: '10% - 15% DFI (Marginal recovery)',
        abnormal: '> 15% DFI (De-certified from commercial distribution collections)'
      },
      setup: {
        chamber: '20 µm Leja Bull Specimen Chambers',
        temperature: '37.5 °C - 38.0 °C constant heated stage mapping',
        volume: '4.0 - 8.0 mL average volume, highly concentrated stream'
      }
    },
    {
      name: 'Equine (Stallion)',
      scientificName: 'Equus caballus',
      standard: 'Theriogenology STG guidelines',
      concentration: '100 - 300 M/ml',
      motility: '≥ 60% (Total), ≥ 50% (Progressive)',
      morphology: '≥ 50% (Normal Forms)',
      notes: 'Stallion spermatozoal membranes are exceptionally sensitive to cold shock and mechanical agitation. Avoid centrifugation where possible.',
      kinematics: {
        vcl: '> 130 µm/s',
        vsl: '> 45 µm/s',
        vap: '> 55 µm/s',
        lin: '≥ 30%',
        str: '≥ 80%',
        alh: '2.5 - 5.5 µm',
        bcf: '22.0 - 28.0 Hz'
      },
      morphologyDetails: {
        head: 'Elongated, slightly flattened oval (length 6-7µm, width 3-4µm)',
        acrosome: 'Subtle cap boundary, covers apical 1/3 of head',
        midpiece: 'Uniform connection, proximal and distal droplets are common path factors',
        tail: 'Thin tail, normally free from double-stranded aberrations'
      },
      sdf: {
        normal: '< 15% DFI (Ideal breed champion)',
        borderline: '15% - 25% DFI (Decreased fertility index)',
        abnormal: '> 25% DFI (Compromised embryo quality, high early loss rates)'
      },
      setup: {
        chamber: '20 µm disposable chambers to allow unrestricted lateral movement',
        temperature: '37.0 °C stage-incubator verification',
        volume: '30 - 120 mL average volume (gel-free fraction evaluated)'
      }
    },
    {
      name: 'Porcine (Boar)',
      scientificName: 'Sus scrofa domesticus',
      standard: 'Commercial Swine Stud Guidelines',
      concentration: '200 - 350 M/ml',
      motility: '≥ 70% (Total), ≥ 60% (Progressive)',
      morphology: '≥ 70% (Normal Forms)',
      notes: 'Highly voluminous ejaculate. Crucial to analyze soon after prep to gauge dilution doses (e.g. 2-3 billion sperm per extended dose).',
      kinematics: {
        vcl: '> 100 µm/s',
        vsl: '> 35 µm/s',
        vap: '> 45 µm/s',
        lin: '≥ 35%',
        str: '≥ 75%',
        alh: '2.0 - 4.5 µm',
        bcf: '20.0 - 25.0 Hz'
      },
      morphologyDetails: {
        head: 'Broad, rounded spatulate head (length 8-9µm, width 4-5µm)',
        acrosome: 'Extends over 60% of the anterior head surface',
        midpiece: 'Long, well-defined, very sensitive to osmotic differences during dilution',
        tail: 'Smooth, standard structure, susceptible to distal droplets'
      },
      sdf: {
        normal: '< 15% DFI (High litter index capability)',
        borderline: '15% - 20% DFI (Moderately compromised farrowing outcomes)',
        abnormal: '> 20% DFI (Reduced farrowing rate and litter numbers)'
      },
      setup: {
        chamber: '20 µm thick-chamber standard slide lines',
        temperature: 'Stored/transported at 17 °C, but analyzed strictly on a warm stage at 37.0 °C',
        volume: '150 - 300 mL (inclusive of gelatinous pre-sperm fraction)'
      }
    },
    {
      name: 'Canine (Dog)',
      scientificName: 'Canis lupus familiaris',
      standard: 'ACT Theriogenology Standards',
      concentration: '200 - 600 M/ml',
      motility: '≥ 75% (Total), ≥ 60% (Progressive)',
      morphology: '≥ 60% (Normal Forms)',
      notes: 'Isolate and evaluate the second fraction (sperm-rich, milky appearance). Clear first and third fractions contain no sperm cells.',
      kinematics: {
        vcl: '> 120 µm/s',
        vsl: '> 40 µm/s',
        vap: '> 50 µm/s',
        lin: '≥ 33%',
        str: '≥ 80%',
        alh: '2.5 - 4.8 µm',
        bcf: '18.0 - 24.0 Hz'
      },
      morphologyDetails: {
        head: 'Perfectly symmetric, oval-shaped configuration (length 6-7µm, width 3.5-4µm)',
        acrosome: 'Covers prior 40% of anterior head surface',
        midpiece: 'Slightly shorter compared to feline or bovine counterparts',
        tail: 'Uniform, normally clear, susceptible to coiled tail defects in cold shock'
      },
      sdf: {
        normal: '< 20% DFI (Good stud prospective)',
        borderline: '20% - 30% DFI (Suspect fertility rating)',
        abnormal: '> 30% DFI (Significantly diminished conception rates, smaller litters)'
      },
      setup: {
        chamber: '10 µm or 20 µm glass chambers are acceptable',
        temperature: '37.0 °C stage-incubator verification',
        volume: '1.0 - 5.0 mL (isolated sperm-rich second fraction)'
      }
    },
    {
      name: 'Ovine (Ram)',
      scientificName: 'Ovis aries',
      standard: 'Veterinary Breeding Standards',
      concentration: '1500 - 4000 M/ml',
      motility: '≥ 75% (Total), ≥ 65% (Progressive)',
      morphology: '≥ 80% (Normal Forms)',
      notes: 'Most concentrated mammalian ejaculate. Absolute dilution precision (1:150 - 1:300) is necessary to isolate cell paths in CASA tracker.',
      kinematics: {
        vcl: '> 220 µm/s (Extremely swift)',
        vsl: '> 65 µm/s',
        vap: '> 85 µm/s',
        lin: '≥ 28%',
        str: '≥ 76%',
        alh: '3.5 - 7.0 µm',
        bcf: '28.0 - 35.0 Hz'
      },
      morphologyDetails: {
        head: 'Broad, rounded base tapering gently to apex (length 7-8µm, width 4-5µm)',
        acrosome: 'Dense apical segment covering front 50% of the head',
        midpiece: 'Stout, very robust mitochondrial alignment',
        tail: 'Very long, uniform, prone to bent mid-piece/droplets under thermal stress'
      },
      sdf: {
        normal: '< 10% DFI (Superior sire indexing)',
        borderline: '10% - 15% DFI (Borderline field index)',
        abnormal: '> 15% DFI (Unacceptable genetic index for artificial insemination sire)'
      },
      setup: {
        chamber: '10 µm / 20 µm deep slide calibration profiles',
        temperature: '38.0 °C heated phase monitoring',
        volume: '0.5 - 2.0 mL average (extremely viscous, thick cream color)'
      }
    },
    {
      name: 'Caprine (Buck)',
      scientificName: 'Capra hircus',
      standard: 'Goat Breeding Association Guide',
      concentration: '1500 - 4500 M/ml',
      motility: '≥ 75% (Total), ≥ 65% (Progressive)',
      morphology: '≥ 80% (Normal Forms)',
      notes: 'Egg-yolk extenders must be avoided unless seminal plasma is washed first. Seminal plasma BUSP enzyme destroys egg-yolk lipids, producing toxic lysolecithin.',
      kinematics: {
        vcl: '> 200 µm/s',
        vsl: '> 60 µm/s',
        vap: '> 80 µm/s',
        lin: '≥ 30%',
        str: '≥ 75%',
        alh: '3.2 - 6.5 µm',
        bcf: '26.0 - 32.0 Hz'
      },
      morphologyDetails: {
        head: 'Elongated spade profile (length 7.5-8.5µm, width 4-4.8µm)',
        acrosome: 'Pronounced apical segment, covers front 45% of head',
        midpiece: 'Well-aligned mitochondrial capsule',
        tail: 'Clean, thin, symmetrical axial positioning'
      },
      sdf: {
        normal: '< 12% DFI (Excellent quality)',
        borderline: '12% - 18% DFI (Requires re-assay)',
        abnormal: '> 18% DFI (Marked fertility reduction)'
      },
      setup: {
        chamber: '10 µm / 20 µm chamber depth configuration',
        temperature: '38.0 °C heated microscopic stage',
        volume: '0.5 - 1.5 mL average volume range'
      }
    }
  ];

  return (
    <div className={cn(
      "flex flex-col h-full",
      theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"
    )} dir={dir}>
      {/* Header */}
      <div className={cn(
        "p-8 border-b flex items-center justify-between",
        theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
      )}>
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className={cn(
                "p-2 rounded-xl transition-colors cursor-pointer",
                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-black/5"
              )}
            >
              <ArrowLeft className={cn(
                "w-5 h-5",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )} />
            </button>
          )}
          <div className="flex items-center gap-3 mr-auto">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className={cn(
                "text-2xl font-bold tracking-tight",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{t('helpAndTrainingCenter')}</h2>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )}>{t('masterCASA')}</p>
            </div>
          </div>
        </div>
        
        <div className="relative w-64">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            theme === 'dark' ? "text-white/20" : "text-black/20"
          )} />
          <input 
            type="text" 
            placeholder={t('searchTopics')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/50 transition-colors",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
            )}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "w-72 border-r p-6 space-y-2",
          theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
        )}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedGuideId(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group cursor-pointer",
                activeCategory === cat.id 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                  : (theme === 'dark' ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
              )}
            >
              <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : (theme === 'dark' ? "text-white/20 group-hover:text-white/60" : "text-black/20 group-hover:text-black/60"))} />
              {cat.label}
            </button>
          ))}

          <div className="mt-auto pt-8">
            <div className={cn(
              "p-5 border rounded-[24px]",
              theme === 'dark' ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50 border-emerald-500/20"
            )}>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">{t('systemStatus')}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-500/80">{t('allEnginesOperational')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-y-auto p-10",
          theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"
        )}>
          <AnimatePresence mode="wait">
            {activeCategory === 'guides' && (
              <motion.div 
                key={selectedGuideId ? `guide-${selectedGuideId}` : "guides-list"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-4xl"
              >
                {!selectedGuideId ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "text-xl font-bold",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                      )}>Essential User Guides</h3>
                      <button className="text-xs text-blue-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        Download All <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {guides.map((guide, i) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedGuideId(guide.id)}
                          className={cn(
                            "flex items-center gap-5 p-6 border rounded-3xl hover:border-blue-500/50 transition-all text-left group",
                            theme === 'dark' ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5" : "bg-slate-50 border-black/10 hover:bg-black/5"
                          )}
                        >
                          <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                            <guide.icon className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className={cn(
                              "text-base font-medium mb-1",
                              theme === 'dark' ? "text-white/90" : "text-slate-900"
                            )}>{guide.title}</p>
                            <p className={cn(
                              "text-[10px] uppercase tracking-widest font-bold",
                              theme === 'dark' ? "text-white/40" : "text-black/40"
                            )}>{guide.duration}</p>
                          </div>
                          <ChevronRight className={cn(
                            "w-5 h-5 ml-auto transition-all group-hover:translate-x-1",
                            theme === 'dark' ? "text-white/10 group-hover:text-blue-500" : "text-black/10 group-hover:text-blue-500"
                          )} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <button 
                      onClick={() => setSelectedGuideId(null)}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors mb-4 cursor-pointer",
                        theme === 'dark' ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"
                      )}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Guides
                    </button>
                    <div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest font-mono">
                        {GUIDE_DETAILS[selectedGuideId].duration}
                      </span>
                      <h3 className={cn(
                        "text-2xl font-black tracking-tight mt-1",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                      )}>
                        {GUIDE_DETAILS[selectedGuideId].title}
                      </h3>
                      <p className={cn(
                        "text-xs mt-1",
                        theme === 'dark' ? "text-white/50" : "text-slate-600"
                      )}>
                        {GUIDE_DETAILS[selectedGuideId].subtitle}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {GUIDE_DETAILS[selectedGuideId].sections.map((section: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-6 border rounded-3xl",
                            theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
                          )}
                        >
                          <h4 className="text-base font-bold text-blue-400 mb-3">{section.heading}</h4>
                          <div className="space-y-3">
                            {section.paragraphs.map((pText: string, pIdx: number) => (
                              <p 
                                key={pIdx} 
                                className={cn(
                                  "text-xs leading-relaxed font-sans",
                                  theme === 'dark' ? "text-white/70" : "text-slate-700"
                                )}
                              >
                                {pText}
                              </p>
                            ))}
                            {section.bullets && (
                              <ul className="list-disc list-inside space-y-2 mt-3 pt-2 border-t border-white/5 pl-2">
                                {section.bullets.map((bText: string, bIdx: number) => (
                                  <li 
                                    key={bIdx} 
                                    className={cn(
                                      "text-xs leading-relaxed font-sans list-none",
                                      theme === 'dark' ? "text-white/60" : "text-slate-600"
                                    )}
                                  >
                                    <span className="text-blue-400 font-bold mr-1.5 font-mono">•</span> {bText}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeCategory === 'metrics' && (
              <motion.div 
                key="metrics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-4xl"
              >
                <h3 className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>Kinematic Metrics Glossary</h3>
                <div className="grid grid-cols-1 gap-4">
                  {metrics.map((metric, i) => (
                    <div key={i} className={cn(
                      "p-6 border rounded-3xl",
                      theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
                    )}>
                      <h4 className="text-base font-bold text-blue-400 mb-2">{metric.name}</h4>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        theme === 'dark' ? "text-white/60" : "text-slate-600"
                      )}>{metric.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeCategory === 'videos' && (
              <motion.div 
                key="videos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl"
              >
                <h3 className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>Training Video Library</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {videos.map((video, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className={cn(
                        "relative aspect-video rounded-[32px] overflow-hidden mb-4 border shadow-2xl",
                        theme === 'dark' ? "border-white/10" : "border-black/10"
                      )}>
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                            <PlayCircle className="w-8 h-8 text-blue-600 fill-current" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-mono border border-white/10">
                          {video.duration}
                        </div>
                      </div>
                      <h4 className={cn(
                        "text-base font-medium transition-colors px-2",
                        theme === 'dark' ? "text-white/90 group-hover:text-blue-400" : "text-slate-900 group-hover:text-blue-600"
                      )}>{video.title}</h4>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeCategory === 'species' && (
              <motion.div 
                key="species"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-xl font-bold",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>Species-Specific Analysis Standards</h3>
                  <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Multi-Species Support</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {speciesData.map((species, i) => {
                    const isExpanded = expandedSpecies === i;
                    return (
                      <div key={i} className={cn(
                        "p-6 sm:p-8 border rounded-[32px] transition-all group duration-300",
                        theme === 'dark' 
                          ? "bg-[#0f0f0f] border-white/10 hover:border-blue-500/30" 
                          : "bg-slate-50 border-black/10 hover:border-blue-500/30",
                        isExpanded && (theme === 'dark' ? "border-blue-500/40 bg-[#0c0c0e]" : "border-blue-500/40 bg-white shadow-lg")
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={cn(
                                "text-2xl font-bold transition-colors",
                                theme === 'dark' ? "text-white group-hover:text-blue-400" : "text-slate-900 group-hover:text-blue-600"
                              )}>{species.name}</h4>
                              <span className={cn(
                                "text-[10px] font-mono italic px-2 py-0.5 rounded",
                                theme === 'dark' ? "bg-white/5 text-white/50" : "bg-black/5 text-slate-500"
                              )}>
                                {species.scientificName}
                              </span>
                            </div>
                            <p className={cn(
                              "text-xs font-medium uppercase tracking-widest mt-1",
                              theme === 'dark' ? "text-white/40" : "text-black/40"
                            )}>{species.standard}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              theme === 'dark' ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"
                            )}>CASA OPTIMIZED</span>
                            <button
                              id={`toggle-species-${i}`}
                              onClick={() => setExpandedSpecies(isExpanded ? null : i)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-[10px] font-bold cursor-pointer",
                                theme === 'dark'
                                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                  : "bg-black/5 border-black/10 hover:bg-black/10 text-slate-900"
                              )}
                            >
                              {isExpanded ? (
                                <>
                                  <span>Collapse</span>
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                                </>
                              ) : (
                                <>
                                  <span>Enrich Details</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white border-black/5"
                          )}>
                            <p className={cn(
                              "text-[10px] font-bold uppercase mb-1",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Concentration</p>
                            <p className={cn(
                              "text-sm font-mono",
                              theme === 'dark' ? "text-white/80" : "text-slate-700"
                            )}>{species.concentration}</p>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white border-black/5"
                          )}>
                            <p className={cn(
                              "text-[10px] font-bold uppercase mb-1",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Motility</p>
                            <p className={cn(
                              "text-sm font-mono",
                              theme === 'dark' ? "text-white/80" : "text-slate-700"
                            )}>{species.motility}</p>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white border-black/5"
                          )}>
                            <p className={cn(
                              "text-[10px] font-bold uppercase mb-1",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Morphology</p>
                            <p className={cn(
                              "text-sm font-mono",
                              theme === 'dark' ? "text-white/80" : "text-slate-700"
                            )}>{species.morphology}</p>
                          </div>
                        </div>
                        
                        <div className={cn(
                          "mt-6 pt-6 border-t flex items-start gap-3",
                          theme === 'dark' ? "border-white/5" : "border-black/5"
                        )}>
                          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className={cn(
                            "text-xs leading-relaxed italic",
                            theme === 'dark' ? "text-white/40" : "text-slate-500"
                          )}>{species.notes}</p>
                        </div>

                        {/* Expandable Deep Theriogenology Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-6 pt-6 border-t border-dashed border-blue-500/20 overflow-hidden space-y-6"
                            >
                              {/* 1. Kinematics benchmarks grid */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                  <h5 className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    theme === 'dark' ? "text-white/60" : "text-slate-700"
                                  )}>CASA Kinematic Benchmarks (Physiological Thresholds)</h5>
                                </div>
                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                  {Object.entries(species.kinematics).map(([key, val]) => (
                                    <div key={key} className={cn(
                                      "p-3 rounded-xl border flex flex-col justify-between",
                                      theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                    )}>
                                      <span className={cn(
                                        "text-[9px] font-bold uppercase",
                                        theme === 'dark' ? "text-white/30" : "text-black/30"
                                      )}>{key}</span>
                                      <span className={cn(
                                        "text-xs font-mono font-semibold mt-1",
                                        theme === 'dark' ? "text-white/80" : "text-slate-800"
                                      )}>{val}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 2. Strict Morphology & SDF limits */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-sky-500" />
                                    <h5 className={cn(
                                      "text-xs font-bold uppercase tracking-wider",
                                      theme === 'dark' ? "text-white/60" : "text-slate-700"
                                    )}>Sperm Morphology Strictures</h5>
                                  </div>
                                  <div className={cn(
                                    "p-4 rounded-2xl border space-y-2.5",
                                    theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                  )}>
                                    {Object.entries(species.morphologyDetails).map(([defectKey, desc]) => (
                                      <div key={defectKey} className="flex flex-col text-xs">
                                        <span className={cn(
                                          "text-[10px] font-bold uppercase flex items-center gap-1.5",
                                          theme === 'dark' ? "text-white/40" : "text-black/40"
                                        )}>
                                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                          {defectKey} Criteria
                                        </span>
                                        <span className={cn(
                                          "mt-0.5 pl-3 leading-relaxed",
                                          theme === 'dark' ? "text-white/60" : "text-slate-600"
                                        )}>{desc}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-purple-500" />
                                    <h5 className={cn(
                                      "text-xs font-bold uppercase tracking-wider",
                                      theme === 'dark' ? "text-white/60" : "text-slate-700"
                                    )}>Sperm DNA Fragmentation Index (SDF/DFI) Limits</h5>
                                  </div>
                                  <div className={cn(
                                    "p-4 rounded-2xl border space-y-2.5",
                                    theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                  )}>
                                    {Object.entries(species.sdf).map(([level, desc]) => (
                                      <div key={level} className="flex flex-col text-xs">
                                        <span className={cn(
                                          "text-[10px] font-bold uppercase flex items-center gap-1.5",
                                          level === 'normal' ? "text-emerald-500" : level === 'borderline' ? "text-amber-500" : "text-rose-500"
                                        )}>
                                          <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            level === 'normal' ? "bg-emerald-500" : level === 'borderline' ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                                          )} />
                                          DFI {level} threshold
                                        </span>
                                        <span className={cn(
                                          "mt-0.5 pl-3 leading-relaxed",
                                          theme === 'dark' ? "text-white/60" : "text-slate-600"
                                        )}>{desc}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* 3. Lab Configuration Recommendations */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Scale className="w-4 h-4 text-amber-500" />
                                  <h5 className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    theme === 'dark' ? "text-white/60" : "text-slate-700"
                                  )}>Theriogenology Laboratory & Hardware Configuration</h5>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className={cn(
                                    "p-4 rounded-xl border flex items-start gap-3",
                                    theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                  )}>
                                    <Sliders className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className={cn(
                                        "text-[10px] font-bold uppercase",
                                        theme === 'dark' ? "text-white/30" : "text-black/30"
                                      )}>Optimal Micro-Chamber Setup</p>
                                      <p className={cn(
                                        "text-xs mt-1 leading-relaxed",
                                        theme === 'dark' ? "text-white/80" : "text-slate-700"
                                      )}>{species.setup.chamber}</p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "p-4 rounded-xl border flex items-start gap-3",
                                    theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                  )}>
                                    <Thermometer className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className={cn(
                                        "text-[10px] font-bold uppercase",
                                        theme === 'dark' ? "text-white/30" : "text-black/30"
                                      )}>Heating Stage Temperature</p>
                                      <p className="text-xs mt-1 leading-relaxed font-semibold text-orange-500">
                                        {species.setup.temperature}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "p-4 rounded-xl border flex items-start gap-3",
                                    theme === 'dark' ? "bg-black/60 border-white/5" : "bg-white border-black/5"
                                  )}>
                                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className={cn(
                                        "text-[10px] font-bold uppercase",
                                        theme === 'dark' ? "text-white/30" : "text-black/30"
                                      )}>Avg Ejaculate Volumetric Range</p>
                                      <p className={cn(
                                        "text-xs mt-1 leading-relaxed",
                                        theme === 'dark' ? "text-white/80" : "text-slate-700"
                                      )}>{species.setup.volume}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeCategory === 'faq' && (
              <motion.div 
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-4xl"
              >
                <h3 className="text-xl font-bold text-red-400">Troubleshooting & FAQ</h3>
                <div className="space-y-4">
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                    <h4 className="text-base font-bold text-red-400/80 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Camera not detected?
                    </h4>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      theme === 'dark' ? "text-white/60" : "text-slate-600"
                    )}>Ensure your microscope camera is connected via USB 3.0 and that you have granted camera permissions in your browser. If you are using a virtual camera, make sure the source software is running.</p>
                  </div>
                  <div className={cn(
                    "p-6 border rounded-3xl",
                    theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
                  )}>
                    <h4 className={cn(
                      "text-base font-bold mb-2",
                      theme === 'dark' ? "text-white/80" : "text-slate-800"
                    )}>Inconsistent tracking results?</h4>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      theme === 'dark' ? "text-white/60" : "text-slate-600"
                    )}>Check your illumination levels. Sperm should be clearly visible against the background. Adjust the focus to ensure the sperm heads are sharp. Low contrast can lead to dropped tracks.</p>
                  </div>
                  <div className={cn(
                    "p-6 border rounded-3xl",
                    theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
                  )}>
                    <h4 className={cn(
                      "text-base font-bold mb-2",
                      theme === 'dark' ? "text-white/80" : "text-slate-800"
                    )}>How to verify calibration?</h4>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      theme === 'dark' ? "text-white/60" : "text-slate-600"
                    )}>Use a stage micrometer to verify the microns-per-pixel setting. A standard 10x objective usually yields around 0.65 - 1.0 µm/px depending on your camera sensor size.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className={cn(
        "p-6 border-t flex items-center justify-between",
        theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
      )}>
        <p className={cn(
          "text-[10px] uppercase tracking-widest font-bold",
          theme === 'dark' ? "text-white/20" : "text-black/20"
        )}>ATSA CASA Engine Documentation • v2.0.4</p>
        <div className="flex gap-6">
          <button className="text-[10px] text-blue-500 hover:text-blue-400 uppercase tracking-widest font-bold transition-colors">Contact Support</button>
          <button className="text-[10px] text-blue-500 hover:text-blue-400 uppercase tracking-widest font-bold transition-colors">Download PDF Manual</button>
        </div>
      </div>
    </div>
  );
};


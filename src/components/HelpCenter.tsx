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
  PawPrint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface HelpCenterProps {
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onBack, theme = 'dark' }) => {
  const [activeCategory, setActiveCategory] = useState<'guides' | 'metrics' | 'videos' | 'faq' | 'species'>('guides');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'guides', label: 'User Guides', icon: BookOpen },
    { id: 'metrics', label: 'Metrics Library', icon: Info },
    { id: 'species', label: 'Species Standards', icon: PawPrint },
    { id: 'videos', label: 'Training Videos', icon: Video },
    { id: 'faq', label: 'Troubleshooting', icon: AlertCircle },
  ] as const;

  const guides = [
    { title: 'Getting Started with ATSA', duration: '5 min read', icon: FileText },
    { title: 'Calibrating your Microscope', duration: '3 min read', icon: FileText },
    { title: 'Sample Preparation Best Practices', duration: '8 min read', icon: FileText },
    { title: 'Animal Sample Handling Protocols', duration: '10 min read', icon: PawPrint },
    { title: 'Exporting Professional Reports', duration: '4 min read', icon: FileText },
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
      standard: 'WHO 2010 (5th Ed)',
      concentration: '> 15 M/ml',
      motility: '> 40% Total, > 32% Progressive',
      morphology: '> 4% Normal Forms',
      notes: 'Standardized global reference for clinical diagnostics.'
    },
    {
      name: 'Bovine (Bull)',
      standard: 'CASA Industry Standard',
      concentration: '500 - 1200 M/ml (Raw)',
      motility: '> 70% Progressive (Pre-freeze)',
      morphology: '> 80% Normal',
      notes: 'Focus on progressive motility for artificial insemination efficiency.'
    },
    {
      name: 'Equine (Stallion)',
      standard: 'Veterinary Guidelines',
      concentration: '150 - 300 M/ml',
      motility: '> 60% Total Motility',
      morphology: '> 50% Normal',
      notes: 'High sensitivity to temperature fluctuations during transport.'
    },
    {
      name: 'Porcine (Boar)',
      standard: 'Commercial Swine Standards',
      concentration: '200 - 300 M/ml',
      motility: '> 70% Total Motility',
      morphology: '> 75% Normal',
      notes: 'Analysis typically performed at 17°C - 20°C storage temperature.'
    },
    {
      name: 'Canine (Dog)',
      standard: 'Theriogenology Standards',
      concentration: '200 - 500 M/ml',
      motility: '> 70% Progressive',
      morphology: '> 60% Normal',
      notes: 'Includes assessment of three distinct fractions during ejaculation.'
    }
  ];

  return (
    <div className={cn(
      "flex flex-col h-full",
      theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"
    )}>
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
                "p-2 rounded-xl transition-colors",
                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-black/5"
              )}
            >
              <ArrowLeft className={cn(
                "w-5 h-5",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className={cn(
                "text-2xl font-bold tracking-tight",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Help & Training Center</h2>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )}>Master the ATSA CASA Engine and Laboratory Standards</p>
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
            placeholder="Search topics..."
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
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group",
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
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-500/80">All Engines Operational</span>
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
                key="guides"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-4xl"
              >
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
                    <button key={i} className={cn(
                      "flex items-center gap-5 p-6 border rounded-3xl hover:border-blue-500/50 transition-all text-left group",
                      theme === 'dark' ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5" : "bg-slate-50 border-black/10 hover:bg-black/5"
                    )}>
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
                  {speciesData.map((species, i) => (
                    <div key={i} className={cn(
                      "p-8 border rounded-[32px] transition-all group",
                      theme === 'dark' ? "bg-[#0f0f0f] border-white/10 hover:border-blue-500/30" : "bg-slate-50 border-black/10 hover:border-blue-500/30"
                    )}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className={cn(
                            "text-2xl font-bold transition-colors",
                            theme === 'dark' ? "text-white group-hover:text-blue-400" : "text-slate-900 group-hover:text-blue-600"
                          )}>{species.name}</h4>
                          <p className={cn(
                            "text-xs font-medium uppercase tracking-widest mt-1",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>{species.standard}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold",
                            theme === 'dark' ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"
                          )}>CASA OPTIMIZED</span>
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
                    </div>
                  ))}
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


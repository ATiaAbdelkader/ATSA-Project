export type Language = 'en' | 'fr' | 'ar';

export interface TranslationDict {
  [key: string]: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const translations: TranslationDict = {
  uploadVideo: {
    en: "Upload Video",
    fr: "Télécharger une Vidéo",
    ar: "تحميل فيديو"
  },
  // Brand & Login
  brandTitle: {
    en: "ATSA",
    fr: "ATSA",
    ar: "أطسا"
  },
  brandSubtitle: {
    en: "Advanced Tailored Sperm Analysis",
    fr: "Analyse Avancée et Personnalisée du Sperme",
    ar: "التحليل المتقدم والمخصص للحيوانات المنوية"
  },
  sloganPrefix: {
    en: "Precision in",
    fr: "La précision dans",
    ar: "الدقة في"
  },
  sloganHighlight: {
    en: "every movement.",
    fr: "chaque mouvement.",
    ar: "كل حركة."
  },
  systemOnline: {
    en: "System Online",
    fr: "Système en ligne",
    ar: "النظام متصل"
  },
  founder: {
    en: "Founder: Dr. Abdelkader Atia",
    fr: "Fondateur: Dr. Abdelkader Atia",
    ar: "المؤسس: د. عبد القادر عطية"
  },
  securityNoticeTitle: {
    en: "Security Notice",
    fr: "Avis de Sécurité",
    ar: "إشعار أمني"
  },
  securityNoticeDesc: {
    en: "This system is for authorized laboratory personnel only. All access attempts are logged and monitored for compliance.",
    fr: "Ce système est réservé uniquement au personnel de laboratoire autorisé. Toutes les tentatives d'accès sont enregistrées et surveillées pour des raisons de conformité.",
    ar: "هذا النظام مخصص لموظفي المختبر المعتمدين فقط. يتم تسجيل جميع محاولات الدخول ومراقبتها لضمان الامتثال والمسؤولية."
  },
  labAccess: {
    en: "Laboratory Access",
    fr: "Accès au Laboratoire",
    ar: "دخول المختبر"
  },
  labAccessDesc: {
    en: "Enter your credentials to begin your session.",
    fr: "Entrez vos identifiants pour démarrer votre session.",
    ar: "أدخل بيانات الاعتماد لبدء جلستك."
  },
  labId: {
    en: "Laboratory ID",
    fr: "Identifiant du Laboratoire",
    ar: "معرف المختبر"
  },
  accessKey: {
    en: "Access Key",
    fr: "Clé d'Accès",
    ar: "مفتاح المرور"
  },
  required: {
    en: "Required",
    fr: "Requis",
    ar: "مطلوب"
  },
  forgotKey: {
    en: "Forgot Key?",
    fr: "Clé oubliée ?",
    ar: "هل نسيت المفتاح؟"
  },
  rememberWorkstation: {
    en: "Remember this workstation",
    fr: "Se souvenir de ce poste de travail",
    ar: "تذكر محطة العمل هذه"
  },
  authGoogle: {
    en: "Authenticate with Google",
    fr: "S'authentifier avec Google",
    ar: "تسجيل الدخول عبر Google"
  },
  reviewerBypass: {
    en: "reviewer bypass portal",
    fr: "portail de contournement pour jury",
    ar: "بوابة الالتفاف والتقييم للجنة التحكيم"
  },
  instantJuryAccess: {
    en: "Instant Jury Access (By-Pass)",
    fr: "Accès Instantané Jury (Contourner)",
    ar: "دخول فوري للجنة التحكيم (تخطي)"
  },

  // Navigation Items
  dashboard: {
    en: "Dashboard",
    fr: "Tableau de Bord",
    ar: "لوحة التحكم"
  },
  casaEngine: {
    en: "CASA Engine",
    fr: "Moteur CASA",
    ar: "محرك كاسا (CASA)"
  },
  patientHistory: {
    en: "Patient History",
    fr: "Historique Patient",
    ar: "سجل المرضى"
  },
  inventory: {
    en: "Inventory",
    fr: "Inventaire",
    ar: "المخزون"
  },
  helpOverview: {
    en: "Help & Training",
    fr: "Aide & Formation",
    ar: "المساعدة والتدريب"
  },
  settings: {
    en: "Settings",
    fr: "Paramètres",
    ar: "الإعدادات"
  },
  logout: {
    en: "Logout",
    fr: "Déconnexion",
    ar: "تسجيل الخروج"
  },

  // Main UI
  systemDate: {
    en: "System Date",
    fr: "Date Système",
    ar: "تاريخ النظام"
  },
  welcomeBack: {
    en: "Welcome back",
    fr: "Bon retour",
    ar: "مرحباً بك مجدداً"
  },
  systemReady: {
    en: "System Ready",
    fr: "Système Prêt",
    ar: "النظام جاهز"
  },
  precisionAnalysis: {
    en: "Precision CASA Analysis",
    fr: "Analyse Kinématique Précise CASA",
    ar: "تحليل الحركة الحيوي الدقيق (CASA)"
  },
  heroDescription: {
    en: "Process high-speed microscopy recordings instantly. System is fully optimized for Ovine, Caprine, and Bovine profiles adhering to WHO international standards.",
    fr: "Processez instantanément les enregistrements de microscopie à haute vitesse. Le système est optimisé pour les profils Ovins, Caprins et Bovins, respectant les normes de l'OMS.",
    ar: "معالجة تسجيلات المجهر عالية السرعة بشكل فوري ومباشر. تم تحسين وتخصيص النظام بالكامل للمواشي (الأغنام، الماعز، الأبقار) تماشياً مع معايير منظمة الصحة العالمية."
  },
  registerNewSample: {
    en: "Register New Sample",
    fr: "Enregistrer Échantillon",
    ar: "تسجيل عينة جديدة"
  },
  accessCasaEngine: {
    en: "Access CASA Engine",
    fr: "Accéder au Moteur CASA",
    ar: "أدخل محرك CASA"
  },

  // Feature features in Login
  feature1Title: {
    en: "AI-Powered CASA",
    fr: "CASA Propulsé par l'IA",
    ar: "تحليل كاسا المدعوم بالذكاء الاصطناعي"
  },
  feature1Desc: {
    en: "Real-time kinematic analysis with neural-network tracking.",
    fr: "Analyse cinématique en temps réel avec suivi par réseau de neurones.",
    ar: "تحليل حركي في الوقت الفعلي مع تتبع متقدم عبر الشبكات العصبية."
  },
  feature2Title: {
    en: "WHO Compliant",
    fr: "Conforme à l'OMS",
    ar: "متوافق مع معايير منظمة الصحة العالمية"
  },
  feature2Desc: {
    en: "Fully adheres to WHO 2010 laboratory standards.",
    fr: "Adhère pleinement aux normes de laboratoire OMS 2010.",
    ar: "ملتزم بالكامل بمعايير ومعمل المختبر الفني لمنظمة الصحة العالمية لعام 2010."
  },
  feature3Title: {
    en: "Multi-Species",
    fr: "Multi-Espèces",
    ar: "متعدد الأنواع والسلالات"
  },
  feature3Desc: {
    en: "Optimized profiles for Ovine, Caprine, and Bovine.",
    fr: "Profils optimisés pour les Ovins, Caprins et Bovins.",
    ar: "ملفات مخصصة ومحسنة للأغنام (Ovine)، الماعز (Caprine)، والأبقار (Bovine)."
  },
  feature4Title: {
    en: "Secure Vault",
    fr: "Coffre-fort Sécurisé",
    ar: "مخزن بيانات آمن"
  },
  feature4Desc: {
    en: "Enterprise-grade encryption for all patient records.",
    fr: "Chiffrement de niveau entreprise pour tous les dossiers des patients.",
    ar: "تشفير وحماية من الدرجة الأولى لجميع سجلات وملفات المرضى."
  },

  // Widgets dashboard
  statsToday: {
    en: "Samples Today",
    fr: "Échantillons Aujourd'hui",
    ar: "عينات اليوم"
  },
  avgProcessing: {
    en: "Avg Processing",
    fr: "Temps Moyen de Traitement",
    ar: "متوسط وقت المعالجة"
  },
  active: {
    en: "Active",
    fr: "Actif",
    ar: "نشط"
  },
  recentSpermAnalyses: {
    en: "Recent Sperm Analyses",
    fr: "Analyses de Sperme Récentes",
    ar: "تحليلات السائل المنوي الأخيرة"
  },
  batchExportSelected: {
    en: "Export Selected (PDF)",
    fr: "Exporter Sélection (PDF)",
    ar: "تصدير المحدد (PDF)"
  },
  batchModeEnabled: {
    en: "Batch Mode Enabled",
    fr: "Mode Lot Activé",
    ar: "تم تمكين وضع المعالجة بالدفعة"
  },
  batchMode: {
    en: "Batch Mode",
    fr: "Mode Lot",
    ar: "معالجة مجمعة"
  },
  id: {
    en: "ID",
    fr: "ID",
    ar: "المعرف"
  },
  date: {
    en: "Date",
    fr: "Date",
    ar: "التاريخ"
  },
  species: {
    en: "Species",
    fr: "Espèce",
    ar: "الفصيلة"
  },
  motility: {
    en: "Motility",
    fr: "Motilité",
    ar: "الحركة"
  },
  speed: {
    en: "Speed",
    fr: "Vitesse",
    ar: "السرعة"
  },
  rating: {
    en: "Rating",
    fr: "Évaluation",
    ar: "التقييم"
  },
  noAnalysesFound: {
    en: "No recent analyses found. Create or register a sample to start analysis.",
    fr: "Aucune analyse récente. Enregistrez un échantillon pour commencer.",
    ar: "لم يتم العثور على تحليلات حديثة. قم بتسجيل عينة للبدء في التحليل."
  },

  // Help & Troubleshooting alerts
  notifications: {
    en: "Notifications",
    fr: "Notifications",
    ar: "الإشعارات"
  },
  markAllRead: {
    en: "Mark all read",
    fr: "Tout marquer comme lu",
    ar: "تحديد الكل كمقروء"
  },
  noNotifications: {
    en: "No notifications yet",
    fr: "Aucune notification pour l'instant",
    ar: "لا توجد إشعارات بعد"
  },

  // CASA Engine Component translations
  backToDashboard: {
    en: "Back to Dashboard",
    fr: "Retour au Tableau de Bord",
    ar: "العودة للوحة التحكم"
  },
  runningCASAOn: {
    en: "Kinematics & Microscopic Fluid Tracking for",
    fr: "Cinématique & Suivi Fluidique Microscopique pour",
    ar: "تتبع حركة السوائل المجهرية والديناميكية لـ"
  },
  spermCameraMonitor: {
    en: "High-Speed Microscopic Capture Feed",
    fr: "Flux de Capture Microscopique Haute Vitesse",
    ar: "بث الالتقاط المجهري عالي السرعة"
  },
  simulationControl: {
    en: "Microscopic Capture Simulation Controls",
    fr: "Contrôles de Simulation de Capture Microscopique",
    ar: "أدوات التحكم في محاكاة الالتقاط المجهري"
  },
  startTrackingSim: {
    en: "Start Kinetic Tracking Process",
    fr: "Lancer le Suivi Cinétique",
    ar: "بدأ عملية التتبع الحركي"
  },
  pauseTrackingSim: {
    en: "Pause Tracking Analysis",
    fr: "Pause de l'Analyse Cinétique",
    ar: "إيقاف مؤقت للتحليل"
  },
  generateGeminiBrief: {
    en: "Generate AI Clinician Diagnostic Brief",
    fr: "Générer un Rapport Diagnostique Clinique IA",
    ar: "توليد التشخيص والتقرير الطبي بالذكاء الاصطناعي"
  },
  generatingGemini: {
    en: "Analyzing with Deep-Theriogenology Gemini Agent...",
    fr: "Analyse avec l'Agent Gemini Deep-Theriogenology...",
    ar: "جاري التحليل واستخراج التقرير الطبي عبر Gemini..."
  },
  velocityDistribution: {
    en: "Sperm Kinematic Parameters & Velocity Distributions",
    fr: "Paramètres Cinématiques & Distribution des Vitesses",
    ar: "معلمات الحركة وتوزيع سرعة الحيوانات المنوية"
  },
  spermsTrackedCount: {
    en: "Sperms Tracked",
    fr: "Spermatozoïdes Suivis",
    ar: "العدد المتتبع"
  },
  concentrationValue: {
    en: "Concentration",
    fr: "Concentration",
    ar: "التركيز"
  },
  normalMorphologyValue: {
    en: "Normal Morphology",
    fr: "Morphologie Normale",
    ar: "التشكل الطبيعي"
  },
  progressiveMotilityLabel: {
    en: "Progressive Motility",
    fr: "Motilité Progressive",
    ar: "الحركة التقدمية (PR)"
  },
  fastMotile: {
    en: "Fast Motile (Type A)",
    fr: "Motiles Rapides (Type A)",
    ar: "سريع الحركة (نوع أ)"
  },
  slowMotile: {
    en: "Slow Motile (Type B)",
    fr: "Motiles Lents (Type B)",
    ar: "بطيء الحركة (نوع ب)"
  },
  nonProgressive: {
    en: "Non-Progressive (Type C)",
    fr: "Non-Progressifs (Type C)",
    ar: "حركة غير تقدمية (نوع ج)"
  },
  immotileCells: {
    en: "Immotile (Type D)",
    fr: "Immobiles (Type D)",
    ar: "غير متحرك/ساكن (نوع د)"
  },
  dynamicTrajectories: {
    en: "Dynamic 3D Sperm Spermatozoa Trajectories",
    fr: "Trajectoires Dynamiques 3D des Spermatozoïdes",
    ar: "المسارات الحركية ثلاثية الأبعاد التفاعلية لحركة الخلايا"
  },
  reconstructPath: {
    en: "This panel reconstructs the real-time curvilinear path (VCL), straight-line path (VSL), and average path (VAP) to compute precise oscillation (WOB) and linearity (LIN) index percentages.",
    fr: "Ce panneau reconstruit la trajectoire curviligne (VCL), rectiligne (VSL) et moyenne (VAP) en temps réel pour calculer les indices d’oscillation (WOB) et de linéarité (LIN).",
    ar: "تقوم هذه اللوحة بإعادة تركيب المسار المنحني في الوقت الفعلي (VCL)، المسار المستقيم (VSL)، والمسار المتوسط (VAP) لحساب النسبة المئوية لمؤشر التذبذب (WOB) ومؤشر الخطيّة (LIN)."
  },

  // Sample Registration Modal
  registerSampleTitle: {
    en: "Register New Semen Specimen",
    fr: "Enregistrer Nouveau Prélèvement de Sperme",
    ar: "تسجيل عينة سائل منوي جديدة"
  },
  patientIdLabel: {
    en: "Patient/Animal ID",
    fr: "ID du Patient / de l'Animal",
    ar: "معرف الحيوان/المريض"
  },
  ownerFarm: {
    en: "Owner / Farm",
    fr: "Propriétaire / Ferme",
    ar: "المالك / المزرعة"
  },
  breedLine: {
    en: "Breed / Genetic Line",
    fr: "Race / Lignée Génétique",
    ar: "السلالة / السلالة الوراثية"
  },
  animalAge: {
    en: "Animal Age (Years)",
    fr: "Âge de l'Animal (Années)",
    ar: "عمر الحيوان (بالسنوات)"
  },
  collectionMethod: {
    en: "Collection Method",
    fr: "Méthode de Collecte",
    ar: "طريقة جمع العينة"
  },
  evaluatorName: {
    en: "Lead Evaluator / Scientist",
    fr: "Évaluateur Principal / Scientifique",
    ar: "المقيّم الرئيسي / الباحث"
  },
  artificialVagina: {
    en: "Artificial Vagina",
    fr: "Vagin Artificiel",
    ar: "المهبل الاصطناعي"
  },
  electroejaculation: {
    en: "Electroejaculation",
    fr: "Électroéjaculation",
    ar: "القذف الكهربائي"
  },
  manualStimulation: {
    en: "Manual Stimulation",
    fr: "Stimulation Manuelle",
    ar: "التحفيز اليدوي"
  },
  selectSpeciesProfile: {
    en: "Select Theriogenology Species Profile",
    fr: "Sélectionner le Profil de l'Espèce",
    ar: "اختر ملف فصيلة علم التناسل"
  },
  bovineLabel: {
    en: "Bovine (Bull / Cattle)",
    fr: "Bovin (Taureau / Bœuf)",
    ar: "البقر (الثور / الماشية)"
  },
  ovineLabel: {
    en: "Ovine (Ram / Sheep)",
    fr: "Ovin (Bélier / Mouton)",
    ar: "الغنم (الكبش / الضأن)"
  },
  caprineLabel: {
    en: "Caprine (Buck / Goat)",
    fr: "Caprin (Bouc / Chèvre)",
    ar: "الماعز (التيس / الماعز)"
  },
  canineLabel: {
    en: "Canine (Stud / Dog)",
    fr: "Canin (Chien)",
    ar: "الكلاب"
  },
  equineLabel: {
    en: "Equine (Stallion / Horse)",
    fr: "Équin (Étalon / Cheval)",
    ar: "الخيول (الفحل / الحصان)"
  },
  cancel: {
    en: "Cancel",
    fr: "Annuler",
    ar: "إلغاء El"
  },
  registerInitializeCASA: {
    en: "Register & Initialize CASA Engine",
    fr: "Enregistrer & Initialiser le Moteur CASA",
    ar: "تسجيل العينة وتجهيز محرك CASA"
  },

  // Patient History Component
  patientHistorySearchTitle: {
    en: "Theriogenology Chronological Record Search",
    fr: "Recherche de Dossier Chronologique Theriogenology",
    ar: "سجل بحث ملفات علم التناسل وعلاج العقم التاريخي"
  },
  searchPlaceholder: {
    en: "Enter Patient (Animal) ID... (e.g. BOV-204, RAM-92)",
    fr: "Entrez l'ID du Patient / de l'Animal... (ex : BOV-204, RAM-92)",
    ar: "أدخل معرف المريض/الحيوان... (مثال BOV-204, RAM-92)"
  },
  searchButton: {
    en: "Search Record",
    fr: "Rechercher",
    ar: "ابحث في السجلات"
  },
  spermVelocityOverTime: {
    en: "Sperm Kinematic & Velocity Trends Over Time",
    fr: "Tendances de Vitesse et Cinématique dans le Temps",
    ar: "اتجاهات السرعة والخصائص الحركية للخلايا بمرور الوقت"
  },
  previousAnalysesList: {
    en: "Previous Analysis List",
    fr: "Liste des Analyses Précédentes",
    ar: "قائمة التحليلات السابقة"
  },
  noHistoricalRecords: {
    en: "No historical records found for this patient. Verify the ID or create a new recording.",
    fr: "Aucun historique trouvé pour ce patient. Vérifiez l'ID ou lancez un enregistrement.",
    ar: "لم يتم العثور على سجلات تاريخية لهذا الحيوان. تأكد من المعرف أو قم بتسجيل عينة له."
  },

  // Inventory Management
  inventoryManagerTitle: {
    en: "Laboratory Consumables & Inventory Tracker",
    fr: "Suivi des Consommables & Inventaire de Laboratoire",
    ar: "متتبع مستهلكات ومخزون المختبر"
  },
  logNewItem: {
    en: "Log New Contained Item",
    fr: "Ajouter un Matériel/Consommable",
    ar: "تسجيل مادة أو مستهلك جديد"
  },
  itemName: {
    en: "Item Name",
    fr: "Nom de l'Article",
    ar: "اسم المادة"
  },
  category: {
    en: "Category",
    fr: "Catégorie",
    ar: "الفئة"
  },
  quantity: {
    en: "Quantity",
    fr: "Quantité",
    ar: "الكمية"
  },
  unit: {
    en: "Unit",
    fr: "Unité",
    ar: "الوحدة"
  },
  expiryDate: {
    en: "Expiry Date",
    fr: "Date de Péremption",
    ar: "تاريخ انتهاء الصلاحية"
  },
  logItemButton: {
    en: "Log Stock Addition",
    fr: "Ajouter au Stock",
    ar: "تسجيل المضافة للمخزن"
  },
  expiryAlerts: {
    en: "Critical Expiry & Quantity Alerts",
    fr: "Alertes Critiques de Péremption & Quantité",
    ar: "أخطار انتهاء الصلاحية والكميات الحرجة"
  },
  reagents: {
    en: "Reagents",
    fr: "Réactifs",
    ar: "الكواشف والمحاليل"
  },
  disposables: {
    en: "Disposables",
    fr: "Consommables jetables",
    ar: "أدوات أحادية الاستخدام"
  },
  equipment: {
    en: "Equipment",
    fr: "Équipement",
    ar: "المعدات والأجهزة"
  },
  others: {
    en: "Others",
    fr: "Autres",
    ar: "أخرى"
  },
  criticalUrgent: {
    en: "CRITICAL ACTION REQUIRED",
    fr: "ACTION CRITIQUE REQUISE",
    ar: "إجراء عاجل ومهم مطلوب"
  },
  runningLow: {
    en: "Running critically low in supply block. Reorder immediately.",
    fr: "Stock extrêmement bas dans le bloc d'approvisionnement.",
    ar: "نفدت الكمية المتاحة بشكل حرج في المخزن الدولي. أعد الطلب فوراً."
  },
  // CASA workspace and tabs
  tabLive: {
    en: "Live",
    fr: "Direct",
    ar: "البث المباشر"
  },
  tabKinematics: {
    en: "Kinematics",
    fr: "Cinématique",
    ar: "حركية الخلايا"
  },
  tabMorphology: {
    en: "Morphology",
    fr: "Morphologie",
    ar: "شكل الخلايا"
  },
  tabVitality: {
    en: "Vitality",
    fr: "Vitalité",
    ar: "الحيوية والعيش"
  },
  tabSdf: {
    en: "SDF Halo",
    fr: "SDF Halo",
    ar: "تكسر الحمض"
  },
  tabAi: {
    en: "AI Analyst",
    fr: "Analyste IA",
    ar: "محلل الذكاء"
  },
  tabReport: {
    en: "Report",
    fr: "Rapport",
    ar: "التقرير النهائي"
  },
  tabHistory: {
    en: "History",
    fr: "Historique",
    ar: "السجل"
  },
  tabCalculator: {
    en: "Dosing",
    fr: "Dosage",
    ar: "الجرعات"
  },
  tabValidation: {
    en: "Validation",
    fr: "Validation",
    ar: "الاعتماد"
  },
  neuralNetworkActive: {
    en: "Neural Network Active",
    fr: "Réseau de Neurones Actif",
    ar: "الشبكة العصبية نشطة"
  },
  calibrationPickPoints: {
    en: "Calibration: Pick 2 Points",
    fr: "Étalonnage : Sélectionnez 2 Points",
    ar: "المعايرة: حدد نقطتين"
  },
  manualAnnotationActive: {
    en: "Manual Annotation: Click to add. Click cell to cycle.",
    fr: "Annotation manuelle : Cliquez pour ajouter/modifier.",
    ar: "التعديل اليدوي: انقر للإضافة. انقر للتبديل."
  },
  processingSpeed: {
    en: "Processing Speed",
    fr: "Vitesse de traitement",
    ar: "سرعة المعالجة"
  },
  aiAccuracy: {
    en: "AI Accuracy",
    fr: "Précision de l'IA",
    ar: "دقة الذكاء الاصطناعي"
  },
  calibrateBtn: {
    en: "Calibrate",
    fr: "Étalonner",
    ar: "المعايرة"
  },
  manualEditBtn: {
    en: "Manual Edit",
    fr: "Édition Manuelle",
    ar: "تعديل يدوي"
  },
  brightnessLabel: {
    en: "Brightness",
    fr: "Luminosité",
    ar: "شدة السطوع"
  },
  contrastLabel: {
    en: "Contrast",
    fr: "Contraste",
    ar: "التباين"
  },
  cvAreaThresholdLabel: {
    en: "CV Area Threshold",
    fr: "Seuil d'Aire CV",
    ar: "عتبة المساحة البصرية"
  },
  stopAnalysisBtn: {
    en: "Stop Analysis",
    fr: "Arrêter l'Analyse",
    ar: "إيقاف التحليل"
  },
  startCASAEngineBtn: {
    en: "Start CASA Engine",
    fr: "Démarrer le Moteur CASA",
    ar: "تشغيل محرك CASA"
  },
  aiUploadBtn: {
    en: "AI Upload (Image/Video)",
    fr: "Téléchargement IA (Image/Vidéo)",
    ar: "تحميل ذكي (صورة/فيديو)"
  },
  noActiveAnalysisData: {
    en: "No Active Analysis Data",
    fr: "Aucune donnée d'analyse active",
    ar: "لا توجد بيانات تحليل نشطة حالية"
  },
  leukocytes: {
    en: "Leukocytes",
    fr: "Leucocytes",
    ar: "الخلايا البيضاء"
  },
  concenLeukoTitle: {
    en: "Concentration & Leukocytes",
    fr: "Concentration & Leucocytes",
    ar: "التركيز والخلايا البيضاء"
  },
  whoMotilityTitle: {
    en: "WHO Motility Summary",
    fr: "Résumé de la Motilité OMS",
    ar: "ملخص منظمة الصحة للحركة"
  },
  hyperactivationTitle: {
    en: "Hyperactivation Analysis",
    fr: "Analyse d'Hyperactivation",
    ar: "تحليل فرط الحركة النشط"
  },
  hyperactivatedLabel: {
    en: "Hyperactivated",
    fr: "Hyperactivé",
    ar: "فرط النشاط"
  },
  kinematicCorrelationTitle: {
    en: "Kinematic Correlation",
    fr: "Corrélation Cinématique",
    ar: "ارتباط المعلمات الحركية"
  },
  microscopeLiveLabel: {
    en: "Microscope Live",
    fr: "Microscope en Direct",
    ar: "مجهر حي مباشر"
  },
  uploadLabFileLabel: {
    en: "Upload Lab File",
    fr: "Téléverser Fichier Lab",
    ar: "تحميل ملف المختبر"
  },
  supportRealVideoLabel: {
    en: "Supports Real Video Analysis",
    fr: "Prend en charge l'analyse vidéo réelle",
    ar: "يدعم التحليل الحركي للفيديو الحقيقي"
  },
  laboratoryUtilitiesLabel: {
    en: "Laboratory Utilities",
    fr: "Utilitaires de Laboratoire",
    ar: "أدوات المختبر المساعدة"
  },
  doseAndExtenderLabel: {
    en: "Dose & Dilution Extender",
    fr: "Calculateur de Dilution",
    ar: "ممدد ومخفف الجرعة"
  },
  multiFieldQC: {
    en: "Multi-Field Microscope QC",
    fr: "Contrôle Qualité Multi-Champs",
    ar: "مراقبة سلامة الحقول المتعددة"
  },
  connectRealtimeOpticalFeed: {
    en: "Connect real-time optical feed for direct tracking",
    fr: "Connectez le flux optique pour un suivi direct",
    ar: "ربط البث البصري للمجهر في الوقت الفعلي للتتبع المباشر"
  },
  dragDropMicroscopy: {
    en: "Drag & drop microscopy MP4 or click to select",
    fr: "Glissez-déposez un MP4 ou cliquez pour sélectionner",
    ar: "قم بسحب وإفلات فيديو مجهري بصيغة MP4 أو انقر للاختيار"
  },
  supportedFormats: {
    en: "Supported formats: MP4, AVI, PNG, JPG",
    fr: "Formats pris en charge : MP4, AVI, PNG, JPG",
    ar: "الصيغ المدعومة: MP4, AVI, PNG, JPG"
  },
  helpAndTrainingCenter: {
    en: "Help & Training Center",
    fr: "Centre d'Aide & Formation",
    ar: "مركز المساعدة والتدريب"
  },
  masterCASA: {
    en: "Master the ATSA CASA Engine and Laboratory Standards",
    fr: "Maîtrisez le Moteur CASA ATSA et les Normes du Laboratoire",
    ar: "احترف استخدام محرك ATSA CASA ومعايير المختبرات"
  },
  searchTopics: {
    en: "Search topics...",
    fr: "Rechercher des sujets...",
    ar: "ابحث في المواضيع..."
  },
  userGuides: {
    en: "User Guides",
    fr: "Guides de l'Utilisateur",
    ar: "أدلة المستخدم"
  },
  metricsLibrary: {
    en: "Metrics Library",
    fr: "Bibliothèque de Mesures",
    ar: "مكتبة المؤشرات"
  },
  speciesStandards: {
    en: "Species Standards",
    fr: "Normes par Espèce",
    ar: "معايير السلالات والأنواع"
  },
  trainingVideos: {
    en: "Training Videos",
    fr: "Vidéos de Formation",
    ar: "الفيديوهات التعليمية"
  },
  troubleshooting: {
    en: "Troubleshooting",
    fr: "Dépannage",
    ar: "استكشاف الأخطاء وإصلاحها"
  },
  systemStatus: {
    en: "System Status",
    fr: "Statut du Système",
    ar: "حالة النظام"
  },
  allEnginesOperational: {
    en: "All Engines Operational",
    fr: "Tous les moteurs opérationnels",
    ar: "جميع الأنظمة تعمل بكفاءة"
  },
  captureMetadata: {
    en: "Capture patient intake and sample metadata",
    fr: "Saisir l'admission du patient et les métadonnées de l'échantillon",
    ar: "تسجيل بيانات المريض والبيانات الوصفية للعينة"
  },
  collectionTime: {
    en: "Collection Time",
    fr: "Heure de Collecte",
    ar: "وقت جمع العينة"
  },
  abstinenceDays: {
    en: "Abstinence (Days)",
    fr: "Abstinence (Jours)",
    ar: "فترة الامتناع (بالأيام)"
  },
  preparationNotesLabel: {
    en: "Preparation Notes",
    fr: "Notes de Préparation",
    ar: "ملاحظات التحضير"
  },
  preparationNotesPlaceholder: {
    en: "Describe sample preparation, dilution, or specific observations...",
    fr: "Décrire la préparation de l'échantillon, la dilution ou les observations spécifiques...",
    ar: "صف تحضير العينة، التخفيف، أو ملاحظات محددة..."
  },
  confirmRegistration: {
    en: "Confirm Registration",
    fr: "Confirmer l'Enregistrement",
    ar: "تأكيد التسجيل"
  },
  dataPrivacyStandards: {
    en: "Data will be encrypted and stored in compliance with WHO 2010 laboratory standards.",
    fr: "Les données seront chiffrées et stockées conformément aux normes de laboratoire de l'OMS 2010.",
    ar: "سيتم تشفير البيانات وتخزينها تحت حماية تامة بما يتوافق مع معايير مختبرات منظمة الصحة العالمية لعام 2010."
  },
  aiClinicalInsights: {
    en: "AI Clinical Insights",
    fr: "Perspectives Cliniques IA",
    ar: "رؤى وتوصيات إكلينيكية بالذكاء الاصطناعي"
  },
  regenerateSummary: {
    en: "Regenerate Summary",
    fr: "Régénérer le Résumé",
    ar: "إعادة إنتاج الملخص"
  },
  analyzeTrendsWithAI: {
    en: "Analyze Trends with AI",
    fr: "Analyser les Tendances avec l'IA",
    ar: "تحليل الاتجاهات والمؤشرات بالذكاء الاصطناعي"
  },
  aiTrendsInstruction: {
    en: "Click the button above to generate an AI-powered clinical interpretation of this patient's historical trends.",
    fr: "Cliquez sur le bouton ci-dessus pour générer une interprétation clinique par l'IA des tendances historiques de ce patient.",
    ar: "انقر فوق الزر أعلاه لإنشاء تفسير سريري مدعوم بالذكاء الاصطناعي للاتجاهات التاريخية لهذا المريض."
  },
  comparativeDelta: {
    en: "Comparative Delta (vs Last)",
    fr: "Delta Comparatif (vs Dernier)",
    ar: "المقارنة التفاضلية (مقارنة بآخر فحص)"
  },
  needMoreSamplesDelta: {
    en: "Need at least 2 samples to calculate comparative deltas.",
    fr: "Nécessite au moins 2 échantillons pour calculer les deltas comparatifs.",
    ar: "يتطلب وجود عينتين على الأقل لحساب الفروقات التفاضلية."
  },
  totalSamples: {
    en: "Total Samples",
    fr: "Total des Échantillons",
    ar: "إجمالي العينات"
  },
  latestStatusLabel: {
    en: "Latest Status",
    fr: "Dernier Statut",
    ar: "أحدث حالة"
  },
  statusNormal: {
    en: "Normal",
    fr: "Normal / Naturel",
    ar: "طبيعي"
  },
  statusAbnormal: {
    en: "Abnormal",
    fr: "Anormal / Altéré",
    ar: "غير طبيعي"
  },
  displaySettings: {
    en: "Display Settings",
    fr: "Paramètres d'Affichage",
    ar: "إعدادات العرض"
  },
  clearAll: {
    en: "Clear All",
    fr: "Tout Effacer",
    ar: "مسح الكل"
  },
  selectAll: {
    en: "Select All",
    fr: "Tout Sélectionner",
    ar: "تحديد الكل"
  },
  totalItems: {
    en: "Total Items",
    fr: "Total des Articles",
    ar: "إجمالي المواد"
  },
  lowStock: {
    en: "Low Stock",
    fr: "Stock Faible",
    ar: "مخزون منخفض"
  },
  reorderAlerts: {
    en: "Reorder Alerts",
    fr: "Alertes de Réapprovisionnement",
    ar: "تنبيهات إعادة الطلب"
  },
  searchInventoryPlaceholder: {
    en: "Search inventory...",
    fr: "Rechercher dans l'inventaire...",
    ar: "البحث في المخزن..."
  },
  threshold: {
    en: "Threshold",
    fr: "Seuil",
    ar: "الحد الأدنى"
  },
  expiry: {
    en: "Expiry",
    fr: "Expiration",
    ar: "الصلاحية"
  },
  actions: {
    en: "Actions",
    fr: "Actions",
    ar: "الإجراءات"
  },
  noItemsMatchingFilter: {
    en: "No items found matching your filters",
    fr: "Aucun article trouvé correspondant à vos filtres",
    ar: "لم يتم العثور على أي مواد مطابقة للتصفية"
  },
  minThresholdLabel: {
    en: "Min Threshold",
    fr: "Seuil Minimum",
    ar: "الحد الأدنى الحرج"
  },
  reagentOption: {
    en: "Reagent",
    fr: "Réactif",
    ar: "كاشف"
  },
  disposableOption: {
    en: "Disposable",
    fr: "Jetable",
    ar: "مستهلكات وحيد الاستخدام"
  },
  equipmentOption: {
    en: "Equipment",
    fr: "Équipement",
    ar: "الأجهزة والمعدات"
  },
  otherOption: {
    en: "Other",
    fr: "Autre",
    ar: "أخرى"
  },
  unitPlaceholder: {
    en: "ml, pcs, boxes...",
    fr: "ml, pièces, boîtes...",
    ar: "ملل، قطع، صناديق..."
  },
  noActivePatient: {
    en: "No Active Patient",
    fr: "Aucun Patient Actif",
    ar: "لا يوجد مريض أو حيوان محدد حالياً"
  },
  pleaseRegisterSampleMessage: {
    en: "Please register a sample or select a patient from the dashboard before launching the CASA Engine.",
    fr: "Veuillez enregistrer un échantillon ou sélectionner un patient sur le tableau de bord avant de lancer le moteur CASA.",
    ar: "يرجى تسجيل عينة جديدة أو اختيار مريض من لوحة التحكم قبل تشغيل محرك CASA."
  },
  concentrationTrend: {
    en: "Concentration Trend",
    fr: "Tendance de la Concentration",
    ar: "اتجاهات التركيز"
  },
  motilityTrend: {
    en: "Motility Trend",
    fr: "Tendance de la Motilité",
    ar: "اتجاهات الحركة"
  },
  morphologyTrend: {
    en: "Morphology Trend",
    fr: "Tendance de la Morphologie",
    ar: "اتجاهات الشكل البيولوجي"
  },
  vitalityTrend: {
    en: "Vitality Trend",
    fr: "Tendance de la Vitalité",
    ar: "اتجاهات الحيوية"
  },
  sdfTrend: {
    en: "SDF Trend",
    fr: "Tendance SDF (Fragmentation)",
    ar: "اتجاهات تكسر المادة الوراثية SDF"
  },
  historyTrackerTitle: {
    en: "Historical Data",
    fr: "Données Historiques",
    ar: "البيانات التاريخية"
  },
  signInButton: {
    en: "Sign In",
    fr: "Se Connecter",
    ar: "تسجيل الدخول"
  },
  signInSyncMessage: {
    en: "Sign in to sync your analysis history to the cloud and track fertility trends.",
    fr: "Connectez-vous pour synchroniser votre historique d'analyse sur le cloud.",
    ar: "سجل الدخول لمزامنة سجل تحاليلك على السحابة وتتبع اتجاهات الخصوبة."
  },
  noHistoryForPatient: {
    en: "No historical data found for this patient. Save an analysis to start tracking.",
    fr: "Données historiques introuvables pour ce patient. Sauvegardez pour commencer le suivi.",
    ar: "لم يتم العثور على سجلات تاريخية لتمثيل هذا الحيوان حالياً. احفظ فحصاً لبدء المحاكاة."
  },
  labUtilitiesTitle: {
    en: "Laboratory Utilities",
    fr: "Utilitaires de Laboratoire",
    ar: "أدوات ومرافق المختبر"
  }
};

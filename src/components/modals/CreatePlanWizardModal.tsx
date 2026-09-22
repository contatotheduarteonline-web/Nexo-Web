import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  PlanCategory,
  PlanOrganization,
  PlanTemplate,
  Discipline,
  Topic,
  CatalogEdital,
  CatalogCargo,
} from "../../types";
import {
  getEditalCargos,
  getFullCargoStructure,
  createCatalogEdital,
  addCargoToCatalogEdital,
  addDisciplineToCargo,
  addTopicToDiscipline,
  checkCatalogDuplicity,
  submitUserEdital,
  getPublishedEditaisByCareer,
  validateCatalogEditalData,
  VALID_CATALOG_UFS,
} from "../../lib/catalogEditalService";
import {
  publishEditalToServer,
  PublishedEditalSnapshot,
} from "../../lib/serverCatalogService";
import {
  parseEditalPdf,
  parseManualPagesSelection,
  ParsedEditalData,
  DetectedCargo,
  ExtractedDiscipline,
  ExtractedTopic,
  ImportProgressUpdate,
} from "../../lib/editalImport";
import {
  X,
  Plus,
  Search,
  BookOpen,
  Award,
  GraduationCap,
  Scale,
  Stethoscope,
  Shield,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Loader2,
  Trash2,
  Edit2,
  Upload,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  RefreshCw,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Palette,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CAREER_OPTIONS } from "../../constants/careers";
import { auth } from "../../lib/firebase";
import {
  processAndCompressPlanImage,
  savePlanImageToFirestore,
} from "../../utils/planImageStorage";
import { BatchTopicsModal } from "./BatchTopicsModal";
import {
  DISTINCT_DISCIPLINE_COLORS,
  getNextAvailableDisciplineColor,
  ensureUniqueDisciplineColors,
  areColorsEqual,
  normalizeHex,
} from "../../utils/disciplineColors";
import { DisciplineColorPickerModal } from "../disciplinas/DisciplineColorPickerModal";
import { WizardSidePanel, WizardSelectionPanel } from "./wizard/WizardSidePanel";

interface CreatePlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep =
  | "objective"   // 1: Objetivo
  | "career"      // 2: Carreira
  | "edital"      // 3: Edital (Existente, Importar, Personalizado)
  | "data"        // 4: Dados e Arquivos
  | "content"     // 5: Conteúdo (Cargos, Disciplinas, Tópicos)
  | "review"      // 6: Revisão
  | "processing"; // Salvamento

const OBJECTIVE_OPTIONS: Array<{
  id: PlanCategory;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}> = [
  {
    id: "Concurso Público",
    title: "Concurso Público",
    description: "Polícias, Tribunais, Fiscais, Administrativos e Prefeituras",
    icon: Shield,
    badge: "Mais popular",
  },
  {
    id: "Concurso Militar",
    title: "Concurso Militar",
    description: "PM, Bombeiros, ESA, EsPCEx, AFA, Colégio Naval",
    icon: Award,
  },
  {
    id: "OAB",
    title: "Exame de Ordem (OAB)",
    description: "1ª e 2ª Fase do Exame Unificado da OAB",
    icon: Scale,
  },
  {
    id: "ENEM",
    title: "ENEM & SiSU",
    description: "Matemática, Linguagens, Humanas, Natureza e Redação",
    icon: GraduationCap,
  },
  {
    id: "Vestibular",
    title: "Vestibular Tradicional",
    description: "Fuvest, Unicamp, Unesp, UERJ, UFSC e federais",
    icon: BookOpen,
  },
  {
    id: "Outro",
    title: "Outro Objetivo",
    description: "Certificações profissionais, residência médica ou estudos livres",
    icon: Sparkles,
  },
];



const PRESET_COLORS = DISTINCT_DISCIPLINE_COLORS;

export const CreatePlanWizardModal: React.FC<CreatePlanWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isAdmin } = useAuth();
  const {
    createEdital,
    createStudyPlan,
    updateStudyPlan,
    catalogEditais,
    refreshCatalogEditais,
    setActivePlanId,
    setActiveEditalId,
    setActiveTab,
    setPlanImageCache,
  } = useStudy();

  // Navigation step
  const [step, setStep] = useState<WizardStep>("objective");

  // Step 1: Objetivo
  const [selectedObjective, setSelectedObjective] = useState<PlanCategory>("Concurso Público");

  // Step 2: Carreira
  const [selectedCareerId, setSelectedCareerId] = useState<string>("policial");

  // Step 3: Edital
  const [concursoSearchQuery, setConcursoSearchQuery] = useState("");
  const [ufFilter, setUfFilter] = useState<string>("all");
  const [selectedCatalogEdital, setSelectedCatalogEdital] = useState<CatalogEdital | null>(null);
  const [selectedCatalogCargo, setSelectedCatalogCargo] = useState<CatalogCargo | null>(null);
  const [availableCatalogCargos, setAvailableCatalogCargos] = useState<CatalogCargo[]>([]);
  const [isLoadingCargos, setIsLoadingCargos] = useState<boolean>(false);
  const [isSelectingCatalogCargo, setIsSelectingCatalogCargo] = useState<boolean>(false);
  const [isCustomConcurso, setIsCustomConcurso] = useState(false);

  // Step 4: Dados e Arquivos
  const [planTitle, setPlanTitle] = useState("");
  const [cargoPretendido, setCargoPretendido] = useState("");
  const [organ, setOrgan] = useState("");
  const [organAcronym, setOrganAcronym] = useState("");
  const [editalUf, setEditalUf] = useState("");
  const [editalBoard, setEditalBoard] = useState("");
  // Ano do Certame: sem valor padrão automático — deve corresponder ao certame real.
  const [editalYear, setEditalYear] = useState<number | "">("");
  const [editalNotes, setEditalNotes] = useState("");
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(20);

  // Suggested Career & Career Override
  const [suggestedCareerName, setSuggestedCareerName] = useState<string | null>(null);
  const [suggestedCareerConfidence, setSuggestedCareerConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [isChangingCareer, setIsChangingCareer] = useState(false);

  // PDF Import State
  const [editalFile, setEditalFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressUpdate | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEditalData | null>(null);
  const [duplicityWarning, setDuplicityWarning] = useState<{
    isDuplicate: boolean;
    reason?: string;
    existingEdital?: CatalogEdital;
  } | null>(null);
  const [ignoreDuplicityWarning, setIgnoreDuplicityWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Validação obrigatória do catálogo oficial (8 campos)
  const [catalogValidationErrors, setCatalogValidationErrors] = useState<string[]>([]);

  // Manual Page Selection Fallback State
  const [isManualPageSelectionOpen, setIsManualPageSelectionOpen] = useState(false);
  const [manualStartPage, setManualStartPage] = useState<number>(1);
  const [manualEndPage, setManualEndPage] = useState<number>(1);

  // Step 5: Multi-Cargo & Conteúdo
  const [cargosList, setCargosList] = useState<DetectedCargo[]>([]);
  const [activeCargoId, setActiveCargoId] = useState<string>("");
  const [expandedDiscId, setExpandedDiscId] = useState<string | null>(null);
  const [isAddingNewCargo, setIsAddingNewCargo] = useState(false);
  const [newCargoName, setNewCargoName] = useState("");
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [editingCargoName, setEditingCargoName] = useState<string>("");
  const [editalCargosCountMap, setEditalCargosCountMap] = useState<Record<string, number>>({});

  // Quick Discipline & Topic Adders
  const [newDiscName, setNewDiscName] = useState("");
  const [newDiscColor, setNewDiscColor] = useState(DISTINCT_DISCIPLINE_COLORS[0]);
  const [showNewDiscColorPalette, setShowNewDiscColorPalette] = useState(false);
  const [colorPickerDisc, setColorPickerDisc] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [batchTopicDiscId, setBatchTopicDiscId] = useState<string | null>(null);

  // Step 6: Revisão
  const [isFullContentExpanded, setIsFullContentExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      refreshCatalogEditais();
      setStep("objective");
      setSelectedObjective("Concurso Público");
      setSelectedCareerId("policial");
      setConcursoSearchQuery("");
      setUfFilter("all");
      setSelectedCatalogEdital(null);
      setSelectedCatalogCargo(null);
      setAvailableCatalogCargos([]);
      setIsSelectingCatalogCargo(false);
      setIsCustomConcurso(false);
      setPlanTitle("");
      setCargoPretendido("");
      setOrgan("");
      setOrganAcronym("");
      setEditalUf("");
      setEditalBoard("");
      setEditalYear(new Date().getFullYear());
      setEditalNotes("");
      setWeeklyGoalHours(20);
      setSuggestedCareerName(null);
      setSuggestedCareerConfidence(null);
      setIsChangingCareer(false);
      setEditalFile(null);
      setIsParsingPdf(false);
      setImportProgress(null);
      setImportError(null);
      setParsedData(null);
      setDuplicityWarning(null);
      setIgnoreDuplicityWarning(false);
      setSelectedImageFile(null);
      setPreviewImageUrl(null);
      setCargosList([]);
      setActiveCargoId("");
      setExpandedDiscId(null);
      setIsAddingNewCargo(false);
      setNewCargoName("");
      setEditingCargoId(null);
      setEditingCargoName("");
      setNewDiscName("");
      setNewDiscColor("#F3AA2D");
      setNewTopicName("");
      setBatchTopicDiscId(null);
      setIsFullContentExpanded(false);
      setIsSaving(false);
      setSaveSuccessMessage(null);
      setIsManualPageSelectionOpen(false);
      setManualStartPage(1);
      setManualEndPage(1);
    }
  }, [isOpen]);

  // Selected Career Object
  const currentCareer = CAREER_OPTIONS.find((c) => c.id === selectedCareerId) || CAREER_OPTIONS[0];

  // Filter Catalog Editais for the active career
  const editaisForCareer = useMemo(() => {
    return catalogEditais.filter((ed) => {
      // If edital has careerId, match against selectedCareerId
      if (ed.careerId) {
        if (ed.careerId.toLowerCase() !== selectedCareerId.toLowerCase()) return false;
      }
      if (ufFilter !== "all") {
        const edUf = (ed.uf || ed.state || "").trim().toUpperCase();
        if (edUf !== ufFilter) return false;
      }
      const q = concursoSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (ed.title || "").toLowerCase().includes(q) ||
        (ed.institution || "").toLowerCase().includes(q) ||
        (ed.acronym || "").toLowerCase().includes(q) ||
        (ed.board || "").toLowerCase().includes(q) ||
        (ed.editalNumber || "").toLowerCase().includes(q) ||
        (ed.state || "").toLowerCase().includes(q)
      );
    });
  }, [catalogEditais, selectedCareerId, concursoSearchQuery, ufFilter]);

  // UFs disponíveis nos editais da carreira selecionada (para o filtro da etapa de edital)
  const availableUfs = useMemo(() => {
    const ufSet = new Set<string>();
    catalogEditais.forEach((ed) => {
      if (ed.careerId && ed.careerId.toLowerCase() !== selectedCareerId.toLowerCase()) return;
      const uf = (ed.uf || ed.state || "").trim().toUpperCase();
      if (uf) ufSet.add(uf);
    });
    return Array.from(ufSet).sort();
  }, [catalogEditais, selectedCareerId]);

  // Efeito para carregar a contagem de cargos dos editais da carreira selecionada
  useEffect(() => {
    if (isOpen && step === "edital" && editaisForCareer.length > 0) {
      editaisForCareer.forEach(async (ed) => {
        const embedded = (ed as PublishedEditalSnapshot).cargos;
        if (ed.cargosCount !== undefined) {
          setEditalCargosCountMap((prev) => ({ ...prev, [ed.id]: ed.cargosCount! }));
        } else if (embedded) {
          setEditalCargosCountMap((prev) => ({ ...prev, [ed.id]: embedded.length }));
        } else if (editalCargosCountMap[ed.id] === undefined) {
          try {
            const c = await getEditalCargos(ed.id);
            setEditalCargosCountMap((prev) => ({ ...prev, [ed.id]: c.length }));
          } catch {
            // fallback silencioso
          }
        }
      });
    }
  }, [isOpen, step, selectedCareerId, editaisForCareer.length]);

  if (!isOpen) return null;

  // Current active cargo in Step 5
  const activeCargo = cargosList.find((c) => c.id === activeCargoId) || cargosList[0] || null;

  // ---------------------------------------------------------------------------
  // STEP 3 HANDLERS: Selecionar Edital Oficial do Catálogo
  // ---------------------------------------------------------------------------
  const handleSelectCatalogEdital = async (ed: CatalogEdital) => {
    setSelectedCatalogEdital(ed);
    setSelectedCatalogCargo(null);
    setIsLoadingCargos(true);
    setIsCustomConcurso(false);

    try {
      // Editais do catálogo oficial (banco do servidor) trazem o snapshot
      // completo de cargos embutido — sem depender do Firestore.
      const embedded = (ed as PublishedEditalSnapshot).cargos;
      const cargos: CatalogCargo[] = embedded?.length
        ? embedded.map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            vacancies: c.vacancies,
            order: c.order,
          }))
        : await getEditalCargos(ed.id);
      if (cargos.length === 0) {
        // Sem cargos cadastrados no catálogo, disponibiliza 1 cargo padrão
        const fallbackCargo: CatalogCargo = {
          id: `cargo-general-${ed.id}`,
          name: "Conteúdo Geral do Concurso",
          level: "superior",
          vacancies: "A definir",
          order: 1,
        };
        setAvailableCatalogCargos([fallbackCargo]);
        await handleSelectCatalogCargo(ed, fallbackCargo);
      } else {
        setAvailableCatalogCargos(cargos);
        if (cargos.length === 1) {
          await handleSelectCatalogCargo(ed, cargos[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar cargos do edital:", err);
      setPlanTitle(ed.title || ed.institution);
      setOrgan(ed.institution);
    } finally {
      setIsLoadingCargos(false);
    }
  };

  const handleSelectCatalogCargo = async (ed: CatalogEdital, cargoItem: CatalogCargo) => {
    setSelectedCatalogCargo(cargoItem);
    setIsCustomConcurso(false);
    setPlanTitle(ed.title || ed.institution);
    setCargoPretendido(cargoItem.name);
    setOrgan(ed.institution);
    setOrganAcronym(ed.acronym || "");
    setEditalUf(ed.uf || ed.state || "");
    setEditalBoard(ed.board || "");
    setEditalYear(ed.year || new Date().getFullYear());

    try {
      // Prioriza o snapshot embutido do catálogo oficial (banco do servidor)
      const embeddedStructure = (ed as PublishedEditalSnapshot).cargos?.find(
        (c) => c.id === cargoItem.id
      );
      const structure = embeddedStructure ?? (await getFullCargoStructure(ed.id, cargoItem.id));
      const rawDisciplines: ExtractedDiscipline[] = (structure?.disciplines || []).map(
        (d, dIdx) => ({
          id: d.id || `disc-${dIdx + 1}`,
          name: d.name,
          order: d.order || dIdx + 1,
          color: (d as any).color || DISTINCT_DISCIPLINE_COLORS[dIdx % DISTINCT_DISCIPLINE_COLORS.length],
          weight: d.weight || 2,
          topics: (d.topics || []).map((t, tIdx) => ({
            id: t.id || `top-${dIdx + 1}-${tIdx + 1}`,
            title: t.title,
            order: t.order || tIdx + 1,
            sourceReference: t.sourceReference,
          })),
        })
      );
      const convertedDisciplines = ensureUniqueDisciplineColors(rawDisciplines);

      const loadedCargo: DetectedCargo = {
        id: cargoItem.id,
        name: cargoItem.name,
        normalizedName: cargoItem.name.toLowerCase().trim(),
        level: (cargoItem.level === "superior" || cargoItem.level === "medio" || cargoItem.level === "fundamental")
          ? cargoItem.level
          : undefined,
        vacancies: typeof cargoItem.vacancies === "number" ? cargoItem.vacancies : undefined,
        disciplines: convertedDisciplines,
      };

      setCargosList([loadedCargo]);
      setActiveCargoId(loadedCargo.id);
      if (convertedDisciplines.length > 0) {
        setExpandedDiscId(convertedDisciplines[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar estrutura do cargo:", err);
    }
  };

  // Renomear cargo
  const handleRenameCargo = (cargoId: string, updatedName: string) => {
    const trimmed = updatedName.trim();
    if (!trimmed) return;
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === cargoId
          ? {
              ...c,
              name: trimmed,
              normalizedName: trimmed.toLowerCase(),
            }
          : c
      )
    );
    if (activeCargoId === cargoId) {
      setCargoPretendido(trimmed);
    }
    setEditingCargoId(null);
  };

  // Caminho 2: Importar novo edital em PDF
  const handleStartImportEdital = () => {
    setIsCustomConcurso(false);
    setSelectedCatalogEdital(null);
    setSelectedCatalogCargo(null);
    setCargosList([]);
    setPlanTitle("");
    setOrgan("");
    setOrganAcronym("");
    setEditalUf("");
    setEditalBoard("");
    setEditalYear(new Date().getFullYear());
    setStep("data");
  };

  // Caminho 3: Criar Plano Personalizado (Sem edital)
  const handleSelectCustomPlan = () => {
    setIsCustomConcurso(true);
    setSelectedCatalogEdital(null);
    setSelectedCatalogCargo(null);
    setPlanTitle("Plano de Estudos Personalizado");
    setCargoPretendido("Geral");
    setOrgan(currentCareer.title);
    setOrganAcronym("");
    setEditalUf("");
    setEditalBoard("");
    setEditalYear(new Date().getFullYear());

    const defaultCargo: DetectedCargo = {
      id: `cargo-custom-${Date.now()}`,
      name: "Geral",
      normalizedName: "geral",
      disciplines: [
        {
          id: "disc-1",
          name: "Língua Portuguesa",
          order: 1,
          color: "#F3AA2D",
          weight: 3,
          topics: [
            { id: "top-1-1", title: "Compreensão e Interpretação de Texto", order: 1 },
            { id: "top-1-2", title: "Ortografia Oficial e Acentuação", order: 2 },
            { id: "top-1-3", title: "Sintaxe da Oração e do Período", order: 3 },
          ],
        },
        {
          id: "disc-2",
          name: "Direito Constitucional",
          order: 2,
          color: "#3B82F6",
          weight: 3,
          topics: [
            { id: "top-2-1", title: "Direitos e Deveres Individuais e Coletivos", order: 1 },
            { id: "top-2-2", title: "Organização Político-Administrativa do Estado", order: 2 },
            { id: "top-2-3", title: "Poder Executivo e Segurança Pública", order: 3 },
          ],
        },
        {
          id: "disc-3",
          name: "Direito Administrativo",
          order: 3,
          color: "#10B981",
          weight: 2,
          topics: [
            { id: "top-3-1", title: "Princípios Básicos da Administração Pública", order: 1 },
            { id: "top-3-2", title: "Atos Administrativos: Conceito e Requisitos", order: 2 },
            { id: "top-3-3", title: "Agentes Públicos e Responsabilidade Civil", order: 3 },
          ],
        },
        {
          id: "disc-4",
          name: "Raciocínio Lógico-Matemático",
          order: 4,
          color: "#F59E0B",
          weight: 2,
          topics: [
            { id: "top-4-1", title: "Estruturas Lógicas e Conectivos", order: 1 },
            { id: "top-4-2", title: "Lógica de Argumentação", order: 2 },
            { id: "top-4-3", title: "Conjuntos e Probabilidade Básica", order: 3 },
          ],
        },
      ],
    };

    setCargosList([defaultCargo]);
    setActiveCargoId(defaultCargo.id);
    setExpandedDiscId("disc-1");
    setStep("data");
  };

  // ---------------------------------------------------------------------------
  // STEP 4 HANDLERS: Upload & Leitura do PDF
  // ---------------------------------------------------------------------------
  const handlePdfFileSelected = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setImportError("O arquivo selecionado deve ser um documento PDF válido.");
      return;
    }

    setEditalFile(file);
    setIsParsingPdf(true);
    setImportError(null);
    setDuplicityWarning(null);
    setIgnoreDuplicityWarning(false);

    try {
      const parsed = await parseEditalPdf(file, {
        onProgress: (p) => setImportProgress(p),
      });

      setParsedData(parsed);

      if (parsed.programmaticSection) {
        setManualStartPage(parsed.programmaticSection.startPage);
        setManualEndPage(parsed.programmaticSection.endPage);
      } else {
        setManualStartPage(1);
        setManualEndPage(parsed.pagesCount || 1);
      }

      // Preenchimento dos campos essenciais
      if (parsed.institution) setOrgan(parsed.institution);
      if (parsed.acronym) setOrganAcronym(parsed.acronym);
      if (parsed.uf) setEditalUf(parsed.uf);
      if (parsed.board) setEditalBoard(parsed.board);
      if (parsed.year) setEditalYear(parsed.year);

      // Nome do edital (sem incluir cargo, para manter dados separados)
      const defaultTitle = parsed.institution
        ? parsed.institution
        : (parsed.title || file.name.replace(/\.pdf$/i, ""));
      setPlanTitle(defaultTitle);
      // NUNCA preencher automaticamente cargo com nome de arquivo ou edital; aguarda preenchimento manual
      setCargoPretendido("");

      // Carreira sugerida
      if (parsed.career) {
        const foundCareer = CAREER_OPTIONS.find((c) => c.id === parsed.career.careerId);
        setSuggestedCareerName(foundCareer?.title || parsed.career.careerId);
        setSuggestedCareerConfidence(parsed.career.confidence);
        // Atualiza a carreira ativa se detectada
        setSelectedCareerId(parsed.career.careerId);
      }

      // Cargos e disciplinas detectadas
      if (parsed.cargos && parsed.cargos.length > 0) {
        const cargosWithUniqueColors = parsed.cargos.map((cargo) => ({
          ...cargo,
          disciplines: ensureUniqueDisciplineColors(cargo.disciplines),
        }));
        setCargosList(cargosWithUniqueColors);
        setActiveCargoId(cargosWithUniqueColors[0].id);
        if (cargosWithUniqueColors[0].disciplines.length > 0) {
          setExpandedDiscId(cargosWithUniqueColors[0].disciplines[0].id);
        }
      } else {
        // Cria cargo único se não encontrou múltiplos
        const singleCargo: DetectedCargo = {
          id: `cargo-${Date.now()}`,
          name: "Geral",
          normalizedName: "geral",
          disciplines: [],
        };
        setCargosList([singleCargo]);
        setActiveCargoId(singleCargo.id);
      }

      // Verificação em duas camadas de duplicidade
      const dupCheck = await checkCatalogDuplicity({
        sourceHash: parsed.sourceHash,
        normalizedIdentity: parsed.normalizedIdentity,
        institution: parsed.institution,
        year: parsed.year,
        editalNumber: parsed.editalNumber,
      });

      if (dupCheck.isDuplicate) {
        setDuplicityWarning(dupCheck);
      }
    } catch (err: any) {
      console.error("Erro na leitura do edital:", err);
      setImportError(err.message || "Não foi possível extrair os dados do PDF.");
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleRemovePdf = () => {
    setEditalFile(null);
    setParsedData(null);
    setImportProgress(null);
    setImportError(null);
    setDuplicityWarning(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessManualPages = () => {
    if (!parsedData?.allPages || parsedData.allPages.length === 0) {
      return;
    }

    const currentCargo = cargosList.find((c) => c.id === activeCargoId);
    const cargoName = currentCargo?.name || organ || "Geral";

    const { cargo, section, validation } = parseManualPagesSelection(
      parsedData.allPages,
      manualStartPage,
      manualEndPage,
      cargoName
    );

    // CORREÇÃO: o processamento de páginas é referente apenas ao cargo ativo.
    // Antes a lista inteira era substituída por um único cargo, descartando
    // silenciosamente os outros cargos já cadastrados na publicação.
    const updatedParsedData: ParsedEditalData = {
      ...parsedData,
      programmaticSection: section,
      validation,
      cargos: currentCargo
        ? [...(parsedData.cargos || []).filter((c) => c.id !== currentCargo.id), cargo]
        : [...(parsedData.cargos || []), cargo],
    };

    setParsedData(updatedParsedData);
    setCargosList((prev) =>
      currentCargo
        ? prev.map((c) => (c.id === currentCargo.id ? cargo : c))
        : [...prev, cargo]
    );
    setActiveCargoId(cargo.id);
    if (cargo.disciplines.length > 0) {
      setExpandedDiscId(cargo.disciplines[0].id);
    }
    setIsManualPageSelectionOpen(false);
  };

  // ---------------------------------------------------------------------------
  // STEP 5 HANDLERS: Multi-Cargo & Conteúdo
  // ---------------------------------------------------------------------------
  const handleAddNewCargo = () => {
    if (!newCargoName.trim()) return;
    const newCargo: DetectedCargo = {
      id: `cargo-${Date.now()}`,
      name: newCargoName.trim(),
      normalizedName: newCargoName.trim().toLowerCase(),
      disciplines: [],
    };
    setCargosList((prev) => [...prev, newCargo]);
    setActiveCargoId(newCargo.id);
    setNewCargoName("");
    setIsAddingNewCargo(false);
  };

  const handleRemoveCargo = (cargoId: string) => {
    if (cargosList.length <= 1) return;
    const filtered = cargosList.filter((c) => c.id !== cargoId);
    setCargosList(filtered);
    if (activeCargoId === cargoId) {
      setActiveCargoId(filtered[0].id);
      setCargoPretendido(filtered[0].name);
    }
  };

  const handleAddDiscipline = () => {
    if (!newDiscName.trim() || !activeCargo) return;

    const currentUsed = activeCargo.disciplines.map((d) => d.color || "#F3AA2D");

    // Regra estrita: se a cor atual já estiver em uso, calcula a próxima cor exclusiva disponível
    let assignedColor = newDiscColor;
    if (currentUsed.some((c) => areColorsEqual(c, assignedColor))) {
      assignedColor = getNextAvailableDisciplineColor(currentUsed);
    }

    const newDisc: ExtractedDiscipline = {
      id: `disc-${Date.now()}`,
      name: newDiscName.trim(),
      order: activeCargo.disciplines.length + 1,
      color: assignedColor,
      weight: 2,
      topics: [],
    };
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? { ...c, disciplines: [...c.disciplines, newDisc] }
          : c
      )
    );
    setExpandedDiscId(newDisc.id);
    setNewDiscName("");

    // MÉTRICA: Troca a cor automaticamente para a próxima cor exclusiva não utilizada
    const nextColor = getNextAvailableDisciplineColor([...currentUsed, assignedColor]);
    setNewDiscColor(nextColor);
    setShowNewDiscColorPalette(false);
  };

  const handleUpdateDisciplineColor = (discId: string, newColor: string) => {
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo?.id
          ? {
              ...c,
              disciplines: c.disciplines.map((d) =>
                d.id === discId ? { ...d, color: newColor } : d
              ),
            }
          : c
      )
    );
    // Se a cor selecionada para o cadastro de nova matéria coincidir com essa cor, avança automaticamente
    const updatedUsed = (activeCargo?.disciplines || []).map((d) =>
      d.id === discId ? newColor : d.color || "#F3AA2D"
    );
    if (updatedUsed.some((c) => areColorsEqual(c, newDiscColor))) {
      setNewDiscColor(getNextAvailableDisciplineColor(updatedUsed));
    }
  };

  const handleRemoveDiscipline = (discId: string) => {
    if (!activeCargo) return;
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? { ...c, disciplines: c.disciplines.filter((d) => d.id !== discId) }
          : c
      )
    );
    if (expandedDiscId === discId) {
      setExpandedDiscId(null);
    }
  };

  const handleMoveDiscipline = (discIndex: number, direction: "up" | "down") => {
    if (!activeCargo) return;
    const targetIndex = direction === "up" ? discIndex - 1 : discIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeCargo.disciplines.length) return;

    const list = [...activeCargo.disciplines];
    const [moved] = list.splice(discIndex, 1);
    list.splice(targetIndex, 0, moved);

    setCargosList((prev) =>
      prev.map((c) => (c.id === activeCargo.id ? { ...c, disciplines: list } : c))
    );
  };

  const handleUpdateDisciplineName = (discId: string, newName: string) => {
    if (!activeCargo) return;
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? {
              ...c,
              disciplines: c.disciplines.map((d) =>
                d.id === discId ? { ...d, name: newName } : d
              ),
            }
          : c
      )
    );
  };

  const handleAddTopic = (discId: string) => {
    if (!newTopicName.trim() || !activeCargo) return;
    const newTopic: ExtractedTopic = {
      id: `top-${Date.now()}`,
      title: newTopicName.trim(),
      order: 99,
    };
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? {
              ...c,
              disciplines: c.disciplines.map((d) =>
                d.id === discId
                  ? {
                      ...d,
                      topics: [
                        ...d.topics,
                        { ...newTopic, order: d.topics.length + 1 },
                      ],
                    }
                  : d
              ),
            }
          : c
      )
    );
    setNewTopicName("");
  };

  const handleAddBatchTopics = (discId: string, topicTitles: string[]) => {
    if (!activeCargo || topicTitles.length === 0) return;
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? {
              ...c,
              disciplines: c.disciplines.map((d) => {
                if (d.id !== discId) return d;
                const startOrder = d.topics.length + 1;
                const newTopics: ExtractedTopic[] = topicTitles.map((title, idx) => ({
                  id: `top-${Date.now()}-${idx}`,
                  title,
                  order: startOrder + idx,
                }));
                return { ...d, topics: [...d.topics, ...newTopics] };
              }),
            }
          : c
      )
    );
  };

  const handleRemoveTopic = (discId: string, topicId: string) => {
    if (!activeCargo) return;
    setCargosList((prev) =>
      prev.map((c) =>
        c.id === activeCargo.id
          ? {
              ...c,
              disciplines: c.disciplines.map((d) =>
                d.id === discId
                  ? { ...d, topics: d.topics.filter((t) => t.id !== topicId) }
                  : d
              ),
            }
          : c
      )
    );
  };

  const handleMoveTopic = (discId: string, topicIndex: number, direction: "up" | "down") => {
    if (!activeCargo) return;
    setCargosList((prev) =>
      prev.map((c) => {
        if (c.id !== activeCargo.id) return c;
        return {
          ...c,
          disciplines: c.disciplines.map((d) => {
            if (d.id !== discId) return d;
            const targetIndex = direction === "up" ? topicIndex - 1 : topicIndex + 1;
            if (targetIndex < 0 || targetIndex >= d.topics.length) return d;
            const updated = [...d.topics];
            const [moved] = updated.splice(topicIndex, 1);
            updated.splice(targetIndex, 0, moved);
            return {
              ...d,
              topics: updated.map((t, idx) => ({ ...t, order: idx + 1 })),
            };
          }),
        };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // STEP 6 HANDLERS: Finalização & Persistência
  // ---------------------------------------------------------------------------
  // Totais estatísticos
  const totalDisciplinesAcrossAllCargos = cargosList.reduce(
    (acc, c) => acc + c.disciplines.length,
    0
  );
  const totalTopicsAcrossAllCargos = cargosList.reduce(
    (acc, c) => acc + c.disciplines.reduce((tAcc, d) => tAcc + d.topics.length, 0),
    0
  );

  const activeCargoDisciplines = activeCargo ? activeCargo.disciplines : [];
  const activeCargoTopicsCount = activeCargoDisciplines.reduce(
    (acc, d) => acc + d.topics.length,
    0
  );

  // Ação de Criar Plano de Estudos
  // Ação de Criar Plano de Estudos
  const handleFinalSubmitCreatePlan = async (publishToCatalog: boolean = false, isDraft: boolean = false) => {
    setIsSaving(true);
    setStep("processing");

    try {
      const finalTitle = planTitle.trim() || organ.trim() || "Plano de Estudos";
      const userUid = auth.currentUser?.uid || user?.id || "anonymous";

      // 1. Gera IDs rastreáveis upfront
      const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const editalId = `edital-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // 2. Transforma disciplinas e tópicos do cargo ativo em entidades do NEXO vinculadas ao editalId
      const newDisciplines: Discipline[] = activeCargoDisciplines.map((wd, dIdx) => ({
        id: `disc-${editalId}-${dIdx + 1}-${Math.random().toString(36).substr(2, 6)}`,
        editalId: editalId,
        name: wd.name.trim(),
        color: wd.color || DISTINCT_DISCIPLINE_COLORS[dIdx % DISTINCT_DISCIPLINE_COLORS.length],
        iconName: "BookOpen",
        priority: "media",
        difficulty: "medio",
        weight: wd.weight || 2,
        targetHours: 30,
        studiedHours: 0,
      }));

      const newTopics: Topic[] = [];
      activeCargoDisciplines.forEach((wd, dIdx) => {
        const matchingDisc = newDisciplines[dIdx];
        if (matchingDisc && wd.topics) {
          wd.topics.forEach((t, tIdx) => {
            const topicTitle = t.title?.trim();
            if (topicTitle) {
              newTopics.push({
                id: `topic-${editalId}-${dIdx + 1}-${tIdx + 1}-${Math.random().toString(36).substr(2, 5)}`,
                disciplineId: matchingDisc.id,
                name: topicTitle,
                subtopics: [],
                isStudied: false,
                isReviewed: false,
                reviewCount: 0,
                questionsDone: 0,
                questionsCorrect: 0,
                accuracyRate: 0,
                masteryRate: 0,
              });
            }
          });
        }
      });

      // Validação / Log de auditoria completo exigido para rastreabilidade
      console.log("==========================================");
      console.log("[AUDITORIA PLANOS] PERSISTÊNCIA INICIADA");
      console.log(`Plano: ${planId}`);
      console.log(`Edital: ${editalId}`);
      console.log(`Cargo: ${activeCargo?.id || activeCargo?.name || "Sem cargo específico"}`);
      console.log(`Disciplinas: ${newDisciplines.length}`);
      console.log(`Tópicos: ${newTopics.length}`);
      console.log("ESTRUTURA FINAL QUE SERÁ PERSISTIDA:", {
        planId,
        editalId,
        cargo: activeCargo?.name,
        disciplinesCount: newDisciplines.length,
        topicsCount: newTopics.length,
        disciplinesSample: newDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          color: d.color,
          topicsCount: newTopics.filter((t) => t.disciplineId === d.id).length,
        })),
      });
      console.log("==========================================");

      // 3. Cria e persiste o Edital no Firestore com disciplinas e tópicos integrados
      const createdEdital = await createEdital({
        id: editalId,
        title: finalTitle,
        organ: organ.trim() || selectedObjective,
        cargo: activeCargo?.name || undefined,
        banca: editalBoard.trim() || "A definir",
        year: editalYear || new Date().getFullYear(),
        careerId: selectedCareerId,
        sourceHash: parsedData?.sourceHash,
        normalizedIdentity: parsedData?.normalizedIdentity,
        disciplines: newDisciplines,
        topics: newTopics,
      });

      // 4. Se for admin e solicitou publicar ou salvar no catálogo
      let publishedCatalogId: string | undefined = selectedCatalogEdital?.id;
      if (isAdmin && (publishToCatalog || isDraft) && !selectedCatalogEdital) {
        // REGRA OFICIAL DO CATÁLOGO: os 8 campos obrigatórios devem estar
        // verificados antes de salvar. Sem fallbacks genéricos — dados
        // ausentes ou inválidos impedem o salvamento do registro oficial.
        const catalogValidation = validateCatalogEditalData({
          title: planTitle.trim(),
          cargoPretendido: cargoPretendido.trim(),
          institution: organ.trim(),
          acronym: organAcronym.trim(),
          uf: editalUf.trim(),
          board: editalBoard.trim(),
          year: Number(editalYear),
          logoUrl: selectedImageFile ? selectedImageFile.name : "",
        });

        if (!catalogValidation.valid) {
          setCatalogValidationErrors(catalogValidation.errors);
          setStep("review");
          setIsSaving(false);
          return;
        }
        setCatalogValidationErrors([]);

        // Processa a imagem selecionada para que ela acompanhe o edital publicado
        // no catálogo oficial (visível para TODOS os usuários, não só o publicador).
        let catalogLogoDataUrl: string | undefined;
        if (selectedImageFile) {
          try {
            const processedLogo = await processAndCompressPlanImage(selectedImageFile);
            catalogLogoDataUrl = processedLogo.dataUrl;
          } catch (logoErr: any) {
            console.warn("[CATALOG] Falha ao processar imagem do edital:", logoErr);
          }
        }

        // Snapshot completa do edital + cargos + disciplinas + tópicos (Step 5)
        const catalogEntry: CatalogEdital = {
          id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: planTitle.trim(),
          institution: organ.trim(),
          acronym: organAcronym.trim().toUpperCase(),
          state: editalUf.trim().toUpperCase(),
          uf: editalUf.trim().toUpperCase(),
          year: Number(editalYear),
          careerId: selectedCareerId,
          objectiveType: selectedObjective,
          editalNumber: parsedData?.editalNumber || "01",
          board: editalBoard.trim(),
          publicationDate: parsedData?.publicationDate || new Date().toISOString(),
          sourceFileName: editalFile?.name || "importacao_direta.pdf",
          sourceType: "pdf",
          sourceHash: parsedData?.sourceHash || `manual-${Date.now()}`,
          normalizedIdentity: parsedData?.normalizedIdentity,
          logoUrl: selectedImageFile ? `plan-image:${planId}` : "",
          logoDataUrl: catalogLogoDataUrl,
          cargoPretendido: cargoPretendido.trim(),
          imagemTipo: "logo_oficial",
          dadosVerificados: true,
          status: publishToCatalog ? "published" : "draft",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userUid,
          validatedBy: publishToCatalog ? userUid : undefined,
          description: editalNotes || undefined,
        };

        const catalogCargos: PublishedEditalSnapshot["cargos"] = cargosList.map(
          (c, cIdx) => ({
            id: `cargo-${catalogEntry.id}-${cIdx + 1}`,
            name: c.name.trim(),
            level: c.level || "superior",
            vacancies: c.vacancies ?? "A definir",
            order: cIdx + 1,
            disciplines: c.disciplines.map((d, dIdx) => ({
              id: `disc-${catalogEntry.id}-${cIdx + 1}-${dIdx + 1}`,
              name: d.name.trim(),
              order: d.order || dIdx + 1,
              weight: d.weight || 2,
              topics: (d.topics || []).map((t, tIdx) => ({
                id: `topic-${catalogEntry.id}-${cIdx + 1}-${dIdx + 1}-${tIdx + 1}`,
                title: t.title.trim(),
                order: t.order || tIdx + 1,
                sourceReference: (t as any).sourceReference,
              })),
            })),
          })
        );

        // 4a. PUBLICA NO BANCO DE DADOS DO SERVIDOR (PostgreSQL) — fonte oficial
        // do catálogo. Regra: publicou o edital, ele já aparece para todos os
        // usuários como opção de plano disponível. Falhas são exibidas.
        try {
          await publishEditalToServer(catalogEntry, catalogCargos);
          publishedCatalogId = catalogEntry.id;
        } catch (pubErr: any) {
          console.error("[CATALOG] Falha ao publicar no banco de dados:", pubErr);
          setCatalogValidationErrors([
            `Falha ao publicar o edital no catálogo oficial: ${pubErr?.message || pubErr}`,
          ]);
          setStep("review");
          setIsSaving(false);
          return;
        }

        // 4b. Espelhamento best-effort no Firestore (compatibilidade com
        // clientes legados). Falhas aqui não bloqueiam a publicação oficial.
        try {
          await createCatalogEdital(
            {
              id: catalogEntry.id,
              title: catalogEntry.title,
              cargoPretendido: catalogEntry.cargoPretendido || "",
              institution: catalogEntry.institution,
              acronym: catalogEntry.acronym,
              state: catalogEntry.state,
              uf: catalogEntry.uf,
              year: catalogEntry.year,
              careerId: catalogEntry.careerId,
              objectiveType: catalogEntry.objectiveType,
              editalNumber: catalogEntry.editalNumber,
              board: catalogEntry.board,
              publicationDate: catalogEntry.publicationDate,
              sourceFileName: catalogEntry.sourceFileName,
              sourceType: catalogEntry.sourceType,
              sourceHash: `${catalogEntry.sourceHash}`,
              normalizedIdentity: catalogEntry.normalizedIdentity,
              logoUrl: catalogEntry.logoUrl || "",
              status: catalogEntry.status,
              description: catalogEntry.description,
            },
            userUid
          );

          for (let cIdx = 0; cIdx < catalogCargos!.length; cIdx++) {
            const cItem = catalogCargos![cIdx];
            const addedCargo = await addCargoToCatalogEdital(
              catalogEntry.id,
              {
                name: cItem.name,
                level: cItem.level,
                vacancies: cItem.vacancies,
                order: cItem.order,
              },
              userUid
            );

            for (let dIdx = 0; dIdx < cItem.disciplines.length; dIdx++) {
              const dItem = cItem.disciplines[dIdx];
              const addedDisc = await addDisciplineToCargo(
                catalogEntry.id,
                addedCargo.id,
                {
                  name: dItem.name,
                  weight: dItem.weight || 2,
                  order: dItem.order || dIdx + 1,
                },
                userUid
              );

              for (const tItem of dItem.topics) {
                await addTopicToDiscipline(
                  catalogEntry.id,
                  addedCargo.id,
                  addedDisc.id,
                  {
                    title: tItem.title,
                    order: tItem.order,
                    sourceReference: tItem.sourceReference,
                  },
                  userUid
                );
              }
            }
          }
        } catch (adminCatErr) {
          console.warn("[CATALOG] Aviso ao espelhar no Firestore (publicação no banco oficial seguiu normal):", adminCatErr);
        }

        refreshCatalogEditais();
      } else if (!isAdmin && editalFile && parsedData) {
        // Usuário regular enviando edital: registra submissão para revisão administrativa
        try {
          await submitUserEdital({
            userId: userUid,
            sourceFileName: editalFile.name,
            sourceHash: parsedData.sourceHash,
            personalEditalId: createdEdital.id,
            notes: editalNotes || undefined,
          });
        } catch (submErr) {
          console.warn("[CATALOG] Aviso ao registrar submissão de usuário:", submErr);
        }
      }

      // 5. Cria e persiste o StudyPlan com vinculação rastreável ao edital e ciclo com IDs das disciplinas
      const newPlan = await createStudyPlan({
        id: planId,
        name: finalTitle,
        editalId: createdEdital.id,
        organ: organ.trim() || selectedObjective,
        cargo: activeCargo?.name || undefined,
        weeklyGoalHours: Number(weeklyGoalHours) || 20,
        notes: editalNotes.trim() || undefined,
        active: true,
        sourceEditalId: publishedCatalogId || selectedCatalogEdital?.id,
        sourceEditalType: selectedCatalogEdital ? "catalog" : editalFile ? "imported" : "manual",
        sourceEditalVersion: selectedCatalogEdital?.version || 1,
        sourceCargoId: selectedCatalogCargo?.id || activeCargo?.id,
        careerId: selectedCareerId,
        updateAvailable: false,
        organizationType: "ciclo",
        planningMode: "CYCLE",
        cycle: newDisciplines.map((d, idx) => ({
          id: `step-${idx + 1}`,
          disciplineId: d.id,
          targetMinutes: d.weight === 3 ? 90 : 60,
          order: idx + 1,
        })),
        currentCycleIndex: 0,
        currentStepElapsedMinutes: 0,
        completedCycles: 0,
        minSessionMinutes: 30,
        maxSessionMinutes: 90,
        dailyAvailability: { seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 4, dom: 1 },
      });

      // 6. Tratamento de upload de imagem
      if (selectedImageFile && userUid) {
        try {
          const processed = await processAndCompressPlanImage(selectedImageFile);
          await savePlanImageToFirestore(
            userUid,
            newPlan.id,
            processed.dataUrl,
            processed.mimeType,
            processed.sizeBytes
          );
          setPlanImageCache(newPlan.id, processed.dataUrl);
          updateStudyPlan(newPlan.id, {
            hasCustomImage: true,
            imageRef: newPlan.id,
          });
        } catch (imgErr) {
          console.error("[NEXO PLAN IMAGE]: Falha ao salvar imagem do plano:", imgErr);
        }
      }

      console.log(`[AUDITORIA PLANOS] SUCESSO: Plano "${newPlan.id}" persistido com ${newDisciplines.length} disciplinas e ${newTopics.length} tópicos.`);

      setActivePlanId(newPlan.id);
      setActiveEditalId(createdEdital.id);
      setActiveTab("planos");
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error("Erro ao finalizar criação do plano:", err);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-[#384154] bg-[#252B38] shadow-2xl dark:border-[#384154] dark:bg-[#252B38]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#384154] bg-[#171B25] px-5 sm:px-6 py-3.5 dark:border-[#384154] dark:bg-[#11151F]">
          <div>
            <h2 className="font-condensed text-lg sm:text-xl font-bold uppercase tracking-wide text-white dark:text-white flex items-baseline gap-1">
              <span>Seu Plano</span>
              <span className="text-[#F3AA2D]">.</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-white dark:text-white">
              {step === "objective" && "Etapa 1 de 6: Objetivo principal"}
              {step === "career" && "Etapa 2 de 6: Carreira pretendida"}
              {step === "edital" && "Etapa 3 de 6: Seleção ou importação do edital"}
              {step === "data" && "Etapa 4 de 6: Dados e arquivos do edital"}
              {step === "content" && "Etapa 5 de 6: Conteúdo programático e tópicos"}
              {step === "review" && "Etapa 6 de 6: Revisão e confirmação"}
              {step === "processing" && "Organizando seu plano de estudos..."}
            </p>
          </div>

          {step !== "processing" && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white hover:bg-[#2D3442] hover:text-white dark:text-white dark:hover:bg-[#2D3442] dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Linear Step Progress Bar */}
        {step !== "processing" && (
          <div className="w-full bg-[#171B25] dark:bg-[#171B25] h-1">
            <div
              className="h-full bg-[#F3AA2D] transition-all duration-300"
              style={{
                width:
                  step === "objective"
                    ? "16.6%"
                    : step === "career"
                    ? "33.3%"
                    : step === "edital"
                    ? "50%"
                    : step === "data"
                    ? "66.6%"
                    : step === "content"
                    ? "83.3%"
                    : "100%",
              }}
            />
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* ========================================================================= */}
          {/* ETAPA 1: OBJETIVO PRINCIPAL (LISTA VERTICAL ROLÁVEL) */}
          {/* ========================================================================= */}
          {step === "objective" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white dark:text-white">
                  Qual o seu objetivo com o NEXO?
                </h3>
                <p className="text-xs text-white dark:text-white mt-0.5">
                  Escolha o tipo de preparação que você vai iniciar:
                </p>

                {/* Botões de objetivo com faixa lateral */}
                <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto pr-0.5">
                  {OBJECTIVE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedObjective === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedObjective(opt.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? "border-[#F3AA2D]/60 bg-[#F3AA2D]/10"
                            : "border-[#384154] bg-[#171B25] hover:border-[#4A5470] hover:bg-[#1B2129]"
                        }`}
                      >
                        <span
                          className={`h-9 w-1.5 shrink-0 rounded-full transition ${
                            isSelected ? "bg-[#F3AA2D]" : "bg-[#384154]"
                          }`}
                        />
                        <div
                          className={`p-1.5 rounded-lg shrink-0 transition ${
                            isSelected ? "bg-[#F3AA2D] text-[#11151F]" : "bg-[#252B38] text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs block font-bold truncate ${
                                isSelected ? "text-[#F3AA2D]" : "text-white dark:text-white"
                              }`}
                            >
                              {opt.title}
                            </span>
                            {opt.badge && (
                              <span className="rounded-full bg-[#F3AA2D]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#F3AA2D] shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/70 dark:text-white line-clamp-1 mt-0.5">
                            {opt.description}
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F3AA2D] text-[#11151F]">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded-full border border-[#384154]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Painel lateral com os diferenciais do NEXO */}
              <WizardSidePanel title="Sua jornada de estudos começa aqui!" />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: CARREIRA (LISTA VERTICAL ROLÁVEL) */}
          {/* ========================================================================= */}
          {step === "career" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                  Áreas de interesse
                </span>
                <h3 className="text-sm font-bold text-white dark:text-white mt-1">
                  Qual área combina com o seu objetivo?
                </h3>
                <p className="text-xs text-white dark:text-white mt-0.5">
                  Usamos a área para organizar o catálogo de editais do NEXO:
                </p>

                {/* Grade de áreas em formato de pílulas */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {CAREER_OPTIONS.map((area) => {
                    const isSelected = selectedCareerId === area.id;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          setSelectedCareerId(area.id);
                          setSelectedCatalogEdital(null);
                          setSelectedCatalogCargo(null);
                          setAvailableCatalogCargos([]);
                          setUfFilter("all");
                        }}
                        className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "border-[#F3AA2D] bg-[#F3AA2D] text-[#11151F]"
                            : "border-[#384154] bg-[#171B25] text-white hover:border-[#4A5470] hover:bg-[#1B2129]"
                        }`}
                      >
                        {area.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <WizardSidePanel title="Editais organizados pela sua área" />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: EDITAL E CARGO (BUSCA, LISTA VERTICAL E SELEÇÃO DE CARGO) */}
          {/* ========================================================================= */}
          {step === "edital" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
              <div className="min-w-0 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white dark:text-white">
                    Escolha seu edital
                  </h3>
                  <p className="text-xs text-white dark:text-white mt-0.5">
                    Área: <strong className="text-white dark:text-white">{currentCareer.title}</strong> • Selecione o certame e, em seguida, o cargo pretendido:
                  </p>
                </div>

                {/* Filtros e Ações Rápidas */}
                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white" />
                    <input
                      type="text"
                      value={concursoSearchQuery}
                      onChange={(e) => setConcursoSearchQuery(e.target.value)}
                      placeholder={`Buscar edital de ${currentCareer.title}...`}
                      className="w-full rounded-xl border border-[#384154] bg-[#171B25] py-2 pl-9 pr-3.5 text-xs text-white placeholder:text-white/50 focus:border-[#F3AA2D] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <select
                        value={ufFilter}
                        onChange={(e) => setUfFilter(e.target.value)}
                        className="appearance-none rounded-full border border-[#384154] bg-[#171B25] py-1.5 pl-3.5 pr-8 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-hidden cursor-pointer dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                      >
                        <option value="all">Todas as UFs</option>
                        {availableUfs.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
                    </div>

                    <button
                      type="button"
                      onClick={handleStartImportEdital}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#384154] bg-[#171B25] hover:bg-[#2D3442] dark:border-[#384154] dark:bg-[#171B25] dark:hover:bg-[#2D3442] px-3 py-1.5 text-xs font-semibold text-white dark:text-white transition cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#F3AA2D]" />
                      <span>Importar edital (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectCustomPlan}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#384154] bg-[#171B25] hover:bg-[#2D3442] dark:border-[#384154] dark:bg-[#171B25] dark:hover:bg-[#2D3442] px-3 py-1.5 text-xs font-semibold text-white dark:text-white transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#F3AA2D]" />
                      <span>Criar plano personalizado</span>
                    </button>
                  </div>
                </div>

                {/* Cards de instituições com cargos em pílulas */}
                <div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                    Editais disponíveis ({editaisForCareer.length})
                  </span>

                  {editaisForCareer.length === 0 ? (
                    <div className="mt-2 flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-[#384154] dark:border-[#384154] bg-[#171B25]/50 dark:bg-[#252B38]/40 text-center">
                      <BookOpen className="w-5 h-5 text-white mb-2" />
                      <h4 className="text-xs font-bold text-white dark:text-white">
                        Nenhum edital encontrado para esta área.
                      </h4>
                      <p className="text-[11px] text-white dark:text-white mt-0.5 max-w-sm">
                        Utilize os botões acima para importar o PDF oficial ou montar um plano livre.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 max-h-[340px] space-y-2.5 overflow-y-auto pr-0.5">
                      {editaisForCareer.map((ed) => {
                        const isSelected = selectedCatalogEdital?.id === ed.id;
                        const cargosCount = editalCargosCountMap[ed.id] ?? ed.cargosCount ?? 1;
                        const initials = (ed.acronym || ed.institution || "ED")
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        // Imagem do edital: dataUrl publicada no catálogo oficial
                        // ou URL direta. Sem imagem, mantém as iniciais.
                        const logoSrc: string | null =
                          ed.logoDataUrl ||
                          (ed.logoUrl && /^https?:\/\//i.test(ed.logoUrl) ? ed.logoUrl : null) ||
                          null;

                        return (
                          <div
                            key={ed.id}
                            className={`rounded-2xl border p-3.5 transition ${
                              isSelected
                                ? "border-[#F3AA2D]/60 bg-[#F3AA2D]/[0.07]"
                                : "border-[#384154] bg-[#171B25] hover:border-[#4A5470]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectCatalogEdital(ed)}
                              disabled={isLoadingCargos}
                              className="flex w-full items-center gap-3 text-left transition cursor-pointer"
                            >
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt={ed.institution}
                                  className={`h-10 w-10 shrink-0 rounded-full border object-cover transition ${
                                    isSelected ? "border-[#F3AA2D]" : "border-[#384154]"
                                  }`}
                                />
                              ) : (
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-condensed text-xs font-bold transition ${
                                    isSelected
                                      ? "border-[#F3AA2D] bg-[#F3AA2D] text-[#11151F]"
                                      : "border-[#384154] bg-[#252B38] text-[#F3AA2D]"
                                  }`}
                                >
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-white dark:text-white block truncate">
                                  {ed.institution}
                                </span>
                                <span className="text-[10px] text-white/70 dark:text-white block truncate mt-0.5">
                                  Banca: {ed.board || "A definir"} • {ed.year || "—"} • {ed.state || ed.uf || "BR"} • {cargosCount} {cargosCount === 1 ? "cargo" : "cargos"}
                                </span>
                              </div>

                              {isSelected ? (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F3AA2D] text-[#11151F]">
                                  <Check className="h-3 w-3" />
                                </div>
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
                              )}
                            </button>

                            {/* Cargos do edital selecionado em formato de pílulas */}
                            {isSelected && (
                              <div className="mt-3 border-t border-[#384154] pt-3">
                                {isLoadingCargos ? (
                                  <span className="text-[11px] text-white inline-flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin text-[#F3AA2D]" />
                                    Carregando cargos...
                                  </span>
                                ) : availableCatalogCargos.length === 0 ? (
                                  <p className="text-[11px] text-white/70">
                                    Nenhum cargo específico cadastrado. Conteúdo geral selecionado.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {availableCatalogCargos.map((cargoItem) => {
                                      const isCargoSelected = selectedCatalogCargo?.id === cargoItem.id;
                                      return (
                                        <button
                                          key={cargoItem.id}
                                          type="button"
                                          onClick={() =>
                                            handleSelectCatalogCargo(selectedCatalogEdital, cargoItem)
                                          }
                                          className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition cursor-pointer ${
                                            isCargoSelected
                                              ? "bg-[#F3AA2D] text-[#11151F]"
                                              : "bg-[#252B38] text-white hover:bg-[#2D3442]"
                                          }`}
                                        >
                                          {cargoItem.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo da seleção atual */}
              <WizardSelectionPanel
                edital={selectedCatalogEdital}
                cargo={selectedCatalogCargo}
                disciplinesCount={totalDisciplinesAcrossAllCargos}
                topicsCount={totalTopicsAcrossAllCargos}
                isLoading={isLoadingCargos}
                onClear={() => {
                  setSelectedCatalogEdital(null);
                  setSelectedCatalogCargo(null);
                  setAvailableCatalogCargos([]);
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: DADOS E ARQUIVOS DO EDITAL */}
          {/* ========================================================================= */}
          {step === "data" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white dark:text-white">
                  Dados e Arquivos do Edital
                </h3>
                <p className="text-xs text-white dark:text-white mt-0.5">
                  Revise as informações cadastrais e os arquivos vinculados:
                </p>
              </div>

              {/* Visualização Discreta de Carreira e Cargo Selecionados */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#384154] dark:border-[#384154] bg-[#171B25]/70 dark:bg-[#2D3442]/50">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                      Carreira
                    </span>
                    <span className="font-bold text-white dark:text-white">
                      {currentCareer.title}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-[#384154] dark:bg-[#384154] hidden sm:block" />
                  <div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                      Cargo
                    </span>
                    <span className="font-bold text-white dark:text-white">
                      {selectedCatalogCargo?.name ||
                        (activeCargo && activeCargo.name !== "Cargo não identificado"
                          ? activeCargo.name
                          : null) ||
                        (isCustomConcurso
                          ? "Geral (Personalizado)"
                          : "A ser identificado no PDF")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("edital")}
                  className="text-xs font-bold text-[#F3AA2D] hover:underline cursor-pointer"
                >
                  Alterar
                </button>
              </div>

              {/* Upload & Estado do Arquivo PDF */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                  Documento Oficial do Edital (PDF)
                </label>

                {editalFile ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#384154] bg-[#252B38] dark:border-[#384154] dark:bg-[#252B38] shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white dark:text-white truncate block">
                          {editalFile.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-white dark:text-white">
                            {(editalFile.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Documento carregado
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2D3442] dark:text-white dark:hover:bg-[#2D3442] transition"
                      >
                        Trocar documento
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="rounded-lg p-1.5 text-white hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Remover documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePdfFileSelected(file);
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#384154] hover:border-[#F3AA2D] bg-[#171B25]/50 hover:bg-[#F3AA2D]/5 dark:border-[#384154] dark:bg-[#252B38]/40 cursor-pointer transition text-center"
                    >
                      <Upload className="h-7 w-7 text-white mb-2" />
                      <span className="text-xs font-bold text-white dark:text-white">
                        Clique para selecionar o edital em PDF
                      </span>
                      <span className="text-[11px] text-white mt-0.5">
                        Processamento direto e seguro no seu navegador (sem limites externos)
                      </span>
                    </div>
                  </div>
                )}

                {/* Feedback de Progresso de Leitura */}
                {isParsingPdf && importProgress && (
                  <div className="p-3.5 rounded-xl border border-[#F3AA2D]/30 bg-[#F3AA2D]/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#F3AA2D] flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {importProgress.message}
                      </span>
                      {importProgress.totalPages && (
                        <span className="text-[10px] text-white font-mono">
                          Página {importProgress.currentPage || 1} de {importProgress.totalPages}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-[#384154] dark:bg-[#171B25] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#F3AA2D] h-full transition-all duration-200"
                        style={{
                          width:
                            importProgress.phase === "reading"
                              ? `${Math.min(90, ((importProgress.currentPage || 1) / (importProgress.totalPages || 10)) * 100)}%`
                              : importProgress.phase === "detecting_sections"
                              ? "75%"
                              : importProgress.phase === "parsing_disciplines"
                              ? "90%"
                              : "100%",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Erro de Importação */}
                {importError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Alerta de Duplicidade */}
                {duplicityWarning && !ignoreDuplicityWarning && (
                  <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>{duplicityWarning.reason}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Você pode visualizar o edital já existente ou continuar como uma nova versão do certame.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIgnoreDuplicityWarning(true)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                      >
                        Continuar como nova versão
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulário Principal Limpo */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                    Título do Edital *
                  </label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    required
                    placeholder="Ex: Concurso Público da Polícia Federal – 2021"
                    className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                    Cargo Pretendido *
                  </label>
                  <input
                    type="text"
                    value={cargoPretendido}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCargoPretendido(val);
                      if (activeCargoId) {
                        setCargosList((prev) =>
                          prev.map((c) =>
                            c.id === activeCargoId
                              ? { ...c, name: val, normalizedName: val.toLowerCase().trim() }
                              : c
                          )
                        );
                      } else if (cargosList.length > 0) {
                        setCargosList((prev) =>
                          prev.map((c, idx) =>
                            idx === 0
                              ? { ...c, name: val, normalizedName: val.toLowerCase().trim() }
                              : c
                          )
                        );
                      }
                    }}
                    required
                    placeholder="Ex: Agente de Polícia Federal"
                    className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                      Órgão / Instituição *
                    </label>
                    <input
                      type="text"
                      value={organ}
                      onChange={(e) => setOrgan(e.target.value)}
                      placeholder="Ex: Polícia Federal"
                      className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                      Sigla *
                    </label>
                    <input
                      type="text"
                      value={organAcronym}
                      onChange={(e) => setOrganAcronym(e.target.value.toUpperCase())}
                      placeholder="Ex: PF"
                      maxLength={10}
                      className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                      UF (Estado) *
                    </label>
                    <select
                      value={editalUf}
                      onChange={(e) => setEditalUf(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                    >
                      <option value="">Selecione a UF</option>
                      {VALID_CATALOG_UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                      Banca Examinadora *
                    </label>
                    <input
                      type="text"
                      value={editalBoard}
                      onChange={(e) => setEditalBoard(e.target.value)}
                      placeholder="Ex: Cebraspe, FGV, Vunesp"
                      className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                      Ano do Certame *
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2035"
                      placeholder="Ex: 2021"
                      value={editalYear}
                      onChange={(e) =>
                        setEditalYear(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-1 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#F3AA2D] focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                    />
                  </div>
                </div>

                {/* Imagem do Plano */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                    Imagem do Plano *
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedImageFile(file);
                      setPreviewImageUrl(URL.createObjectURL(file));
                    }}
                  />
                  {previewImageUrl ? (
                    <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#384154] bg-[#252B38] p-2.5 dark:border-[#384154] dark:bg-[#252B38]">
                      <img
                        src={previewImageUrl}
                        alt="Imagem do plano"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover border border-[#384154] dark:border-[#384154]"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-xs font-semibold text-white hover:text-white dark:text-white dark:hover:text-white truncate flex-1 cursor-pointer"
                      >
                        {selectedImageFile?.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setPreviewImageUrl(null);
                          if (imageInputRef.current) imageInputRef.current.value = "";
                        }}
                        className="rounded-lg p-1.5 text-white hover:text-red-500 hover:bg-red-950/30 transition"
                        title="Remover imagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#384154] hover:border-[#F3AA2D] bg-[#171B25]/50 hover:bg-[#F3AA2D]/5 dark:border-[#384154] dark:bg-[#252B38]/40 px-3 py-3 text-xs font-bold text-white dark:text-white transition cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-[#F3AA2D]" />
                      Selecionar imagem
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 5: CONTEÚDO (O CORAÇÃO DO FLUXO) */}
          {/* ========================================================================= */}
          {step === "content" && (
            <div className="space-y-4">
              {/* Banner superior com validação do conteúdo programático */}
              {editalFile && parsedData && (
                <>
                  {parsedData.validation?.valid ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-[#F3AA2D]/30 bg-[#F3AA2D]/5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F3AA2D]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                          Conteúdo identificado no documento ({activeCargoDisciplines.length} disciplinas • {activeCargoTopicsCount} tópicos)
                        </span>
                        {parsedData.programmaticSection && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F3AA2D]/15 text-[#F3AA2D]">
                            Páginas {parsedData.programmaticSection.startPage} a {parsedData.programmaticSection.endPage}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (parsedData?.programmaticSection) {
                            setManualStartPage(parsedData.programmaticSection.startPage);
                            setManualEndPage(parsedData.programmaticSection.endPage);
                          }
                          setIsManualPageSelectionOpen(!isManualPageSelectionOpen);
                        }}
                        className="text-[11px] font-bold text-white hover:text-white dark:text-white dark:hover:text-white underline cursor-pointer"
                      >
                        Ajustar páginas
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Revise a localização do conteúdo programático
                            </h4>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                              Não foi possível identificar com segurança o conteúdo programático deste edital.
                            </p>
                            {parsedData.validation?.reasons && parsedData.validation.reasons.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300 list-disc list-inside">
                                {parsedData.validation.reasons.map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setManualStartPage(parsedData.programmaticSection?.startPage || 1);
                            setManualEndPage(parsedData.programmaticSection?.endPage || parsedData.pagesCount || 1);
                            setIsManualPageSelectionOpen(true);
                          }}
                          className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition cursor-pointer"
                        >
                          Selecionar páginas
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulário de Seleção Manual de Páginas */}
                  {isManualPageSelectionOpen && (
                    <div className="p-3.5 rounded-xl border border-[#384154] bg-[#252B38] dark:border-[#384154] dark:bg-[#2D3442] space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white dark:text-white flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#F3AA2D]" />
                          Selecionar páginas do conteúdo programático
                        </h4>
                        <span className="text-[11px] text-white dark:text-white">
                          Total do documento: {parsedData?.pagesCount || 0} páginas
                        </span>
                      </div>
                      <p className="text-[11px] text-white dark:text-white">
                        Indique o intervalo onde está o anexo ou a seção de disciplinas e matérias para recortar com precisão:
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-white dark:text-white font-medium">Página inicial:</label>
                          <input
                            type="number"
                            min={1}
                            max={parsedData?.pagesCount || 1000}
                            value={manualStartPage}
                            onChange={(e) => setManualStartPage(Number(e.target.value))}
                            className="w-16 rounded-lg border border-[#384154] bg-[#171B25] px-2 py-1 text-xs font-bold text-white text-center dark:border-[#384154] dark:bg-[#252B38] dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-white dark:text-white font-medium">Página final:</label>
                          <input
                            type="number"
                            min={1}
                            max={parsedData?.pagesCount || 1000}
                            value={manualEndPage}
                            onChange={(e) => setManualEndPage(Number(e.target.value))}
                            className="w-16 rounded-lg border border-[#384154] bg-[#171B25] px-2 py-1 text-xs font-bold text-white text-center dark:border-[#384154] dark:bg-[#252B38] dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleProcessManualPages}
                          className="px-3 py-1 text-xs font-bold text-white bg-[#F3AA2D] hover:bg-[#1f8771] rounded-lg transition cursor-pointer"
                        >
                          Processar essas páginas
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsManualPageSelectionOpen(false)}
                          className="text-xs text-white hover:text-white dark:hover:text-white px-1 cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Seção Cargos Identificados */}
              <div className="rounded-xl border border-[#384154] dark:border-[#384154] bg-[#252B38] dark:bg-[#252B38] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#171B25] dark:bg-[#2D3442] border-b border-[#384154] dark:border-[#384154]">
                  <span className="text-xs font-bold text-white dark:text-white uppercase tracking-wider">
                    Cargos identificados ({cargosList.length})
                  </span>
                  {!isAddingNewCargo && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCargo(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#F3AA2D] hover:underline cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar cargo</span>
                    </button>
                  )}
                </div>

                {/* Formulário inline para adicionar cargo */}
                {isAddingNewCargo && (
                  <div className="p-3 bg-[#171B25]/50 dark:bg-[#2D3442]/50 border-b border-[#384154] dark:border-[#384154] flex items-center gap-2">
                    <input
                      type="text"
                      value={newCargoName}
                      onChange={(e) => setNewCargoName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNewCargo()}
                      placeholder="Nome do novo cargo..."
                      className="flex-1 rounded-lg border border-[#384154] bg-[#252B38] px-2.5 py-1.5 text-xs text-white focus:border-[#F3AA2D] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCargo}
                      className="rounded-lg bg-[#F3AA2D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f8771]"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCargo(false);
                        setNewCargoName("");
                      }}
                      className="text-xs text-white hover:text-white dark:hover:text-white px-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Lista de Cargos com checkmarks, renomear, remover e aviso de cargo inválido */}
                <div className="divide-y divide-[#384154] dark:divide-[#384154] max-h-48 overflow-y-auto">
                  {cargosList.length === 0 ? (
                    <div className="p-3 text-xs text-white text-center">
                      Nenhum cargo adicionado ainda.
                    </div>
                  ) : (
                    cargosList.map((cargo) => {
                      const isInvalidCargo = cargo.name === "Cargo não identificado";
                      const isActive = activeCargoId === cargo.id;
                      const isEditing = editingCargoId === cargo.id;
                      const totalTopics = cargo.disciplines.reduce((acc, d) => acc + d.topics.length, 0);

                      return (
                        <div
                          key={cargo.id}
                          onClick={() => setActiveCargoId(cargo.id)}
                          className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                            isActive
                              ? "bg-[#F3AA2D]/5 dark:bg-[#F3AA2D]/10 ring-1 ring-inset ring-[#F3AA2D]/30"
                              : "hover:bg-[#2D3442] dark:hover:bg-[#2D3442]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {isInvalidCargo ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  <AlertTriangle className="h-4 w-4 shrink-0" />
                                  <span>⚠️ Cargo não identificado</span>
                                </div>
                                <p className="text-[11px] text-white dark:text-white">
                                  O edital não especificou este cargo claramente. Clique ao lado para definir o nome.
                                </p>
                              </div>
                            ) : isEditing ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingCargoName}
                                  onChange={(e) => setEditingCargoName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameCargo(cargo.id, editingCargoName);
                                    if (e.key === "Escape") setEditingCargoId(null);
                                  }}
                                  className="flex-1 rounded-lg border border-[#F3AA2D] bg-[#252B38] px-2 py-1 text-xs text-white dark:bg-[#171B25] dark:text-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameCargo(cargo.id, editingCargoName)}
                                  className="rounded-md bg-[#F3AA2D] px-2 py-1 text-[11px] font-bold text-white"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCargoId(null)}
                                  className="text-[11px] text-white hover:text-white px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[#F3AA2D] font-bold text-xs shrink-0">✓</span>
                                <div className="min-w-0">
                                  <span
                                    className={`font-bold text-xs block truncate ${
                                      isActive
                                        ? "text-[#F3AA2D] dark:text-[#F3AA2D]"
                                        : "text-white dark:text-white"
                                    }`}
                                  >
                                    {cargo.name}
                                  </span>
                                  <span className="text-[11px] text-white dark:text-white block truncate mt-0.5">
                                    {cargo.disciplines.length} {cargo.disciplines.length === 1 ? "disciplina" : "disciplinas"} • {totalTopics} {totalTopics === 1 ? "tópico" : "tópicos"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Ações do Cargo */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isInvalidCargo ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCargoId(cargo.id);
                                  setEditingCargoName("");
                                }}
                                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
                              >
                                Informar cargo
                              </button>
                            ) : (
                              <>
                                {!isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCargoId(cargo.id);
                                      setEditingCargoName(cargo.name);
                                    }}
                                    title="Renomear cargo"
                                    className="p-1 rounded-md text-white hover:text-white dark:hover:text-white transition cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {cargosList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCargo(cargo.id)}
                                    title="Remover cargo"
                                    className="p-1 rounded-md text-white hover:text-red-600 transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seletor de Nova Disciplina com Métrica de Cor Automática e Opção Manual */}
              <div className="rounded-xl border border-[#384154] bg-[#171B25] p-2.5 dark:border-[#384154] dark:bg-[#2D3442] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDiscName}
                    onChange={(e) => setNewDiscName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const conflict = activeCargoDisciplines.find((d) =>
                          areColorsEqual(d.color || "", newDiscColor)
                        );
                        if (!conflict) handleAddDiscipline();
                      }
                    }}
                    placeholder="Adicionar disciplina ao cargo (ex: Direito Processual Penal)..."
                    className="flex-1 rounded-lg border border-[#384154] bg-[#252B38] px-3 py-1.5 text-xs text-white focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                  />

                  {/* Seletor de Cor da Nova Matéria (Automático + Opção Manual) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNewDiscColorPalette(!showNewDiscColorPalette)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#384154] dark:border-[#384154] bg-[#252B38] dark:bg-[#171B25] hover:bg-[#2D3442] dark:hover:bg-[#2D3442] transition cursor-pointer shadow-2xs"
                      title="Cor da matéria (troca automaticamente a cada cadastro, ou clique para escolher manual)"
                    >
                      <span
                        className="h-4 w-4 rounded-full ring-1 ring-[#384154] dark:ring-[#384154] shrink-0"
                        style={{ backgroundColor: newDiscColor }}
                      />
                      <span className="font-mono text-[10px] font-bold text-white dark:text-white">
                        {normalizeHex(newDiscColor).toUpperCase()}
                      </span>
                      <Palette className="h-3 w-3 text-white" />
                    </button>

                    {/* Popover de Escolha Manual de Cor */}
                    {showNewDiscColorPalette && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-72 rounded-2xl border border-[#384154] bg-[#252B38] p-3 shadow-xl dark:border-[#384154] dark:bg-[#252B38] animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#384154] dark:border-[#384154]">
                          <span className="text-[11px] font-bold text-white dark:text-white flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5 text-[#F3AA2D]" />
                            Escolher Cor Manualmente
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowNewDiscColorPalette(false)}
                            className="text-white hover:text-white dark:hover:text-white cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white dark:text-white mb-2">
                          Cores com cadeado já pertencem a outras matérias deste cargo e não podem ser repetidas.
                        </p>
                        <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                          {DISTINCT_DISCIPLINE_COLORS.slice(0, 24).map((c) => {
                            const conflictWith = activeCargoDisciplines.find((d) =>
                              areColorsEqual(d.color || "", c)
                            );
                            const isTaken = Boolean(conflictWith);
                            const isSelected = areColorsEqual(newDiscColor, c);

                            return (
                              <button
                                key={c}
                                type="button"
                                disabled={isTaken}
                                onClick={() => {
                                  if (!isTaken) {
                                    setNewDiscColor(c);
                                    setShowNewDiscColorPalette(false);
                                  }
                                }}
                                style={{ backgroundColor: c }}
                                title={
                                  isTaken
                                    ? `Em uso por: ${conflictWith?.name}`
                                    : isSelected
                                    ? "Cor selecionada"
                                    : `Disponível (${c})`
                                }
                                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                  isTaken
                                    ? "opacity-20 cursor-not-allowed"
                                    : isSelected
                                    ? "ring-2 ring-offset-1 ring-[#F3AA2D] scale-110 shadow-sm"
                                    : "hover:scale-110 opacity-90 cursor-pointer"
                                }`}
                              >
                                {isTaken && <Lock className="h-2.5 w-2.5 text-white" />}
                                {isSelected && !isTaken && (
                                  <Check className="h-3 w-3 text-white stroke-[3]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="pt-2 border-t border-[#384154] dark:border-[#384154] flex items-center justify-between text-[11px]">
                          <span className="text-white font-mono text-[10px]">Livre:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={newDiscColor}
                              onChange={(e) => setNewDiscColor(e.target.value)}
                              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                              title="Seletor livre"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const used = activeCargoDisciplines.map((d) => d.color || "#F3AA2D");
                                setNewDiscColor(getNextAvailableDisciplineColor(used));
                                setShowNewDiscColorPalette(false);
                              }}
                              className="text-[10px] font-bold text-[#F3AA2D] hover:underline cursor-pointer"
                            >
                              Sugerir próxima
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão Adicionar Disciplina */}
                  <button
                    type="button"
                    disabled={Boolean(
                      activeCargoDisciplines.find((d) =>
                        areColorsEqual(d.color || "", newDiscColor)
                      )
                    )}
                    onClick={handleAddDiscipline}
                    className="rounded-lg bg-[#F3AA2D] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1f8771] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Aviso se a cor escolhida manualmente já estiver em uso */}
                {(() => {
                  const conflict = activeCargoDisciplines.find((d) =>
                    areColorsEqual(d.color || "", newDiscColor)
                  );
                  if (!conflict) return null;
                  return (
                    <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">
                          Cor em conflito com <strong>{conflict.name}</strong>. Matérias nunca podem repetir cor.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const used = activeCargoDisciplines.map((d) => d.color || "#F3AA2D");
                          setNewDiscColor(getNextAvailableDisciplineColor(used));
                        }}
                        className="text-[10px] font-bold text-[#F3AA2D] dark:text-[#38c9ab] hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        Trocar automática
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Acordeão de Disciplinas e Tópicos */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeCargoDisciplines.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white dark:text-white rounded-xl border border-dashed border-[#384154] dark:border-[#384154]">
                    Nenhuma disciplina cadastrada para este cargo ainda. Adicione disciplinas ou tópicos acima.
                  </div>
                ) : (
                  activeCargoDisciplines.map((disc, dIdx) => {
                    const isExpanded = expandedDiscId === disc.id;
                    return (
                      <div
                        key={disc.id}
                        className="rounded-xl border border-[#384154] bg-[#252B38] overflow-hidden dark:border-[#384154] dark:bg-[#252B38] shadow-2xs"
                      >
                        {/* Cabeçalho do Acordeão */}
                        <div className="flex items-center justify-between p-3 bg-[#171B25]/70 dark:bg-[#2D3442]/50">
                          <div
                            onClick={() => setExpandedDiscId(isExpanded ? null : disc.id)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          >
                            {/* Círculo Interativo com a Cor da Matéria */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorPickerDisc({
                                  id: disc.id,
                                  name: disc.name,
                                  color: disc.color || "#F3AA2D",
                                });
                              }}
                              className="group relative flex items-center justify-center shrink-0 cursor-pointer p-0.5 rounded-full hover:bg-[#2D3442] dark:hover:bg-[#2D3442] transition"
                              title="Clique para alterar a cor desta matéria (cores únicas)"
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-[#252B38] group-hover:scale-125 transition-transform shadow-xs"
                                style={{ backgroundColor: disc.color || "#F3AA2D" }}
                              />
                            </button>
                            <span className="font-bold text-xs text-white dark:text-white truncate">
                              {disc.name}
                            </span>
                            {disc.group && (
                              <span className="rounded-md bg-[#384154]/70 dark:bg-[#171B25] border border-[#384154]/60 dark:border-[#384154]/60 px-1.5 py-0.2 text-[10px] font-semibold text-white dark:text-white shrink-0">
                                {disc.group}
                              </span>
                            )}
                            {disc.sourceReference && (
                              <span className="text-[10px] text-white dark:text-white shrink-0">
                                {disc.sourceReference}
                              </span>
                            )}
                            <span className="rounded-full bg-[#384154]/60 dark:bg-[#171B25] px-2 py-0.2 text-[10px] font-bold text-white dark:text-white shrink-0">
                              {disc.topics.length} {disc.topics.length === 1 ? "tópico" : "tópicos"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveDiscipline(dIdx, "up")}
                              disabled={dIdx === 0}
                              className="p-1 text-white hover:text-white dark:hover:text-white disabled:opacity-30"
                              title="Subir disciplina"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDiscipline(dIdx, "down")}
                              disabled={dIdx === activeCargoDisciplines.length - 1}
                              className="p-1 text-white hover:text-white dark:hover:text-white disabled:opacity-30"
                              title="Descer disciplina"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDiscipline(disc.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-950/40"
                              title="Remover disciplina"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedDiscId(isExpanded ? null : disc.id)}
                              className="p-1 text-white hover:text-white"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Conteúdo Expandido do Acordeão: Lista Ordenada de Tópicos */}
                        {isExpanded && (
                          <div className="p-3 border-t border-[#384154] dark:border-[#384154] space-y-2 bg-[#252B38] dark:bg-[#252B38]">
                            {/* Lista dos Tópicos */}
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                              {disc.topics.length === 0 ? (
                                <p className="text-[11px] text-white py-1 italic">
                                  Nenhum tópico adicionado a esta disciplina.
                                </p>
                              ) : (
                                disc.topics.map((top, tIdx) => (
                                  <div
                                    key={top.id}
                                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#171B25] dark:bg-[#2D3442] hover:bg-[#2D3442] dark:hover:bg-[#2D3442] text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="font-mono text-[10px] font-bold text-white shrink-0">
                                        {String(tIdx + 1).padStart(2, "0")}
                                      </span>
                                      <input
                                        type="text"
                                        value={top.title}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCargosList((prev) =>
                                            prev.map((c) =>
                                              c.id === activeCargo?.id
                                                ? {
                                                    ...c,
                                                    disciplines: c.disciplines.map((d) =>
                                                      d.id === disc.id
                                                        ? {
                                                            ...d,
                                                            topics: d.topics.map((t) =>
                                                              t.id === top.id
                                                                ? { ...t, title: val }
                                                                : t
                                                            ),
                                                          }
                                                        : d
                                                    ),
                                                  }
                                                : c
                                            )
                                          );
                                        }}
                                        className="w-full bg-transparent font-medium text-white dark:text-white focus:outline-hidden"
                                      />
                                      {top.sourceReference && (
                                        <span className="text-[9px] text-white shrink-0">
                                          {top.sourceReference}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveTopic(disc.id, tIdx, "up")}
                                        disabled={tIdx === 0}
                                        className="p-0.5 text-white hover:text-white disabled:opacity-30"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveTopic(disc.id, tIdx, "down")}
                                        disabled={tIdx === disc.topics.length - 1}
                                        className="p-0.5 text-white hover:text-white disabled:opacity-30"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTopic(disc.id, top.id)}
                                        className="p-0.5 text-white hover:text-red-500"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Adicionador Unitário e em Lote */}
                            <div className="pt-2 border-t border-[#384154] dark:border-[#384154] flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                <input
                                  type="text"
                                  placeholder="Novo tópico..."
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const input = e.currentTarget;
                                      if (input.value.trim()) {
                                        setNewTopicName(input.value);
                                        handleAddTopic(disc.id);
                                        input.value = "";
                                      }
                                    }
                                  }}
                                  className="w-full rounded-lg border border-[#384154] bg-[#171B25] px-2.5 py-1 text-xs text-white focus:bg-[#252B38] focus:outline-hidden dark:border-[#384154] dark:bg-[#171B25] dark:text-white"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setBatchTopicDiscId(disc.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F3AA2D] hover:underline"
                              >
                                <Layers className="h-3 w-3" />
                                + Adicionar em lote
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 6: REVISÃO */}
          {/* ========================================================================= */}
          {step === "review" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white dark:text-white">
                  Revisão Executiva
                </h3>
                <p className="text-xs text-white dark:text-white mt-0.5">
                  Verifique o resumo consolidado antes de iniciar sua preparação:
                </p>
              </div>

              {/* Bloqueio de publicação no catálogo oficial: campos obrigatórios ausentes/inválidos */}
              {catalogValidationErrors.length > 0 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-red-400">
                    Publicação no catálogo bloqueada — dados obrigatórios ausentes ou inválidos:
                  </p>
                  <ul className="space-y-0.5 text-[11px] text-red-300 list-disc list-inside">
                    {catalogValidationErrors.map((validationError, vIdx) => (
                      <li key={vIdx}>{validationError}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card Executivo de Resumo */}
              <div className="rounded-2xl border border-[#384154] bg-[#171B25] p-4 sm:p-5 space-y-3 dark:border-[#384154] dark:bg-[#2D3442]">
                <div className="flex items-start justify-between border-b border-[#384154] pb-3 dark:border-[#384154]">
                  <div className="flex items-center gap-3">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt="Logo"
                        className="w-11 h-11 rounded-xl object-cover border border-[#384154] dark:border-[#384154] shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#F3AA2D]/15 flex items-center justify-center text-[#F3AA2D] shrink-0 font-bold">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3AA2D]">
                          {organAcronym || organ || "Certame"}
                        </span>
                        <span className="rounded-full bg-[#F3AA2D]/15 px-2 py-0.2 text-[9px] font-bold text-[#F3AA2D]">
                          {currentCareer.title}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white dark:text-white">
                        {planTitle || "Plano de Estudos"}
                      </h4>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#384154]/70 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-[#384154] dark:text-white shrink-0">
                    {selectedObjective}
                  </span>
                </div>

                {/* Métricas e Detalhes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-white block text-[10px] uppercase font-bold">Órgão</span>
                    <span className="font-semibold text-white dark:text-white truncate block">
                      {organ || "Geral"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white block text-[10px] uppercase font-bold">Cargo</span>
                    <span className="font-semibold text-white dark:text-white truncate block">
                      {activeCargo?.name || "Geral"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white block text-[10px] uppercase font-bold">Banca • Ano</span>
                    <span className="font-semibold text-white dark:text-white">
                      {editalBoard || "A definir"} • {editalYear || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white block text-[10px] uppercase font-bold">Meta Semanal</span>
                    <span className="font-semibold text-white dark:text-white">
                      {weeklyGoalHours}h / semana
                    </span>
                  </div>
                </div>

                {/* Resumo Quantitativo de Conteúdo */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#384154] dark:border-[#384154] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white dark:text-white">
                      {cargosList.length} cargo(s)
                    </span>
                    <span className="text-white">•</span>
                    <span className="font-bold text-white dark:text-white">
                      {activeCargoDisciplines.length} disciplinas
                    </span>
                    <span className="text-white">•</span>
                    <span className="font-bold text-white dark:text-white">
                      {activeCargoTopicsCount} tópicos
                    </span>
                  </div>

                  {editalFile && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Estrutura validada pelo edital
                    </span>
                  )}
                </div>

                {/* Toggle para Ver Conteúdo Completo */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFullContentExpanded(!isFullContentExpanded)}
                    className="text-xs font-bold text-[#F3AA2D] hover:underline flex items-center gap-1"
                  >
                    <span>{isFullContentExpanded ? "Ocultar detalhes" : "Ver conteúdo completo do plano"}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isFullContentExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isFullContentExpanded && (
                    <div className="mt-3 p-3 rounded-xl bg-[#252B38] dark:bg-[#252B38] border border-[#384154] dark:border-[#384154] max-h-48 overflow-y-auto space-y-2">
                      {activeCargoDisciplines.map((d) => (
                        <div key={d.id} className="text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white dark:text-white">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: d.color }}
                            />
                            <span>{d.name}</span>
                            <span className="text-[10px] font-normal text-white">
                              ({d.topics.length} tópicos)
                            </span>
                          </div>
                          <ul className="pl-4 mt-1 space-y-0.5 text-[11px] text-white dark:text-white list-disc">
                            {d.topics.map((t) => (
                              <li key={t.id}>{t.title}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA: PROCESSAMENTO / FINALIZAÇÃO */}
          {/* ========================================================================= */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3AA2D]/15 text-[#F3AA2D]">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-white dark:text-white">
                Construindo seu plano de estudos...
              </h3>
              <p className="text-xs text-white dark:text-white max-w-sm">
                Organizando o ciclo, metas e estrutura programática. Você será redirecionado em instantes.
              </p>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        {step !== "processing" && (
          <div className="flex items-center justify-between border-t border-[#384154] bg-[#171B25] px-5 sm:px-6 py-3.5 dark:border-[#384154] dark:bg-[#11151F]">
            {step === "objective" ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#384154] px-4 py-2 text-xs font-bold text-white hover:bg-[#2D3442] dark:border-[#384154] dark:text-white dark:hover:bg-[#2D3442] transition"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (step === "career") setStep("objective");
                  else if (step === "edital") setStep("career");
                  else if (step === "data") setStep("edital");
                  else if (step === "content") setStep("data");
                  else if (step === "review") setStep("content");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[#384154] px-4 py-2 text-xs font-bold text-white hover:bg-[#2D3442] dark:border-[#384154] dark:text-white dark:hover:bg-[#2D3442] transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            )}

            {step === "review" ? (
              <div className="flex items-center gap-2">
                {/* Ações de Administração: Salvar Rascunho / Publicar no Catálogo */}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleFinalSubmitCreatePlan(false, true)}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#384154] bg-[#252B38] px-3 py-2 text-xs font-bold text-white hover:bg-[#2D3442] dark:border-[#384154] dark:bg-[#171B25] dark:text-white transition"
                      title="Salva no catálogo oficial como rascunho"
                    >
                      Salvar Rascunho
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleFinalSubmitCreatePlan(true, false)}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                      title="Disponibiliza este edital para todos os alunos no catálogo oficial"
                    >
                      Publicar Edital
                    </button>
                  </>
                )}

                {/* Ação Primária: Criar Plano de Estudos */}
                <button
                  type="button"
                  disabled={isSaving || activeCargoDisciplines.length === 0}
                  onClick={() => handleFinalSubmitCreatePlan(false, false)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#F3AA2D] px-5 py-2 text-xs font-bold text-[#11151F] shadow-sm hover:bg-[#e09a1d] transition disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Criar Plano de Estudos</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={
                  (step === "objective" && !selectedObjective) ||
                  (step === "edital" && !(selectedCatalogEdital && selectedCatalogCargo)) ||
                  (step === "data" && (!planTitle.trim() || !cargoPretendido.trim())) ||
                  (step === "content" && cargosList.some((c) => c.name === "Cargo não identificado"))
                }
                title={
                  step === "objective" && !selectedObjective
                    ? "Selecione um objetivo para continuar"
                    : step === "edital" && !(selectedCatalogEdital && selectedCatalogCargo)
                    ? "Selecione um edital e um cargo para continuar"
                    : step === "data" && (!planTitle.trim() || !cargoPretendido.trim())
                    ? "Informe o título do edital e o cargo pretendido para continuar"
                    : step === "content" && cargosList.some((c) => c.name === "Cargo não identificado")
                    ? "Informe o nome do cargo antes de continuar"
                    : undefined
                }
                onClick={() => {
                  if (step === "objective") {
                    if (selectedObjective) setStep("career");
                  }
                  else if (step === "career") setStep("edital");
                  else if (step === "edital") {
                    if (selectedCatalogEdital && selectedCatalogCargo) {
                      setStep("data");
                    }
                  } else if (step === "data") {
                    if (!planTitle.trim() || !cargoPretendido.trim()) {
                      return;
                    }
                    // Garante sincronia do cargo pretendido com a lista de cargos
                    const trimmedCargo = cargoPretendido.trim();
                    if (activeCargoId) {
                      setCargosList((prev) =>
                        prev.map((c) =>
                          c.id === activeCargoId
                            ? { ...c, name: trimmedCargo, normalizedName: trimmedCargo.toLowerCase() }
                            : c
                        )
                      );
                    } else if (cargosList.length > 0) {
                      setCargosList((prev) =>
                        prev.map((c, idx) =>
                          idx === 0
                            ? { ...c, name: trimmedCargo, normalizedName: trimmedCargo.toLowerCase() }
                            : c
                        )
                      );
                    } else {
                      const newCargo: DetectedCargo = {
                        id: `cargo-${Date.now()}`,
                        name: trimmedCargo,
                        normalizedName: trimmedCargo.toLowerCase(),
                        disciplines: [],
                      };
                      setCargosList([newCargo]);
                      setActiveCargoId(newCargo.id);
                    }
                    setStep("content");
                  } else if (step === "content") {
                    setStep("review");
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#F3AA2D] px-5 py-2 text-xs font-bold text-[#11151F] shadow-sm hover:bg-[#e09a1d] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Avançar</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Adição de Tópicos em Lote */}
      {batchTopicDiscId && activeCargo && (
        <BatchTopicsModal
          isOpen={!!batchTopicDiscId}
          disciplineName={
            activeCargo.disciplines.find((d) => d.id === batchTopicDiscId)?.name || ""
          }
          onClose={() => setBatchTopicDiscId(null)}
          onAddTopics={(topics) => handleAddBatchTopics(batchTopicDiscId, topics)}
        />
      )}

      {/* Modal de Seleção de Cor da Matéria (Garantia de Cores Únicas) */}
      {colorPickerDisc && activeCargo && (
        <DisciplineColorPickerModal
          isOpen={Boolean(colorPickerDisc)}
          disciplineId={colorPickerDisc.id}
          disciplineName={colorPickerDisc.name}
          currentColor={colorPickerDisc.color}
          otherDisciplines={activeCargo.disciplines.map((d) => ({
            id: d.id,
            name: d.name,
            color: d.color || "#F3AA2D",
          }))}
          onSelectColor={(newColor) =>
            handleUpdateDisciplineColor(colorPickerDisc.id, newColor)
          }
          onClose={() => setColorPickerDisc(null)}
        />
      )}
    </div>
  );
};

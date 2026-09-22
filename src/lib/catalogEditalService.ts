import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  CatalogEdital,
  CatalogCargo,
  CatalogDiscipline,
  CatalogTopic,
  EditalSubmission,
  CatalogEditalStatus,
} from "../types";

// ============================================================================
// VERIFICAÇÃO ADMINISTRATIVA SEGURA
// ============================================================================
/**
 * Valida se o usuário autenticado possui role === 'admin' no Firestore.
 * Não utiliza comparação por e-mail ou bypass local.
 */
export async function assertAdminRole(userUid: string): Promise<boolean> {
  if (!userUid) {
    throw new Error("Sessão inválida: UID não fornecido.");
  }

  const userDocRef = doc(db, "users", userUid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error("Acesso negado: Perfil de usuário não encontrado.");
  }

  const userData = userSnap.data();
  const role = userData?.role;

  if (role !== "admin") {
    throw new Error("Acesso negado: Operação restrita a administradores.");
  }

  return true;
}

// ============================================================================
// PREVENÇÃO DE DUPLICIDADE
// ============================================================================
export interface DuplicityCheckParams {
  sourceHash?: string;
  normalizedIdentity?: string;
  institution?: string;
  year?: number;
  editalNumber?: string;
}

export interface DuplicityCheckResult {
  isDuplicate: boolean;
  reason?: string;
  existingEdital?: CatalogEdital;
}

/**
 * Previne cadastro acidental idêntico e sinaliza duplicidade sem exclusão automática:
 * 1. Por sourceHash (conteúdo idêntico)
 * 2. Por normalizedIdentity
 * 3. Por combinação de institution + year + editalNumber
 */
export async function checkCatalogDuplicity(
  params: DuplicityCheckParams
): Promise<DuplicityCheckResult> {
  try {
    const catalogColl = collection(db, "catalogEditais");

    // 1. Checagem por sourceHash exato
    if (params.sourceHash && params.sourceHash.trim()) {
      const qHash = query(catalogColl, where("sourceHash", "==", params.sourceHash.trim()));
      const snapHash = await getDocs(qHash);
      if (!snapHash.empty) {
        const existing = snapHash.docs[0].data() as CatalogEdital;
        return {
          isDuplicate: true,
          reason: `Documento com hash de origem idêntico já cadastrado (${existing.title || existing.id}).`,
          existingEdital: existing,
        };
      }
    }

    // 2. Checagem por normalizedIdentity
    if (params.normalizedIdentity && params.normalizedIdentity.trim()) {
      const qId = query(catalogColl, where("normalizedIdentity", "==", params.normalizedIdentity.trim()));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        const existing = snapId.docs[0].data() as CatalogEdital;
        return {
          isDuplicate: true,
          reason: `Certame já cadastrado para este órgão/ano (${existing.title || existing.institution}).`,
          existingEdital: existing,
        };
      }
    }

    // 3. Checagem aproximada por Instituição + Ano + Número do Edital
    if (params.institution && params.year && params.editalNumber) {
      const qCombo = query(
        catalogColl,
        where("year", "==", Number(params.year)),
        where("editalNumber", "==", params.editalNumber.trim())
      );
      const snapCombo = await getDocs(qCombo);

      for (const docSnap of snapCombo.docs) {
        const item = docSnap.data() as CatalogEdital;
        const instA = (item.institution || "").toLowerCase().trim();
        const instB = params.institution.toLowerCase().trim();
        const acrA = (item.acronym || "").toLowerCase().trim();

        if (instA === instB || (acrA && acrA === instB)) {
          return {
            isDuplicate: true,
            reason: `Possível edital já existente para ${item.institution} - Edital ${item.editalNumber}/${item.year}.`,
            existingEdital: item,
          };
        }
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.warn("[CATALOG] Falha na checagem de duplicidade:", err);
    return { isDuplicate: false };
  }
}

// ============================================================================
// CONSULTAS PÚBLICAS DO CATÁLOGO (SOMENTE STATUS === "published")
// ============================================================================

/**
 * Retorna todos os editais do catálogo com status === "published".
 * Sem mocks, sem arrays hardcoded.
 */
export async function getPublishedEditais(): Promise<CatalogEdital[]> {
  try {
    const catalogColl = collection(db, "catalogEditais");
    const q = query(catalogColl, where("status", "==", "published"));
    const snap = await getDocs(q);

    const list: CatalogEdital[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as CatalogEdital);
    });

    // Ordenação decrescente por publicação/criação
    list.sort((a, b) => {
      const dateA = new Date(a.publicationDate || a.createdAt).getTime();
      const dateB = new Date(b.publicationDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    return list;
  } catch (err) {
    console.error("[CATALOG] Erro ao buscar editais publicados:", err);
    return [];
  }
}

/**
 * Retorna editais publicados filtrados por carreira (ou todos se careerId não for especificado)
 */
export async function getPublishedEditaisByCareer(careerId?: string): Promise<CatalogEdital[]> {
  const all = await getPublishedEditais();
  if (!careerId || careerId === "todos") return all;
  return all.filter((e) => {
    if (e.careerId) return e.careerId === careerId;
    return true;
  });
}

/**
 * Assina atualizações em tempo real de editais publicados.
 * Quando um novo edital oficial for publicado, os seletores da aplicação atualizam automaticamente.
 */
export function subscribePublishedEditais(
  callback: (editais: CatalogEdital[]) => void
): Unsubscribe {
  const catalogColl = collection(db, "catalogEditais");
  const q = query(catalogColl, where("status", "==", "published"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CatalogEdital[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CatalogEdital);
      });

      list.sort((a, b) => {
        const dateA = new Date(a.publicationDate || a.createdAt).getTime();
        const dateB = new Date(b.publicationDate || b.createdAt).getTime();
        return dateB - dateA;
      });

      callback(list);
    },
    (error) => {
      console.error("[CATALOG] Erro no listener de editais publicados:", error);
      callback([]);
    }
  );
}

/**
 * Busca edital por ID específico.
 */
export async function getEditalById(editalId: string): Promise<CatalogEdital | null> {
  if (!editalId) return null;
  try {
    const docRef = doc(db, "catalogEditais", editalId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as CatalogEdital;
  } catch (err) {
    console.error(`[CATALOG] Erro ao buscar edital ${editalId}:`, err);
    return null;
  }
}

// ============================================================================
// CARGOS, DISCIPLINAS E TÓPICOS
// ============================================================================

/**
 * Busca todos os cargos de um edital do catálogo.
 * Estrutura: catalogEditais/{editalId}/cargos/{cargoId}
 */
export async function getEditalCargos(editalId: string): Promise<CatalogCargo[]> {
  if (!editalId) return [];
  try {
    const cargosColl = collection(db, "catalogEditais", editalId, "cargos");
    const snap = await getDocs(cargosColl);

    const list: CatalogCargo[] = [];
    snap.forEach((d) => list.push(d.data() as CatalogCargo));
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (err) {
    console.error(`[CATALOG] Erro ao buscar cargos do edital ${editalId}:`, err);
    return [];
  }
}

/**
 * Busca as disciplinas de um cargo específico.
 * Estrutura: catalogEditais/{editalId}/cargos/{cargoId}/disciplines/{disciplineId}
 */
export async function getCargoDisciplines(
  editalId: string,
  cargoId: string
): Promise<CatalogDiscipline[]> {
  if (!editalId || !cargoId) return [];
  try {
    const discColl = collection(
      db,
      "catalogEditais",
      editalId,
      "cargos",
      cargoId,
      "disciplines"
    );
    const snap = await getDocs(discColl);

    const list: CatalogDiscipline[] = [];
    snap.forEach((d) => list.push(d.data() as CatalogDiscipline));
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (err) {
    console.error(`[CATALOG] Erro ao buscar disciplinas (${editalId}/${cargoId}):`, err);
    return [];
  }
}

/**
 * Busca os tópicos de uma disciplina de um cargo.
 * Estrutura: catalogEditais/{editalId}/cargos/{cargoId}/disciplines/{disciplineId}/topics/{topicId}
 */
export async function getDisciplineTopics(
  editalId: string,
  cargoId: string,
  disciplineId: string
): Promise<CatalogTopic[]> {
  if (!editalId || !cargoId || !disciplineId) return [];
  try {
    const topColl = collection(
      db,
      "catalogEditais",
      editalId,
      "cargos",
      cargoId,
      "disciplines",
      disciplineId,
      "topics"
    );
    const snap = await getDocs(topColl);

    const list: CatalogTopic[] = [];
    snap.forEach((d) => list.push(d.data() as CatalogTopic));
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (err) {
    console.error(
      `[CATALOG] Erro ao buscar tópicos (${editalId}/${cargoId}/${disciplineId}):`,
      err
    );
    return [];
  }
}

export interface FullDisciplineSnapshot extends CatalogDiscipline {
  topics: CatalogTopic[];
}

export interface FullCargoSnapshot extends CatalogCargo {
  disciplines: FullDisciplineSnapshot[];
}

/**
 * Carrega toda a árvore de disciplinas e tópicos de um cargo do catálogo.
 * Usado para criar o snapshot independente no plano de estudos do usuário.
 */
export async function getFullCargoStructure(
  editalId: string,
  cargoId: string
): Promise<FullCargoSnapshot | null> {
  if (!editalId || !cargoId) return null;
  try {
    const cargoDoc = await getDoc(doc(db, "catalogEditais", editalId, "cargos", cargoId));
    if (!cargoDoc.exists()) return null;
    const cargo = cargoDoc.data() as CatalogCargo;

    const disciplines = await getCargoDisciplines(editalId, cargoId);

    const fullDisciplines: FullDisciplineSnapshot[] = await Promise.all(
      disciplines.map(async (disc) => {
        const topics = await getDisciplineTopics(editalId, cargoId, disc.id);
        return {
          ...disc,
          topics,
        };
      })
    );

    return {
      ...cargo,
      disciplines: fullDisciplines,
    };
  } catch (err) {
    console.error(`[CATALOG] Erro ao obter estrutura completa do cargo:`, err);
    return null;
  }
}

// ============================================================================
// ATUALIZAÇÃO E VERSIONAMENTO (CATALOG vs. STUDY PLAN)
// ============================================================================

export interface PlanUpdateCheckResult {
  updateAvailable: boolean;
  currentCatalogVersion?: number;
  planVersion?: number;
  catalogEdital?: CatalogEdital;
}

/**
 * Verifica se o edital do catálogo possui uma versão mais recente que a versão registrada no plano do usuário.
 * Se catalogEdital.version > studyPlan.sourceEditalVersion, retorna updateAvailable = true.
 * Nunca altera o plano do usuário automaticamente.
 */
export async function checkForPlanEditalUpdate(plan: {
  sourceEditalId?: string;
  sourceEditalVersion?: number;
}): Promise<PlanUpdateCheckResult> {
  if (!plan.sourceEditalId) {
    return { updateAvailable: false };
  }

  const catalogEdital = await getEditalById(plan.sourceEditalId);
  if (!catalogEdital) {
    return { updateAvailable: false };
  }

  const planVersion = plan.sourceEditalVersion || 1;
  const catalogVersion = catalogEdital.version || 1;

  if (catalogVersion > planVersion) {
    return {
      updateAvailable: true,
      currentCatalogVersion: catalogVersion,
      planVersion,
      catalogEdital,
    };
  }

  return {
    updateAvailable: false,
    currentCatalogVersion: catalogVersion,
    planVersion,
    catalogEdital,
  };
}

// ============================================================================
// ADMINISTRAÇÃO DO CATÁLOGO (EXIGE ROLE === 'admin')
// ============================================================================

export interface CreateCatalogEditalInput {
  title: string;
  institution: string;
  acronym: string;
  state: string;
  uf?: string;
  year: number;
  careerId?: string;
  objectiveType?: string;
  editalNumber: string;
  board: string;
  publicationDate: string;
  sourceFileName: string;
  sourceType: string;
  sourceHash: string;
  normalizedIdentity?: string;
  logoUrl?: string;
  status?: CatalogEditalStatus;
  description?: string;
}

/**
 * Cria um novo edital no catálogo oficial.
 * Exige papel de administrador verificado no Firestore.
 */
export async function createCatalogEdital(
  data: CreateCatalogEditalInput,
  userUid: string
): Promise<CatalogEdital> {
  await assertAdminRole(userUid);

  // Prevenção de duplicidade
  const dupCheck = await checkCatalogDuplicity({
    sourceHash: data.sourceHash,
    normalizedIdentity: data.normalizedIdentity,
    institution: data.institution,
    year: data.year,
    editalNumber: data.editalNumber,
  });

  if (dupCheck.isDuplicate) {
    throw new Error(`Edital duplicado: ${dupCheck.reason}`);
  }

  const now = new Date().toISOString();
  const editalId = `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newEdital: CatalogEdital = {
    id: editalId,
    title: data.title.trim(),
    institution: data.institution.trim(),
    acronym: data.acronym.trim().toUpperCase(),
    state: (data.uf || data.state || "").trim().toUpperCase(),
    uf: (data.uf || data.state || "").trim().toUpperCase(),
    year: Number(data.year),
    careerId: data.careerId,
    objectiveType: data.objectiveType,
    editalNumber: data.editalNumber.trim(),
    board: data.board.trim(),
    publicationDate: data.publicationDate,
    sourceFileName: data.sourceFileName,
    sourceType: data.sourceType || "pdf",
    sourceHash: data.sourceHash,
    normalizedIdentity: data.normalizedIdentity,
    logoUrl: data.logoUrl,
    status: data.status || "draft",
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: userUid,
    validatedBy: data.status === "published" ? userUid : undefined,
    description: data.description,
  };

  const docRef = doc(db, "catalogEditais", editalId);
  await setDoc(docRef, newEdital);

  return newEdital;
}

/**
 * Adiciona um cargo a um edital do catálogo.
 */
export async function addCargoToCatalogEdital(
  editalId: string,
  cargo: Omit<CatalogCargo, "id">,
  userUid: string
): Promise<CatalogCargo> {
  await assertAdminRole(userUid);

  const cargoId = `cargo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullCargo: CatalogCargo = {
    id: cargoId,
    name: cargo.name.trim(),
    level: cargo.level,
    vacancies: cargo.vacancies,
    order: cargo.order ?? 1,
  };

  const cargoRef = doc(db, "catalogEditais", editalId, "cargos", cargoId);
  await setDoc(cargoRef, fullCargo);

  // Atualiza timestamp do edital
  await updateDoc(doc(db, "catalogEditais", editalId), {
    updatedAt: new Date().toISOString(),
  });

  return fullCargo;
}

/**
 * Adiciona uma disciplina a um cargo do catálogo.
 */
export async function addDisciplineToCargo(
  editalId: string,
  cargoId: string,
  discipline: Omit<CatalogDiscipline, "id">,
  userUid: string
): Promise<CatalogDiscipline> {
  await assertAdminRole(userUid);

  const discId = `disc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullDisc: CatalogDiscipline = {
    id: discId,
    name: discipline.name.trim(),
    order: discipline.order ?? 1,
    group: discipline.group,
    questionCount: discipline.questionCount,
    weight: discipline.weight,
  };

  const discRef = doc(
    db,
    "catalogEditais",
    editalId,
    "cargos",
    cargoId,
    "disciplines",
    discId
  );
  await setDoc(discRef, fullDisc);

  return fullDisc;
}

/**
 * Adiciona um tópico a uma disciplina do catálogo.
 */
export async function addTopicToDiscipline(
  editalId: string,
  cargoId: string,
  disciplineId: string,
  topic: Omit<CatalogTopic, "id">,
  userUid: string
): Promise<CatalogTopic> {
  await assertAdminRole(userUid);

  const topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullTopic: CatalogTopic = {
    id: topicId,
    title: topic.title.trim(),
    order: topic.order ?? 1,
    sourceReference: topic.sourceReference,
  };

  const topicRef = doc(
    db,
    "catalogEditais",
    editalId,
    "cargos",
    cargoId,
    "disciplines",
    disciplineId,
    "topics",
    topicId
  );
  await setDoc(topicRef, fullTopic);

  return fullTopic;
}

/**
 * Atualiza campos de um edital do catálogo.
 * Se incrementVersion for true, eleva o número da versão (version: version + 1).
 */
export async function updateCatalogEdital(
  editalId: string,
  updates: Partial<CatalogEdital>,
  userUid: string,
  incrementVersion: boolean = false
): Promise<void> {
  await assertAdminRole(userUid);

  const editalRef = doc(db, "catalogEditais", editalId);
  const snap = await getDoc(editalRef);
  if (!snap.exists()) {
    throw new Error(`Edital não encontrado: ${editalId}`);
  }

  const current = snap.data() as CatalogEdital;
  const newVersion = incrementVersion ? (current.version || 1) + 1 : current.version || 1;

  await updateDoc(editalRef, {
    ...updates,
    version: newVersion,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Publica um edital no catálogo para acesso de todos os estudantes.
 */
export async function publishCatalogEdital(editalId: string, userUid: string): Promise<void> {
  await assertAdminRole(userUid);

  const editalRef = doc(db, "catalogEditais", editalId);
  await updateDoc(editalRef, {
    status: "published",
    validatedBy: userUid,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Arquiva um edital do catálogo (deixa de aparecer para os alunos).
 */
export async function archiveCatalogEdital(editalId: string, userUid: string): Promise<void> {
  await assertAdminRole(userUid);

  const editalRef = doc(db, "catalogEditais", editalId);
  await updateDoc(editalRef, {
    status: "archived",
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================================
// ENVIO DE EDITAIS POR USUÁRIOS (SUBMISSÕES)
// ============================================================================

export interface SubmitUserEditalInput {
  userId: string;
  sourceFileName: string;
  sourceHash: string;
  personalEditalId?: string;
  notes?: string;
}

/**
 * Registra a submissão de um edital enviado pelo estudante para validação administrativa posterior.
 * O edital do estudante permanece pessoal em `users/{uid}/editais/{editalId}` e NÃO é publicado automaticamente.
 */
export async function submitUserEdital(
  input: SubmitUserEditalInput
): Promise<EditalSubmission> {
  if (!input.userId) {
    throw new Error("Usuário obrigatório para submissão de edital.");
  }

  const submissionId = `subm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  const submission: EditalSubmission = {
    id: submissionId,
    userId: input.userId,
    submittedAt: now,
    status: "pending",
    sourceFileName: input.sourceFileName,
    sourceHash: input.sourceHash,
    personalEditalId: input.personalEditalId,
    notes: input.notes,
  };

  const docRef = doc(db, "editalSubmissions", submissionId);
  await setDoc(docRef, submission);

  return submission;
}

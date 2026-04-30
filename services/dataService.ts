import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { 
  AppData, 
  Profissional, 
  ProducaoMensal, 
  ReceitasExtras, 
  GastoMensal, 
  ParametrosAnuais, 
  MeetingNote,
  PlanningData
} from '../types.ts';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
};

// --- Profissionais ---
export const saveProfissional = async (p: Profissional) => {
  const path = `users/${getUserId()}/profissionais`;
  try {
    await setDoc(doc(db, path, p.id), p);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${p.id}`);
  }
};

export const deleteProfissional = async (id: string) => {
  const path = `users/${getUserId()}/profissionais`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
  }
};

// --- Produção Mensal ---
export const saveProducao = async (p: ProducaoMensal) => {
  const path = `users/${getUserId()}/producao_mensal`;
  // Use a composite ID for unique monthly production per professional
  const id = `${p.ano}_${p.mes}_${p.profissionalId}`;
  try {
    await setDoc(doc(db, path, id), p);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
  }
};

// --- Receitas Extras ---
export const saveReceitaExtra = async (r: ReceitasExtras) => {
  const path = `users/${getUserId()}/receitas_extras_mensal`;
  const id = `${r.ano}_${r.mes}`;
  try {
    await setDoc(doc(db, path, id), r);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
  }
};

// --- Gastos Mensais ---
export const saveGasto = async (g: GastoMensal) => {
  const path = `users/${getUserId()}/gastos_mensal`;
  // Assuming meta is unique per year/month/category
  const id = `${g.ano}_${g.mes}_${g.categoria.replace(/\//g, '_')}`;
  try {
    await setDoc(doc(db, path, id), g);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
  }
};

// --- Metas (Parâmetros) ---
export const saveParametros = async (p: ParametrosAnuais) => {
  const path = `users/${getUserId()}/metas`;
  const id = `${p.ano}`;
  try {
    await setDoc(doc(db, path, id), p);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
  }
};

// --- Meeting Notes ---
export const saveMeetingNote = async (n: MeetingNote) => {
  const path = `users/${getUserId()}/feedbacks_reuniao`;
  try {
    await setDoc(doc(db, path, n.id), n);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${n.id}`);
  }
};

export const deleteMeetingNote = async (id: string) => {
  const path = `users/${getUserId()}/feedbacks_reuniao`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
  }
};

// --- Full Monthly Closing ---
export const saveFechamentoMes = async (payload: { extra: ReceitasExtras, producao: ProducaoMensal[], gastos: GastoMensal[] }) => {
  const userId = getUserId();
  const batch = writeBatch(db);

  // Extra
  const extraId = `${payload.extra.ano}_${payload.extra.mes}`;
  batch.set(doc(db, `users/${userId}/receitas_extras_mensal`, extraId), payload.extra);

  // Producao
  payload.producao.forEach(p => {
    const id = `${p.ano}_${p.mes}_${p.profissionalId}`;
    batch.set(doc(db, `users/${userId}/producao_mensal`, id), p);
  });

  // Gastos
  payload.gastos.forEach(g => {
    const id = `${g.ano}_${g.mes}_${g.categoria.replace(/\//g, '_')}`;
    batch.set(doc(db, `users/${userId}/gastos_mensal`, id), g);
  });

  try {
    await batch.commit();
    console.log("dataService: Fechamento mensal salvo com sucesso via batch.");
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/fechamento_mes (batch)`);
  }
};

// --- Planning Data ---
export const savePlanning = async (p: PlanningData) => {
  const path = `users/${getUserId()}/planejamento`;
  const id = `${p.ano}_${p.mes}`;
  try {
    await setDoc(doc(db, path, id), { ...p, lastUpdated: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${id}`);
  }
};

// --- Load all data ---
export const loadAppData = async (): Promise<Partial<AppData>> => {
  const userId = getUserId();
  const data: Partial<AppData> = {
    profissionais: [],
    producao: [],
    receitasExtras: [],
    gastos: [],
    parametros: [],
    meetingNotes: [],
    planejamento: []
  };

  const collections = [
    { key: 'profissionais', path: `users/${userId}/profissionais` },
    { key: 'producao', path: `users/${userId}/producao_mensal` },
    { key: 'receitasExtras', path: `users/${userId}/receitas_extras_mensal` },
    { key: 'gastos', path: `users/${userId}/gastos_mensal` },
    { key: 'parametros', path: `users/${userId}/metas` },
    { key: 'meetingNotes', path: `users/${userId}/feedbacks_reuniao` },
    { key: 'planejamento', path: `users/${userId}/planejamento` }
  ];

  console.log("dataService: Iniciando carregamento paralelo das coleções para", userId);

  const results = await Promise.allSettled(
    collections.map(async (c) => {
      try {
        const snap = await getDocs(collection(db, c.path));
        return { key: c.key, docs: snap.docs.map(d => d.data()) };
      } catch (err) {
        console.error(`Erro ao carregar coleção ${c.path}:`, err);
        throw err;
      }
    })
  );

  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      (data as any)[res.value.key] = res.value.docs;
    }
  });

  console.log("dataService: Carregamento finalizado. Status das coleções:", 
    results.map((r, i) => `${collections[i].key}: ${r.status}`)
  );

  return data;
};

// --- Migration ---
export const migrateToCloud = async (localData: AppData) => {
  const userId = getUserId();
  const batch = writeBatch(db);

  // Helper to get doc ref
  const getDocRef = (coll: string, id: string) => doc(db, `users/${userId}/${coll}`, id);

  // Profissionais
  localData.profissionais.forEach(p => {
    batch.set(getDocRef('profissionais', p.id), p);
  });

  // Produção
  localData.producao.forEach(p => {
    const id = `${p.ano}_${p.mes}_${p.profissionalId}`;
    batch.set(getDocRef('producao_mensal', id), p);
  });

  // Receitas
  localData.receitasExtras.forEach(r => {
    const id = `${r.ano}_${r.mes}`;
    batch.set(getDocRef('receitas_extras_mensal', id), r);
  });

  // Gastos
  localData.gastos.forEach(g => {
    const id = `${g.ano}_${g.mes}_${g.categoria.replace(/\//g, '_')}`;
    batch.set(getDocRef('gastos_mensal', id), g);
  });

  // Metas
  localData.parametros.forEach(p => {
    const id = `${p.ano}`;
    batch.set(getDocRef('metas', id), p);
  });

  // Notes
  localData.meetingNotes.forEach(n => {
    batch.set(getDocRef('feedbacks_reuniao', n.id), n);
  });

  // Planning
  if (localData.planejamento) {
    localData.planejamento.forEach(p => {
      const id = `${p.ano}_${p.mes}`;
      batch.set(getDocRef('planejamento', id), p);
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId} (batch migration)`);
  }
};

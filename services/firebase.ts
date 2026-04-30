import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import configData from '../firebase-applet-config.json';

// Tenta ler das variáveis de ambiente primeiro, mas usa o JSON como fonte de verdade se disponível
const getConfig = (key: string, fbKey: string) => {
  const value = import.meta.env[key] || (configData as any)[fbKey];
  return typeof value === 'string' ? value.trim() : value;
};

const firebaseConfig = {
  apiKey: getConfig('VITE_FIREBASE_API_KEY', 'apiKey'),
  authDomain: getConfig('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'),
  projectId: getConfig('VITE_FIREBASE_PROJECT_ID', 'projectId'),
  storageBucket: getConfig('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'),
  messagingSenderId: getConfig('VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'),
  appId: getConfig('VITE_FIREBASE_APP_ID', 'appId')
};

console.log("Firebase: Configuração carregada para o projeto:", firebaseConfig.projectId);

let app;
let auth: any;
let db: any;

try {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error("As chaves do Firebase não foram encontradas. Verifique o arquivo de configuração.");
    }
    app = initializeApp(firebaseConfig);
    console.log("Firebase: App inicializado com sucesso.");
  } else {
    app = getApp();
  }
  
  auth = getAuth(app);
  
  // No AI Studio, usamos o databaseId do config, mas omitimos se for "(default)" para evitar problemas de compatibilidade
  const dbId = (configData as any).firestoreDatabaseId;
  db = (dbId && dbId !== "(default)") ? getFirestore(app, dbId) : getFirestore(app);

  // Valida conexão com Firestore (CRITICAL CONSTRAINT)
  const testConnection = async () => {
    try {
      const { doc, getDocFromServer } = await import('firebase/firestore');
      // Tentamos ler o documento de teste. Se der erro de permissão, as regras estão erradas.
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase: Conexão com Firestore validada com sucesso.");
    } catch (error: any) {
      // Se o erro for "not-found", a permissão está OK (conseguiu chegar no doc).
      // Se for "permission-denied", as regras estão bloqueando.
      if (error.code === 'permission-denied') {
        console.error("Firebase: Erro de permissão no Firestore (permission-denied). Path: test/connection. Verifique as regras.");
      } else if (error.code === 'not-found') {
        console.log("Firebase: Conexão validada (documento de teste não existe, mas a permissão foi aceita).");
      } else {
        console.warn(`Firebase: Aviso na validação de conexão (${error.code}):`, error.message);
      }
    }
  };
  testConnection();
} catch (e) {
  console.error("Firebase: Erro na inicialização do SDK:", e);
  auth = null;
  db = null;
}

export { auth, db, app };

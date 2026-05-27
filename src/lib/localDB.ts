// Client-side IndexedDB wrapper to manage de-identified patient charts, notes history, and custom templates
// Enforces 100% data residency in the clinician's browser. Zero database server writes.

export interface AnonymizedPatient {
  id: string; // Patient-TX-XXXX
  treatmentGoals: string;
  symptomBaseline: string;
  createdAt: string;
}

export interface ScrubbedNote {
  id?: number;
  patientId: string;
  date: string;
  outputFormat: string;
  content: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  instructions: string;
  sections: string[]; // e.g. ["Subjective", "Objective", "Assessment", "Plan"]
}

const DB_NAME = 'hip_health_local_db';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store 1: Anonymized Patient Profiles
      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id' });
      }

      // Store 2: De-identified Clinical Notes History
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        noteStore.createIndex('patientId', 'patientId', { unique: false });
      }

      // Store 3: Clinician Custom Templates
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    };
  });
}

// --- Patient Operations ---
export async function savePatient(patient: AnonymizedPatient): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('patients', 'readwrite');
    const store = tx.objectStore('patients');
    const req = store.put(patient);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPatients(): Promise<AnonymizedPatient[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('patients', 'readonly');
    const store = tx.objectStore('patients');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePatient(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['patients', 'notes'], 'readwrite');
    
    // Delete patient
    tx.objectStore('patients').delete(id);
    
    // Delete patient notes
    const notesStore = tx.objectStore('notes');
    const index = notesStore.index('patientId');
    const req = index.openCursor(IDBKeyRange.only(id));
    
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Notes Operations ---
export async function saveNote(note: ScrubbedNote): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const req = store.put(note);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getNotesByPatient(patientId: string): Promise<ScrubbedNote[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const index = store.index('patientId');
    const req = index.getAll(IDBKeyRange.only(patientId));
    req.onsuccess = () => {
      // Sort notes chronologically by date
      const sorted = (req.result || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Templates Operations ---
export async function saveTemplate(template: CustomTemplate): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const req = store.put(template);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getTemplates(): Promise<CustomTemplate[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readonly');
    const store = tx.objectStore('templates');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

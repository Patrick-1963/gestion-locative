/**
 * db.js - Gestion de la base de données IndexedDB
 * Remplace localStorage pour un stockage plus robuste
 */

const DB_NAME = "GestionLocativeDB";
const DB_VERSION = 2; // Incrémenté pour ajouter le store liaisons

let db = null;

/**
 * Initialiser/Ouvrir la base de données
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Créer les stores s'ils n'existent pas
      if (!database.objectStoreNames.contains("biens")) {
        database.createObjectStore("biens", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("proprietaires")) {
        database.createObjectStore("proprietaires", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("locataires")) {
        database.createObjectStore("locataires", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("baux")) {
        database.createObjectStore("baux", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("quittances")) {
        database.createObjectStore("quittances", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("etatsDesLieux")) {
        database.createObjectStore("etatsDesLieux", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("liaisons")) {
        database.createObjectStore("liaisons", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", { keyPath: "key" });
      }
      
      console.log("✅ Base de données mise à jour vers version", DB_VERSION);
    };
  });
}

/**
 * Alias pour compatibilité
 */
export const initDB = openDB;

/**
 * Obtenir tous les éléments d'un store
 */
export function getAll(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Obtenir un élément par ID
 */
export function getById(storeName, id) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Ajouter un élément
 */
export function add(storeName, data) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Mettre à jour un élément
 */
export function update(storeName, data) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Supprimer un élément
 */
export function remove(storeName, id) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Vider un store complètement
 */
export function clearStore(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await openDB();
      
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ========================================
// BIENS
// ========================================

export function getBiens() {
  return getAll("biens");
}

export function getBienById(id) {
  return getById("biens", id);
}

export function addBien(data) {
  data.id = data.id || "bien_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  data.documents = data.documents || [];
  return add("biens", data);
}

export function updateBien(data) {
  return update("biens", data);
}

export function deleteBien(id) {
  return remove("biens", id);
}

export function addDocumentToBien(bienId, doc) {
  return getBienById(bienId).then(bien => {
    if (!bien) throw new Error("Bien non trouvé");
    if (!bien.documents) bien.documents = [];
    bien.documents.push(doc);
    return updateBien(bien);
  });
}

export function removeDocumentFromBien(bienId, index) {
  return getBienById(bienId).then(bien => {
    if (!bien) throw new Error("Bien non trouvé");
    bien.documents.splice(index, 1);
    return updateBien(bien);
  });
}

// ========================================
// PROPRIÉTAIRES
// ========================================

export function getProprietaires() {
  return getAll("proprietaires");
}

export function getProprietaireById(id) {
  return getById("proprietaires", id);
}

export function addProprietaire(data) {
  data.id = data.id || "proprio_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  data.biensIds = data.biensIds || [];
  data.documents = data.documents || [];
  return add("proprietaires", data);
}

export function updateProprietaire(data) {
  return update("proprietaires", data);
}

export function deleteProprietaire(id) {
  return remove("proprietaires", id);
}

export function addDocumentToProprietaire(proprioId, doc) {
  return getProprietaireById(proprioId).then(proprio => {
    if (!proprio) throw new Error("Propriétaire non trouvé");
    if (!proprio.documents) proprio.documents = [];
    proprio.documents.push(doc);
    return updateProprietaire(proprio);
  });
}

export function removeDocumentFromProprietaire(proprioId, index) {
  return getProprietaireById(proprioId).then(proprio => {
    if (!proprio) throw new Error("Propriétaire non trouvé");
    proprio.documents.splice(index, 1);
    return updateProprietaire(proprio);
  });
}

// ========================================
// LOCATAIRES
// ========================================

export function getLocataires() {
  return getAll("locataires");
}

export function getLocataireById(id) {
  return getById("locataires", id);
}

export function addLocataire(data) {
  data.id = data.id || "locataire_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  data.documents = data.documents || [];
  data.coLocataires = data.coLocataires || [];
  return add("locataires", data);
}

export function updateLocataire(data) {
  return update("locataires", data);
}

export function deleteLocataire(id) {
  return remove("locataires", id);
}

export function addDocumentToLocataire(locataireId, doc) {
  return getLocataireById(locataireId).then(locataire => {
    if (!locataire) throw new Error("Locataire non trouvé");
    if (!locataire.documents) locataire.documents = [];
    locataire.documents.push(doc);
    return updateLocataire(locataire);
  });
}

export function removeDocumentFromLocataire(locataireId, index) {
  return getLocataireById(locataireId).then(locataire => {
    if (!locataire) throw new Error("Locataire non trouvé");
    locataire.documents.splice(index, 1);
    return updateLocataire(locataire);
  });
}

// ========================================
// BAUX
// ========================================

export function getBaux() {
  return getAll("baux");
}

export function getBailById(id) {
  return getById("baux", id);
}

export function addBail(data) {
  data.id = data.id || "bail_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  return add("baux", data);
}

export function updateBail(data) {
  return update("baux", data);
}

export function deleteBail(id) {
  return remove("baux", id);
}

// ========================================
// QUITTANCES
// ========================================

export function getQuittances() {
  return getAll("quittances");
}

export function getQuittanceById(id) {
  return getById("quittances", id);
}

export function addQuittance(data) {
  data.id = data.id || "quittance_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  return add("quittances", data);
}

export function updateQuittance(data) {
  return update("quittances", data);
}

export function deleteQuittance(id) {
  return remove("quittances", id);
}

// ========================================
// ÉTATS DES LIEUX
// ========================================

export function getEtatsDesLieux() {
  return getAll("etatsDesLieux");
}

export function getEtatDesLieuxById(id) {
  return getById("etatsDesLieux", id);
}

export function addEtatDesLieux(data) {
  data.id = data.id || "etat_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  return add("etatsDesLieux", data);
}

export function updateEtatDesLieux(data) {
  return update("etatsDesLieux", data);
}

export function deleteEtatDesLieux(id) {
  return remove("etatsDesLieux", id);
}

// ========================================
// LIAISONS (pour liaison-bien-proprietaire)
// ========================================

export function getLiaisons() {
  return getAll("liaisons");
}

export function getLiaisonById(id) {
  return getById("liaisons", id);
}

export function addLiaison(data) {
  data.id = data.id || "liaison_" + Date.now();
  data.dateCreation = data.dateCreation || new Date().toISOString();
  return add("liaisons", data);
}

export function updateLiaison(data) {
  return update("liaisons", data);
}

export function deleteLiaison(id) {
  return remove("liaisons", id);
}

// ========================================
// SETTINGS
// ========================================

export function getSetting(key) {
  return getById("settings", key).then(result => result ? result.value : null);
}

export function setSetting(key, value) {
  return update("settings", { key, value });
}

// ========================================
// IMPORT / EXPORT
// ========================================

export async function exportData() {
  try {
    if (!db) await openDB();
    
    // Vérifier quels stores existent réellement
    const availableStores = Array.from(db.objectStoreNames);
    
    const data = {
      dateExport: new Date().toISOString(),
      version: "2.1.0"
    };
    
    // Exporter uniquement les stores qui existent
    if (availableStores.includes('biens')) {
      data.biens = await getBiens();
    }
    if (availableStores.includes('proprietaires')) {
      data.proprietaires = await getProprietaires();
    }
    if (availableStores.includes('locataires')) {
      data.locataires = await getLocataires();
    }
    if (availableStores.includes('baux')) {
      data.baux = await getBaux();
    }
    if (availableStores.includes('quittances')) {
      data.quittances = await getQuittances();
    }
    if (availableStores.includes('etatsDesLieux')) {
      data.etatsDesLieux = await getEtatsDesLieux();
    }
    if (availableStores.includes('liaisons')) {
      data.liaisons = await getLiaisons();
    }
    
    return data;
  } catch (err) {
    console.error("Erreur export:", err);
    throw err;
  }
}

export async function exportAllData() {
  return exportData();
}

export async function importData(data) {
  try {
    if (!db) await openDB();
    
    const stores = ["aide", "biens", "proprietaires", "locataires", "baux", "quittances", "etatsDesLieux", "liaisons"];
    
    for (const storeName of stores) {
      if (!data[storeName] || !Array.isArray(data[storeName])) continue;
      
      // Ajouter/mettre à jour les données
      for (const item of data[storeName]) {
        try {
          const existing = await getById(storeName, item.id);
          if (existing) {
            await update(storeName, item);
          } else {
            await add(storeName, item);
          }
        } catch (e) {
          console.error(`Erreur import ${storeName}:`, e);
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error("Erreur import:", err);
    throw err;
  }
}

export async function importAllData(data, mode = "merge") {
  try {
    if (!db) await openDB();
    
    const stores = ["biens", "proprietaires", "locataires", "baux", "quittances", "etatsDesLieux", "liaisons"];
    
    for (const storeName of stores) {
      if (!data[storeName] || !Array.isArray(data[storeName])) continue;
      
      if (mode === "replace") {
        // Vider le store
        await clearStore(storeName);
      }
      
      // Ajouter les données
      for (const item of data[storeName]) {
        try {
          if (mode === "merge") {
            const existing = await getById(storeName, item.id);
            if (existing) {
              await update(storeName, item);
            } else {
              await add(storeName, item);
            }
          } else {
            await add(storeName, item);
          }
        } catch (e) {
          console.error(`Erreur import ${storeName}:`, e);
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error("Erreur import:", err);
    throw err;
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Compter le nombre d'éléments dans un store
 */
export async function count(storeName) {
  try {
    if (!db) await openDB();
    
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.count();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Erreur count ${storeName}:`, err);
    return 0;
  }
}

/**
 * Vérifier si la base de données existe
 */
export async function databaseExists() {
  const databases = await indexedDB.databases();
  return databases.some(db => db.name === DB_NAME);
}

/**
 * Supprimer complètement la base de données
 */
export async function deleteDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close();
      db = null;
    }
    
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn("Suppression de la base de données bloquée");
      reject(new Error("Suppression bloquée"));
    };
  });
}

/**
 * Obtenir la taille approximative de la base de données
 */
export async function getDatabaseSize() {
  try {
    if (!db) await openDB();
    
    let totalSize = 0;
    const stores = ["biens", "proprietaires", "locataires", "baux", "quittances", "etatsDesLieux", "liaisons"];
    
    for (const storeName of stores) {
      const items = await getAll(storeName);
      const storeSize = JSON.stringify(items).length;
      totalSize += storeSize;
    }
    
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / 1024 / 1024).toFixed(2)
    };
  } catch (err) {
    console.error("Erreur calcul taille:", err);
    return { bytes: 0, kb: 0, mb: 0 };
  }
}
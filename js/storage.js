/**
 * storage.js - Gestion du stockage des fichiers avec File System Access API
 */

import { getSetting, setSetting } from "./db.js";

let directoryHandle = null;

/**
 * Vérifier si l'API File System Access est supportée
 */
export function isFileSystemSupported() {
  return "showDirectoryPicker" in window;
}

/**
 * Demander à l'utilisateur de choisir un dossier
 */
export async function selectStorageDirectory() {
  try {
    directoryHandle = await window.showDirectoryPicker({
      mode: "readwrite"
    });
    
    // Sauvegarder la référence
    await setSetting("storageDirectoryHandle", directoryHandle);
    
    return directoryHandle;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Erreur sélection dossier:", err);
    }
    return null;
  }
}

/**
 * Récupérer le dossier de stockage
 */
export async function getStorageDirectory() {
  if (directoryHandle) return directoryHandle;
  
  // Essayer de récupérer depuis les settings
  try {
    directoryHandle = await getSetting("storageDirectoryHandle");
    
    if (directoryHandle) {
      // Vérifier les permissions
      const permission = await directoryHandle.queryPermission({ mode: "readwrite" });
      
      if (permission === "granted") {
        return directoryHandle;
      } else if (permission === "prompt") {
        const newPermission = await directoryHandle.requestPermission({ mode: "readwrite" });
        if (newPermission === "granted") {
          return directoryHandle;
        }
      }
    }
  } catch (err) {
    console.error("Erreur récupération dossier:", err);
  }
  
  return null;
}

/**
 * Créer un dossier (récursivement)
 */
async function ensureDirectory(baseHandle, path) {
  const parts = path.split("/").filter(p => p);
  let currentHandle = baseHandle;
  
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }
  
  return currentHandle;
}

/**
 * Écrire un fichier
 */
export async function writeFile(directoryHandle, filePath, fileData) {
  try {
    const pathParts = filePath.split("/");
    const fileName = pathParts.pop();
    const dirPath = pathParts.join("/");
    
    // Créer les dossiers si nécessaire
    let targetDir = directoryHandle;
    if (dirPath) {
      targetDir = await ensureDirectory(directoryHandle, dirPath);
    }
    
    // Créer/écraser le fichier
    const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    
    if (fileData instanceof Blob || fileData instanceof File) {
      await writable.write(fileData);
    } else {
      await writable.write(new Blob([fileData]));
    }
    
    await writable.close();
    return true;
  } catch (err) {
    console.error("Erreur écriture fichier:", err);
    throw err;
  }
}

/**
 * Lire un fichier
 */
export async function readFile(directoryHandle, filePath) {
  try {
    const pathParts = filePath.split("/");
    const fileName = pathParts.pop();
    const dirPath = pathParts.join("/");
    
    // Naviguer vers le dossier
    let targetDir = directoryHandle;
    if (dirPath) {
      for (const part of dirPath.split("/").filter(p => p)) {
        targetDir = await targetDir.getDirectoryHandle(part);
      }
    }
    
    // Lire le fichier
    const fileHandle = await targetDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file;
  } catch (err) {
    console.error("Erreur lecture fichier:", err);
    throw err;
  }
}

/**
 * Supprimer un fichier
 */
export async function deleteFile(directoryHandle, filePath) {
  try {
    const pathParts = filePath.split("/");
    const fileName = pathParts.pop();
    const dirPath = pathParts.join("/");
    
    // Naviguer vers le dossier
    let targetDir = directoryHandle;
    if (dirPath) {
      for (const part of dirPath.split("/").filter(p => p)) {
        targetDir = await targetDir.getDirectoryHandle(part);
      }
    }
    
    // Supprimer le fichier
    await targetDir.removeEntry(fileName);
    return true;
  } catch (err) {
    console.error("Erreur suppression fichier:", err);
    throw err;
  }
}

/**
 * Lister les fichiers d'un dossier
 */
export async function listFiles(directoryHandle, path = "") {
  try {
    let targetDir = directoryHandle;
    
    if (path) {
      for (const part of path.split("/").filter(p => p)) {
        targetDir = await targetDir.getDirectoryHandle(part);
      }
    }
    
    const files = [];
    for await (const entry of targetDir.values()) {
      if (entry.kind === "file") {
        files.push({
          name: entry.name,
          handle: entry
        });
      }
    }
    
    return files;
  } catch (err) {
    console.error("Erreur liste fichiers:", err);
    return [];
  }
}

/**
 * Convertir un fichier en Data URL (pour l'affichage)
 */
export async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convertir un fichier en texte
 */
export async function fileToText(file) {
  return await file.text();
}

/**
 * Convertir un fichier en ArrayBuffer
 */
export async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}
/**
 * app.js - Initialisation de l'application PWA
 */

import { initDB } from "./db.js";
import { isFileSystemSupported } from "./storage.js";

/**
 * Enregistrer le Service Worker
 */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("✅ Service Worker enregistré:", registration.scope);
      
      // Mettre à jour si nécessaire
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("🔄 Nouvelle version disponible");
            // Vous pouvez afficher une notification ici
          }
        });
      });
    } catch (err) {
      console.error("❌ Erreur Service Worker:", err);
    }
  }
}

/**
 * Initialiser la base de données
 */
async function initializeDatabase() {
  try {
    await initDB();
    console.log("✅ Base de données initialisée");
  } catch (err) {
    console.error("❌ Erreur initialisation DB:", err);
    alert("Erreur lors de l'initialisation de la base de données");
  }
}

/**
 * Vérifier la compatibilité du navigateur
 */
function checkBrowserCompatibility() {
  const features = {
    "IndexedDB": "indexedDB" in window,
    "Service Worker": "serviceWorker" in navigator,
    "File System Access": isFileSystemSupported()
  };
  
  console.log("🔍 Compatibilité navigateur:");
  for (const [feature, supported] of Object.entries(features)) {
    console.log(`${supported ? "✅" : "❌"} ${feature}`);
  }
  
  if (!features.IndexedDB) {
    alert("⚠️ Votre navigateur ne supporte pas IndexedDB. L'application ne fonctionnera pas correctement.");
  }
  
  if (!features["File System Access"]) {
    console.warn("⚠️ File System Access API non supportée. La gestion des documents sera limitée.");
  }
}

/**
 * Afficher une notification toast
 */
export function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    font-weight: 600;
  `;
  
  if (type === "success") {
    notification.style.background = "#4caf50";
    notification.style.color = "white";
  } else if (type === "error") {
    notification.style.background = "#f44336";
    notification.style.color = "white";
  } else if (type === "warning") {
    notification.style.background = "#ff9800";
    notification.style.color = "white";
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Formater une date en français
 */
export function formatDateFR(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR");
}

/**
 * Formater un montant en euros
 */
export function formatEuros(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}

/**
 * Générer un ID unique
 */
export function generateId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Télécharger un fichier JSON
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Lire un fichier JSON uploadé
 */
export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error("Fichier JSON invalide"));
      }
    };
    reader.onerror = () => reject(new Error("Erreur lecture fichier"));
    reader.readAsText(file);
  });
}

/**
 * Gérer le bouton "Retour en haut"
 */
function initScrollTopButton() {
  let scrollTopBtn = document.getElementById("scrollTopBtn");
  
  if (!scrollTopBtn) {
    scrollTopBtn = document.createElement("a");
    scrollTopBtn.id = "scrollTopBtn";
    scrollTopBtn.href = "#";
    scrollTopBtn.title = "Retour en haut";
    scrollTopBtn.innerHTML = "↑";
    scrollTopBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(scrollTopBtn);
  }
  
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollTopBtn.style.opacity = "1";
      scrollTopBtn.style.visibility = "visible";
    } else {
      scrollTopBtn.style.opacity = "0";
      scrollTopBtn.style.visibility = "hidden";
    }
  });
  
  scrollTopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/**
 * Initialiser l'application
 */
async function init() {
  console.log("🚀 Démarrage de l'application...");
  
  checkBrowserCompatibility();
  await initializeDatabase();
  await registerServiceWorker();
  initScrollTopButton();
  
  console.log("✅ Application prête");
}

// Démarrer l'application au chargement
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Exporter la fonction init pour utilisation dans d'autres modules
export { init };
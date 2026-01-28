import {
  getLocataires,
  addLocataire,
  deleteLocataire,
  addDocumentToLocataire,
  removeDocumentFromLocataire
} from "./db.js";

import {
  getStorageDirectory,
  writeFile,
  readFile,
  deleteFile
} from "./storage.js";

/* -----------------------------------------------
   Sélecteurs
------------------------------------------------- */

const form = document.getElementById("formAdd");
const liste = document.getElementById("listeLocataires");

const docModal = document.getElementById("docModal");
const docLocataireNom = document.getElementById("docLocataireNom");
const docFile = document.getElementById("docFile");
const btnUploadDoc = document.getElementById("btnUploadDoc");
const docList = document.getElementById("docList");
const closeDocModal = document.getElementById("closeDocModal");

let currentLocataire = null;

/* -----------------------------------------------
   Initialisation
------------------------------------------------- */

function init() {
  afficherLocataires();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    nom: document.getElementById("nom").value.trim(),
    prenom: document.getElementById("prenom").value.trim(),
    naissance: document.getElementById("naissance").value,
    email: document.getElementById("email").value.trim(),
    tel: document.getElementById("tel").value.trim(),
    adresse: document.getElementById("adresse").value.trim(),
    cp: document.getElementById("cp").value.trim(),
    ville: document.getElementById("ville").value.trim(),
    profession: document.getElementById("profession").value.trim(),
    situation: document.getElementById("situation").value,
    revenus: document.getElementById("revenus").value,
    commentaires: document.getElementById("commentaires").value.trim()
  };

  addLocataire(data);
  form.reset();
  afficherLocataires();
});

/* -----------------------------------------------
   Format date FR
------------------------------------------------- */

function formatDateFR(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR");
}

/* -----------------------------------------------
   Affichage des locataires
------------------------------------------------- */

function afficherLocataires() {
  const locataires = getLocataires();

  if (locataires.length === 0) {
    liste.innerHTML = "<p>Aucun locataire enregistré.</p>";
    return;
  }

  liste.innerHTML = "";

  locataires.forEach(loc => {
    const div = document.createElement("div");
    div.className = "card";

div.innerHTML = `
  <h3>${loc.prenom} ${loc.nom}</h3>
  <p>
    Date de naissance : ${formatDateFR(loc.naissance)}<br>
    Email : ${loc.email || "—"}<br>
    Téléphone : ${loc.tel || "—"}<br>
    Adresse : ${loc.adresse || "—"}, ${loc.cp || ""} ${loc.ville || ""}<br>
    Profession : ${loc.profession || "—"}<br>
    Situation : ${loc.situation || "—"}<br>
    Revenus : ${loc.revenus ? loc.revenus + " €" : "—"}<br>
    Commentaires : ${loc.commentaires || "—"}
  </p>

  <div class="actions">
    <button class="docsBtn" data-id="${loc.id}">📁 Documents</button>
    <button class="deleteBtn" data-id="${loc.id}">🗑 Supprimer</button>
  </div>
`;


    liste.appendChild(div);
  });

  // Boutons documents
  document.querySelectorAll(".docsBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      ouvrirDocumentsLocataire(id);
    });
  });

  // Boutons suppression
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (confirm("Supprimer ce locataire ?")) {
        deleteLocataire(id);
        afficherLocataires();
      }
    });
  });
}

/* -----------------------------------------------
   Gestion des documents
------------------------------------------------- */

function ouvrirDocumentsLocataire(id) {
  const loc = getLocataires().find(l => l.id === id);
  if (!loc) return;

  currentLocataire = loc;

  docLocataireNom.textContent = `${loc.prenom} ${loc.nom}`;
  afficherDocuments();

  docModal.showModal();
}

function afficherDocuments() {
  docList.innerHTML = "";

  if (!currentLocataire.documents || currentLocataire.documents.length === 0) {
    docList.innerHTML = "<p>Aucun document.</p>";
    return;
  }

  currentLocataire.documents.forEach((doc, index) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <strong>${doc.name}</strong><br>
      <small>${doc.path}</small><br>
      <button data-index="${index}" class="openDoc">📄 Ouvrir</button>
      <button data-index="${index}" class="deleteDoc">🗑 Supprimer</button>
    `;

    docList.appendChild(div);
  });

  // Ouvrir un document
  document.querySelectorAll(".openDoc").forEach(btn => {
    btn.addEventListener("click", async () => {
      const index = btn.dataset.index;
      const doc = currentLocataire.documents[index];

      const dir = await getStorageDirectory();
      if (!dir) return alert("Dossier non configuré.");

      const file = await readFile(dir, doc.path);
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
    });
  });

  // Supprimer un document
  document.querySelectorAll(".deleteDoc").forEach(btn => {
    btn.addEventListener("click", async () => {
      const index = btn.dataset.index;
      const doc = currentLocataire.documents[index];

      const dir = await getStorageDirectory();
      if (!dir) return alert("Dossier non configuré.");

      await deleteFile(dir, doc.path);
      removeDocumentFromLocataire(currentLocataire.id, index);

      currentLocataire = getLocataires().find(l => l.id === currentLocataire.id);
      afficherDocuments();
    });
  });
}

/* -----------------------------------------------
   Upload document
------------------------------------------------- */

btnUploadDoc.addEventListener("click", async () => {
  const file = docFile.files[0];
  if (!file) return alert("Choisissez un fichier.");

  const dir = await getStorageDirectory();
  if (!dir) return alert("Dossier non configuré.");

  const folder = `locataires/${currentLocataire.id}`;
  const path = `${folder}/${file.name}`;

  await writeFile(dir, path, file);

  addDocumentToLocataire(currentLocataire.id, {
    name: file.name,
    path
  });

  currentLocataire = getLocataires().find(l => l.id === currentLocataire.id);
  docFile.value = "";
  afficherDocuments();
});

/* -----------------------------------------------
   Fermeture modal
------------------------------------------------- */

closeDocModal.addEventListener("click", () => {
  docModal.close();
});

/* -----------------------------------------------
   Lancement
------------------------------------------------- */

init();

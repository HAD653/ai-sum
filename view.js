const qs       = new URLSearchParams(location.search);
const pageUrl  = decodeURIComponent(qs.get("url")  || "");
const passed   = qs.get("text") ? decodeURIComponent(qs.get("text")) : null;
const pre     = document.getElementById("bigResult");
const copyBtn = document.getElementById("copyBtn");


async function loadSummary() {
  if (passed) {
    pre.textContent = passed;
    return;
  }

  if (!pageUrl) {
    pre.textContent = "Résumé introuvable.";
    copyBtn.disabled = true;
    return;
  }

  const store = await chrome.storage.local.get(pageUrl);
  const saved = store[pageUrl];

  if (saved?.api || saved?.local) {
    pre.textContent = saved.api || saved.local;
  } else {
    pre.textContent =
      "Aucun résumé sauvegardé pour cette page.\n\n" +
      "Retournez dans la popup et générez‑le d’abord.";
    copyBtn.disabled = true;
  }
}


copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(pre.textContent.trim());
    copyBtn.textContent = "Copié !";
    setTimeout(() => (copyBtn.textContent = "Copier le résumé"), 1500);
  } catch {
    alert("Impossible de copier.");
  }
});


loadSummary();

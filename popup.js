const apiBtn    = document.getElementById("apiBtn");
const localBtn  = document.getElementById("localBtn");
const expandBtn = document.getElementById("expandBtn");
const resultPre = document.getElementById("result");
const wrap      = document.getElementById("summaryWrapper");
const copyBtn   = document.getElementById("copyBtn");


const HF_API = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const HF_TOKEN = "Bearer <put yours>";

function show(text) {
  wrap.classList.remove("hidden");
  resultPre.textContent = text;
  copyBtn.style.display = "block";
  expandBtn.classList.remove("hidden");
}

function loading(msg) {
  wrap.classList.remove("hidden");
  resultPre.textContent = msg;
  copyBtn.style.display = "none";
  expandBtn.classList.add("hidden");
}

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { text } = await chrome.tabs.sendMessage(tab.id, { action: "GET_TEXT" });
  if (!text) throw new Error("Impossible de récupérer le texte.");
  return { tab, text };
}


async function summarizeAPI(text) {
  
  const isFrench = /[àâäèéêëîïôöùûüçœ]/i.test(text);


  const prompt = isFrench
    ? "Résume l'article suivant en 5 phrases : "
    : "Summarize the following article in 5 sentences: ";


  const params = {
    max_length: 180,
    min_length: 60,
    no_repeat_ngram_size: 3,
    early_stopping: true
  };

  const r = await fetch(HF_API, {
    method: "POST",
    headers: {
      Authorization: HF_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt + text, parameters: params })
  });

  if (!r.ok) throw new Error(`API ${r.status}`);

  const data = await r.json();
  const raw  = Array.isArray(data) ? data[0]?.summary_text : data.summary_text;
  if (!raw) throw new Error("Réponse vide de l’API");

  return /[.!?]\s*$/.test(raw)
    ? raw.trim()
    : raw.trim().replace(/([.!?])[^.!?]*$/, "$1");
}


async function summarizeLocal(txt) {
  const r = await fetch("http://localhost:8000/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: txt, length: "long" })
  });

  if (!r.ok) throw new Error(`Local ${r.status}`);
  return (await r.json()).summary.trim();
}


async function run(mode) {
  apiBtn.disabled = localBtn.disabled = true;
  try {
    loading("Résumé en cours…");
    const { tab, text } = await getPageText();
    const summary = mode === "api" ? await summarizeAPI(text) : await summarizeLocal(text);
    show(summary);
    await chrome.storage.local.set({ [tab.url]: { [mode]: summary } });
  } catch (e) {
    show(`Erreur : ${e.message}`);
  } finally {
    apiBtn.disabled = localBtn.disabled = false;
  }
}


apiBtn .addEventListener("click", () => run("api"));
localBtn.addEventListener("click", () => run("local"));

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(resultPre.textContent.trim());
  copyBtn.textContent = "Copié !";
  setTimeout(() => (copyBtn.textContent = "Copier"), 1500);
});

expandBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const encodedUrl  = encodeURIComponent(tab.url);
  const encodedText = encodeURIComponent(resultPre.textContent.trim());
  const view = chrome.runtime.getURL("view.html") + `?url=${encodedUrl}&text=${encodedText}`;
  chrome.tabs.create({ url: view });
});



document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const store = await chrome.storage.local.get(tab.url);
  const saved = store[tab.url];
  if (saved?.api || saved?.local) show(saved.api || saved.local);
});

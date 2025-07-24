chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.action !== "GET_TEXT") return false;

  const article = new Readability(document.cloneNode(true)).parse();
  const raw = (article?.textContent || document.body.innerText || "").trim();

  const MAX = 3000;
  let slice = raw.slice(0, MAX);
  const lastDot = slice.lastIndexOf(". ");
  if (lastDot > 200) slice = slice.slice(0, lastDot + 1);

  sendResponse({ text: slice });
  return true; 
});

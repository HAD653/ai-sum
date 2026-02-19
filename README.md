# AI-Sum – Smart Article Summarizer (Chrome Extension)

**AI-Sum** is a lightweight Chrome extension that summarizes any article you're reading in just a few seconds.  
It offers two modes: one using a local model and the other via Hugging Face's API.

---

## Features

-  Summarizes any webpage in 5 sentences
-  Works in English and French
-  Two modes:
  - **Local model** (FastAPI + Transformers)
  - **Hugging Face API** (BART model)
-  Saves summaries locally per page
-  One-click copy & fullscreen view
-  Clean and fast UI with no tracking

---

##  Preview

![AI-Sum Screenshot](https://i.imgur.com/zhumc0I.png)

---

##  Tech Stack

- Frontend: HTML, JS (Chrome Extension APIs)
- Backend: Python, FastAPI, HuggingFace Transformers
- Models: `facebook/bart-large-cnn`
- Optional API via HuggingFace


##  Setup

###  Option 1 – Use with Hugging Face (API)

Open popup.js and add your Hugging Face token:
```js
const HF_TOKEN = "Bearer <your_token_here>";
```

###  Option 2 – Run it locally 

```bash
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000

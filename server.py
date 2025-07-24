
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    pipeline,
)
import torch
import re

MODEL_ID = "facebook/bart-large-cnn"      
DEVICE   = 0 if torch.cuda.is_available() else -1


tokenizer  = AutoTokenizer.from_pretrained(MODEL_ID)
model      = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)

summarizer = pipeline(
    "summarization",
    model=model,
    tokenizer=tokenizer,
    device=DEVICE,
    truncation=True 
)

MAX_INPUT_TOKENS = tokenizer.model_max_length  


app = FastAPI(title="Local summarizer")

class Req(BaseModel):
    text: str
    length: str = "long"   


def _clean(text: str) -> str:
    """Supprime les espaces multiples + trims."""
    return re.sub(r"\s+", " ", text).strip()


def _truncate(text: str) -> str:
    """Coupe le texte pour qu'il entre dans MAX_INPUT_TOKENS."""
    ids = tokenizer.encode(
        text,
        max_length=MAX_INPUT_TOKENS,
        truncation=True,
        add_special_tokens=False,
    )
    return tokenizer.decode(ids, skip_special_tokens=True)


def make_summary(text: str, mode: str) -> str:
    """mode = 'long' ou 'short'."""
    text = _clean(text)
    if not text:
        raise ValueError("Texte vide")
    if len(tokenizer.encode(text)) > MAX_INPUT_TOKENS:
        text = _truncate(text)

    params = {
        "min_length": 60 if mode == "long" else 30,
        "max_length": 240 if mode == "long" else 120,
        "no_repeat_ngram_size": 3,
        "early_stopping": True,
        "do_sample": False,
    }

    try:
        out = summarizer(text, **params)[0]["summary_text"].strip()
    except IndexError as e:
        
        raise ValueError("Le texte est trop long pour être résumé") from e

    return out


@app.post("/summarize")
def summarize(req: Req):
    try:
        summary = make_summary(req.text, req.length)
        return {"summary": summary}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

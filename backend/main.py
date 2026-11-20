import asyncio
import os
import tempfile
import threading

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Choi Chu voice")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_lock = threading.Lock()
_infer_lock = threading.Lock()
_model = None
_error: str | None = None


def get_model():
    global _model, _error
    with _lock:
        if _model is not None:
            return _model
        if _error:
            raise RuntimeError(_error)
        try:
            import torch
            from chunkformer import ChunkFormerModel

            threads = max(1, int(os.environ.get("ASR_THREADS", "4")))
            torch.set_num_threads(threads)
            torch.set_num_interop_threads(1)
            os.environ.setdefault("OMP_NUM_THREADS", str(threads))
            os.environ.setdefault("MKL_NUM_THREADS", str(threads))

            name = os.environ.get("ASR_MODEL", "khanhld/chunkformer-ctc-large-vie")
            print(f"loading {name} threads={threads}")
            model = ChunkFormerModel.from_pretrained(name)
            model = model.to(torch.device("cpu"))
            model.eval()
            _model = model
            return _model
        except Exception as exc:
            _error = str(exc)
            raise


def decode_file(path: str) -> str:
    model = get_model()
    with _infer_lock:
        pieces = model.batch_decode([path])
    heard = pieces[0] if pieces else ""
    return drop_looped_hallucination(str(heard).strip())


@app.get("/api/health")
def health():
    return {"ok": True, "ready": _model is not None, "error": _error}


@app.post("/api/warmup")
def warmup():
    try:
        get_model()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ready": True}


_HALLUCINATIONS = ("subscribe", "ghiền mì gõ", "đăng ký kênh", "nhấn chuông", "like và share")


def drop_looped_hallucination(text: str) -> str:
    lowered = text.casefold()
    if any(phrase in lowered for phrase in _HALLUCINATIONS):
        return ""
    words = text.split()
    if len(words) >= 6 and len({word.casefold() for word in words}) <= 3:
        return ""
    return text


@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) < 800:
        raise HTTPException(status_code=400, detail="Không nghe thấy gì. Đọc dài hơn một chút.")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        text = await asyncio.to_thread(decode_file, path)
        print(f"heard: {text}")
        return {"text": text}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        try:
            os.remove(path)
        except OSError:
            pass

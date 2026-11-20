import asyncio
import io
import os
import tempfile
import threading
import time
import wave

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
_engine: str | None = None
_error: str | None = None

# Whisper (CTranslate2) is much faster on typical VPS CPUs.
# ChunkFormer stays available via ASR_ENGINE=chunkformer.
DEFAULT_ENGINE = os.environ.get("ASR_ENGINE", "whisper").strip().lower()


def _thread_count() -> int:
    return max(1, int(os.environ.get("ASR_THREADS", "2")))


def get_model():
    global _model, _engine, _error
    with _lock:
        if _model is not None:
            return _model, _engine or DEFAULT_ENGINE
        if _error:
            raise RuntimeError(_error)
        try:
            engine = DEFAULT_ENGINE
            threads = _thread_count()
            os.environ.setdefault("OMP_NUM_THREADS", str(threads))
            os.environ.setdefault("MKL_NUM_THREADS", str(threads))

            if engine == "chunkformer":
                import torch
                from chunkformer import ChunkFormerModel

                torch.set_num_threads(threads)
                try:
                    torch.set_num_interop_threads(1)
                except RuntimeError:
                    pass
                name = os.environ.get("ASR_MODEL", "khanhld/chunkformer-ctc-large-vie")
                print(f"loading chunkformer {name} threads={threads}")
                model = ChunkFormerModel.from_pretrained(name)
                model = model.to(torch.device("cpu"))
                model.eval()
            else:
                from faster_whisper import WhisperModel

                name = os.environ.get("ASR_MODEL", "vudang449/PhoWhisper-small-ct2")
                print(f"loading whisper {name} threads={threads}")
                model = WhisperModel(
                    name,
                    device="cpu",
                    compute_type="int8",
                    cpu_threads=threads,
                )
                engine = "whisper"

            _model = model
            _engine = engine
            return _model, _engine
        except Exception as exc:
            _error = str(exc)
            raise


_HALLUCINATIONS = ("subscribe", "ghiền mì gõ", "đăng ký kênh", "nhấn chuông", "like và share")


def drop_looped_hallucination(text: str) -> str:
    lowered = text.casefold()
    if any(phrase in lowered for phrase in _HALLUCINATIONS):
        return ""
    words = text.split()
    if len(words) >= 6 and len({word.casefold() for word in words}) <= 3:
        return ""
    return text


def wav_to_audio(data: bytes):
    import numpy as np

    try:
        with wave.open(io.BytesIO(data), "rb") as handle:
            channels = handle.getnchannels()
            width = handle.getsampwidth()
            rate = handle.getframerate()
            frames = handle.readframes(handle.getnframes())
    except wave.Error as exc:
        raise HTTPException(status_code=400, detail="File tiếng không đọc được.") from exc
    if width != 2 or not frames:
        raise HTTPException(status_code=400, detail="Cần WAV 16-bit.")
    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)
    if rate != 16000 and len(audio):
        target = max(1, int(len(audio) * 16000 / rate))
        audio = np.interp(
            np.linspace(0, len(audio) - 1, target),
            np.arange(len(audio)),
            audio,
        ).astype(np.float32)
    return np.ascontiguousarray(audio)


def decode_bytes(data: bytes) -> str:
    model, engine = get_model()
    started = time.perf_counter()
    with _infer_lock:
        if engine == "chunkformer":
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(data)
                path = tmp.name
            try:
                pieces = model.batch_decode([path])
                heard = pieces[0] if pieces else ""
            finally:
                try:
                    os.remove(path)
                except OSError:
                    pass
        else:
            audio = wav_to_audio(data)
            if audio.size < 16000 * 0.25:
                return ""
            segments, _info = model.transcribe(
                audio,
                language="vi",
                beam_size=1,
                best_of=1,
                temperature=0.0,
                condition_on_previous_text=False,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 200, "speech_pad_ms": 200},
            )
            heard = " ".join(segment.text.strip() for segment in segments).strip()
    text = drop_looped_hallucination(str(heard).strip())
    print(f"heard ({engine}, {time.perf_counter() - started:.2f}s): {text}")
    return text


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "ready": _model is not None,
        "engine": _engine or DEFAULT_ENGINE,
        "error": _error,
    }


@app.post("/api/warmup")
def warmup():
    try:
        get_model()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ready": True, "engine": _engine or DEFAULT_ENGINE}


@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) < 800:
        raise HTTPException(status_code=400, detail="Không nghe thấy gì. Đọc dài hơn một chút.")
    try:
        text = await asyncio.to_thread(decode_bytes, data)
        return {"text": text}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

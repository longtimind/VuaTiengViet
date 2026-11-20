# Chơi Chữ

Web game tiếng Việt: đọc L/N, xếp câu, đoán nghĩa, sửa chính tả.

Cần hai tiến trình. Backend Python chấm giọng.

Mặc định dùng **PhoWhisper small** (nhanh trên VPS CPU). Muốn đúng hơn thì:

```bash
export ASR_ENGINE=chunkformer
export ASR_THREADS=2
```

ChunkFormer giấy phép CC-BY-NC-4.0 (phi thương mại).

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

```powershell
npm run dev
```

Mở http://127.0.0.1:5174 . Lần đọc đầu tiên máy nạp model.

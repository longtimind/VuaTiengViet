# Chơi Chữ

Web game tiếng Việt: đọc L/N, xếp câu, đoán nghĩa, sửa chính tả.

Cần hai tiến trình. Backend Python chấm giọng bằng ChunkFormer, model tiếng Việt. Bản này chỉ dùng phi thương mại.

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

```powershell
npm run dev
```

Mở http://127.0.0.1:5174 . Lần đọc đầu tiên máy tải ChunkFormer.

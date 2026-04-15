# Illness Prediction

Ứng dụng dự đoán rủi ro di truyền theo phả hệ (pedigree) với FastAPI + frontend tĩnh.

## Quick start

1. Install dependencies:
   - `pip install -e .[dev]`
2. Run API:
   - `uvicorn src.api.app:app --reload`
3. Run tests:
   - `pytest`

## Cấu trúc chính

- `src/api/`: API FastAPI và route inference
- `src/inference/`: engine suy luận xác suất
- `src/domain/`: mô hình dữ liệu pedigree và xác suất Mendelian
- `src/frontend/`: giao diện nhập phả hệ và xem kết quả
- `tests/unit/`: test đơn vị

## UI

Open `http://127.0.0.1:8000/` in your browser.

The UI starts with default father and mother nodes. You can:

1. Edit phenotype for each node.
2. Click `+ Thêm 1 đời` to add another generation for grandparents or other relatives.
3. Add more nodes inside each generation for aunt/uncle branches.
4. Select query father and mother from the dropdowns.
5. Chọn kiểu di truyền (`auto`, `recessive`, `dominant`).
6. Click `Tính rủi ro` để tính xác suất con bị bệnh theo mô hình đã chọn.

`auto` sẽ thử cả 2 giả thuyết lặn/trội trên cùng phả hệ và chọn mô hình phù hợp hơn với phenotype quan sát được.

## API

### Health check

- `GET /health`
- Response:

```json
{"status": "ok"}
```

### Inference

- `POST /v1/infer`
- Request body mẫu:

```json
{
   "individuals": [
      {"id": "father", "phenotype": "unaffected", "father_id": null, "mother_id": null},
      {"id": "mother", "phenotype": "unaffected", "father_id": null, "mother_id": null},
      {"id": "child1", "phenotype": "affected", "father_id": "father", "mother_id": "mother"}
   ],
   "query": {
      "father_id": "father",
      "mother_id": "mother",
      "inheritance_mode": "auto",
      "allele_frequency": 0.01
   }
}
```

### Các giá trị phenotype hợp lệ

- `affected`
- `unaffected`
- `unknown`

### Các giá trị inheritance_mode hợp lệ

- `auto`
- `recessive`
- `dominant`

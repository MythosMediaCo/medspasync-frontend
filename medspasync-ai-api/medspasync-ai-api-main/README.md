# MedSpaSync AI API

This project provides a Flask-based API and a React front-end for reconciling medical spa transactions.

## Features

- XGBoost model with 95%+ accuracy
- High performance batch processing
- Fallback logic when ML is unavailable
- REST API with CORS support

## Quick Start

### Backend

```bash
pip install -r requirements.txt
python app.py
```

### Frontend

The React client uses Vite. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

```bash
cd frontend
npm install
npm run dev     # for development
# or build for production
npm run build
```

### Running Tests

Both the Flask API and the React client include automated tests.

```bash
# backend tests
pip install -r requirements.txt
pytest

# frontend tests
cd frontend
npm install
npm test
```

## API Endpoints

- `GET /` – API information
- `GET /health` – Health check
- `POST /predict` – Single transaction prediction
- `POST /batch-predict` – Batch reconciliation

## Deployment

Build the Docker image and run with Gunicorn:

```bash
docker build -t medspasync-api .
docker run -p 8080:8080 medspasync-api
```

## License

This project is licensed under the MIT License.

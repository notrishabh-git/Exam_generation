# ExamGen — AI Question Studio

**A full-stack MERN platform for professors to generate professional exam papers using AI.**

---

## Features

- **AI Question Generation** — Upload PPTX/PDF/DOCX slides or enter topics manually; Claude generates MCQs, Short Answer, Long Answer, True/False, and Fill-in-the-Blank questions
- **Bloom's Taxonomy Tagging** — Every question tagged with cognitive level (Remember → Create)
- **Question Review Panel** — Edit, delete, regenerate, and approve questions individually before finalizing
- **Question Bank** — Searchable, filterable repository of all generated questions reusable across papers
- **Dashboard Analytics** — Charts for generation activity, question type distribution, subject performance
- **Paper Management** — Save, duplicate, search, filter, and export papers as PDF/DOCX/JSON
- **Multi-variant Support** — Generate Set A, Set B for different exam halls
- **Protected Routes** — JWT auth with professor profiles

---

## Tech Stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Frontend | React 18, React Router 6, Zustand, Recharts, Framer Motion |
| Backend  | Node.js, Express 4, MongoDB, Mongoose  |
| AI       | Anthropic Claude API (claude-sonnet)   |
| Auth     | JWT + bcryptjs                         |
| Files    | Multer, pdf-parse, mammoth             |
| Styling  | Custom CSS design system (dark academic theme) |

---

## Project Structure

```
examgen/
├── client/                   # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── layout/       # Sidebar, Header, AppLayout
│       │   └── questions/    # QuestionReview, QuestionCard
│       ├── pages/            # Dashboard, Generate, Papers, QuestionBank, Analytics, Settings, Auth
│       ├── store/            # Zustand stores (auth, UI, generator, bank)
│       ├── utils/            # Axios API client
│       └── styles/           # globals.css, components.css
└── server/
    ├── models/               # User, Paper, BankQuestion (Mongoose)
    ├── routes/               # auth, papers, generate, bank, dashboard
    ├── middleware/           # JWT auth middleware
    └── services/
        ├── aiService.js      # Claude API integration
        ├── fileService.js    # PDF/DOCX/PPTX text extraction
        └── exportService.js  # Paper export (PDF/DOCX)
```

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd examgen
npm install           # installs root (concurrently)
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/examgen
JWT_SECRET=your_super_secret_key_here
ANTHROPIC_API_KEY=sk-ant-api03-...   ← Get from console.anthropic.com
CLIENT_URL=http://localhost:3000
```

### 3. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod

# Windows — start MongoDB service from Services
```

### 4. Run development servers

```bash
# From root — starts both client (port 3000) and server (port 5000)
npm run dev
```

Or run separately:
```bash
npm run dev:server   # Server on :5000
npm run dev:client   # React on :3000
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Description       |
|--------|----------------------|-------------------|
| POST   | /api/auth/register   | Create account    |
| POST   | /api/auth/login      | Login             |
| GET    | /api/auth/me         | Get current user  |
| PUT    | /api/auth/profile    | Update profile    |
| PUT    | /api/auth/password   | Change password   |

### Generation
| Method | Endpoint                       | Description                          |
|--------|--------------------------------|--------------------------------------|
| POST   | /api/generate/extract-topics   | Upload files → extract topics        |
| POST   | /api/generate/questions        | Generate questions from topics       |
| POST   | /api/generate/regenerate       | Regenerate a single question         |

### Papers
| Method | Endpoint                   | Description          |
|--------|----------------------------|----------------------|
| GET    | /api/papers                | List all papers      |
| POST   | /api/papers                | Save new paper       |
| GET    | /api/papers/:id            | Get single paper     |
| PUT    | /api/papers/:id            | Update paper         |
| DELETE | /api/papers/:id            | Delete paper         |
| POST   | /api/papers/:id/duplicate  | Duplicate paper      |
| GET    | /api/papers/:id/export/:fmt| Export (json/pdf)    |

### Question Bank
| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| GET    | /api/bank      | List bank questions      |
| POST   | /api/bank/bulk | Bulk add questions       |
| PUT    | /api/bank/:id  | Update question          |
| DELETE | /api/bank/:id  | Delete question          |

### Dashboard
| Method | Endpoint                  | Description         |
|--------|---------------------------|---------------------|
| GET    | /api/dashboard/stats      | Analytics stats     |
| GET    | /api/dashboard/activity   | Recent activity     |

---

## Adding PDF Export

Install pdfkit:
```bash
cd server && npm install pdfkit
```

See the commented implementation in `server/services/exportService.js`.

## Adding DOCX Export

Install docx:
```bash
cd server && npm install docx
```

See the commented implementation in `server/services/exportService.js`.

---

## Production Deployment

```bash
# Build React
cd client && npm run build

# Set NODE_ENV=production in server/.env
# Server will serve the React build from /client/build

# Start server
cd server && npm start
```

For deployment to services like Railway, Render, or AWS:
- Set all env variables in the platform dashboard
- Point `MONGODB_URI` to MongoDB Atlas
- The server serves both API and static React build

---

## Environment Variables Reference

| Variable         | Description                          | Example                          |
|------------------|--------------------------------------|----------------------------------|
| PORT             | Server port                          | 5000                             |
| NODE_ENV         | Environment                          | development / production         |
| MONGODB_URI      | MongoDB connection string            | mongodb://localhost:27017/examgen|
| JWT_SECRET       | Secret for signing JWT tokens        | (random 64-char string)          |
| JWT_EXPIRES_IN   | Token expiry                         | 7d                               |
| ANTHROPIC_API_KEY| Claude API key from Anthropic Console| sk-ant-api03-...                 |
| CLIENT_URL       | Frontend URL for CORS                | http://localhost:3000            |

# CareerAI: Multi-Agent Career Orchestrator

CareerAI is a sophisticated job-search automation platform that utilizes a **Sequential Chain Workflow** to bridge the gap between job discovery and application. By leveraging specialized AI agents, the system scouts the live job market and generates hyper-tailored, high-conversion cover letters based on a candidate's specific experience. (WORK IS STILL BEING DONE, DON'T EXPECT THE APPLICATION TO WORK FULLY)

## 🚀 Core Features

- **Multi-Agent Architecture**: 
  - **The Scout Agent**: Performs real-time Information Retrieval (IR) via the Adzuna API, ranking opportunities based on resume relevancy.
  - **The Writer Agent**: Utilizes Retrieval-Augmented Generation (RAG) to synthesize tailored cover letters.
- **Dual-Mode Operation**:
  - **Auto-Scout**: Scans the web for multiple job titles simultaneously and identifies the "#1 Best Match."
  - **Ghostwriter**: A standalone mode where users can paste a job description or a **live URL** for instant application drafting.
- **Smart Web Scraping**: Integrated BeautifulSoup4 logic to "read" job descriptions directly from job board links (CareerPuck, LinkedIn, etc.).
- **Neomorphic UI**: A high-performance React.js frontend featuring a modern, dark-themed aesthetic with real-time agent status tracking.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), Uvicorn.
- **AI/LLM**: Google Gemini 2.5 Flash.
- **Data & Scraping**: Adzuna API, BeautifulSoup4, PyPDF2.
- **Environment**: Managed via Anaconda.
- 
## 📦 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Adzuna API Credentials
- Google Gemini API Key

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧠 System Architecture

The system follows a **Sequential Chain Workflow**:
1. **Data Ingestion**: The user uploads a PDF resume which is parsed into vectorized text.
2. **Market Retrieval**: The Scout Agent queries the Adzuna API for multiple job titles.
3. **Synthesis & Ranking**: Gemini analyzes the intersection of the user’s skills and the live job metadata.
4. **Application Drafting**: The Writer Agent generates a professional cover letter, ensuring high alignment with job requirements.

**Developed by Betza Avalos** *Software Engineer | Graduate Student at UTEP*

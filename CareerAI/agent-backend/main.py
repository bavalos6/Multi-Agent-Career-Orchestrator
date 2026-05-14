import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv

app = FastAPI()

# Health Check Route
@app.get("/")
def home():
    return {"status": "Omni-Career Agent is Online", "version": "2.0"}

# CORS Middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# API KEYS
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
ADZUNA_ID = os.getenv("ADZUNA_ID")
ADZUNA_KEY = os.getenv("ADZUNA_KEY")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')


class SessionData:
    resume_text = ""
    last_scouted_jobs = []

db = SessionData()


# ---API CALL---
def search_adzuna(title):
    url = f"https://api.adzuna.com/v1/api/jobs/us/search/1"
    params = {
        "app_id": ADZUNA_ID,
        "app_key": ADZUNA_KEY,
        "results_per_page": 10,
        "what": title,
        "content-type": "application/json"
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json().get('results', [])
        else:
            print(f"Adzuna Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Request failed: {e}")
        return []

# ---THE SCOUT ---
def scout_agent_logic(resume, jobs):
    prompt = f"""
    ROLE: Lead Career Scout
    CONTEXT: You have a candidate's resume and 10 job listings.
    RESUME: {resume[:3000]}
    JOBS: {jobs}
    
    TASK: 
    1. Filter and rank these jobs. 
    2. Identify the #1 absolute best match for a cover letter.
    3. For ALL jobs, provide the 'redirect_url' so the user can apply.
    
    OUTPUT FORMAT: Return a JSON-like list of the top 10 with Title, Company, Link, and a 1-sentence 'Why'. 
    Clearly label the '#1 Best Match' at the top.
    """
    response = model.generate_content(prompt)
    return response.text

# --- THE WRITER ---
def writer_agent_logic(resume, best_job_description):
    prompt = f"""
    ROLE: Executive Ghostwriter
    CONTEXT: You are writing a cover letter for the #1 job found by the Scout.
    RESUME: {resume[:3000]}
    JOB DETAILS: {best_job_description}
    
    TASK: Write a 3-paragraph, high-conversion cover letter.
    """
    response = model.generate_content(prompt)
    return response.text

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(await file.read()))
        db.resume_text = "".join([p.extract_text() for p in reader.pages])
        return {"message": "Resume parsed and ready!"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/scout")
async def scout_results(title: str = Form(...)):
    if not db.resume_text:
        return {"error": "Please upload a resume first."}

    titles_list = [t.strip() for t in title.split(',')]
    all_jobs = []
    
    for job_title in titles_list:
        print(f"Scouting for: {job_title}")
        results = search_adzuna(job_title)
        all_jobs.extend(results)

    if not all_jobs:
        return {"error": "No jobs found for those titles."}

    raw_analysis = scout_agent_logic(db.resume_text, all_jobs)
    
    best_job = all_jobs[0]
    letter = writer_agent_logic(db.resume_text, best_job.get('description', ''))
    
    return {
        "cover_letter": letter,
        "analysis": raw_analysis,
        "jobs_raw": all_jobs[:10]
    }

# --- INDEPENDENT GHOSTWRITER AGENT ---
def ghostwriter_only_logic(resume, job_description):
    prompt = f"""
    ROLE: Professional Career Writer
    RESUME: {resume[:3000]}
    TARGET JOB: {job_description}
    TASK: Write a high-quality cover letter based ONLY on this specific job description.
    """
    return model.generate_content(prompt).text

def scrape_job_description(url: str):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()

        # Get text and clean up whitespace
        text = soup.get_text(separator=' ')
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Return the first 5000 characters to stay within context limits
        return clean_text[:5000]
    except Exception as e:
        print(f"Scraping error: {e}")
        return None

@app.post("/ghostwrite")
async def manual_ghostwriter(job_desc: str = Form(...)):
    if not db.resume_text:
        return {"error": "Please upload a resume first."}

    # Check if the input is a URL
    final_desc = job_desc
    if job_desc.startswith("http"):
        scraped_text = scrape_job_description(job_desc)
        if scraped_text:
            final_desc = scraped_text
        else:
            return {"error": "Could not read the job link. Try pasting the text manually."}

    # Now pass the scraped (or pasted) text to the AI
    letter = ghostwriter_only_logic(db.resume_text, final_desc)
    return {"cover_letter": letter}
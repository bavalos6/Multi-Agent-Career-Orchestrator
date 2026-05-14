'use client';
import { useState, useRef } from 'react';

interface Job {
  title: string;
  company: { display_name: string };
  redirect_url: string;
  location: { display_name: string };
}

export default function CareerAI() {
  const [mode, setMode] = useState<'AUTO' | 'GHOSTWRITER'>('AUTO');
  const [status, setStatus] = useState('READY');
  const [input, setInput] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setStatus('UPLOADING...');
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: fd });
      if (res.ok) {
        setResumeName(file.name);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Could not connect to server.");
    } finally {
      setStatus('READY');
    }
  };

  const handleAction = async () => {
    if (!input) return alert("Please enter job titles or a description.");

    setStatus(mode === 'AUTO' ? 'ANALYZING' : 'WRITING');
    const fd = new FormData();

    try {
      if (mode === 'AUTO') {
        fd.append('title', input);
        const res = await fetch('http://127.0.0.1:8000/scout', { method: 'POST', body: fd });
        const data = await res.json();
        setCoverLetter(data.cover_letter);
        setJobs(data.jobs_raw || []);
      } else {
        fd.append('job_desc', input);
        const res = await fetch('http://127.0.0.1:8000/ghostwrite', { method: 'POST', body: fd });
        const data = await res.json();
        setCoverLetter(data.cover_letter);
        setJobs([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatus('READY');
    }
  };

  return (
    <div className="bg-[#1a1b26] text-[#e8eaf0] min-h-screen font-sans">
      <style jsx global>{`
        .neo-in { background: #13141f; box-shadow: inset 4px 4px 8px #0a0b10, inset -4px -4px 8px #1e1f2b; }
        .neo-card { background: #232533; box-shadow: 8px 8px 16px #101118, -4px -4px 12px #2e3040; border: 1px solid rgba(255, 255, 255, 0.05); }
        .neo-primary { background: #6366f1; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39); }
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      <header className="fixed top-0 w-full bg-[#1a1b26]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex justify-between items-center px-10 h-16 max-w-[1200px] mx-auto">
          <span className="text-xl font-bold text-[#6366f1]">CareerAI</span>
          <div className="neo-in p-1 rounded-full flex items-center">
            <button onClick={() => setMode('AUTO')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${mode === 'AUTO' ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-500'}`}>Multi-Agent</button>
            <button onClick={() => setMode('GHOSTWRITER')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${mode === 'GHOSTWRITER' ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-500'}`}>Ghostwriter</button>
          </div>
          <div className="w-32"></div> {/* Spacer for symmetry */}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto pt-32 px-6">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Find your next career move with AI</h1>
          <div className="neo-card p-8 rounded-2xl max-w-3xl mx-auto mt-10">
            <div className="flex flex-col gap-6">
              <div className="text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  {mode === 'AUTO' ? 'Desired Job Titles' : 'Target Job Description'}
                </label>
                <div className="flex flex-col gap-4">
                  {mode === 'AUTO' ? (
                    <input
                      className="w-full neo-in border-0 rounded-xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-[#6366f1]/50"
                      placeholder="e.g. Software Engineer, Web Developer"
                      value={input} onChange={(e) => setInput(e.target.value)}
                    />
                  ) : (
                    // Inside the input/textarea section of your page.tsx
                    <div className="flex flex-col gap-4">
                      <textarea
                        className="w-full neo-in border-0 rounded-xl py-4 px-6 text-sm h-32 outline-none focus:ring-2 focus:ring-[#6366f1]/50"
                        placeholder="Paste a job link (e.g. careerpuck.com/...) or the job description text here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <button
                        onClick={handleAction}
                        className="neo-primary w-full py-4 rounded-xl font-bold text-sm hover:brightness-110 transition"
                      >
                        {status === 'WRITING' ? 'Agent is reading the link...' : 'Draft Cover Letter'}
                      </button>
                    </div>
                  )}
                  <button onClick={handleAction} className="neo-primary w-full py-4 rounded-xl font-bold text-sm hover:brightness-110 transition active:scale-[0.98]">
                    {status === 'READY' ? (mode === 'AUTO' ? 'Search & Scout Jobs' : 'Draft Cover Letter') : 'Processing...'}
                  </button>
                </div>
              </div>

              {/* Functional & Clean Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="neo-in border-2 border-dashed border-white/10 rounded-2xl py-10 flex flex-col items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
                <div className="bg-[#6366f1]/10 p-3 rounded-full mb-3">
                  <span className="material-symbols-outlined text-[#6366f1] text-2xl">
                    {status === 'UPLOADING...' ? 'sync' : resumeName ? 'check_circle' : 'upload'}
                  </span>
                </div>

                {/* Dynamic Text Logic */}
                <p className="text-xs font-bold text-slate-200">
                  {status === 'UPLOADING...' ? 'Uploading...' : resumeName ? 'Resume Uploaded' : 'Drop your resume here'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {resumeName ? `Current: ${resumeName}` : 'PDF, DOCX up to 10MB'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Results Area */}
        {coverLetter && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl font-bold mb-4">{mode === 'AUTO' ? 'Top Matches' : 'AI Analysis'}</h2>
              {jobs.length > 0 ? (
                jobs.map((job, i) => (
                  <div key={i} className="neo-card p-5 rounded-xl border-l-4 border-[#6366f1]">
                    <h3 className="text-sm font-bold truncate mb-1">{job.title}</h3>
                    <p className="text-[10px] text-slate-400 mb-4">{job.company.display_name}</p>
                    <a href={job.redirect_url} target="_blank" className="text-[10px] text-[#6366f1] font-bold tracking-widest hover:underline">VIEW JOB →</a>
                  </div>
                ))
              ) : (
                <div className="p-6 neo-in rounded-xl text-slate-500 text-xs italic">
                  Analysis focused on the provided job requirements.
                </div>
              )}
            </div>
            <div className="lg:col-span-8 neo-card rounded-2xl p-12 relative min-h-[500px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#6366f1] rounded-t-2xl"></div>
              <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
                {coverLetter}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
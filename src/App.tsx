/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

type ViewState = 'home' | 'loading' | 'results';
type TabState = 'manual' | 'url';
type AIModel = 'flash' | 'flash-lite';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [tab, setTab] = useState<TabState>('manual');
  const [aiModel, setAiModel] = useState<AIModel>('flash-lite');

  // Form State Handles
  const [serviceHistory, setServiceHistory] = useState<boolean>(true);
  const [accidentHistory, setAccidentHistory] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>('ANALYSING DEAL...');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    data.serviceHistory = serviceHistory ? 'YES' : 'NO';
    data.accidentHistory = accidentHistory ? 'YES' : 'NO';

    setLoadingMsg('USING AI TO ANALYSE DEAL...');
    setView('loading');
    setScrapeError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'manual', data, model: aiModel })
      });
      const resultObj = await response.json();
      if (!response.ok) throw new Error(resultObj.error || 'Analysis failed');
      setAnalysisResult(resultObj.data);
      setView('results');
      window.scrollTo(0, 0);
    } catch(err: any) {
      setView('home');
      setScrapeError(err.message);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const urlInput = formData.get('urlInput') as string;
    
    setScrapeError(null);
    setLoadingMsg('USING AI TO ANALYSE DEAL...');
    setView('loading');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'url', url: urlInput, model: aiModel })
      });
      
      const resultObj = await response.json();
      if (!response.ok) throw new Error(resultObj.error || 'Analysis failed');

      setAnalysisResult(resultObj.data);
      setView('results');
      window.scrollTo(0, 0);

    } catch (err: any) {
      setView('home');
      setScrapeError(err.message);
    }
  };

  const handleReset = () => {
    setView('home');
    window.scrollTo(0, 0);
  };

  const scrollToForm = () => {
    document.getElementById('analysis-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const NavBar = () => (
    <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-8 py-6 bg-canvas/30">
      <div className="flex-1">
        <button className="font-mono text-[11px] uppercase tracking-[2px] text-ink hover:opacity-70 transition-opacity">MENU</button>
      </div>
      <div className="flex-1 text-center">
        <span className="font-display text-[14px] uppercase tracking-[6px] text-ink">CARDEAL</span>
      </div>
      <div className="flex-1 text-right">
        <button className="font-mono text-[11px] uppercase tracking-[2px] text-ink hover:opacity-70 transition-opacity">ABOUT</button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen font-body text-ink">
      {(view === 'home' || view === 'results') && <NavBar />}
      
      {view === 'loading' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-canvas">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted-soft animate-pulse mb-8">
            {loadingMsg}
          </div>
          <div className="w-[200px] h-[1px] bg-hairline relative overflow-hidden">
            <div className="absolute top-0 left-0 h-[1px] bg-ink animate-progress-slide"></div>
          </div>
        </div>
      )}

      {view === 'home' && (
        <main>
          {/* Hero Section */}
          <section className="relative h-screen min-h-[600px] flex flex-col items-center justify-center text-center px-4">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2069&auto=format&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-canvas/60 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="font-display text-[32px] md:text-[48px] uppercase tracking-[3px] md:tracking-[4px] text-ink leading-tight max-w-3xl">
                WHAT IS THIS CAR REALLY WORTH
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted mt-6 mb-10">
                AI-POWERED USED CAR ANALYSIS
              </p>
              <button 
                onClick={scrollToForm}
                className="font-mono text-[11px] uppercase tracking-[2px] text-ink border border-ink rounded-full px-8 py-3 hover:opacity-70 transition-opacity"
              >
                SCORE A DEAL
              </button>
            </div>
          </section>

          {/* Form Section */}
          <section id="analysis-form" className="py-[120px] max-w-4xl mx-auto px-6">
            
            {/* Model Selection */}
            <div className="flex flex-col items-center gap-4 mb-16">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted text-center">AI MODEL</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setAiModel('flash-lite')}
                  className={`font-mono text-[11px] uppercase tracking-[2px] px-6 py-2 rounded-full border transition-colors ${aiModel === 'flash-lite' ? 'border-ink text-ink bg-surface-elevated' : 'border-hairline text-muted hover:border-muted'}`}
                >
                  GEMINI FLASH-LITE (FAST)
                </button>
                <button 
                  onClick={() => setAiModel('flash')}
                  className={`font-mono text-[11px] uppercase tracking-[2px] px-6 py-2 rounded-full border transition-colors ${aiModel === 'flash' ? 'border-ink text-ink bg-surface-elevated' : 'border-hairline text-muted hover:border-muted'}`}
                >
                  GEMINI FLASH (SMART)
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-12 justify-center mb-16">
              <button 
                onClick={() => setTab('manual')}
                className={`font-mono text-[12px] uppercase tracking-[2px] pb-[6px] border-b ${tab === 'manual' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink transition-colors'}`}
              >
                MANUAL ENTRY
              </button>
              <button 
                onClick={() => setTab('url')}
                className={`font-mono text-[12px] uppercase tracking-[2px] pb-[6px] border-b ${tab === 'url' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink transition-colors'}`}
              >
                PASTE URL
              </button>
            </div>

            {/* Manual Entry Form */}
            {tab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="animate-in fade-in duration-500">
                {scrapeError && (
                  <div className="mb-10 p-4 border border-warning text-warning text-center font-mono text-[11px] uppercase tracking-[1px]">
                    {scrapeError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 mb-10">
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">MAKE</label>
                    <input type="text" name="make" required className="hairline-input" placeholder="e.g. Porsche" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">MODEL</label>
                    <input type="text" name="model" required className="hairline-input" placeholder="e.g. 911 Carrera S" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">YEAR</label>
                    <input type="number" name="year" required className="hairline-input" placeholder="YYYY" min="1900" max="2100" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">MILEAGE (KM)</label>
                    <input type="text" name="mileage" required className="hairline-input" placeholder="e.g. 50000 - 60000" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">ASKING PRICE</label>
                    <input type="text" name="askingPrice" required className="hairline-input" placeholder="e.g. RM 50000 - 60000" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">CONDITION</label>
                    <select name="condition" required className="hairline-input cursor-pointer" defaultValue="">
                      <option value="" disabled>SELECT CONDITION</option>
                      <option value="EXCELLENT">EXCELLENT</option>
                      <option value="GOOD">GOOD</option>
                      <option value="FAIR">FAIR</option>
                      <option value="POOR">POOR</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">FUEL TYPE</label>
                    <select name="fuelType" required className="hairline-input cursor-pointer" defaultValue="">
                      <option value="" disabled>SELECT FUEL</option>
                      <option value="PETROL">PETROL</option>
                      <option value="DIESEL">DIESEL</option>
                      <option value="HYBRID">HYBRID</option>
                      <option value="ELECTRIC">ELECTRIC</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">TRANSMISSION</label>
                    <select name="transmission" required className="hairline-input cursor-pointer" defaultValue="">
                      <option value="" disabled>SELECT TRANS</option>
                      <option value="AUTOMATIC">AUTOMATIC</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">PREVIOUS OWNERS</label>
                    <input type="number" name="previousOwners" className="hairline-input" placeholder="1" min="0" />
                  </div>
                  
                  {/* Toggles */}
                  <div className="flex flex-col gap-6 self-end pt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted">SERVICE HISTORY</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setServiceHistory(true)} className={`font-mono text-[11px] uppercase tracking-[2px] px-4 py-1.5 rounded-full border transition-colors ${serviceHistory ? 'border-ink text-ink' : 'border-hairline text-muted hover:border-muted'}`}>YES</button>
                        <button type="button" onClick={() => setServiceHistory(false)} className={`font-mono text-[11px] uppercase tracking-[2px] px-4 py-1.5 rounded-full border transition-colors ${!serviceHistory ? 'border-ink text-ink' : 'border-hairline text-muted hover:border-muted'}`}>NO</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted">ACCIDENT HISTORY</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setAccidentHistory(true)} className={`font-mono text-[11px] uppercase tracking-[2px] px-4 py-1.5 rounded-full border transition-colors ${accidentHistory ? 'border-ink text-ink' : 'border-hairline text-muted hover:border-muted'}`}>YES</button>
                        <button type="button" onClick={() => setAccidentHistory(false)} className={`font-mono text-[11px] uppercase tracking-[2px] px-4 py-1.5 rounded-full border transition-colors ${!accidentHistory ? 'border-ink text-ink' : 'border-hairline text-muted hover:border-muted'}`}>NO</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col mb-16">
                  <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">ADDITIONAL NOTES</label>
                  <textarea name="notes" className="hairline-input resize-none" rows={4} placeholder="Modifications, trim levels, or other specifications..."></textarea>
                  <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-soft mt-3">
                    PASTE THE LISTING DESCRIPTION HERE FOR MORE ACCURATE ANALYSIS
                  </p>
                </div>

                <button type="submit" className="w-full font-mono text-[12px] uppercase tracking-[2px] text-ink border border-ink rounded-full py-4 text-center hover:opacity-70 transition-opacity">
                  ANALYSE THIS CAR
                </button>
              </form>
            )}

            {/* URL Paste Form */}
            {tab === 'url' && (
              <form onSubmit={handleUrlSubmit} className="animate-in fade-in duration-500 max-w-2xl mx-auto">
                {scrapeError && (
                  <div className="mb-10 p-4 border border-warning text-warning text-center font-mono text-[11px] uppercase tracking-[1px]">
                    {scrapeError}
                  </div>
                )}
                <div className="flex flex-col mb-10">
                  <label className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-3">LISTING URL</label>
                  <input type="url" name="urlInput" required className="hairline-input" placeholder="PASTE LISTING URL" />
                </div>

                <div className="text-center mb-12">
                  <p className="font-mono text-[11px] uppercase tracking-[2px] text-muted-soft">
                    WE WILL AUTOMATICALLY ANALYSE THE PRICE, MILEAGE AND CONDITION USING AI.
                  </p>
                </div>

                <button type="submit" className="w-full font-mono text-[12px] uppercase tracking-[2px] text-ink border border-ink rounded-full py-4 text-center hover:opacity-70 transition-opacity">
                  SEARCH & ANALYSE THIS CAR
                </button>
              </form>
            )}

          </section>
        </main>
      )}

      {view === 'results' && analysisResult && (
        <main className="pt-[100px] pb-0">
          
          {/* Section 1: Deal Score */}
          <section className="w-full bg-surface-soft py-[80px] mb-[120px] flex flex-col items-center">
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-12">DEAL SCORE</span>
            
            <div className="relative w-[240px] h-[240px] mb-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="110" stroke="var(--color-hairline)" strokeWidth="2" fill="none" />
                <circle cx="120" cy="120" r="110" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeDasharray="691" strokeDashoffset={`${691 - (691 * analysisResult.score / 100)}`} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[64px] text-ink leading-none mt-2">{analysisResult.score}</span>
              </div>
            </div>
            
            <h2 className="font-display text-[24px] uppercase tracking-[2px] text-ink">{analysisResult.dealRating}</h2>
          </section>

          {/* Section 2: Price Analysis */}
          <section className="max-w-4xl mx-auto px-6 mb-[120px]">
            <div className="flex flex-col md:flex-row border-y border-hairline relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-hairline transform -translate-x-1/2"></div>
              
              <div className="flex-1 py-12 text-center md:border-b-0 border-b border-hairline">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-4">ASKING PRICE</div>
                <div className="font-display text-[32px] tracking-[2px] text-ink">{analysisResult.askingPrice}</div>
              </div>
              
              <div className="flex-1 py-12 text-center">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-4">ESTIMATED MARKET VALUE</div>
                <div className="font-display text-[32px] tracking-[2px] text-ink">{analysisResult.estimatedMarketValue}</div>
              </div>
            </div>
            <div className="text-center mt-12">
              <span className={`font-mono text-[14px] uppercase tracking-[2px] text-${analysisResult.marketComparisonColor || 'success'}`}>
                {analysisResult.marketComparison}
              </span>
            </div>
          </section>

          {/* Section 3: Analysis Factors */}
          <section className="max-w-5xl mx-auto px-6 mb-[120px]">
             <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-8 text-center md:text-left">FACTOR BREAKDOWN</div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {analysisResult.factors?.map((factor: any, index: number) => (
                  <div key={index} className="bg-surface-card border border-hairline p-6 rounded-none flex flex-col">
                    <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-6">{factor.title}</div>
                    <div className="font-display text-[32px] tracking-[2px] text-ink mb-4">{factor.score}</div>
                    <div className="mb-6">
                      <div className="w-full h-[1px] bg-hairline relative mb-2">
                         <div className={`absolute top-0 left-0 h-[1px] bg-${factor.color === 'success' ? 'ink' : factor.color}`} style={{width: `${factor.score}%`}}></div>
                      </div>
                      <div className={`font-mono text-[11px] text-${factor.color}`}>{factor.rating}</div>
                    </div>
                    <p className="font-body text-[14px] text-body-text flex-1">
                      {factor.description}
                    </p>
                  </div>
                ))}
             </div>
          </section>

          {/* Section 4: Red Flags & Green Flags */}
          <section className="max-w-5xl mx-auto px-6 mb-[120px]">
            <div className="flex flex-col md:flex-row border border-hairline rounded-none">
              <div className="flex-1 p-8 md:p-12 md:border-r border-b md:border-b-0 border-hairline">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-ink mb-10">RED FLAGS</div>
                <div className="flex flex-col gap-6">
                   {analysisResult.redFlags?.map((flag: string, index: number) => (
                     <p key={index} className="font-body text-[16px] text-body-text flex gap-4">
                       <span className="text-muted-soft">—</span>
                       {flag}
                     </p>
                   ))}
                </div>
              </div>
              <div className="flex-1 p-8 md:p-12">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-ink mb-10">GREEN FLAGS</div>
                <div className="flex flex-col gap-6">
                   {analysisResult.greenFlags?.map((flag: string, index: number) => (
                     <p key={index} className="font-body text-[16px] text-body-text flex gap-4">
                       <span className="text-muted-soft">—</span>
                       {flag}
                     </p>
                   ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Negotiation */}
          {analysisResult.negotiationPoints?.length > 0 && (
            <section className="max-w-4xl mx-auto px-6 mb-[120px]">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-8 text-center pt-[120px] border-t border-hairline">NEGOTIATION</div>
              <div className="flex flex-col">
                 {analysisResult.negotiationPoints.map((point: string, index: number) => (
                   <div key={index} className="flex gap-6 py-6 border-b border-hairline items-start">
                     <span className="font-mono text-[11px] text-muted-soft pt-1">{String(index + 1).padStart(2, '0')}</span>
                     <p className="font-body text-[16px] text-body-text leading-relaxed">
                       {point}
                     </p>
                   </div>
                 ))}
              </div>
            </section>
          )}

          {/* Section 6: AI Verdict */}
          <section className="w-full bg-surface-soft py-[64px] mb-[120px]">
            <div className="max-w-3xl mx-auto px-6 text-center">
               <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted mb-8">AI VERDICT</div>
               <p className="font-body text-[20px] text-body-strong leading-relaxed">
                 {analysisResult.verdict}
               </p>
            </div>
          </section>

          {/* Section 7: Reset CTA */}
          <section className="w-full bg-canvas py-[120px]">
            <div className="flex flex-col items-center">
              <h2 className="font-display text-[32px] select-none text-ink uppercase tracking-[2px] mb-10 text-center px-4">
                SCORE ANOTHER CAR
              </h2>
              <button 
                onClick={handleReset}
                className="font-mono text-[11px] uppercase tracking-[2px] text-ink border border-ink rounded-full px-10 py-4 hover:opacity-70 transition-opacity"
              >
                START OVER
              </button>
            </div>
          </section>
        </main>
      )}

    </div>
  );
}

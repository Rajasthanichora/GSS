import React, { useState, useRef, useEffect } from 'react';
import { ListChecks, Image as ImageIcon, UploadCloud } from 'lucide-react';

export const LogsheetCalculator: React.FC = () => {
  const [activeSub, setActiveSub] = useState<'logsheet' | 'register'>('logsheet');
  const [img1Preview, setImg1Preview] = useState<string | null>(null);
  const [img2Preview, setImg2Preview] = useState<string | null>(null);
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img2File, setImg2File] = useState<File | null>(null);
  const [uploadingBoth, setUploadingBoth] = useState<boolean>(false);
  const [errorBoth, setErrorBoth] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [n8nStatus, setN8nStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const input1Ref = useRef<HTMLInputElement | null>(null);
  const input2Ref = useRef<HTMLInputElement | null>(null);

  const onPick = (ref: React.RefObject<HTMLInputElement>) => ref.current?.click();

  const N8N_WEBHOOK = 'http://arisey.fun/webhook-test/f18fc7bf-b29e-4b73-9f85-c01f260a19ed';
  // Optional: a status endpoint that returns final text when ready
  // Configure in n8n as a separate Webhook node, e.g., GET /webhook-test/logsheet-status
  const N8N_STATUS_WEBHOOK = 'http://arisey.fun/webhook/868647c7-5da9-4009-879a-8fde9e830f6f';

  // Supabase REST credentials (public anon key is safe for client)
  const SUPABASE_URL = 'https://pxkuyafnamjpehtwalrp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4a3V5YWZuYW1qcGVodHdhbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjcwMDgsImV4cCI6MjA3NDkwMzAwOH0.3V3yQleHrVEsUJ800pwFeIJR653DTneqF4pMXSN849A';

  // Helper to build PostgREST URL for a column (handles spaces/uppercase via quoted identifier)
  const buildColumnUrl = (column: string) => {
    const quoted = encodeURIComponent(`"${column}"`); // e.g. %22AI%20ANALYSIS%22
    const select = `select=${quoted}`;
    const filter = `${quoted}=not.is.null`;
    return `${SUPABASE_URL}/rest/v1/job_results?${select}&${filter}&limit=1`;
  };

  // Poll Supabase table job_results for a non-empty text_result. Stops when text is found.
  const pollSupabaseText = () => {
    const deadline = Date.now() + 10 * 60 * 1000; // 10 min safety
    const pollOnce = async (): Promise<void> => {
      if (Date.now() > deadline) {
        setErrorBoth('Timed out waiting for result');
        return;
      }
      try {
        const url = `${SUPABASE_URL}/rest/v1/job_results?select=text_result&text_result=not.is.null&limit=1`;
        const r = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        if (!r.ok) {
          setTimeout(pollOnce, 2500);
          return;
        }
        const data = await r.json().catch(() => null);
        const text = Array.isArray(data) && data[0]?.text_result ? String(data[0].text_result) : '';
        if (text) {
          if (typeof (window as any).onN8nTextResponse === 'function') {
            (window as any).onN8nTextResponse(text);
          } else {
            setResponseText(text);
            setShowLoader(false);
          }
        } else {
          setTimeout(pollOnce, 2000);
        }
      } catch {
        setTimeout(pollOnce, 3000);
      }
    };
    pollOnce();
  };

  // Poll Supabase table job_results for a non-empty AI analysis. Stops when text is found.
  const pollSupabaseAI = () => {
    const deadline = Date.now() + 10 * 60 * 1000; // 10 min safety
    const pollOnce = async (): Promise<void> => {
      if (Date.now() > deadline) {
        setErrorBoth('Timed out waiting for AI analysis');
        return;
      }
      try {
        // Try snake_case first, then the actual column name with space and uppercase
        const url1 = buildColumnUrl('ai_analysis');
        const r1 = await fetch(url1, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        let text = '';
        if (r1.ok) {
          const data = await r1.json().catch(() => null);
          text = Array.isArray(data) && data[0]?.ai_analysis ? String(data[0].ai_analysis) : '';
        }
        // If empty, try the spaced/upper column: "AI ANALYSIS"
        if (!text) {
          const url2 = buildColumnUrl('AI ANALYSIS');
          const r2 = await fetch(url2, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          if (r2.ok) {
            const data2 = await r2.json().catch(() => null);
            text = Array.isArray(data2) && data2[0] && data2[0]['AI ANALYSIS'] ? String(data2[0]['AI ANALYSIS']) : '';
          }
        }
        if (text) {
          // Mirror text_result handling: prefer global callback if provided
          if (typeof (window as any).onN8nTextResponse === 'function') {
            (window as any).onN8nTextResponse(text);
          } else {
            setResponseText(text);
            setShowLoader(false);
          }
        } else {
          setTimeout(pollOnce, 2000);
        }
      } catch {
        setTimeout(pollOnce, 3000);
      }
    };
    pollOnce();
  };

  // Polling helper: asks n8n for result using a jobId. When final text is available,
  // calls the global handler to stop loader and show text.
  const pollForResult = async (jobId: string) => {
    const maxMinutes = 10; // safety timeout
    const deadline = Date.now() + maxMinutes * 60 * 1000;

    const pollOnce = async (): Promise<void> => {
      if (Date.now() > deadline) {
        setErrorBoth('Timed out waiting for result');
        return;
      }
      try {
        const url = `${N8N_STATUS_WEBHOOK}?jobId=${encodeURIComponent(jobId)}`;
        const r = await fetch(url, { method: 'GET', mode: 'cors' });
        if (r.status === 204) {
          // Still pending
          setTimeout(pollOnce, 2000);
          return;
        }
        if (!r.ok) {
          // Backoff and retry
          setTimeout(pollOnce, 3000);
          return;
        }
        const txt = await r.text();
        if (txt && typeof (window as any).onN8nTextResponse === 'function') {
          (window as any).onN8nTextResponse(txt);
        } else if (txt) {
          // Fallback
          setResponseText(txt);
          setShowLoader(false);
        } else {
          // No text yet; retry
          setTimeout(pollOnce, 2000);
        }
      } catch {
        // Network error; retry after a short delay
        setTimeout(pollOnce, 3000);
      }
    };
    pollOnce();
  };

  const uploadBothFiles = async () => {
    if (!img1File || !img2File) return;
    setErrorBoth(null);
    setUploadingBoth(true);
    try {
      const form = new FormData();
      form.append('file132', img1File, img1File.name);
      form.append('file33', img2File, img2File.name);
      form.append('timestamp', new Date().toISOString());
      form.append('labels', JSON.stringify({ file132: '132KV', file33: '33KV' }));

      const resp = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        body: form,
        mode: 'cors',
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Upload failed (${resp.status}): ${text}`);
      }
      // Webhook is reachable and accepted
      setN8nStatus('online');
      // Try to parse a jobId from n8n to start polling (optional enhancement)
      let jobId: string | null = null;
      try {
        const txt = await resp.text();
        const maybeJson = JSON.parse(txt);
        if (maybeJson && typeof maybeJson === 'object' && typeof maybeJson.jobId === 'string') {
          jobId = maybeJson.jobId;
        }
      } catch {
        // Non-JSON response; ignore and keep waiting for external callback
      }
      if (jobId) {
        pollForResult(jobId);
      }
    } catch (err: any) {
      // Keep loader running; optionally log the error internally
      setErrorBoth(err?.message || 'Upload failed');
      setN8nStatus('offline');
    } finally {
      setUploadingBoth(false);
      // Do not stop the loader automatically; wait for n8n-triggered function
    }
  };

  // Register a global callback that n8n (or any external script) can call to stop the loader
  // and show the text response. Example: window.onN8nTextResponse('final text from n8n')
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      // 1) Try CORS fetch -> requires CORS enabled on status endpoint
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 5000);
        const r = await fetch(N8N_STATUS_WEBHOOK, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!isMounted) return;
        if (r.ok) {
          setN8nStatus('online');
          return;
        }
      } catch {
        // ignore; try image ping next
      }

      // 2) Fallback: Image ping (doesn't need CORS but requires endpoint to serve an image)
      const img = new Image();
      const timeout = window.setTimeout(() => {
        img.src = '';
        if (isMounted) setN8nStatus('offline');
      }, 5000);
      img.onload = () => {
        clearTimeout(timeout);
        if (isMounted) setN8nStatus('online');
      };
      img.onerror = () => {
        clearTimeout(timeout);
        if (isMounted) setN8nStatus('offline');
      };
      img.src = `${N8N_STATUS_WEBHOOK}?_=${Date.now()}`;
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [N8N_STATUS_WEBHOOK]);

  useEffect(() => {
    (window as any).onN8nTextResponse = (text: string) => {
      setResponseText(text ?? '');
      setShowLoader(false);
    };
    return () => {
      try {
        delete (window as any).onN8nTextResponse;
      } catch {}
    };
  }, []);

  // On mount: try to show any existing result from Supabase immediately
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // Try AI analysis first (snake_case, then spaced/uppercase)
        const urlAI1 = buildColumnUrl('ai_analysis');
        const rAI1 = await fetch(urlAI1, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        let ai = '';
        if (rAI1.ok) {
          const dataAI1 = await rAI1.json().catch(() => null);
          ai = Array.isArray(dataAI1) && dataAI1[0]?.ai_analysis ? String(dataAI1[0].ai_analysis) : '';
        }
        if (!ai) {
          const urlAI2 = buildColumnUrl('AI ANALYSIS');
          const rAI2 = await fetch(urlAI2, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          if (rAI2.ok) {
            const dataAI2 = await rAI2.json().catch(() => null);
            ai = Array.isArray(dataAI2) && dataAI2[0] && dataAI2[0]['AI ANALYSIS'] ? String(dataAI2[0]['AI ANALYSIS']) : '';
          }
        }
        if (ai) {
          if (typeof (window as any).onN8nTextResponse === 'function') {
            (window as any).onN8nTextResponse(ai);
          } else {
            setResponseText(ai);
            setShowLoader(false);
          }
          return;
        }
        // Fallback to text_result
        const urlTxt = `${SUPABASE_URL}/rest/v1/job_results?select=text_result&text_result=not.is.null&limit=1`;
        const rTxt = await fetch(urlTxt, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        if (!rTxt.ok) return;
        const dataTxt = await rTxt.json().catch(() => null);
        const txt = Array.isArray(dataTxt) && dataTxt[0]?.text_result ? String(dataTxt[0].text_result) : '';
        if (txt) {
          if (typeof (window as any).onN8nTextResponse === 'function') {
            (window as any).onN8nTextResponse(txt);
          } else {
            setResponseText(txt);
            setShowLoader(false);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchInitial();
  }, []);

  const handleSend = () => {
    if (hasSent || uploadingBoth || !img1File || !img2File) return;
    setHasSent(true);
    setShowLoader(true);
    uploadBothFiles();
    // Start Supabase polling to receive custom text whenever n8n writes it
    pollSupabaseText();
    // Also poll for AI analysis column updates
    pollSupabaseAI();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, which: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === 1) {
      setImg1Preview(url);
      setImg1File(file);
    }
    if (which === 2) {
      setImg2Preview(url);
      setImg2File(file);
    }
    // Auto-send when both selected (respect one-time send)
    setTimeout(() => {
      if (img1File && img2File && !hasSent) {
        handleSend();
      }
    }, 0);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden relative min-h-[400px]">
      {/* Title */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Logsheet Calculate</h2>
        </div>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-text-secondary" aria-live="polite">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              n8nStatus === 'online'
                ? 'bg-emerald-500'
                : n8nStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-yellow-400 animate-pulse'
            }`}
          />
          <span>
            {n8nStatus === 'online'
              ? 'N8N Online'
              : n8nStatus === 'offline'
                ? 'N8N Offline'
                : 'Checking N8N...'}
          </span>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 bg-surface-secondary/50 backdrop-blur-sm rounded-lg p-1 border border-border w-fit">
        <button
          onClick={() => setActiveSub('logsheet')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            activeSub === 'logsheet'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
          }`}
        >
          LOGSHEET
        </button>
        <button
          onClick={() => setActiveSub('register')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            activeSub === 'register'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80'
          }`}
        >
          REGISTER
        </button>
      </div>

      {/* Content */}
      {activeSub === 'logsheet' && (
        <>
        {responseText !== null ? (
          <div className="p-6 rounded-2xl border-2 bg-surface-secondary/40 border-border backdrop-blur-sm text-text-primary whitespace-pre-wrap">
            {responseText}
          </div>
        ) : showLoader ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="loader">
              <div className="circle c1"></div>
              <div className="circle c2"></div>
              <div className="circle c3"></div>
              <div className="circle c4"></div>
            </div>
          </div>
        ) : (
        <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Image 1 */}
              <div className="bg-surface-secondary/40 border border-border rounded-2xl p-4 backdrop-blur-sm">
                <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" /> 132 KV Image
                </label>
            <div
              className={`border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-text-secondary transition hover:border-primary/60 ${hasSent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => { if (!hasSent) onPick(input1Ref); }}
            >
              {img1Preview ? (
                <img src={img1Preview} alt="Preview 1" className="max-h-48 rounded-lg border border-border" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <div className="font-medium text-text-primary">Click to upload</div>
                    <div className="text-xs">PNG, JPG up to ~50MB</div>
                  </div>
                </>
              )}
              {/* Status shown below with the Send Both control */}
            </div>
            <input
              ref={input1Ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e, 1)}
            />
          </div>

          {/* Image 2 */}
          <div className="bg-surface-secondary/40 border border-border rounded-2xl p-4 backdrop-blur-sm">
            <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> 33 KV Image
            </label>
            <div
              className={`border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-text-secondary transition hover:border-primary/60 ${hasSent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => { if (!hasSent) onPick(input2Ref); }}
            >
              {img2Preview ? (
                <img src={img2Preview} alt="Preview 2" className="max-h-48 rounded-lg border border-border" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <div className="font-medium text-text-primary">Click to upload</div>
                    <div className="text-xs">PNG, JPG up to ~50MB</div>
                  </div>
                </>
              )}
              {/* Status shown below with the Send Both control */}
            </div>
            <input
              ref={input2Ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e, 2)}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={!img1File || !img2File || uploadingBoth || hasSent}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium border transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform ${
              !img1File || !img2File || uploadingBoth || hasSent
                ? 'bg-surface-secondary text-text-secondary border-border cursor-not-allowed'
                : 'bg-primary text-primary-foreground border-primary hover:opacity-90'
            } ${uploadingBoth ? 'animate-pulse' : ''}`}
          >
            {uploadingBoth ? 'Sending...' : 'Send Both'}
          </button>
          {!errorBoth && uploadingBoth && <div className="text-xs text-text-secondary">Uploading images...</div>}
        </div>
        </div>
        )}
        </>
      )}

      {activeSub === 'register' && (
        <div className="p-6 rounded-2xl border-2 bg-surface-secondary/40 border-border backdrop-blur-sm text-text-secondary">
          Register section is blank for now. We will add fields in future updates.
        </div>
      )}
    </div>
  );
};

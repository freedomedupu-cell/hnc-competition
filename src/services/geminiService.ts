/**
 * Full-Stack Client-Side Gemini Service
 * 
 * Provides unified, server-backed helper functions for text generation,
 * streaming generation, and real-time Live API voice/audio sessions.
 * All @google/genai SDK calls are strictly executed on the server.
 */

export interface GenerateContentOptions {
  model?: string;
  prompt?: string;
  contents?: any;
  config?: any;
}

export interface GenerateContentResult {
  success: boolean;
  text?: string;
  candidates?: any[];
  error?: string;
}

/**
 * Generate text or structured content via server-side Gemini API
 */
export async function generateContentWithServer(
  options: GenerateContentOptions
): Promise<GenerateContentResult> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Server error');
      return { success: false, error: errText };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Stream text generation via Server-Sent Events (SSE)
 */
export async function streamContentWithServer(
  options: GenerateContentOptions,
  onChunk: (chunkText: string) => void,
  onComplete?: (fullText: string) => void,
  onError?: (err: Error) => void
): Promise<() => void> {
  const controller = new AbortController();

  (async () => {
    let accumulatedText = '';
    try {
      const res = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Streaming failed with HTTP status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              accumulatedText += parsed.text;
              onChunk(parsed.text);
            }
          } catch {
            // ignore non-json ping/keepalive
          }
        }
      }

      onComplete?.(accumulatedText);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    }
  })();

  // Return cancel function
  return () => {
    controller.abort();
  };
}

export interface LiveMessagePayload {
  audio?: string;
  text?: string;
  interrupted?: boolean;
  error?: string;
}

/**
 * Connect to server-side Gemini Live API WebSocket session
 */
export function connectGeminiLiveSession(
  onMessage: (msg: LiveMessagePayload) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (err: any) => void
): {
  sendAudio: (base64Pcm16k: string) => void;
  sendText: (text: string) => void;
  sendVideoFrame: (base64Jpeg: string) => void;
  close: () => void;
} {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/live`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // Non-json message
    }
  };

  ws.onerror = (err) => {
    onError?.(err);
  };

  ws.onclose = () => {
    onClose?.();
  };

  return {
    sendAudio: (base64Pcm16k: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ audio: base64Pcm16k }));
      }
    },
    sendText: (text: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text }));
      }
    },
    sendVideoFrame: (base64Jpeg: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ video: base64Jpeg }));
      }
    },
    close: () => {
      ws.close();
    },
  };
}

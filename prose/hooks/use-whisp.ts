import { useCallback, useRef, useState } from "react";

type Segment = {
  start: string;
  end: string;
  text: string;
  completed: boolean;
};

export function useWhisp() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastTextRef = useRef("");

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ws = new WebSocket("ws://localhost:9090");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          uid: crypto.randomUUID(),
          language: null,
          task: "transcribe",
          model: "small",
          use_vad: true,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.segments) {
        const fullText = (data.segments as Segment[]).map((s) => s.text).join("");
        // Only emit the new portion
        if (fullText.length > lastTextRef.current.length) {
          const newText = fullText.slice(lastTextRef.current.length);
          lastTextRef.current = fullText;
          setText(newText);
        }
      }
    };

    ws.onerror = (e) => console.error("WebSocket error:", e);

    // Wait for WebSocket to be ready
    await new Promise<void>((resolve) => {
      const check = () => (ws.readyState === WebSocket.OPEN ? resolve() : setTimeout(check, 50));
      check();
    });

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    await audioCtx.audioWorklet.addModule("/audio-processor.js");
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = new AudioWorkletNode(audioCtx, "audio-processor");

    processor.port.onmessage = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(e.data.buffer);
      }
    };

    source.connect(processor);
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send("END_OF_AUDIO");
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    lastTextRef.current = "";
    setIsRecording(false);
  }, []);

  return { isRecording, text, start, stop };
}

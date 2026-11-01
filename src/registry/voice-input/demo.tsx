"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { VoiceInput, type VoiceError, type VoiceState } from "./voice-input";

const scenarios: Scenario[] = [
  { id: "dictate", label: "Dictate", hint: "Tap, talk, tap Done. The text lands in a box you can fix before sending.", script: [] },
  { id: "denied", label: "Mic blocked", hint: "A blocked microphone is explained, and typing is the main way forward. Retrying would change nothing.", script: [] },
  { id: "quiet", label: "Didn't catch it", hint: "Silence is not an error screen: say what happened and offer Try again or typing.", script: [] },
];

const SAID = "Book the house in Alfama for 8 people, 14 to 16 November, and send the agenda to the team.";
const BARS = 24;

export default function Demo() {
  const [id, setId] = useState("dictate");
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<VoiceError>("no-speech");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BARS }, () => 0.08));
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const heardNothing = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  // While listening, a small clock stands in for the microphone: levels move and seconds count up.
  useEffect(() => {
    if (state !== "listening") return;
    const bars = setInterval(() => setLevels((l) => [...l.slice(1), 0.15 + Math.random() * 0.8]), 90);
    const clock = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(bars);
      clearInterval(clock);
    };
  }, [state]);

  const reset = (n: string) => {
    clear();
    setState("idle");
    setSeconds(0);
    setText("");
    setNote(null);
    heardNothing.current = false;
    setLevels(Array.from({ length: BARS }, () => 0.08));
    setId(n);
  };

  const start = () => {
    clear();
    setNote(null);
    if (id === "denied") {
      setError("denied");
      setState("error");
      return;
    }
    setSeconds(0);
    setState("listening");
    // The quiet scenario hears nothing the first time, then works.
    if (id === "quiet" && !heardNothing.current) {
      heardNothing.current = true;
      timers.current.push(
        setTimeout(() => {
          setError("no-speech");
          setState("error");
        }, 3000),
      );
    }
  };

  const stop = () => {
    setState("transcribing");
    timers.current.push(
      setTimeout(() => {
        setText(SAID);
        setState("review");
      }, 1300),
    );
  };

  return (
    <DemoFrame scenarios={scenarios} scenarioId={id} onScenario={reset} onReplay={() => reset(id)}>
      <div className="space-y-3">
        <VoiceInput
          state={state}
          seconds={seconds}
          levels={levels}
          transcript={text}
          onTranscriptChange={setText}
          error={error}
          onStart={start}
          onStop={stop}
          onCancel={() => reset(id)}
          onSend={() => {
            setNote("Sent. In your app this is where the message goes to the agent.");
            setState("idle");
            setText("");
          }}
          onType={() => {
            setNote("Switched to typing. In your app this would focus the text box.");
            setState("idle");
          }}
        />
        {note && (
          <p role="status" className="text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </DemoFrame>
  );
}

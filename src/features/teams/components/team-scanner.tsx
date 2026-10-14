"use client";

import { useEffect, useRef, useState, useTransition, type SyntheticEvent } from "react";
import { Alert, FieldError, Form, Input, Label, TextField, toast } from "@heroui/react";
import { scanVisitorQrAction } from "@features/teams/lib/team-scanner-actions";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamScanResult } from "@features/teams/lib/types";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

function TeamScanAlert({ result }: Readonly<{ result: TeamScanResult }>) {
  const copy = TEAMS_COPY.scanner;

  if (result.status === "created") {
    return (
      <Alert status="success">
        <Alert.Content>
          <Alert.Title>{copy.alertSuccessTitle}</Alert.Title>
          <Alert.Description>{copy.alertSuccessDescription(result.gamertag)}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (result.status === "duplicate") {
    return (
      <Alert status="warning">
        <Alert.Content>
          <Alert.Title>{copy.alertDuplicateTitle}</Alert.Title>
          <Alert.Description>{copy.alertDuplicateDescription(result.gamertag)}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <Alert status="danger">
      <Alert.Content>
        <Alert.Title>{copy.alertUnknownTitle}</Alert.Title>
        <Alert.Description>{copy.alertUnknownDescription}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

export function TeamScanner() {
  const copy = TEAMS_COPY.scanner;
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [lastResult, setLastResult] = useState<TeamScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const processScan = (scannedText: string) => {
    const now = Date.now();

    if (now - lastScannedTimeRef.current < 2500) return;
    lastScannedTimeRef.current = now;

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    startTransition(async () => {
      setErrorMsg(null);
      const res = await scanVisitorQrAction(scannedText);

      if (res.ok) {
        setLastResult(res.data);
      } else {
        setErrorMsg(res.error);
        toast.danger(res.error);
        setLastResult(null);
      }
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch {
      const msg = copy.cameraError;
      setCameraError(msg);
      toast.danger(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isCameraActive || typeof window === "undefined" || !window.BarcodeDetector) return;

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let animationId: number;

    const scanFrame = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await detector.detect(videoRef.current);

          if (barcodes.length > 0 && barcodes[0]?.rawValue) {
            processScan(barcodes[0].rawValue);
          }
        } catch {
          // Continuar al siguiente fotograma
        }
      }

      animationId = requestAnimationFrame(scanFrame);
    };

    animationId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const handleManualSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!manualInput.trim()) return;

    processScan(manualInput.trim());
    setManualInput("");
  };

  return (
    <div className="flex flex-col gap-6">
      <PaperCard className="gap-5 p-[clamp(20px,3vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-wide text-xl font-bold tracking-[-.02em] uppercase">{copy.title}</h2>
            <p className="m-0 text-sm text-paper-foreground/80">{copy.subtitle}</p>
          </div>

          <ActionButton
            variant={isCameraActive ? "secondary" : "primary"}
            onPress={isCameraActive ? stopCamera : startCamera}
          >
            {isCameraActive ? copy.stopCamera : copy.startCamera}
          </ActionButton>
        </div>

        {cameraError ? (
          <Alert status="warning">
            <Alert.Content>
              <Alert.Description>{cameraError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <div
          className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black ${
            isCameraActive ? "block" : "hidden"
          }`}
        >
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary/80 size-48 rounded-2xl border-2 border-dashed" />
          </div>
        </div>

        {lastResult ? <TeamScanAlert result={lastResult} /> : null}

        {errorMsg ? (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Description>{errorMsg}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <Form onSubmit={handleManualSubmit} className="flex flex-col gap-3 pt-2">
          <Label className="text-sm font-semibold text-paper-foreground">{copy.manualInputLabel}</Label>
          <div className="flex flex-wrap gap-2">
            <TextField className="min-w-[260px] flex-1">
              <Input
                placeholder={copy.manualInputPlaceholder}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoCapitalize="none"
                spellCheck={false}
                className="text-base"
              />
              <FieldError />
            </TextField>
            <ActionButton type="submit" variant="secondary" isPending={isPending}>
              {copy.submitManual}
            </ActionButton>
          </div>
        </Form>
      </PaperCard>
    </div>
  );
}

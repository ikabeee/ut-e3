import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PaperCard } from "@shared/components/paper-card";
import { QrCode } from "@shared/components/qr-code";

interface VisitorQrCardProps {
  gamertag: string;
  qrUrl: string;
}

/** QR personal del visitante con la indicación de guardar una captura. */
export function VisitorQrCard({ gamertag, qrUrl }: Readonly<VisitorQrCardProps>) {
  const copy = VISITORS_COPY.qr;

  return (
    <PaperCard className="gap-4 p-[clamp(18px,2.6vw,28px)]">
      <div className="flex flex-col gap-1">
        <span className="type-tiny">{copy.kicker}</span>
        <h2 className="font-wide text-[clamp(22px,2.4vw,30px)] leading-[.95] font-bold tracking-[-.03em] break-all uppercase">
          {gamertag}
        </h2>
      </div>
      <QrCode value={qrUrl} label={copy.label(gamertag)} className="mx-auto max-w-[320px]" />
      <p className="m-0 text-[15px] leading-[1.35]">
        {copy.instructions} <b>{copy.screenshotTip}</b>
        {copy.screenshotReason}
      </p>
    </PaperCard>
  );
}

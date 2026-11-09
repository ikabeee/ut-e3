import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { RejectedVisitNotice } from "@features/stands/lib/types";

interface RejectedVisitNoticesProps {
  notices: RejectedVisitNotice[];
}

const COPY = STANDS_COPY.rejectedNotice;

/** In the passport: each visit of the offline queue of a kiosk that the server refused, with the reason (RF-24). */
export function RejectedVisitNotices({ notices }: Readonly<RejectedVisitNoticesProps>) {
  if (notices.length === 0) return null;

  return (
    <div className="grid w-full max-w-md gap-3">
      {notices.map((notice) => (
        <div key={notice.id} role="alert" className="grid gap-2 border border-danger p-4">
          <p className="m-0 font-semibold text-danger">{COPY.heading(notice.standCode)}</p>
          <p className="m-0 text-sm">{COPY.late}</p>
          <p className="m-0 text-sm text-muted">{COPY.help}</p>
        </div>
      ))}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Modal } from "@heroui/react";
import { GAMES_COPY } from "@features/games/lib/games-copy";

interface GameDetailModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Always open: the route decides when it shows, so closing only reports back to the caller.
export function GameDetailModal({ title, onClose, children }: Readonly<GameDetailModalProps>) {
  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(isOpen) => isOpen || onClose()}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="rounded-none border-2 border-border">
            <Modal.CloseTrigger aria-label={GAMES_COPY.detail.close} className="touch-target" />
            <Modal.Header>
              <Modal.Heading className="type-section">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

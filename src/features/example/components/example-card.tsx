import { Card } from "@heroui/react";
import type { ExampleMessage } from "@features/example/lib/types";

interface ExampleCardProps {
  message: ExampleMessage;
}

export function ExampleCard({ message }: Readonly<ExampleCardProps>) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{message.title}</Card.Title>
        <Card.Description>{message.description}</Card.Description>
      </Card.Header>
    </Card>
  );
}

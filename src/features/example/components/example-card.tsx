import { Card } from "@heroui/react";
import { ExampleToggle } from "@features/example/components/example-toggle";
import type { ExampleMessage } from "@features/example/lib/types";

export function ExampleCard({ message }: { message: ExampleMessage }) {
  return (
    <Card className="max-w-md">
      <Card.Header>
        <Card.Title>{message.title}</Card.Title>
        <Card.Description>{message.description}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <ExampleToggle />
      </Card.Footer>
    </Card>
  );
}

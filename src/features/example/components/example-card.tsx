import type { ExampleMessage } from "../lib/types";
import { ExampleToggle } from "./example-toggle";

export function ExampleCard({ message }: { message: ExampleMessage }) {
  return (
    <article className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{message.title}</h1>
      <p>{message.description}</p>
      <ExampleToggle />
    </article>
  );
}

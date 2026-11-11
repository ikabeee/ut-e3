import { useMutation } from "@tanstack/react-query";

async function writeToClipboard(text: string) {
  if (!navigator.clipboard) {
    throw new Error("El portapapeles no está disponible.");
  }
  await navigator.clipboard.writeText(text);
}

/**
 * Copia texto al portapapeles como una mutación de TanStack Query: expone el estado
 * (`isPending`, `isSuccess`, `isError`) para cambiar la etiqueta del botón.
 */
export function useCopyToClipboard() {
  const mutation = useMutation({ mutationKey: ["event", "copy-address"], mutationFn: writeToClipboard });

  return {
    copy: mutation.mutate,
    isCopied: mutation.isSuccess,
    hasFailed: mutation.isError,
    isPending: mutation.isPending,
  };
}

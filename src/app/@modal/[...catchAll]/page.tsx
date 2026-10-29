// A soft navigation to a route the slot does not match keeps the open modal visible; matching every other route with
// null closes it (parallel-routes.md, "Closing the modal").
export default function ModalCatchAll() {
  return null;
}

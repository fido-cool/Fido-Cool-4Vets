import { AddClientDialog } from "../AddClientDialog";

export default function AddClientDialogExample() {
  return (
    <div className="p-8 bg-background">
      <AddClientDialog onAdd={(client) => console.log("Client added:", client)} />
    </div>
  );
}

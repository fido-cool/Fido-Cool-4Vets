import { AddEventDialog } from "../AddEventDialog";

export default function AddEventDialogExample() {
  return (
    <div className="p-8 bg-background">
      <AddEventDialog onAdd={(event) => console.log("Event added:", event)} />
    </div>
  );
}

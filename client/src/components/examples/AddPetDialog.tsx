import { AddPetDialog } from "../AddPetDialog";

export default function AddPetDialogExample() {
  return (
    <div className="p-8 bg-background">
      <AddPetDialog onAdd={(pet) => console.log("Pet added:", pet)} />
    </div>
  );
}

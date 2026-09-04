import { redirect } from "next/navigation";

// Walk-ins are now created from the Schedule board — tap any open slot.
export default function WalkinPage() {
  redirect("/dashboard/schedule");
}

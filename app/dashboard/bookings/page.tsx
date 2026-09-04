import { redirect } from "next/navigation";

// Bookings + Schedule are merged into the Schedule board (with a searchable List view).
export default function BookingsPage() {
  redirect("/dashboard/schedule");
}

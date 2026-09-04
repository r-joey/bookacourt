export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { seedOwner } = await import("./lib/seed-owner");
  await seedOwner();
}

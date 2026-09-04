import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("platform_settings").select("*").maybeSingle();
  return <SettingsForm settings={settings} />;
}

import { EntityPage } from "@/components/entity-page";
import { modules } from "@/lib/modules";

export default function Page() {
  return <EntityPage config={modules.staff} />;
}

import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import PhoneCompletionModal from "@/components/auth/PhoneCompletionModal";

function safeNext(value?: string) {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LengkapiTeleponPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const destination = safeNext(params.next);
  const { user } = await validateRequest();

  if (!user) {
    redirect(`/auth/masuk?next=${encodeURIComponent(destination)}`);
  }

  const role = String(user.role || "member").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  if (isAdmin || String(user.phone || "").trim()) redirect(destination);

  return (
    <div className="min-h-screen bg-[#FFF7E8]">
      <PhoneCompletionModal
        open
        redirectTo={destination}
        userName={user.name || "Member"}
      />
    </div>
  );
}

import { userRepository } from "@/lib/repositories/UserRepository";
import { CreatorCard } from "@/components/CreatorCard";

export default async function CriadoresPage() {
  const creators = await userRepository.findCreators();
  const visible = creators.filter(
    (c) =>
      c.creatorProfile?.verificationStatus === "verified" ||
      c.creatorProfile?.verificationStatus === "pending" ||
      c.creatorProfile?.verificationStatus === "unverified",
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Criadores</h1>
        <p className="text-sm text-(--color-text-muted)">
          Publique seu conteúdo e defina o preço.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((c) => (
          <CreatorCard key={c.id} creator={c} />
        ))}
      </div>
    </div>
  );
}

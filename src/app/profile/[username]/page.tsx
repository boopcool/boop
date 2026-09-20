import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TestCard } from "@/components/test/TestCard";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar, DemoBadge, EmptyState } from "@/components/ui/Primitives";
import { getProfileByUsername, getViewer, listPublicTestsBy } from "@/lib/data/read";

export const dynamic = "force-dynamic";

type Params = Promise<{ username: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found" };

  return {
    title: profile.displayName,
    description: profile.bio ?? `Tests run by ${profile.displayName} on Boop.`,
    alternates: { canonical: `/profile/${profile.username}` },
  };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [tests, viewer] = await Promise.all([
    listPublicTestsBy(profile.id),
    getViewer(),
  ]);

  const isSelf = viewer.profile?.id === profile.id;
  const responses = tests.reduce((sum, t) => sum + t.voteCount, 0);

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-10 sm:px-8 sm:py-16">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <Avatar seed={profile.avatarSeed} name={profile.displayName} size={64} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-medium tracking-[-0.03em]">
                {profile.displayName}
              </h1>
              {profile.isDemo && <DemoBadge />}
            </div>
            <p className="text-[14px] text-muted">@{profile.username}</p>
            {profile.bio && (
              <p className="user-text mt-3 max-w-md text-[15px] leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {isSelf && (
          <ButtonLink href="/dashboard" variant="secondary" size="sm">
            Your dashboard
          </ButtonLink>
        )}
      </header>

      <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-5">
        <Stat label="Tests run" value={tests.length.toLocaleString()} />
        <Stat label="Responses collected" value={responses.toLocaleString()} />
        <Stat label="Boops given" value={profile.boopsGiven.toLocaleString()} />
        <Stat
          label="Joined"
          value={new Date(profile.createdAt).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })}
        />
      </dl>

      <section className="mt-12">
        <h2 className="eyebrow">Public tests</h2>
        <div className="mt-6">
          {tests.length === 0 ? (
            <EmptyState
              title="Nothing public yet"
              body={
                isSelf
                  ? "Tests you run publicly show up here. Unlisted and private ones stay out of sight."
                  : `${profile.displayName} hasn't published a test yet.`
              }
              action={isSelf ? <ButtonLink href="/new">Run a test</ButtonLink> : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 text-[22px] font-medium tabular-nums tracking-[-0.025em]">
        {value}
      </dd>
    </div>
  );
}

export default function ResultsLoading() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
      <div className="skeleton h-3 w-28 rounded-full" />
      <div className="skeleton mt-6 h-4 w-[min(420px,80%)] rounded-full" />
      <div className="skeleton mt-4 h-14 w-[min(360px,70%)] rounded-lg" />
      <div className="skeleton mt-6 h-1 w-full rounded-full" />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
        <div className="space-y-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="skeleton aspect-[16/11] rounded-xl" />
            <div className="skeleton aspect-[16/11] rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading results
      </span>
    </div>
  );
}

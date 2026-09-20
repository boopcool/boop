export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
      <div className="skeleton h-3 w-20 rounded-full" />
      <div className="skeleton mt-4 h-10 w-64 rounded-lg" />

      <div className="mt-8 flex gap-2 border-b border-line pb-4">
        {[72, 88, 104, 80, 92].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_248px] lg:gap-12">
        <div className="order-2 lg:order-1">
          <div className="skeleton h-8 w-[min(520px,90%)] rounded-lg" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="skeleton aspect-[16/11] rounded-xl" />
            <div className="skeleton aspect-[16/11] rounded-xl" />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="skeleton h-24 rounded-xl lg:h-72" />
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading the feed
      </span>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16">
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton mt-6 h-11 w-[min(420px,80%)] rounded-lg" />
      <div className="skeleton mt-3 h-4 w-[min(560px,90%)] rounded-full" />

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="skeleton aspect-[16/10] rounded-xl" />
        <div className="skeleton aspect-[16/10] rounded-xl" />
      </div>

      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}

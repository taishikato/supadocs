import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
      <h1 className="text-4xl font-semibold">Hey, welcome to Supadocs!</h1>
      <div className="mt-6 text-lg text-zinc-400 sm:text-xl">
        <ul className="list-disc list-inside space-y-1">
          <li>
            To enable AI Chat, check{" "}
            <Link
              className="font-semibold text-white underline"
              href="https://github.com/taishikato/supadocs-starter-template/blob/main/README.md#usage"
              rel="noreferrer"
              target="_blank"
            >
              README.md
            </Link>{" "}
            for the setup guide - it's supa easy!
          </li>
          <li>
            Open{" "}
            <Link className="font-semibold text-white underline" href="/docs">
              /docs
            </Link>{" "}
            to see the documentation.
          </li>
        </ul>
      </div>
    </main>
  );
}

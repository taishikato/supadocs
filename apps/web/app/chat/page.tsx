import Link from "next/link";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function ChatPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← トップに戻る
        </Link>
        <h1 className="text-3xl font-bold">ドキュメントチャット</h1>
        <p className="text-muted-foreground">
          Supabase
          の埋め込み検索を利用して、関連するドキュメントを引用しながら回答します。
        </p>
      </header>

      <section className="flex flex-1 flex-col gap-6">
        <ChatPanel />
      </section>
    </main>
  );
}

import { ChatPanel } from "@/components/chat-panel";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <Dashboard />
      <aside className="lg:sticky lg:top-8 lg:self-start lg:border-l lg:border-border lg:pl-8">
        <ChatPanel />
      </aside>
    </div>
  );
}

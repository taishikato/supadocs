import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatModal } from "@/components/chat-modal";
import { Button } from "@workspace/ui/components/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative flex h-full flex-col px-4 pt-4 sm:px-6 lg:px-8">
          <SidebarTrigger />
          {children}
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <ChatModal
            initialChatModel="gpt-4o-mini-2024-07-18"
            trigger={
              <Button size="lg" className="shadow-lg">
                Ask AI
              </Button>
            }
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

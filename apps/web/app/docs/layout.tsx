import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatModal } from "@/components/chat-modal";
import { ArrowUpIcon } from "@/components/icons";
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
      </SidebarInset>
      <div className="fixed bottom-6 flex justify-center w-full">
        <ChatModal
          initialChatModel="gpt-4o-mini-2024-07-18"
          trigger={
            <Button
              size="lg"
              variant="ghost"
              className="group h-auto rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground shadow-lg"
            >
              <span className="px-2">Ask AI</span>
              <span className="ml-4 flex size-6 items-center justify-center rounded-full bg-muted-foreground text-muted">
                <ArrowUpIcon size={14} />
              </span>
            </Button>
          }
        />
      </div>
    </SidebarProvider>
  );
}

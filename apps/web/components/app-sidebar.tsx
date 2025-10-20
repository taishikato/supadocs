"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

const docLinks = [
  { title: "Docs Introduction", href: "/docs" },
  { title: "Supadocs Overview", href: "/docs/supadocs-overview" },
  { title: "Getting Started", href: "/docs/getting-started" },
  { title: "Chat Pipeline", href: "/docs/chat" },
  { title: "Reindex Architecture", href: "/docs/reindex-architecture" },
  { title: "Agent Runtime Preview", href: "/docs/agent-runtime-preview" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props} className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link className="flex flex-row items-center gap-3" href="/">
                <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                  Supadocs
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Docs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {docLinks.map((doc) => {
                const isActive =
                  pathname === doc.href ||
                  (doc.href !== "/docs" && pathname.startsWith(`${doc.href}/`));

                return (
                  <SidebarMenuItem key={doc.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={doc.href}>{doc.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

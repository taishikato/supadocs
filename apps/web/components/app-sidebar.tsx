"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
} from "@workspace/ui/components/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div>
            <Link className="flex flex-row items-center gap-3" href="/">
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Supadocs
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
}

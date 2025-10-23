"use client";

import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b h-14 flex items-center">
      <nav
        aria-label="Global"
        className="mx-auto flex items-center justify-between px-5 container"
      >
        <div className="flex items-center gap-x-12">
          <Link href="/" className="font-semibold">
            Supadocs starter pack
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="hidden lg:flex">
          <ModeToggle />
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background/80 backdrop-blur-sm px-5 pt-4 pb-5 sm:max-w-sm sm:ring-1 sm:ring-border">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 font-semibold">
              Supadocs starter pack
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-border">
              <div className="py-6">
                <ModeToggle />
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}

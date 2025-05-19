"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Dock, { DockItemData } from "@/shared/ui/Dock/Dock";
import { FaHome } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { FaClock } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";
import LanguageToggle from "@/shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";

type Props = { children: ReactNode };

export default function App({ children }: Props) {
  const router = useRouter();
  const items: DockItemData[] = [
    { icon: <FaHome />, label: "Home", onClick: () => router.push("/") },
    { icon: <FaUser />, label: "Accounts", onClick: () => router.push("/accounts") },
    { icon: <FaClock />, label: "History", onClick: () => router.push("/history") },
    { icon: <MdDescription />, label: "About me", onClick: () => router.push("/about") },
  ];

  return (
    <>
      <header className="fixed top-0 right-0 p-10 z-40">
        <LanguageToggle onChange={() => {}} />
      </header>

      <main className="flex-1 flex flex-col justify-center items-center">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40">
        <Dock
          items={items}
          panelHeight={70}
          baseItemSize={50}
          magnification={60}
        />
      </footer>
    </>
  );
}

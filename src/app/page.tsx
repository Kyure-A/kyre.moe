"use client";

import Accounts from "@/pages/Accounts/ui/Accounts";
import Home from "@/pages/Home/ui/Home";
import AboutMe from "@/pages/AboutMe/ui/AboutMe";

import Dock, { DockItemData } from "@/shared/ui/Dock/Dock";
import { FaHome } from "react-icons/fa";
import { FaClock, FaUser } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";
import LanguageToggle from "../shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";
import History from "@/pages/History/ui/History";
import { useState } from "react";

export default function Main() {
  const [currentPage, setCurrentPage] = useState("Home");
  const items: DockItemData[] = [
    { icon: <FaHome />, label: "Home", onClick: () => setCurrentPage("Home") },
    {
      icon: <FaUser />,
      label: "Accounts",
      onClick: () => setCurrentPage("Accounts"),
    },
    {
      icon: <FaClock />,
      label: "History",
      onClick: () => setCurrentPage("Timeline"),
    },
    {
      icon: <MdDescription />,
      label: "About me",
      onClick: () => setCurrentPage("About"),
    },
    /* { icon: <FaMessage />, label: "Posts", onClick: () => setCurrentPage("Posts") } */
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed items-center top-0 right-0 p-10 z-40">
        <LanguageToggle onChange={() => {}} />
      </header>
      <main className="flex-1 flex flex-col justify-center items-center">
        {currentPage === "Home" && <Home />}
        {currentPage === "Accounts" && <Accounts />}
        {currentPage === "Timeline" && <History />}
        {currentPage === "About" && <AboutMe />}
      </main>
      <footer className="items-center fixed bottom-0 left-0 right-0 z-40">
        <Dock
          items={items}
          panelHeight={70}
          baseItemSize={50}
          magnification={60}
        />
      </footer>
    </div>
  );
}

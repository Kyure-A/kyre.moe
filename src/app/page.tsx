"use client";

import Accounts from "@/pages/Accounts/ui/Accounts";
import Home from "@/pages/Home/ui/Home";

import Dock, { DockItemData } from "@/shared/ui/Dock/Dock";
import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { FaClock, FaMessage, FaUser } from "react-icons/fa6";
import { MdOutlineDescription } from "react-icons/md";

export default function Main() {
    const [currentPage, setCurrentPage] = useState("Home");

    const items: DockItemData[] = [
        { icon: <FaUser/>, label: "Accounts", onClick: () => setCurrentPage("Accounts")},
        { icon: <FaClock />, label: "History", onClick: () => setCurrentPage("Timeline")},
        { icon: <FaHome/>, label: "Home", onClick: () => setCurrentPage("Home")},
        { icon: <MdOutlineDescription/>, label: "About me", onClick: () => setCurrentPage("About")},
        { icon: <FaMessage />, label: "Posts", onClick: () => setCurrentPage("Posts") }
    ]
    
    return (
        <div className="flex flex-col min-h-screen">
          <main className="items-center">
            {currentPage === "Home" && <Home />}
            {currentPage === "Accounts" && <Accounts /> }
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

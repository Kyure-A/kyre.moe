"use client";

import Dock, { DockItemData } from "@/blocks/Components/Dock/Dock";
import Accounts from "@/pages/accounts";
import Home from "@/pages/home";
import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { MdOutlineDescription } from "react-icons/md";

export default function Main() {
    const [currentPage, setCurrentPage] = useState("Home");

    const items: DockItemData[] = [
        { icon: <FaHome/>, label: "Home", onClick: () => setCurrentPage("Home")},
        { icon: <FaUser/>, label: "Accounts", onClick: () => setCurrentPage("Accounts")},
        { icon: <MdOutlineDescription/>, label: "About me", onClick: () => setCurrentPage("About")}
    ]
    
    return (
        <div className="flex flex-col min-h-screen">
          <main className="items-center">
            {currentPage === "Home" && <Home />}
            {currentPage === "Accounts" && <Accounts /> }
          </main>
          <footer className="items-center fixed bottom-0 left-0 right-0">
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

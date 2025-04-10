"use client";

import Accounts from "@/pages/Accounts/ui/Accounts";
import Home from "@/pages/Home/ui/Home";

import Dock, { DockItemData } from "@/shared/ui/Dock/Dock";
import { FaHome } from "react-icons/fa";
import { FaClock, FaUser } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";
import LanguageToggle from "../shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";
import History from "@/pages/History/History";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ReactNode } from "react";

type AppLayoutProps = {
    children: ReactNode;
}

const NavigationDock = () => {
    const navigate = useNavigate();
    
    const items: DockItemData[] = [
        { icon: <FaHome/>, label: "Home", onClick: () => navigate("/")},
        { icon: <FaUser/>, label: "Accounts", onClick: () => navigate("/accounts")},
        { icon: <FaClock />, label: "History", onClick: () => navigate("/history")},
        { icon: <MdDescription/>, label: "About", onClick: () => navigate("/about")},
    ];
    
    return (
        <footer className="items-center fixed bottom-0 left-0 right-0 z-40">
          <Dock
              items={items}
              panelHeight={70}
              baseItemSize={50}
              magnification={60}
          />
        </footer>
    );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
          <header className="fixed items-center top-0 right-0 p-10 z-40">
            <LanguageToggle onChange={() => {}}/>
          </header>
          <main className="flex-1 flex flex-col justify-center items-center">
            {children}
          </main>
          <NavigationDock />
        </div>
    );
};

export default function Main() {
    return (
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </AppLayout>
        </Router>
    );
}

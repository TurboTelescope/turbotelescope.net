"use client";

import { AlignJustifyIcon, Telescope } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";

import { ModeToggle } from "@/components/ThemeToggle";

const Header: React.FC = () => {
    // State to track dropdown visibility
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Toggle dropdown visibility
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const { theme } = useTheme();

    return (
        <div
            style={{
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: theme == "light" ? "#f2f2f2" : "#151515",
            }}
        >
            <h1>
                <ModeToggle />
            </h1>

            {/* Dropdown button */}
            <div style={{ position: "relative" }}>
                <button onClick={toggleDropdown} style={{ padding: "8px 16px", fontSize: "16px", cursor: "pointer" }}>
                    <AlignJustifyIcon />
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "8px",
                            backgroundColor: "#fff",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            borderRadius: "4px",
                            zIndex: 1000,
                            minWidth: "150px",
                        }}
                    >
                        <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
                            <li>
                                <Link
                                    href="/IHW"
                                    style={{
                                        display: "block",
                                        padding: "8px 16px",
                                        textDecoration: "none",
                                        color: "#333",
                                    }}
                                >
                                    Image Health Website
                                </Link>
                            </li>
                            {/* <li>
                                <Link
                                    href="/logs"
                                    style={{
                                        display: "block",
                                        padding: "8px 16px",
                                        textDecoration: "none",
                                        color: "#333",
                                    }}
                                >
                                    Logs
                                </Link>
                            </li> */}
                            {/* <li>
                                <Link
                                    href="/images"
                                    style={{
                                        display: "block",
                                        padding: "8px 16px",
                                        textDecoration: "none",
                                        color: "#333",
                                    }}
                                >
                                    Images
                                </Link>
                            </li> */}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Home() {
    return (
        <>
            <Header />
            <main style={{ padding: "16px", textAlign: "center", alignContent: "center" }}>
                <h2>Welcome to the Home Page</h2>
                <h2>Links are in the top right</h2>
                <Telescope size="large" />
            </main>
        </>
    );
}

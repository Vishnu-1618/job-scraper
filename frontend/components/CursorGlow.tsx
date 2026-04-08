"use client";

import { useEffect, useState } from "react";

export default function CursorGlow() {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 pointer-events-none hidden sm:block"
            style={{
                background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.07), transparent 40%)`,
            }}
        />
    );
}

//app/dashboard/layout.tsx
"use client"

import { useState,useEffect  } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const originalError = console.error;
    const newError = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Created TensorFlow Lite XNNPACK delegate for CPU')) {

        return;
      }
      originalError(...args);
    };

    console.error = newError;

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
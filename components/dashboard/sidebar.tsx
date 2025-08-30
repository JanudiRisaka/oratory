//dashboard/components/sidebar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Camera,
  Video,
  TrendingUp,
  History,
  MessageSquare,
  Archive,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Mic,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { name: "Practice", href: "/dashboard", icon: Camera },
  { name: "Upload", href: "/dashboard/upload", icon: Video },
  { name: "Progress", href: "/dashboard/progress", icon: TrendingUp },
  { name: "Progress History", href: "/dashboard/progress-history", icon: History },
  { name: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { name: "Feedback History", href: "/dashboard/feedback-history", icon: Archive },
  { name: "Resources", href: "/dashboard/resources", icon: BookOpen },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Security", href: "/dashboard/security", icon: Shield },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">Oratory</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-9 h-9 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-800"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md"
                  : "text-brand-600 hover:text-brand-700 hover:bg-brand-100 dark:text-brand-300 dark:hover:text-brand-200 dark:hover:bg-brand-800"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          {!isCollapsed && <span className="text-sm text-brand-600 dark:text-brand-300">Theme</span>}
          <ThemeToggle />
        </div>
        <Link href="/auth/login">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-brand-600 hover:text-brand-700 hover:bg-brand-100 dark:text-brand-300 dark:hover:text-brand-200 dark:hover:bg-brand-800",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </Link>
      </div>
    </div>
  )
}
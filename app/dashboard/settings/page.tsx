"use client"

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase/firebaseConfig";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getUserSettings, updateUserSettings, defaultSettings, type UserSettings } from "@/lib/firebase/services/settingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Zap, Monitor } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const SettingsSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-5 w-72" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card><CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent className="space-y-6"><Skeleton className="h-10 w-full" /></CardContent></Card>
    </div>
  </div>
);

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [initialSettings, setInitialSettings] = useState<UserSettings>(defaultSettings);
  const [initialTheme, setInitialTheme] = useState("system");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        setIsLoading(true);
        try {
          const userSettings = await getUserSettings(user.uid);
          setSettings(userSettings);
          setInitialSettings(userSettings);
          if (theme) setInitialTheme(theme);
        } catch (error) {
          toast.error("Failed to load settings.");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [user, theme]);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings) || theme !== initialTheme;

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings((prev: UserSettings) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserSettings(user.uid, settings);
      setInitialSettings(settings);
      if (theme) setInitialTheme(theme);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(initialSettings);
    setTheme(initialTheme);
  };

  if (!mounted || isLoading) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return <div className="text-center p-8">Please log in to manage your settings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Customize your Oratory experience</p>
        </div>
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Feedback Settings */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Zap className="w-5 h-5" /><span>AI Feedback</span></CardTitle>
            <CardDescription>Adjust how the AI coach provides feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Feedback Sensitivity</Label>
              <Select
                value={settings.aiSensitivity}
                onValueChange={(value: "low" | "medium" | "high") => updateSetting('aiSensitivity', value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Gentle (Fewer tips, for beginners)</SelectItem>
                  <SelectItem value="medium">Balanced (Recommended)</SelectItem>
                  <SelectItem value="high">Intensive (More frequent tips, for experts)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This will adjust the thresholds for when the live AI coach gives you a tip.
              </p>
            </div>
          </CardContent>
        </Card> */}

        {/* General App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Settings className="w-5 h-5" /><span>General</span></CardTitle>
            <CardDescription>Basic application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Appearance</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
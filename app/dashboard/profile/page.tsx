"use client"

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getUserProfile, updateUserProfile, createDefaultProfile, type Profile } from "@/lib/firebase/services/userService";
import { fetchFeedbackHistory } from "@/lib/firebase/services/sessionService";
import type { FeedbackHistoryItem } from "@/features/facial-analysis/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Briefcase, MapPin, Calendar, Edit, Save, X, Camera, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface SpeakingStats {
  label: string;
  value: string;
}

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><Skeleton className="h-9 w-32" /><Skeleton className="h-4 w-72 mt-2" /></div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2"><Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader><CardContent className="space-y-6"><div className="flex items-center space-x-4"><Skeleton className="w-20 h-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-32" /></div></div><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div></CardContent></Card></div>
      <div className="space-y-6"><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card></div>
    </div>
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [speakingStats, setSpeakingStats] = useState<SpeakingStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [profileData, historyData] = await Promise.all([
            getUserProfile(user.uid),
            fetchFeedbackHistory()
          ]);

          let currentProfile = profileData;
          if (!currentProfile) {
            toast.info("Welcome! Let's set up your profile.");
            currentProfile = await createDefaultProfile(user);
          }
          setProfile(currentProfile);
          setEditedProfile(currentProfile);

          calculateAndSetStats(historyData);

        } catch (error) {
          toast.error("Failed to load your data. Please refresh the page.");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const calculateAndSetStats = (history: FeedbackHistoryItem[]) => {
    if (history.length === 0) {
      setSpeakingStats([
        { label: "Total Sessions", value: "0" },
        { label: "Practice Hours", value: "0h 0m" },
        { label: "Average Score", value: "N/A" },
        { label: "Best Score", value: "N/A" }
      ]);
      return;
    }

    const totalSessions = history.length;
    const totalDurationMinutes = history.reduce((sum, session) => {
        const parts = session.duration.split(':').map(Number);
        return sum + (parts[0] || 0) + (parts[1] || 0) / 60;
    }, 0);
    const totalHours = Math.floor(totalDurationMinutes / 60);
    const remainingMinutes = Math.round(totalDurationMinutes % 60);

    const averageScore = Math.round(history.reduce((sum, session) => sum + session.overallScore, 0) / totalSessions);
    const bestScore = Math.max(...history.map(session => session.overallScore));

    setSpeakingStats([
      { label: "Total Sessions", value: totalSessions.toString() },
      { label: "Practice Hours", value: `${totalHours}h ${remainingMinutes}m` },
      { label: "Average Score", value: `${averageScore}%` },
      { label: "Best Score", value: `${bestScore}%` }
    ]);
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditedProfile(prev => prev ? { ...prev, [id]: value } : null);
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return <div className="text-center p-8 text-muted-foreground">Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your information and view your speaking journey</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20"><AvatarImage src={profile.avatar} alt={profile.name} /><AvatarFallback>{(profile.name || 'N A').split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField id="name" label="Full Name" value={profile.name} editedValue={editedProfile?.name} Icon={User} isEditing={isEditing} onChange={handleInputChange} />
                <InfoField id="email" label="Email Address" value={profile.email} editedValue={editedProfile?.email} Icon={Mail} isEditing={isEditing} onChange={handleInputChange} type="email" />
                <InfoField id="title" label="Job Title" value={profile.title} editedValue={editedProfile?.title} Icon={Briefcase} isEditing={isEditing} onChange={handleInputChange} />
                <InfoField id="company" label="Company" value={profile.company} editedValue={editedProfile?.company} Icon={Briefcase} isEditing={isEditing} onChange={handleInputChange} />
                <div className="md:col-span-2"><InfoField id="location" label="Location" value={profile.location} editedValue={editedProfile?.location} Icon={MapPin} isEditing={isEditing} onChange={handleInputChange} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? <Textarea id="bio" value={editedProfile?.bio || ''} onChange={handleInputChange} rows={3} /> : <p className="text-muted-foreground p-2 min-h-[60px]">{profile.bio || "No bio provided."}</p>}
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Speaking Stats</CardTitle>
              <CardDescription>Your progress at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {speakingStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{stat.label}</span>
                  <span className="text-lg font-bold text-primary">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member since</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoField({ id, label, value, editedValue, Icon, isEditing, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {isEditing ? (
        <Input id={id} type={type} value={editedValue || ''} onChange={onChange} />
      ) : (
        <div className="flex items-center space-x-2 p-2 min-h-[40px]">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{value || "Not set"}</span>
        </div>
      )}
    </div>
  );
}
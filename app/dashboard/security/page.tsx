"use client"

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, Trash2, History } from "lucide-react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { writeSecurityAudit, fetchSecurityAudits, type SecurityAuditEvent } from "@/lib/firebase/services/securityService";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Your current password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    case "auth/weak-password":
      return "New password is too weak. Try a longer, more complex password.";
    case "auth/requires-recent-login":
      return "For security, please sign out and sign in again before retrying.";
    default:
      return "An unknown error occurred. Please try again.";
  }
}

const meetsPolicy = (pwd: string) => pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);

export default function SecurityPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPasswordProvider, setHasPasswordProvider] = useState<boolean | null>(null);
  const [loginHistory, setLoginHistory] = useState<SecurityAuditEvent[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const hasPwd = user.providerData.some((p) => p.providerId === "password");
      setHasPasswordProvider(hasPwd);
      fetchSecurityAudits(user.uid).then(setLoginHistory);
    }
  }, []);

  const canSubmitPassword = useMemo(() =>
    !!passwords.current && !!passwords.new && passwords.new === passwords.confirm && meetsPolicy(passwords.new) && !isUpdating,
    [passwords, isUpdating]
  );

  const handlePasswordChange = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("Not signed in properly. Please sign in again.");
      return;
    }
    if (!canSubmitPassword) return;

    setIsUpdating(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwords.new);
      await writeSecurityAudit(user.uid, "password_changed");

      toast.success("Password Updated Successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
      fetchSecurityAudits(user.uid).then(setLoginHistory);
    } catch (err: any) {
      toast.error("Update Failed", { description: mapAuthError(err.code) });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("Not signed in properly. Please sign in again.");
      return;
    }
    setIsDeleting(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, cred);
      await deleteUser(user);

      toast.success("Account deleted successfully. We're sorry to see you go.");
      router.push("/");
    } catch (err: any) {
      toast.error("Deletion Failed", { description: mapAuthError(err.code) });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">Manage your account security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Lock className="w-5 h-5" /><span>Password</span></CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasPasswordProvider ? (
              <div className="flex items-start gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                <p className="text-muted-foreground">This account uses a social login (like Google). You cannot change the password here.</p>
              </div>
            ) : (
              <>
                <PasswordInput
                  id="current-password"
                  label="Current Password"
                  show={showCurrentPassword}
                  setShow={setShowCurrentPassword}
                  value={passwords.current}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, current: e.target.value })}
                />

                <PasswordInput
                  id="new-password"
                  label="New Password"
                  show={showNewPassword}
                  setShow={setShowNewPassword}
                  value={passwords.new}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, new: e.target.value })}
                />
                {passwords.new && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {[{ ok: passwords.new.length >= 8, text: "At least 8 characters" }, { ok: /[A-Z]/.test(passwords.new), text: "At least one uppercase letter" }, { ok: /[a-z]/.test(passwords.new), text: "At least one lowercase letter" }, { ok: /\d/.test(passwords.new), text: "At least one number" }].map((r, idx) => (
                      <li key={idx} className={`flex items-center gap-2 ${r.ok ? "text-foreground" : ""}`}><CheckCircle2 className={`h-3.5 w-3.5 ${r.ok ? "text-green-600" : "text-muted-foreground"}`} />{r.text}</li>
                    ))}
                  </ul>
                )}
                 <PasswordInput
                    id="confirm-password"
                    label="Confirm New Password"
                    show={showNewPassword}
                    setShow={setShowNewPassword}
                    value={passwords.confirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />

                  {passwords.confirm && passwords.new !== passwords.confirm && <p className="text-xs text-destructive">Passwords do not match.</p>}

                <Button onClick={handlePasswordChange} className="w-full" disabled={!canSubmitPassword}>
                  {isUpdating ? "Updating..." : "Update Password"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Login Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><History className="w-5 h-5" /><span>Recent Activity</span></CardTitle>
            <CardDescription>A log of recent security-related events on your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loginHistory.length > 0 ? loginHistory.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <p className="font-medium capitalize">{log.event.replace(/_/g, ' ')}</p>
                  <p className="text-muted-foreground">{new Date(log.at).toLocaleString()}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No recent security events found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Deletion */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!hasPasswordProvider}><Trash2 className="w-4 h-4 mr-2" />Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, profile, and all practice history. To confirm, please enter your current password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="delete-confirm-password">Current Password</Label>
                <Input
                  id="delete-confirm-password"
                  type="password"
                  value={passwords.current}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter your password to confirm"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={!passwords.current || isDeleting}>
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!hasPasswordProvider && <p className="text-xs text-muted-foreground mt-2">Account deletion is disabled for social logins.</p>}
        </CardContent>
      </Card>
    </div>
  );
}


interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  setShow: (show: boolean) => void;
}

function PasswordInput({ id, label, value, onChange, show, setShow }: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete="new-password" />
        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShow(!show)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

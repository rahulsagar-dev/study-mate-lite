import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Calendar, BookOpen, Brain, FileText, Flame, Timer, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ProfileData {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  study_hours: number;
  streak: number;
  favorite_subjects: string[];
  created_at: string;
  total_pomodoro_sessions: number;
  total_focus_hours: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [summariesCount, setSummariesCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      const profileData: ProfileData = {
        ...data,
        favorite_subjects: 
          Array.isArray(data.favorite_subjects) 
            ? data.favorite_subjects.filter((s): s is string => typeof s === 'string')
            : [],
        total_pomodoro_sessions: (data as any).total_pomodoro_sessions || 0,
        total_focus_hours: (data as any).total_focus_hours || 0,
      };

      setProfile(profileData);
      setDisplayName(data.display_name || "");
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch flashcard sets count
      const { count: flashcardsCount } = await supabase
        .from("flashcard_sets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      // Fetch summaries count
      const { count: summariesCount } = await supabase
        .from("summaries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      setFlashcardsCount(flashcardsCount || 0);
      setSummariesCount(summariesCount || 0);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user?.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>Unable to load your profile information.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return profile.email?.[0].toUpperCase() || "U";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "User"} />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="rounded-full bg-primary p-2 shadow-lg hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                    <Button onClick={handleUpdateProfile} disabled={updating}>
                      {updating ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email || ""} disabled />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since {profile.created_at ? format(new Date(profile.created_at), "MMMM yyyy") : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pomodoro Sessions</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.total_pomodoro_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">Completed sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(profile.total_focus_hours || 0).toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Total focused time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.study_hours || 0}h</div>
              <p className="text-xs text-muted-foreground">Total time studied</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.streak || 0}</div>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flashcardsCount}</div>
              <p className="text-xs text-muted-foreground">Sets created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Summaries</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summariesCount}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Study Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Study Activity</CardTitle>
            <CardDescription>Your recent study patterns and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.favorite_subjects && profile.favorite_subjects.length > 0 ? (
              <div className="space-y-2">
                <Label>Favorite Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start studying to track your favorite subjects!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

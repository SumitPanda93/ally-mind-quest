import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    profession: '',
    experience_level: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          profession: data.profession || '',
          experience_level: data.experience_level || '',
          profile_picture_url: data.profile_picture_url || ''
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, profile_picture_url: publicUrl }));
      toast.success('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!profile.name || profile.name.length < 3) {
      toast.error('Name must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    if (profile.mobile && !/^[0-9]{10}$/.test(profile.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
          profession: profile.profession,
          experience_level: profile.experience_level,
          profile_picture_url: profile.profile_picture_url
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.profile_picture_url} />
                  <AvatarFallback className="text-3xl">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPhoto}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Max 5MB, JPG, PNG, or WEBP
                  </p>
                </div>
              </div>

              {/* User ID (Non-editable) */}
              <div>
                <Label>User ID</Label>
                <Input
                  value={userId}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your unique identifier (non-editable)
                </p>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>

              {/* Profession */}
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>

              {/* Experience Level */}
              <div>
                <Label htmlFor="experience">Experience Level</Label>
                <Input
                  id="experience"
                  type="text"
                  value={profile.experience_level}
                  onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                  placeholder="Intermediate, Expert, etc."
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              
              const formData = new FormData(e.currentTarget);
              const newPassword = formData.get('new-password') as string;
              const confirmPassword = formData.get('confirm-password') as string;
              
              if (newPassword !== confirmPassword) {
                toast.error('Passwords do not match');
                setIsLoading(false);
                return;
              }
              
              if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
                toast.error('Password must be at least 8 characters with one number and one uppercase letter');
                setIsLoading(false);
                return;
              }
              
              try {
                const { error } = await supabase.auth.updateUser({
                  password: newPassword
                });
                
                if (error) throw error;
                
                toast.success('Password changed successfully!');
                (e.target as HTMLFormElement).reset();
              } catch (error: any) {
                console.error('Password change error:', error);
                toast.error(error.message || 'Failed to change password');
              } finally {
                setIsLoading(false);
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password *</Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  placeholder="Enter new password"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Min 8 characters, one number, one uppercase
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

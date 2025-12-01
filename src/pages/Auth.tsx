import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import mentorIcon from '@/assets/mentor-icon.png';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otpFlow, setOtpFlow] = useState<'email' | 'mobile' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [forgotPasswordFlow, setForgotPasswordFlow] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateName = (name: string) => {
    return name.trim().length >= 3;
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    return hasMinLength && hasNumber && hasUpperCase;
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('signup-name') as string;
    const mobile = formData.get('signup-mobile') as string;
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;

    // Validation
    if (!name || !mobile || !email || !password) {
      toast.error('Please fill in all mandatory fields');
      setIsLoading(false);
      return;
    }

    if (!validateName(name)) {
      toast.error('Name must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      toast.error('Password must be at least 8 characters with one number and one uppercase letter');
      setIsLoading(false);
      return;
    }

    try {
      // Check for duplicate email or mobile
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email, mobile')
        .or(`email.eq.${email},mobile.eq.${mobile}`);

      if (existingProfiles && existingProfiles.length > 0) {
        const duplicateEmail = existingProfiles.some(p => p.email === email);
        const duplicateMobile = existingProfiles.some(p => p.mobile === mobile);
        
        if (duplicateEmail && duplicateMobile) {
          toast.error('Email and mobile number are already registered');
        } else if (duplicateEmail) {
          toast.error('Email is already registered');
        } else {
          toast.error('Mobile number is already registered');
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name,
            mobile
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            name,
            mobile,
            email
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Failed to create profile. Please contact support.');
          setIsLoading(false);
          return;
        }

        toast.success('Account created! Please check your email to verify your account.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!emailOrMobile) {
      toast.error('Please enter your email or mobile number');
      return;
    }

    setIsLoading(true);
    const isEmail = validateEmail(emailOrMobile);
    const isMobile = validateMobile(emailOrMobile);

    if (!isEmail && !isMobile) {
      toast.error('Please enter a valid email or 10-digit mobile number');
      setIsLoading(false);
      return;
    }

    try {
      // Send OTP to both email and mobile if possible
      let emailSent = false;
      let mobileSent = false;
      
      if (isEmail) {
        const { error } = await supabase.auth.signInWithOtp({
          email: emailOrMobile,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        
        if (!error) {
          emailSent = true;
          setOtpFlow('email');
        }
      }
      
      if (isMobile) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: `+91${emailOrMobile}`,
          options: {
            channel: 'sms'
          }
        });
        
        if (!error) {
          mobileSent = true;
          setOtpFlow('mobile');
        }
      }
      
      if (emailSent || mobileSent) {
        setOtpSent(true);
        if (emailSent && mobileSent) {
          toast.success('OTP sent to both your email and mobile!');
        } else if (emailSent) {
          toast.success('OTP sent to your email!');
        } else {
          toast.success('OTP sent to your mobile!');
        }
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      let verifyResult;
      
      if (otpFlow === 'email') {
        verifyResult = await supabase.auth.verifyOtp({
          email: emailOrMobile,
          token: otpValue,
          type: 'email'
        });
      } else {
        verifyResult = await supabase.auth.verifyOtp({
          phone: `+91${emailOrMobile}`,
          token: otpValue,
          type: 'sms'
        });
      }
      
      if (verifyResult.error) throw verifyResult.error;

      // Check email confirmation status
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && !user.email_confirmed_at) {
        toast.error('Please verify your email before signing in. Check your inbox for the confirmation link.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
      setOtpValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailOrMobile) {
      toast.error('Please enter your email');
      return;
    }

    if (!validateEmail(emailOrMobile)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailOrMobile, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;
      setResetOtpSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters with one number and one uppercase letter');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Password updated successfully!');
      setForgotPasswordFlow(false);
      setResetOtpSent(false);
      setNewPassword('');
      setEmailOrMobile('');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Flow
  if (forgotPasswordFlow) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={mentorIcon} alt="Mentor" className="h-16 w-16 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!resetOtpSent ? (
              <>
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailOrMobile}
                    onChange={(e) => setEmailOrMobile(e.target.value)}
                    required
                  />
                </div>
                <Button onClick={handleForgotPassword} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button variant="ghost" onClick={() => setForgotPasswordFlow(false)} className="w-full">
                  Back to Sign In
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 8 characters, one number, one uppercase
                  </p>
                </div>
                <Button onClick={handleUpdatePassword} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Flow
  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={mentorIcon} alt="Mentor" className="h-16 w-16 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">Enter OTP</CardTitle>
            <CardDescription>
              We sent a 6-digit OTP to {otpFlow === 'email' ? 'your email' : 'your mobile'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading || otpValue.length !== 6}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <div className="text-center space-y-2">
              <Button variant="link" onClick={handleSendOtp} disabled={isLoading}>
                Resend OTP
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setOtpSent(false);
                  setOtpValue('');
                  setEmailOrMobile('');
                }} 
                className="w-full"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={mentorIcon} alt="Mentor" className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">MENTOR</CardTitle>
          <CardDescription>Guidance. Simplified.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password" className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                const formData = new FormData(e.currentTarget);
                const email = formData.get('login-email') as string;
                const password = formData.get('login-password') as string;
                
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                  });
                  
                  if (error) throw error;
                  
                  // Check email confirmation
                  if (data.user && !data.user.email_confirmed_at) {
                    toast.error('Please verify your email before signing in. Check your inbox for the confirmation link.');
                    await supabase.auth.signOut();
                    setIsLoading(false);
                    return;
                  }
                  
                  toast.success('Signed in successfully!');
                  navigate('/dashboard');
                } catch (error: any) {
                  toast.error(error.message || 'Failed to sign in');
                } finally {
                  setIsLoading(false);
                }
              }} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="login-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="login-password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <Button 
                  type="button"
                  variant="link" 
                  onClick={() => setForgotPasswordFlow(true)} 
                  className="w-full"
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="otp" className="space-y-4">
              <div>
                <Label htmlFor="otp-email-mobile">Email or Mobile Number</Label>
                <Input
                  id="otp-email-mobile"
                  type="text"
                  placeholder="you@example.com or 9876543210"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  OTP will be sent to both your email and mobile number
                </p>
              </div>
              <Button onClick={handleSendOtp} className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Name *</Label>
                  <Input
                    id="signup-name"
                    name="signup-name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-mobile">Mobile Number *</Label>
                  <Input
                    id="signup-mobile"
                    name="signup-mobile"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 8 characters, one number, one uppercase
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;


import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileItem } from "@/lib/supabase";
import { useFiles } from "@/hooks/useFiles";

// Schema for setting a new password
const setPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Schema for entering an existing password
const enterPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

interface PasswordProtectionProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (file: Blob) => void;
  mode: "set" | "enter" | "reset";
}

export function PasswordProtection({ file, isOpen, onClose, onSuccess, mode }: PasswordProtectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setFilePassword, verifyFilePassword, resetFilePassword } = useFiles();

  // Form for setting a new password
  const setPasswordForm = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Form for entering an existing password
  const enterPasswordForm = useForm<z.infer<typeof enterPasswordSchema>>({
    resolver: zodResolver(enterPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSetPassword = async (data: z.infer<typeof setPasswordSchema>) => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const success = await setFilePassword(file.id, data.password);
      if (success) {
        toast.success("Password set successfully");
        onClose();
      } else {
        setErrorMessage("Failed to set password");
      }
    } catch (error) {
      console.error("Error setting password:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterPassword = async (data: z.infer<typeof enterPasswordSchema>) => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await verifyFilePassword(file.id, data.password);
      if (result.success && result.decryptedFile) {
        if (onSuccess) {
          onSuccess(result.decryptedFile);
        }
        toast.success("Password verified successfully");
        onClose();
      } else {
        setErrorMessage("Incorrect password");
        enterPasswordForm.setError("password", { 
          type: "manual", 
          message: "Incorrect password" 
        });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: z.infer<typeof setPasswordSchema>) => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const success = await resetFilePassword(file.id, data.password);
      if (success) {
        toast.success("Password reset successfully");
        onClose();
      } else {
        setErrorMessage("Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "set" && "Set Password Protection"}
            {mode === "enter" && "Enter Password"}
            {mode === "reset" && "Reset Password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "set" && "Add password protection to your file. You'll need this password to view the file in the future."}
            {mode === "enter" && "This file is password protected. Enter the password to view it."}
            {mode === "reset" && "Reset your file password. This will replace the existing password."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {(mode === "set" || mode === "reset") && (
          <Form {...setPasswordForm}>
            <form onSubmit={setPasswordForm.handleSubmit(mode === "set" ? handleSetPassword : handleResetPassword)} className="space-y-4">
              <FormField
                control={setPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"} 
                          className="pr-10"
                          placeholder="Enter a strong password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={setPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"} 
                          className="pr-10"
                          placeholder="Confirm your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={toggleConfirmPasswordVisibility}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {mode === "set" ? "Set Password" : "Reset Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {mode === "enter" && (
          <Form {...enterPasswordForm}>
            <form onSubmit={enterPasswordForm.handleSubmit(handleEnterPassword)} className="space-y-4">
              <FormField
                control={enterPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"} 
                          className="pr-10"
                          placeholder="Enter file password"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  Unlock File
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PasswordProtectedViewer({ file, decryptedFile }: { file: FileItem, decryptedFile: Blob }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const url = URL.createObjectURL(decryptedFile);

  // Clean up URL when component unmounts
  React.useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isText = file.type.startsWith('text/') || file.type === 'application/json';

  // Function to handle text file previews
  const renderTextPreview = async () => {
    try {
      const text = await decryptedFile.text();
      return (
        <pre className="bg-muted p-4 rounded overflow-auto max-h-[500px]">
          <code>{text}</code>
        </pre>
      );
    } catch (error) {
      console.error("Failed to read text file:", error);
      return <p className="text-center">Error displaying text content</p>;
    }
  };

  const [textContent, setTextContent] = useState<React.ReactNode>(
    <div className="flex justify-center items-center h-[200px]">
      <span className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2"></span>
      Loading text content...
    </div>
  );

  // Load text content if needed
  React.useEffect(() => {
    if (isText) {
      renderTextPreview().then(setTextContent);
    }
  }, [isText, decryptedFile]);

  return (
    <div className={`bg-background border rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <h3 className="text-sm font-medium">{file.name}</h3>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      </div>
      
      <div className={`p-4 ${isFullscreen ? 'h-[calc(100%-3rem)] overflow-auto' : 'max-h-[70vh] overflow-auto'}`}>
        {isImage && (
          <img 
            src={url} 
            alt={file.name} 
            className="max-w-full mx-auto" 
          />
        )}
        {isPdf && (
          <iframe 
            src={url} 
            title={file.name}
            className="w-full h-full min-h-[500px]" 
          />
        )}
        {isVideo && (
          <video 
            src={url} 
            controls 
            className="max-w-full mx-auto" 
          />
        )}
        {isAudio && (
          <audio 
            src={url} 
            controls 
            className="w-full" 
          />
        )}
        {isText && textContent}
        {!isImage && !isPdf && !isVideo && !isAudio && !isText && (
          <div className="text-center p-4">
            <p>Preview not available for this file type.</p>
            <Button 
              className="mt-4"
              onClick={() => window.open(url, '_blank')}
            >
              Open File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

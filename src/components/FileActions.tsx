
import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import { FileItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Eye,
  ChevronDown,
  Lock,
  Info,
  KeyRound,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordProtection, PasswordProtectedViewer } from "./PasswordProtection";

interface FileActionsProps {
  file: FileItem;
  isCompact?: boolean;
}

export function FileActions({ file, isCompact = false }: FileActionsProps) {
  const { downloadFile, deleteFile, shareFile, getFileMetadata, previewFile } = useFiles();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [metadataDialog, setMetadataDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [enterPasswordDialog, setEnterPasswordDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"read" | "write" | "admin">("read");
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState<Blob | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [passwordForAction, setPasswordForAction] = useState<"preview" | "download" | null>(null);

  const isFolder = file.type === "folder";
  const isPasswordProtected = file.metadata?.isPasswordProtected === true;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if file is password protected
    if (isPasswordProtected) {
      setPasswordForAction("download");
      setEnterPasswordDialog(true);
      return;
    }
    
    setLoading(true);
    const result = await downloadFile(file.id);
    setLoading(false);
    
    if (!result.success && result.needsPassword) {
      setPasswordForAction("download");
      setEnterPasswordDialog(true);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteFile(file.id);
    setLoading(false);
    if (success) {
      setConfirmDelete(false);
    }
  };

  const handleShare = async () => {
    if (!shareEmail) return;
    
    setLoading(true);
    const success = await shareFile(file.id, shareEmail, sharePermission);
    setLoading(false);
    
    if (success) {
      setShareEmail("");
      setShareDialog(false);
    }
  };

  const viewMetadata = async () => {
    setLoading(true);
    const data = await getFileMetadata(file.id);
    setLoading(false);
    
    if (data) {
      setMetadata(data);
      setMetadataDialog(true);
    }
  };

  const handlePasswordSuccess = async (decrypted: Blob) => {
    setDecryptedFile(decrypted);
    
    if (passwordForAction === "download") {
      // Create download link
      const url = URL.createObjectURL(decrypted);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setEnterPasswordDialog(false);
    } else {
      // For preview
      setPreviewDialog(true);
    }
    
    setPasswordForAction(null);
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    
    try {
      // Use the new previewFile function from useFiles hook
      const result = await previewFile(file.id);
      
      if (result.success && result.decryptedFile) {
        setDecryptedFile(result.decryptedFile);
        setPreviewDialog(true);
      } else if (result.needsPassword) {
        setPasswordForAction("preview");
        setEnterPasswordDialog(true);
      }
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setLoading(false);
    }
  };

  // For folders, we only show info and delete
  if (isFolder) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className={isCompact ? "h-6 w-6" : "h-8 w-8"}
          >
            <MoreVertical className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={viewMetadata}>
            <Info className="mr-2 h-4 w-4" />
            Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className={isCompact ? "h-6 w-6" : "h-8 w-8"}
          >
            <MoreVertical className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShareDialog(true);
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewMetadata}>
            <Info className="mr-2 h-4 w-4" />
            Details
          </DropdownMenuItem>
          
          {/* Password protection menu items */}
          <DropdownMenuSeparator />
          
          {isPasswordProtected ? (
            <>
              <DropdownMenuItem className="text-amber-500">
                <Lock className="mr-2 h-4 w-4" />
                Password Protected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setResetPasswordDialog(true);
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setPasswordDialog(true);
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Set Password
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{file.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share file</DialogTitle>
            <DialogDescription>
              Share "{file.name}" with another user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shareEmail">Email address</Label>
              <Input
                id="shareEmail"
                type="email"
                placeholder="colleague@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sharePermission">Permission</Label>
              <Select
                value={sharePermission}
                onValueChange={(value) => 
                  setSharePermission(value as "read" | "write" | "admin")
                }
              >
                <SelectTrigger id="sharePermission">
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read only</SelectItem>
                  <SelectItem value="write">Can edit</SelectItem>
                  <SelectItem value="admin">Full access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {sharePermission === "read"
                  ? "User can view and download the file."
                  : sharePermission === "write"
                  ? "User can view, download, and make changes."
                  : "User has full control including deletion rights."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={loading || !shareEmail}>
              {loading ? "Sharing..." : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metadata dialog */}
      <Dialog open={metadataDialog} onOpenChange={setMetadataDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>File details</DialogTitle>
            <DialogDescription>
              Detailed information about "{file.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {metadata ? (
              <>
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 gap-x-4 border-b px-4 py-2 bg-muted/50">
                    <div className="font-medium">Property</div>
                    <div className="col-span-2 font-medium">Value</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="col-span-2 text-sm">{file.type}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Size</div>
                      <div className="col-span-2 text-sm">
                        {file.size} bytes
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="col-span-2 text-sm">
                        {new Date(file.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Modified</div>
                      <div className="col-span-2 text-sm">
                        {new Date(file.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Encrypted</div>
                      <div className="col-span-2 text-sm">
                        {file.is_encrypted ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Password Protected</div>
                      <div className="col-span-2 text-sm">
                        {metadata.metadata?.isPasswordProtected ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-2">
                      <div className="text-sm text-muted-foreground">Shared</div>
                      <div className="col-span-2 text-sm">
                        {file.is_shared ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared users */}
                {metadata.file_shares && metadata.file_shares.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Shared with</h3>
                    <div className="rounded-md border divide-y">
                      {metadata.file_shares.map((share: any) => (
                        <div key={share.id} className="px-4 py-2 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">
                              {share.profiles.full_name || share.profiles.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {share.permission === "read"
                                ? "Can view"
                                : share.permission === "write"
                                ? "Can edit"
                                : "Full access"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-8 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Loading state
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Set password dialog */}
      <PasswordProtection 
        file={file}
        isOpen={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        mode="set"
      />

      {/* Enter password dialog */}
      <PasswordProtection 
        file={file}
        isOpen={enterPasswordDialog}
        onClose={() => {
          setEnterPasswordDialog(false);
          setPasswordForAction(null);
        }}
        onSuccess={handlePasswordSuccess}
        mode="enter"
      />

      {/* Reset password dialog */}
      <PasswordProtection 
        file={file}
        isOpen={resetPasswordDialog}
        onClose={() => setResetPasswordDialog(false)}
        mode="reset"
      />

      {/* File preview dialog */}
      {decryptedFile && (
        <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            <PasswordProtectedViewer 
              file={file} 
              decryptedFile={decryptedFile} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

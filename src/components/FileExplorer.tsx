import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import type { FileItem } from "@/lib/supabase";
import { FileActions } from "@/components/FileActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderPlus,
  Upload,
  Folder,
  ArrowLeft,
  Search,
  Grid3X3,
  List,
  FileText,
  Image,
  Film,
  File,
  Music,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export function FileExplorer() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<BreadcrumbItem[]>([
    { id: null, name: "Home" },
  ]);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderMode, setCreateFolderMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    files,
    loading,
    uploading,
    uploadFile,
    createFolder,
    refreshFiles,
  } = useFiles(currentFolder);

  // Filter files based on search query
  const filteredFiles = searchQuery
    ? files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const uploadPromises = Array.from(fileList).map((file) =>
      uploadFile(file, false, currentFolder)
    );

    await Promise.all(uploadPromises);
    refreshFiles();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    
    await createFolder(newFolderName, currentFolder);
    setNewFolderName("");
    setCreateFolderMode(false);
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    
    
    setFolderHistory((prev) => [
      ...prev,
      { id: folderId, name: folderName },
    ]);
  };

  const navigateBreadcrumb = (index: number) => {
    const targetFolder = folderHistory[index];
    setCurrentFolder(targetFolder.id);
    setFolderHistory(folderHistory.slice(0, index + 1));
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    
    const newHistory = folderHistory.slice(0, -1);
    const target = newHistory[newHistory.length - 1];
    
    setCurrentFolder(target.id);
    setFolderHistory(newHistory);
  };

  return (
    <div className="flex flex-col h-full w-full animate-fadeIn">
      {/* Breadcrumb and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {folderHistory.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateBack}
              className="mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <nav className="flex items-center text-sm">
            {folderHistory.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-muted-foreground">/</span>
                )}
                <button
                  className={cn(
                    "hover:text-primary focus:outline-none",
                    index === folderHistory.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => navigateBreadcrumb(index)}
                >
                  {item.name}
                </button>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none rounded-l-md",
                viewMode === "grid" && "bg-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none rounded-r-md",
                viewMode === "list" && "bg-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          onClick={() => setCreateFolderMode(!createFolderMode)}
          className="gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
        
        <div className="relative">
          <Input
            type="file"
            id="file-upload"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleUpload}
            multiple
          />
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Create folder input */}
      {createFolderMode && (
        <div className="flex gap-2 mb-6 animate-fadeIn">
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <Button onClick={handleCreateFolder}>Create</Button>
          <Button 
            variant="ghost" 
            onClick={() => setCreateFolderMode(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* File list */}
      <ScrollArea className="flex-1 rounded-md border min-h-[400px]">
        {loading ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-36 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Folder className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No files here yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchQuery
                ? "No files match your search. Try a different term."
                : "Upload some files or create a folder to get started."}
            </p>
          </div>
        ) : (
          <div 
            className={cn(
              viewMode === "grid" 
                ? "p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
                : "divide-y"
            )}
          >
            {filteredFiles.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                viewMode={viewMode}
                onFolderClick={() => navigateToFolder(file.id, file.name)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface FileItemProps {
  file: FileItem;
  viewMode: "grid" | "list";
  onFolderClick: () => void;
}

function FileItem({ file, viewMode, onFolderClick }: FileItemProps) {
  const isFolder = file.type === "folder";
  const fileExtension = !isFolder ? file.name.split(".").pop() || "" : "";
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (viewMode === "grid") {
    return (
      <div 
        className={cn(
          "group flex flex-col rounded-lg border bg-card overflow-hidden transition-all duration-200",
          isFolder && "cursor-pointer hover:border-primary hover:ring-1 hover:ring-primary",
          !isFolder && "hover:shadow-md"
        )}
        onClick={isFolder ? onFolderClick : undefined}
      >
        <div className="p-4 flex items-center justify-center aspect-square bg-gradient-to-br from-muted/50 to-muted">
          <FileTypeIcon type={isFolder ? "folder" : fileExtension} />
        </div>
        
        <div className="p-3 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium line-clamp-1">{file.name}</h3>
            <FileActions file={file} isCompact />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {isFolder ? "Folder" : formatFileSize(file.size)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(file.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div 
        className={cn(
          "group flex items-center px-4 py-3 hover:bg-muted/50 transition-colors",
          isFolder && "cursor-pointer"
        )}
        onClick={isFolder ? onFolderClick : undefined}
      >
        <div className="mr-3">
          <FileTypeIcon type={isFolder ? "folder" : fileExtension} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{file.name}</h3>
          <p className="text-xs text-muted-foreground">
            {isFolder ? "Folder" : formatFileSize(file.size)} • Last modified {new Date(file.updated_at).toLocaleDateString()}
          </p>
        </div>
        <FileActions file={file} />
      </div>
    );
  }
}

interface FileTypeIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
}

function FileTypeIcon({ type, size = "md" }: FileTypeIconProps) {
  const iconSize = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }[size];

  // Based on file type, return an appropriate icon
  if (type === "folder") {
    return <Folder className={cn(iconSize, "text-primary")} />;
  }

  // Return an icon based on common file extensions
  const FileIcon = getFileIcon(type);
  return <FileIcon className={cn(iconSize, "text-muted-foreground")} />;
}

// Helper to get the right icon for file type
function getFileIcon(extension: string) {
  // Simplified mapping of extensions to icons
  const iconMap: Record<string, any> = {
    // Images
    jpg: Image,
    jpeg: Image,
    png: Image,
    gif: Image,
    webp: Image,
    
    // Documents
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    txt: FileText,
    
    // Videos
    mp4: Film,
    mov: Film,
    avi: Film,
    
    // Audio
    mp3: Music,
    wav: Music,
    
    // Code
    js: Code,
    ts: Code,
    jsx: Code,
    tsx: Code,
    html: Code,
    css: Code,
    json: Code,
  };
  
  return iconMap[extension.toLowerCase()] || File;
}

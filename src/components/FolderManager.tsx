import { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Folder, 
  FolderOpen, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronDown,
  ChevronLeft,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Folder as FolderType, 
  fetchFolders, 
  createFolder, 
  updateFolder, 
  deleteFolder 
} from '@/services/indexService';

interface FolderManagerProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
  showAddButton?: boolean;
  compact?: boolean;
}

const FOLDER_COLORS = [
  '#FFD700', // gold
  '#4A90A4', // navy-light
  '#22c55e', // green
  '#ef4444', // red
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
];

export function FolderManager({ 
  onFolderSelect, 
  selectedFolderId,
  showAddButton = true,
  compact = false
}: FolderManagerProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#FFD700');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await fetchFolders();
      setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim(), undefined, newFolderColor);
      toast({ title: 'התיקייה נוצרה בהצלחה' });
      setNewFolderName('');
      setNewFolderColor('#FFD700');
      setDialogOpen(false);
      loadFolders();
    } catch (error) {
      toast({ 
        title: 'שגיאה ביצירת תיקייה', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateFolder = async (id: string) => {
    if (!editName.trim()) return;

    try {
      await updateFolder(id, { name: editName.trim() });
      toast({ title: 'התיקייה עודכנה' });
      setEditingId(null);
      loadFolders();
    } catch (error) {
      toast({ 
        title: 'שגיאה בעדכון', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder(id);
      toast({ title: 'התיקייה נמחקה' });
      if (selectedFolderId === id) {
        onFolderSelect?.(null);
      }
      loadFolders();
    } catch (error) {
      toast({ 
        title: 'שגיאה במחיקה', 
        variant: 'destructive' 
      });
    }
  };

  const startEditing = (folder: FolderType) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const toggleExpand = (id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);
  
  // Get child folders
  const getChildFolders = (parentId: string) => 
    folders.filter(f => f.parent_id === parentId);

  const renderFolder = (folder: FolderType, level: number = 0) => {
    const children = getChildFolders(folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingId === folder.id;

    return (
      <div key={folder.id} style={{ marginRight: level * 16 }}>
        <div
          className={`
            group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer
            ${isSelected ? 'bg-gold/20 border border-gold' : 'hover:bg-muted'}
            ${compact ? 'py-1.5' : ''}
          `}
          onClick={() => !isEditing && onFolderSelect?.(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          
          {isSelected ? (
            <FolderOpen 
              className="w-5 h-5 shrink-0" 
              style={{ color: folder.color || '#FFD700' }} 
            />
          ) : (
            <Folder 
              className="w-5 h-5 shrink-0" 
              style={{ color: folder.color || '#FFD700' }} 
            />
          )}

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateFolder(folder.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleUpdateFolder(folder.id)}
              >
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditingId(null)}
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium truncate">
                {folder.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(folder);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-2">טוען תיקיות...</div>;
  }

  return (
    <div className="space-y-2" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Folder className="w-4 h-4 text-gold" />
          תיקיות
        </h4>
        {showAddButton && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                <FolderPlus className="w-4 h-4" />
                <span className="text-xs">חדש</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">תיקייה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-right">
                  <label className="text-sm font-medium mb-2 block">שם התיקייה</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="הזן שם תיקייה..."
                    className="text-right"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium mb-2 block">צבע</label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewFolderColor(color)}
                        className={`
                          w-8 h-8 rounded-lg transition-all
                          ${newFolderColor === color ? 'ring-2 ring-offset-2 ring-navy scale-110' : 'hover:scale-105'}
                        `}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateFolder} className="w-full gap-2">
                  <FolderPlus className="w-4 h-4" />
                  צור תיקייה
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Folder List */}
      <ScrollArea className={compact ? 'h-[150px]' : 'h-[200px]'}>
        <div className="space-y-1">
          {/* "All documents" option */}
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer
              ${selectedFolderId === null ? 'bg-gold/20 border border-gold' : 'hover:bg-muted'}
              ${compact ? 'py-1.5' : ''}
            `}
            onClick={() => onFolderSelect?.(null)}
          >
            <Folder className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">כל המסמכים</span>
            <Badge variant="secondary" className="mr-auto text-xs">
              הכל
            </Badge>
          </div>

          {/* Folders */}
          {rootFolders.map(folder => renderFolder(folder))}

          {folders.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              אין תיקיות עדיין
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

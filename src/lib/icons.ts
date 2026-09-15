import { 
  BookOpen, BrainCircuit, CalendarDays, FileText, Scale, Timer, 
  Edit3, CheckCircle2, AlertCircle, Info, Upload, Download, 
  Trash2, Plus, ChevronLeft, ChevronRight, LayoutGrid, Settings, Folder
} from 'lucide-react';

export const LexiIcons = {
  // Objets métiers
  Course: BookOpen,
  Memory: BrainCircuit,
  Schedule: CalendarDays,
  Document: FileText,
  Law: Scale,
  Exam: Timer,
  Note: Edit3,
  Library: Folder,
  
  // Actions standards
  Add: Plus,
  Edit: Edit3,
  Delete: Trash2,
  Upload: Upload,
  Download: Download,
  Settings: Settings,
  
  // Navigation
  Back: ChevronLeft,
  Forward: ChevronRight,
  ViewCompact: LayoutGrid,
  
  // Feedbacks
  Success: CheckCircle2,
  Error: AlertCircle,
  Info: Info,
  Warning: AlertCircle
};

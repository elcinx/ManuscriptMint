import React, { useRef } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Type,
  List, ListOrdered, Undo, Redo, 
  Indent, Outdent, Image as ImageIcon
} from 'lucide-react';

interface EditorToolbarProps {
  onFormat: (command: string, value?: string) => void;
  activeFormats: Record<string, string | boolean>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onFormat, activeFormats }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ToolbarButton = ({ 
    command, 
    value, 
    icon: Icon, 
    label,
    active = false,
    onClick
  }: { 
    command: string; 
    value?: string; 
    icon: any; 
    label?: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor selection
        if (onClick) {
            onClick();
        } else {
            onFormat(command, value);
        }
      }}
      className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
        active 
          ? 'bg-brand-100 text-brand-700 shadow-inner' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
      title={label || command}
    >
      <Icon size={16} strokeWidth={2.5} />
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1 self-center" />;

  // Helper to handle select changes without losing focus
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, command: string) => {
    onFormat(command, e.target.value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
            onFormat('insertImage', base64);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-1 shadow-sm shrink-0 overflow-x-auto z-20">
      
      {/* History */}
      <div className="flex gap-0.5">
        <ToolbarButton command="undo" icon={Undo} />
        <ToolbarButton command="redo" icon={Redo} />
      </div>

      <Divider />

      {/* Font Family */}
      <div className="flex items-center mr-1">
        <select 
          className="text-xs border border-gray-200 rounded p-1 w-28 h-8 bg-transparent hover:bg-gray-50 focus:outline-none cursor-pointer"
          onChange={(e) => handleSelectChange(e, 'fontName')}
          // Safely cast or fallback
          value={(activeFormats.fontName as string) || 'Merriweather'}
        >
          <option value="Merriweather">Serif (Merriweather)</option>
          <option value="Inter">Sans (Inter)</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center mr-2">
         <select
            className="text-xs border border-gray-200 rounded p-1 w-20 h-8 bg-transparent hover:bg-gray-50 focus:outline-none cursor-pointer"
            onChange={(e) => handleSelectChange(e, 'fontSize')}
            // execCommand 'fontSize' uses 1-7 integers
            value={(activeFormats.fontSize as string) || '3'}
         >
            <option value="1">Size 1 (Small)</option>
            <option value="2">Size 2</option>
            <option value="3">Size 3 (Normal)</option>
            <option value="4">Size 4 (Medium)</option>
            <option value="5">Size 5 (Large)</option>
            <option value="6">Size 6 (XL)</option>
            <option value="7">Size 7 (XXL)</option>
         </select>
      </div>

      <Divider />

      <div className="flex gap-0.5">
        <ToolbarButton command="bold" icon={Bold} active={activeFormats.bold as boolean} />
        <ToolbarButton command="italic" icon={Italic} active={activeFormats.italic as boolean} />
        <ToolbarButton command="underline" icon={Underline} active={activeFormats.underline as boolean} />
        <ToolbarButton command="strikethrough" icon={Strikethrough} active={activeFormats.strikethrough as boolean} />
      </div>

      <Divider />

      {/* Headings / Styles */}
      <div className="flex gap-0.5">
         <ToolbarButton command="formatBlock" value="p" icon={Type} label="Normal" active={activeFormats.p as boolean} />
         <ToolbarButton command="formatBlock" value="h1" icon={Heading1} active={activeFormats.h1 as boolean} />
         <ToolbarButton command="formatBlock" value="h2" icon={Heading2} active={activeFormats.h2 as boolean} />
      </div>

      <Divider />

      {/* Alignment */}
      <div className="flex gap-0.5">
        <ToolbarButton command="justifyLeft" icon={AlignLeft} active={activeFormats.justifyLeft as boolean} />
        <ToolbarButton command="justifyCenter" icon={AlignCenter} active={activeFormats.justifyCenter as boolean} />
        <ToolbarButton command="justifyRight" icon={AlignRight} active={activeFormats.justifyRight as boolean} />
        <ToolbarButton command="justifyFull" icon={AlignJustify} active={activeFormats.justifyFull as boolean} />
      </div>

      <Divider />

      {/* Lists & Indent */}
      <div className="flex gap-0.5">
        <ToolbarButton command="insertUnorderedList" icon={List} active={activeFormats.insertUnorderedList as boolean} />
        <ToolbarButton command="insertOrderedList" icon={ListOrdered} active={activeFormats.insertOrderedList as boolean} />
        <ToolbarButton command="outdent" icon={Outdent} />
        <ToolbarButton command="indent" icon={Indent} />
      </div>

      <Divider />

      {/* Insert Image */}
      <div className="flex gap-0.5">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
        />
        <ToolbarButton 
            command="insertImage" 
            icon={ImageIcon} 
            label="Image"
            onClick={() => fileInputRef.current?.click()}
        />
      </div>

    </div>
  );
};

export default EditorToolbar;
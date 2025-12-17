import React from 'react';
import { Bold, Italic, Highlighter, MessageSquarePlus, Wand2 } from 'lucide-react';

interface FloatingToolbarProps {
  position: { top: number; left: number } | null;
  onFormat: (command: string, value?: string) => void;
  onSmartRefineClick: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ position, onFormat, onSmartRefineClick }) => {
  if (!position) return null;

  const Button = ({ icon: Icon, onClick, label, className }: any) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-1.5 hover:bg-gray-100 rounded text-gray-700 transition-colors ${className}`}
      title={label}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div 
      className="fixed flex items-center gap-1 bg-white shadow-xl border border-gray-200 rounded-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{ 
        top: position.top - 45, // Position slightly above selection
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <Button icon={Bold} onClick={() => onFormat('bold')} label="Bold" />
      <Button icon={Italic} onClick={() => onFormat('italic')} label="Italic" />
      
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      
      <Button 
        icon={Highlighter} 
        onClick={() => onFormat('backColor', '#fef08a')} 
        label="Highlight" 
        className="text-yellow-600"
      />
      <Button icon={MessageSquarePlus} onClick={() => alert("Comment feature coming soon!")} label="Add Comment" />
      
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onSmartRefineClick();
        }}
        className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded text-xs font-semibold transition-colors"
      >
        <Wand2 size={12} />
        Refine
      </button>
    </div>
  );
};

export default FloatingToolbar;

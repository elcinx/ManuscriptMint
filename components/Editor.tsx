import React, { useRef, useEffect, useState } from 'react';
import { Suggestion } from '../types';
import FloatingToolbar from './FloatingToolbar';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  suggestions: Suggestion[];
  activeSuggestionId: string | null;
  onTextSelection: (text: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  activeFormats: Record<string, string | boolean>;
  setActiveFormats: (formats: Record<string, string | boolean>) => void;
  handleFormat: (command: string, value?: string) => void;
}

const Editor: React.FC<EditorProps> = ({ 
  content, 
  onContentChange,
  suggestions, 
  activeSuggestionId,
  onTextSelection,
  editorRef,
  setActiveFormats,
  handleFormat
}) => {
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{top: number, left: number} | null>(null);
  
  // Image Resizing State
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeRect, setResizeRect] = useState<{width: number, height: number, top: number, left: number} | null>(null);

  const PAGE_HEIGHT = 1056; 
  const PAGE_GAP = 24; 
  
  const [minHeight, setMinHeight] = useState(PAGE_HEIGHT);
  
  // Track the content we believe is in the editor to prevent loops
  const lastEmittedContent = useRef<string>(content);
  // Track if we are currently handling a user event to avoid overwriting
  const isUserTyping = useRef<boolean>(false);
  
  // INITIALIZATION & EXTERNAL UPDATES
  useEffect(() => {
    if (editorRef.current) {
      // We only update the DOM if the prop content is different from our last known state
      // This allows external updates (AI, Doc switch) to work, but ignores updates 
      // caused by the user typing (which are already in the DOM).
      if (content !== lastEmittedContent.current && !isUserTyping.current) {
         editorRef.current.innerHTML = content;
         lastEmittedContent.current = content; 
         adjustHeight();
      }
      
      // Reset typing flag after prop sync
      isUserTyping.current = false;
    }
  }, [content]);

  // Initial mount setup
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === "") {
        editorRef.current.innerHTML = content;
        lastEmittedContent.current = content;
        adjustHeight();
    }
  }, []);

  // Sync Resize Overlay position on scroll or resize
  useEffect(() => {
      if (selectedImage && !isResizing) {
          updateResizeOverlay();
      }
  }, [selectedImage, content, minHeight]); // Update when content changes too

  const updateResizeOverlay = () => {
      if (selectedImage && editorRef.current) {
          const editorRect = editorRef.current.getBoundingClientRect();
          const imgRect = selectedImage.getBoundingClientRect();
          
          setResizeRect({
              width: imgRect.width,
              height: imgRect.height,
              top: imgRect.top - editorRect.top,
              left: imgRect.left - editorRect.left
          });
      }
  };

  const adjustHeight = () => {
    if (editorRef.current) {
      const scrollHeight = editorRef.current.scrollHeight;
      const pageCount = Math.max(1, Math.ceil(scrollHeight / (PAGE_HEIGHT - 40)));
      const newHeight = pageCount * PAGE_HEIGHT;
      if (newHeight !== minHeight) {
        setMinHeight(newHeight);
      }
    }
  };

  const checkActiveFormats = () => {
    // 1. Boolean Toggles
    const formats: Record<string, string | boolean> = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    };
    
    // 2. Block Type Check
    const parentBlock = window.getSelection()?.anchorNode?.parentElement;
    if (parentBlock) {
        const block = parentBlock.closest('h1, h2, h3, p, div, li');
        if (block) {
             formats[block.tagName.toLowerCase()] = true;
        }
    }

    // 3. Value Checks
    try {
        formats['fontName'] = document.queryCommandValue('fontName');
        formats['fontSize'] = document.queryCommandValue('fontSize');
    } catch (e) { }

    setActiveFormats(formats);
  };

  const handleSelectionChange = () => {
    checkActiveFormats();
    
    const selection = window.getSelection();
    
    // If we have a selected image, we might want to hide the floating text toolbar
    // unless there is also text selected.
    if (selectedImage) {
        setFloatingToolbarPos(null);
        return;
    }

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setFloatingToolbarPos(null);
      if (!selection || selection.isCollapsed) onTextSelection('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      onTextSelection(text);
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (editorRef.current?.contains(selection.anchorNode)) {
          setFloatingToolbarPos({
            top: rect.top,
            left: rect.left + (rect.width / 2)
          });
      }
    } else {
      setFloatingToolbarPos(null);
      onTextSelection('');
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      isUserTyping.current = true;
      const html = editorRef.current.innerHTML;
      lastEmittedContent.current = html;
      onContentChange(html);
      adjustHeight();
      
      // If content changed, image position might have changed
      if (selectedImage) updateResizeOverlay();
    }
    checkActiveFormats();
  };

  const handleEditorClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Image Selection Logic
      if (target.tagName === 'IMG') {
          setSelectedImage(target as HTMLImageElement);
          // Update overlay position immediately
          // We need to wait for render cycle or calculate directly
          // Using timeout to ensure layout is stable if it changed
          setTimeout(() => {
            const editorRect = editorRef.current!.getBoundingClientRect();
            const imgRect = target.getBoundingClientRect();
            setResizeRect({
                width: imgRect.width,
                height: imgRect.height,
                top: imgRect.top - editorRect.top,
                left: imgRect.left - editorRect.left
            });
          }, 0);
      } else {
          // Deselect image if clicking elsewhere (but not if clicking the resizer itself)
          if (!target.closest('.image-resizer-overlay')) {
              setSelectedImage(null);
              setResizeRect(null);
          }
      }
      editorRef.current?.focus();
  };

  // RESIZE HANDLER
  const startResize = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      
      const startX = e.clientX;
      const startWidth = selectedImage ? selectedImage.clientWidth : 0;
      
      const onMouseMove = (moveEvent: MouseEvent) => {
          if (!selectedImage) return;
          const currentX = moveEvent.clientX;
          const diffX = currentX - startX;
          const newWidth = Math.max(50, startWidth + diffX); // Min width 50px
          
          // Apply to DOM directly for performance
          selectedImage.style.width = `${newWidth}px`;
          selectedImage.style.height = 'auto'; // Maintain aspect ratio
          
          // Update overlay locally to match
          updateResizeOverlay();
      };
      
      const onMouseUp = () => {
          setIsResizing(false);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          
          // Trigger content save
          if (editorRef.current) {
              handleInput({} as any);
          }
      };
      
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'b': e.preventDefault(); handleFormat('bold'); break;
        case 'i': e.preventDefault(); handleFormat('italic'); break;
        case 'u': e.preventDefault(); handleFormat('underline'); break;
      }
    }
    // Delete image if selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImage) {
        e.preventDefault();
        selectedImage.remove();
        setSelectedImage(null);
        setResizeRect(null);
        if (editorRef.current) handleInput({} as any);
    }
  };

  return (
    <div className="flex-1 h-full bg-gray-200/80 overflow-y-auto p-8 flex justify-center relative cursor-text" onClick={() => editorRef.current?.focus()}>
      
      <FloatingToolbar 
        position={floatingToolbarPos} 
        onFormat={handleFormat}
        onSmartRefineClick={() => {
            const input = document.querySelector('input[placeholder*="how to change"]') as HTMLInputElement;
            if (input) input.focus();
        }}
      />

      <div 
        className="w-full max-w-[816px] transition-all duration-200 relative"
        style={{
           minHeight: `${minHeight}px`,
           backgroundImage: `linear-gradient(to bottom, white 0px, white ${PAGE_HEIGHT - PAGE_GAP}px, #e5e7eb ${PAGE_HEIGHT - PAGE_GAP}px, #e5e7eb ${PAGE_HEIGHT}px)`,
           backgroundSize: `100% ${PAGE_HEIGHT}px`,
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        onMouseUp={handleSelectionChange}
        onClick={handleEditorClick}
        onKeyUp={(e) => {
            handleSelectionChange();
            handleKeyDown(e);
        }}
        onKeyDown={handleKeyDown}
      >
        <div 
          ref={editorRef}
          className="editor-content outline-none empty:before:content-['Start_typing...'] empty:before:text-gray-300"
          style={{
            padding: '96px',
            minHeight: '100%',
          }}
          contentEditable={true}
          onInput={handleInput}
          suppressContentEditableWarning={true}
        />

        {/* Image Resizer Overlay */}
        {selectedImage && resizeRect && (
            <div 
                className="image-resizer-overlay absolute pointer-events-none border-2 border-brand-500 z-10"
                style={{
                    top: resizeRect.top,
                    left: resizeRect.left,
                    width: resizeRect.width,
                    height: resizeRect.height,
                }}
            >
                {/* Resize Handle (Bottom Right) */}
                <div 
                    className="absolute bottom-0 right-0 w-3 h-3 bg-brand-500 cursor-nwse-resize pointer-events-auto transform translate-x-1/2 translate-y-1/2 border border-white shadow-sm"
                    onMouseDown={startResize}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
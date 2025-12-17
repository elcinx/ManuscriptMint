import React, { useState, useEffect, useRef } from 'react';
import LeftPanel from './components/LeftPanel';
import Editor from './components/Editor';
import EditorToolbar from './components/EditorToolbar';
import RightPanel from './components/RightPanel';
import { MOCK_DOCS } from './constants';
import { Document, Suggestion, RiskReport, DocStatus } from './types';
import { analyzeDocument, smartRefineText, AssistantResponse } from './services/geminiService';
import { RotateCcw, FileText, Download } from 'lucide-react';

const App: React.FC = () => {
  // State Initialization with LocalStorage
  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const savedDocs = localStorage.getItem('manuscriptMint_docs');
      return savedDocs ? JSON.parse(savedDocs) : MOCK_DOCS;
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return MOCK_DOCS;
    }
  });

  const [currentDocId, setCurrentDocId] = useState<string>(() => {
     // Try to restore the last open doc, or default to first
     const firstId = documents.length > 0 ? documents[0].id : ''; 
     return localStorage.getItem('manuscriptMint_activeDoc') || firstId;
  });

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  
  // Editor State
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, string | boolean>>({});

  const currentDoc = documents.find(d => d.id === currentDocId) || documents[0];

  // PERSISTENCE EFFECT
  // Automatically save to local storage whenever documents change
  useEffect(() => {
    localStorage.setItem('manuscriptMint_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('manuscriptMint_activeDoc', currentDocId);
  }, [currentDocId]);

  // Logic
  const handleSelectDoc = (id: string) => {
    setCurrentDocId(id);
    setSuggestions([]);
  };

  const createNewDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Untitled Document',
      content: '',
      status: DocStatus.NEEDS_REVIEW,
      lastEdited: 'Just now',
      wordCount: 0
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setCurrentDocId(newDoc.id);
    setSuggestions([]);
    
    // Focus editor after creation
    setTimeout(() => {
        editorRef.current?.focus();
    }, 100);
  };

  const handleDeleteDoc = (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    if (!window.confirm(`Are you sure you want to delete "${docToDelete.title}"?`)) return;

    const updatedDocs = documents.filter(d => d.id !== id);

    // Clear suggestions as context changes
    setSuggestions([]);

    if (updatedDocs.length === 0) {
        // If deleting the last doc, create a fresh one immediately so UI isn't empty
        const newDoc: Document = {
            id: Date.now().toString(),
            title: 'Untitled Document',
            content: '',
            status: DocStatus.NEEDS_REVIEW,
            lastEdited: 'Just now',
            wordCount: 0
        };
        setDocuments([newDoc]);
        setCurrentDocId(newDoc.id);
    } else {
        setDocuments(updatedDocs);
        // If we deleted the currently active doc, switch to the first available one
        if (currentDocId === id) {
            setCurrentDocId(updatedDocs[0].id);
        }
    }
  };

  // EXPORT / DOWNLOAD FUNCTION
  const handleDownload = () => {
      if (!currentDoc) return;

      const element = document.createElement("a");
      const file = new Blob([currentDoc.content], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      // Ensure it has an extension
      const fileName = currentDoc.title.endsWith('.html') || currentDoc.title.endsWith('.txt') 
        ? currentDoc.title 
        : `${currentDoc.title}.html`;
      
      element.download = fileName;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element);
  };

  // Editor Formatting Logic
  const handleFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    // Execute command
    document.execCommand(command, false, value);
    
    // Crucial: Re-focus editor immediately so selection persists or typing continues
    editorRef.current.focus();
    
    // Optimistic update for toggles (improves UI responsiveness)
    const formats = { ...activeFormats };
    if (typeof formats[command] === 'boolean') {
        formats[command] = !formats[command];
    } else if (value) {
        formats[command] = value;
    }
    setActiveFormats(formats);
  };

  // Handle direct insertion from AI Assistant
  const handleAiAction = (response: AssistantResponse) => {
    if (!editorRef.current) return;
    
    if (response.scope === 'document') {
        const newContent = response.content;
        setDocuments(prev => prev.map(d => 
            d.id === currentDocId ? { ...d, content: newContent } : d
        ));
        editorRef.current.innerHTML = newContent;
        
    } else {
        editorRef.current.focus();
        const success = document.execCommand('insertHTML', false, response.content);
        
        if (success) {
            setDocuments(prev => prev.map(d => 
                d.id === currentDocId ? { ...d, content: editorRef.current?.innerHTML || '' } : d
            ));
        }
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top App Bar */}
      <div className="h-10 bg-brand-900 flex items-center justify-between px-4 shrink-0 z-30 text-white">
         <div className="flex items-center gap-2">
             <FileText size={16} className="text-brand-200"/>
             <span className="font-semibold text-sm tracking-wide">ManuscriptMint</span>
             <span className="text-brand-400 text-xs mx-2">|</span>
             <span className="text-xs text-brand-100 opacity-90 truncate max-w-[300px]">{currentDoc?.title}</span>
         </div>

         <div className="flex items-center gap-4">
            <span className="text-xs text-brand-200">
               {currentDoc?.wordCount || 0} words
            </span>
            <button 
                onClick={handleDownload}
                className="text-brand-100 hover:text-white transition-colors flex items-center gap-1.5 px-2 py-1 hover:bg-brand-800 rounded" 
                title="Download HTML"
            >
                <Download size={14} />
                <span className="hidden sm:inline text-xs font-medium">Export</span>
            </button>
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel 
          documents={documents}
          currentDocId={currentDocId}
          onSelectDoc={handleSelectDoc}
          onNewDoc={createNewDocument}
          onDeleteDoc={handleDeleteDoc}
        />
        
        {/* Editor Area Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
            <EditorToolbar onFormat={handleFormat} activeFormats={activeFormats} />
            
            <div className="flex-1 overflow-hidden relative">
                <Editor 
                    content={currentDoc?.content || ''}
                    onContentChange={(newHtml) => {
                        setDocuments(prev => prev.map(d => 
                            d.id === currentDocId ? { ...d, content: newHtml } : d
                        ));
                    }}
                    suggestions={suggestions}
                    activeSuggestionId={null}
                    onTextSelection={setSelectedText}
                    editorRef={editorRef}
                    activeFormats={activeFormats}
                    setActiveFormats={setActiveFormats}
                    handleFormat={handleFormat}
                />
            </div>
        </div>

        <RightPanel 
          selectedText={selectedText}
          documentContent={currentDoc?.content}
          onInsertContent={(content) => {
             handleAiAction({ type: 'action', scope: 'selection', content });
          }}
          onAiAction={handleAiAction}
        />
      </div>
    </div>
  );
};

export default App;
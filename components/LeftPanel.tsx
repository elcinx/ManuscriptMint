import React from 'react';
import { Document, DocStatus } from '../types';
import { FileText, FolderOpen, Plus, Trash2 } from 'lucide-react';

interface LeftPanelProps {
  documents: Document[];
  currentDocId: string;
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
  onDeleteDoc: (id: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ documents, currentDocId, onSelectDoc, onNewDoc, onDeleteDoc }) => {
  const getStatusColor = (status: DocStatus) => {
    switch(status) {
      case DocStatus.NEEDS_REVIEW: return 'bg-amber-100 text-amber-700';
      case DocStatus.IN_REVIEW: return 'bg-blue-100 text-blue-700';
      case DocStatus.REVIEWED: return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-brand-900 font-bold text-lg">
          <div className="w-8 h-8 bg-brand-900 rounded-md flex items-center justify-center text-white">
            <FileText size={18} />
          </div>
          <span>ManuscriptMint</span>
        </div>
      </div>

      {/* Library Title */}
      <div className="p-4 flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <FolderOpen size={14} /> Library
        </h3>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{documents.length} Files</span>
      </div>

      {/* Search (Visual Only) */}
      <div className="px-4 mb-4">
        <input 
          type="text" 
          placeholder="Search documents..." 
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Doc List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {documents.map(doc => (
          <div 
            key={doc.id}
            className={`group relative flex items-center rounded-lg transition-all border ${
              currentDocId === doc.id 
              ? 'bg-brand-50 border-brand-200 shadow-sm' 
              : 'bg-white border-transparent hover:bg-gray-50'
            }`}
          >
            <button
              onClick={() => onSelectDoc(doc.id)}
              className="flex-1 text-left p-3 pr-10 outline-none w-full"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1.5 rounded ${currentDocId === doc.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${currentDocId === doc.id ? 'text-brand-900' : 'text-gray-700'}`}>
                    {doc.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.lastEdited}</p>
                  <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            </button>
            
            {/* Delete Button (Appears on Hover) - Clean & Robust */}
            <div className="absolute right-2 top-2 bottom-2 flex items-start pt-1">
                 <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onDeleteDoc(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all z-20 cursor-pointer"
                    title="Delete Document"
                 >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onNewDoc}
          className="flex items-center justify-center gap-2 w-full bg-brand-900 hover:bg-brand-800 text-white py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Document
        </button>
      </div>
    </div>
  );
};

export default LeftPanel;
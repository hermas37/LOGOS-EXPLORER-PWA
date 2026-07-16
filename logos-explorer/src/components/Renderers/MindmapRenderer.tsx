import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, ChevronDown, ChevronRight, Folder, FolderOpen, Tag, HelpCircle, Compass } from 'lucide-react';
import { MindmapNode } from '../../types';

interface MindmapRendererProps {
  mindmapData: MindmapNode;
}

interface TreeNodeProps {
  node: MindmapNode;
  depth?: number;
  key?: React.Key;
}

// Recursive Node Component
function TreeNode({ node, depth = 0 }: TreeNodeProps) {
  const isLeaf = !node.children || node.children.length === 0;
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    if (!isLeaf) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="relative pl-4 select-none">
      {/* Connector lines to show node tree connections */}
      {depth > 0 && (
        <div
          className="absolute left-1 top-0 bottom-0 border-l-2 border-dashed border-slate-800"
          style={{ height: isLeaf ? '1.25rem' : '100%' }}
        />
      )}

      <div className="flex items-start gap-1.5 py-1.5 relative">
        {/* Horizontal connector line */}
        {depth > 0 && (
          <div className="absolute left-[-12px] top-[15px] w-[12px] border-t-2 border-dashed border-slate-800" />
        )}

        {/* Toggle icon for expandable nodes */}
        {!isLeaf ? (
          <button
            onClick={toggleExpand}
            className="p-0.5 rounded hover:bg-slate-800 text-amber-500 hover:text-amber-400 active:scale-90 transition-all z-10"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-amber-500/80 shadow-md shadow-amber-500/20" />
          </div>
        )}

        {/* Node Content Card */}
        <div
          onClick={toggleExpand}
          className={`flex-grow p-2 rounded-lg border text-left cursor-pointer transition-all ${
            isLeaf
              ? 'border-slate-800/80 bg-slate-950/40 text-slate-300 text-xs hover:border-slate-700 hover:bg-slate-900/40'
              : 'border-slate-700 bg-slate-900/50 text-slate-100 font-medium text-xs md:text-sm shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {!isLeaf ? (
              isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400/80" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500/80" />
              )
            ) : (
              <Tag className="w-3 h-3 text-amber-400/80" />
            )}
            <span className="leading-relaxed font-sans">{node.name}</span>
          </div>
        </div>
      </div>

      {/* Children Nodes rendering */}
      <AnimatePresence initial={false}>
        {!isLeaf && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pl-2 overflow-hidden"
          >
            {node.children?.map((child, idx) => (
              <TreeNode key={idx} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MindmapRenderer({ mindmapData }: MindmapRendererProps) {
  const [allExpanded, setAllExpanded] = useState(true);

  if (!mindmapData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
        <p>No mindmap data available.</p>
      </div>
    );
  }

  return (
    <div id="mindmap-renderer-container" className="space-y-5 pb-24">
      {/* Mindmap Title and Controls bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Concept Mind Map
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Collapsible Node Tree
        </div>
      </div>

      <p className="text-xs text-slate-400 font-mono border-l-2 border-[#d97706]/50 pl-3 py-1">
        🌿 <span className="text-amber-300 font-medium">Map:</span> Deepen your understanding of relationships. Tap collapsible folders to explore parent-child conceptual roots.
      </p>

      {/* Tree Wrapper */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 overflow-x-auto min-h-[300px]">
        {/* Top-level Root Indicator */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Timeless Divine Perspective Peak
          </span>
        </div>

        <div className="border-l-2 border-dashed border-slate-800 pl-1 ml-3">
          <TreeNode node={mindmapData} depth={0} />
        </div>
      </div>

      <div className="text-[10px] text-center text-slate-500 italic font-sans px-4">
        "All branches align under the unifying melody of the divine Logos."
      </div>
    </div>
  );
}

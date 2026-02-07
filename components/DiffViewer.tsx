"use client";

import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
}

interface DiffLine {
  left?: {
    num: number;
    text: string;
    type: 'removed' | 'common' | 'empty';
  };
  right?: {
    num: number;
    text: string;
    type: 'added' | 'common' | 'empty';
  };
}

export function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
  const diffRows = useMemo(() => {
    // Ensure we are working with strings
    const oldStr = oldValue || "";
    const newStr = newValue || "";

    const diff = Diff.diffLines(oldStr, newStr);
    const rows: DiffLine[] = [];
    
    let leftLineNum = 1;
    let rightLineNum = 1;
    
    const blocks: { type: 'common' | 'removed' | 'added' | 'changed', oldLines: string[], newLines: string[] }[] = [];
    
    for (let i = 0; i < diff.length; i++) {
       const part = diff[i];
       // Handle splitting and ignore last empty split if caused by trailing newline
       let lines = part.value.split('\n');
       if (lines.length > 0 && lines[lines.length - 1] === '') {
           lines.pop();
       }
       
       if (part.removed) {
         // Check next part for 'changed' block logic
         if (i + 1 < diff.length && diff[i+1].added) {
            const nextPart = diff[i+1];
            let nextLines = nextPart.value.split('\n');
            if (nextLines.length > 0 && nextLines[nextLines.length - 1] === '') {
                nextLines.pop();
            }
            blocks.push({ type: 'changed', oldLines: lines, newLines: nextLines });
            i++; // Skip the next 'added' part as we processed it
         } else {
            blocks.push({ type: 'removed', oldLines: lines, newLines: [] });
         }
       } else if (part.added) {
          blocks.push({ type: 'added', oldLines: [], newLines: lines });
       } else {
          blocks.push({ type: 'common', oldLines: lines, newLines: lines });
       }
    }
    
    // Generate rows from blocks
    blocks.forEach(block => {
        if (block.type === 'common') {
            block.oldLines.forEach(line => {
                rows.push({
                    left: { num: leftLineNum++, text: line, type: 'common' },
                    right: { num: rightLineNum++, text: line, type: 'common' }
                });
            });
        } else if (block.type === 'changed') {
            const count = Math.max(block.oldLines.length, block.newLines.length);
            for (let j = 0; j < count; j++) {
                const oldLine = block.oldLines[j];
                const newLine = block.newLines[j];
                rows.push({
                    left: oldLine !== undefined ? { num: leftLineNum++, text: oldLine, type: 'removed' } : { num: -1, text: '', type: 'empty' },
                    right: newLine !== undefined ? { num: rightLineNum++, text: newLine, type: 'added' } : { num: -1, text: '', type: 'empty' }
                });
            }
        } else if (block.type === 'removed') {
            block.oldLines.forEach(line => {
                rows.push({
                    left: { num: leftLineNum++, text: line, type: 'removed' },
                    right: { num: -1, text: '', type: 'empty' } 
                });
            });
        } else if (block.type === 'added') {
             block.newLines.forEach(line => {
                rows.push({
                    left: { num: -1, text: '', type: 'empty' },
                    right: { num: rightLineNum++, text: line, type: 'added' }
                });
            });
        }
    });

    // Check if empty
    if (rows.length === 0) {
        return [];
    }
    
    return rows;
  }, [oldValue, newValue]);

  if (!oldValue && !newValue) {
    return <div className="text-center p-4 text-muted-foreground">No content</div>;
  }

  return (
    <div className="font-mono text-xs border border-border rounded-md overflow-hidden bg-card flex flex-col h-full max-h-[70vh]">
       <div className="grid grid-cols-2 divide-x divide-border bg-muted/50 border-b border-border sticky top-0 z-10">
          <div className="p-2 text-center text-muted-foreground font-medium">Original</div>
          <div className="p-2 text-center text-muted-foreground font-medium">Current (Draft)</div>
       </div>
       <div className="overflow-auto custom-scrollbar flex-1 bg-background">
           <table className="w-full border-collapse table-fixed">
               <colgroup>
                   <col className="w-10" />
                   <col />
                   <col className="w-10" />
                   <col />
               </colgroup>
               <tbody>
                  {diffRows.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No changes</td></tr>
                  ) : (
                      diffRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/5 group">
                              {/* Left */}
                              <td className={`text-right pr-2 select-none text-[10px] py-0.5 border-r border-border/30 text-muted-foreground/40 bg-muted/10`}>
                                 {row.left?.num !== -1 ? row.left?.num : ''}
                              </td>
                              <td className={`whitespace-pre-wrap break-all px-2 py-0.5 border-r border-border ${getRowClass(row.left?.type)}`}>
                                 {row.left?.text}
                              </td>
                              
                              {/* Right */}
                               <td className={`text-right pr-2 select-none text-[10px] py-0.5 border-r border-border/30 text-muted-foreground/40 bg-muted/10`}>
                                 {row.right?.num !== -1 ? row.right?.num : ''}
                              </td>
                              <td className={`whitespace-pre-wrap break-all px-2 py-0.5 ${getRowClass(row.right?.type)}`}>
                                 {row.right?.text}
                              </td>
                          </tr>
                      ))
                  )}
               </tbody>
           </table>
       </div>
    </div>
  );
}

function getRowClass(type?: string) {
    if (type === 'removed') return 'bg-red-500/10 text-red-700 dark:text-red-400 decoration-red-900/20';
    if (type === 'added') return 'bg-green-500/10 text-green-700 dark:text-green-400 decoration-green-900/20';
    if (type === 'empty') return 'bg-muted/5 select-none'; // filler
    return 'text-foreground/80';
}

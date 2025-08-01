import React, { useState } from 'react';
import {type NodeProps, useReactFlow} from 'reactflow';
import { X, Minus, Square } from 'lucide-react';
import NodeFlow from "@/routes/main/canvas/NodeFlow.tsx";

const MacOSNode: React.FC<NodeProps> = (props) => {
  const { setNodes } = useReactFlow();
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const handleClose = () => {
    setNodes((nds) => nds.filter((node) => node.id !== props.id));
  };

  const handleMinimize = () => {
    setMinimized(!minimized);
  };

  const handleMaximize = () => {
    setMaximized(!maximized);
  };

  return (
    <div
      className={`border transition-all cursor-auto
        ${maximized ? 'w-full' : 'w-auto h-auto'} ${minimized ? '' : ''}`}
    >
      <div
        className="flex relative items-center border-b bg-zinc-900 justify-between px-2 py-1 cursor-move drag-handle"
      >
        <div className="flex space-x-2">
          <button onClick={handleClose} className={`w-3 h-3 cursor-pointer bg-zinc-950  hover:bg-red-500 rounded-full flex items-center justify-center`}>
            <X size={6}  />
          </button>
          <button onClick={handleMinimize} className={`w-3 h-3 cursor-pointer ${!minimized ? "bg-zinc-950" : "bg-amber-600"} hover:bg-yellow-500 rounded-full flex items-center justify-center`}>
            <Minus size={6} />
          </button>
          <button onClick={handleMaximize} className="w-3 h-3 cursor-pointer bg-zinc-950 hover:bg-green-500 rounded-full flex items-center justify-center">
            <Square size={6} />
          </button>
        </div>
      </div>

      {!minimized && <NodeFlow {...props} selected={true} />}
    </div>
  );
};

export default MacOSNode;

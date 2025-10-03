import React, { useCallback, useState } from "react";
import { Handle, type NodeProps, Position, useReactFlow } from "reactflow";
import { Minus, Square, X } from "lucide-react";
import NodeFlow from "@/routes/main/canvas/NodeFlow";
import type { FlowNodeData, NodeState } from "@/lib/canvas-types";

interface MacOSNodeProps extends NodeProps {
	data: FlowNodeData;
}

const MacOSNode: React.FC<MacOSNodeProps> = (props) => {
	const { setNodes } = useReactFlow();
	const [nodeState, setNodeState] = useState<NodeState>(
		props.data.nodeState || {
			minimized: false,
			maximized: false,
		},
	);

	const handleClose = useCallback(() => {
		if (props.data.onDelete) {
			props.data.onDelete(props.id);
		}
	}, [props.data.onDelete, props.id]);

	const handleMinimize = useCallback(() => {
		setNodeState((prev) => {
			const newState = {
				...prev,
				minimized: !prev.minimized,
			};

			// Update node data with new state
			setNodes((nds) =>
				nds.map((node) =>
					node.id === props.id
						? {
							...node,
							data: {
								...node.data,
								nodeState: newState,
							},
						}
						: node
				)
			);

			return newState;
		});
	}, [setNodes, props.id]);

	const handleMaximize = useCallback(() => {
		setNodeState((prev) => {
			const newMaximized = !prev.maximized;
			const newState = {
				...prev,
				maximized: newMaximized,
			};

			// Update node size and state in ReactFlow
			setNodes((nds) =>
				nds.map((node) =>
					node.id === props.id
						? {
							...node,
							style: {
								...node.style,
								width: newMaximized ? "100vw" : "auto",
								height: newMaximized ? "100vh" : "auto",
								zIndex: newMaximized ? 1000 : 1,
							},
							position: newMaximized ? { x: 0, y: 0 } : node.position,
							data: {
								...node.data,
								nodeState: newState,
							},
						}
						: node
				)
			);

			return newState;
		});
	}, [setNodes, props.id]);

	return (
		<div
			className={`border transition-all cursor-auto bg-zinc-900 rounded-lg overflow-hidden
        ${nodeState.maximized ? "w-full h-full" : "w-auto h-auto"} 
        ${nodeState.minimized ? "h-8" : ""}`}
		>
			{/* Auto connection handles */}
			<Handle
				type="source"
				position={Position.Right}
				id="auto-source"
				className="opacity-0 w-0 h-0"
			/>
			<Handle
				type="target"
				position={Position.Left}
				id="auto-target"
				className="opacity-0 w-0 h-0"
			/>
			<div className="flex relative items-center border-b bg-zinc-900 justify-between px-2 py-1 cursor-move drag-handle">
				<div className="flex items-center space-x-1">
					<span className="text-xs text-zinc-400 truncate max-w-32">
						{props.data.label}
					</span>
				</div>
				<div className="flex space-x-2">
					<button
						onClick={handleClose}
						className="w-3 h-3 cursor-pointer bg-zinc-950 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
						title="Close"
					>
						<X size={6} />
					</button>
					<button
						onClick={handleMinimize}
						className={`w-3 h-3 cursor-pointer transition-colors ${
							!nodeState.minimized
								? "bg-zinc-950 hover:bg-yellow-500"
								: "bg-amber-600"
						} rounded-full flex items-center justify-center`}
						title={nodeState.minimized ? "Restore" : "Minimize"}
					>
						<Minus size={6} />
					</button>
					<button
						onClick={handleMaximize}
						className={`w-3 h-3 cursor-pointer transition-colors ${
							!nodeState.maximized
								? "bg-zinc-950 hover:bg-green-500"
								: "bg-green-600"
						} rounded-full flex items-center justify-center`}
						title={nodeState.maximized ? "Restore" : "Maximize"}
					>
						<Square size={6} />
					</button>
				</div>
			</div>

			{!nodeState.minimized && <NodeFlow {...props} />}
		</div>
	);
};

export default MacOSNode;

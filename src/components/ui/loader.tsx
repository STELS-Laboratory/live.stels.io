import {motion} from "framer-motion";
import type {ReactNode} from "react";

function Loader({children}: { children: ReactNode }) {
	return (
		<motion.div
			className="fixed left-0 right-0 top-0 bottom-0 flex flex-1 flex-col justify-center items-center"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
			transition={{duration: 0.4}}
		>
			<div>
				<motion.svg
					width={38}
					height={38}
					viewBox="0 0 58 58"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<motion.g
						animate={{rotate: 360}}
						transition={{duration: 2, repeat: Infinity, ease: "linear"}}
					>
						<motion.rect
							width={40}
							height={40}
							transform="translate(9 9)"
							fill="white"
							fillOpacity={0.01}
							style={{
								mixBlendMode: "multiply",
							}}
						/>
						<motion.path
							d="M12.75 37.75V20.25C12.75 19.8056 12.9862 19.3942 13.3701 19.1702L28.3701 10.4203C28.7593 10.1933 29.2408 10.1933 29.6299 10.4203L44.6299 19.1702C45.0138 19.3942 45.25 19.8056 45.25 20.25V37.75C45.25 38.1944 45.0138 38.6057 44.6299 38.8298L29.6299 47.5798C29.2408 47.8068 28.7593 47.8068 28.3701 47.5798L13.3701 38.8298C12.9862 38.6057 12.75 38.1944 12.75 37.75ZM15.25 20.9677V37.0322L29 45.0529L42.75 37.0322V20.9677L29 12.9471L15.25 20.9677Z"
							fill="#F7A608"
						/>
					</motion.g>
					
					<motion.g
						animate={{rotate: -360}}
						transition={{duration: 2, repeat: Infinity, ease: "linear"}}
					>
						<motion.rect
							width={58}
							height={58}
							fill="white"
							fillOpacity={0.01}
							style={{
								mixBlendMode: "multiply",
							}}
						/>
						<motion.path
							d="M5.4375 41.6875V16.3125C5.4375 15.6682 5.78006 15.0717 6.33668 14.7469L28.0867 2.05936C28.6509 1.73021 29.3491 1.73021 29.9133 2.05936L51.6633 14.7469C52.2199 15.0717 52.5625 15.6682 52.5625 16.3125V41.6875C52.5625 42.3318 52.2199 42.9283 51.6633 43.2531L29.9133 55.9406C29.3491 56.2698 28.6509 56.2698 28.0867 55.9406L6.33668 43.2531C5.78006 42.9283 5.4375 42.3318 5.4375 41.6875ZM9.0625 17.3532V40.6468L29 52.2767L48.9375 40.6468V17.3532L29 5.72333L9.0625 17.3532Z"
							fill="#1A1A1A"
						/>
					</motion.g>
				</motion.svg>
			</div>
			<div className="text-zinc-200 text-[10px]">
				{children}
			</div>
		</motion.div>
	);
}

export default Loader;

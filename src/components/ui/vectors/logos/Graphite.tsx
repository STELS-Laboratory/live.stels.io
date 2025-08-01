import {motion} from "framer-motion"

interface GraphiteProps {
  primary?: string
  size: number
}

const Graphite = ({primary = "orange", size = 3}: GraphiteProps) => (
  <motion.svg
    initial={{scale: 0.9}}
    animate={{scale: 1}}
    whileTap={{scale: 0.9, outline: "none"}}
    width={size + "em"}
    height={size + "em"}
    viewBox="0 0 79 154"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M63.5042 45.679L38.982 0L14.4426 45.7111L38.9648 91.3901L63.5042 45.679ZM57.0299 45.6422L38.9442 11.9528L20.8458 45.6658L38.9315 79.3552L57.0299 45.6422Z"
      fill={primary}
    />
    <path
      d="M39.027 152.639L39.6813 153.858L59.259 117.377L65.8181 129.598L78.0223 82.4131L78.054 82.3543L39.6812 10.8507L39.027 12.0698L39.027 152.639Z"
      fill="black"
    />
    <path
      d="M39.027 152.781L38.3728 154L18.795 117.519L12.2359 129.741L0.0317116 82.5555L0 82.4966L38.3728 10.993L39.027 12.2121L39.027 152.781Z"
      fill="#4c4c4c"
    />
    <path
      d="M39.0894 46.9937L63.6116 92.6727L39.0722 138.384L14.55 92.7048L39.0894 46.9937Z"
      fill="black"
    />
    <path
      d="M39.0515 58.9466L57.1372 92.636L39.0388 126.349L20.9531 92.6597L39.0515 58.9466Z"
      fill={primary}
    />
  </motion.svg>
)
export default Graphite

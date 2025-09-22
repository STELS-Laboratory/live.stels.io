import React from "react";

interface RouteLoaderProps {
	children: React.ReactNode;
}

export const RouteLoader: React.FC<RouteLoaderProps> = ({children}) => {
	return <>{children}</>;
};

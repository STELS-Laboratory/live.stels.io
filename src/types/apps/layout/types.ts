/**
 * Layout application type definitions
 */

/**
 * Layout component props
 */
export interface LayoutProps {
	children: React.ReactNode;
}

/**
 * Navigation item structure
 */
export interface NavItem {
	key: string;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}


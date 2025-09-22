import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@/index.css';
import App from '@/App.tsx';

function generateId(length = 16): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const rootElement = document.createElement("main");
document.body.setAttribute("stels", "1.12.00");
document.body.setAttribute("module", "sonar");
document.body.setAttribute("network", "testnet");
document.body.setAttribute("session", generateId());
rootElement.className = "sonar";
document.body.appendChild(rootElement);

createRoot(rootElement).render(
	<StrictMode>
		<App/>
	</StrictMode>
);

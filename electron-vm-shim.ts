// Re-export Node.js built-in vm module
// This shim exists so electron-vite can properly externalize it
import * as vm from 'vm'
export { vm }

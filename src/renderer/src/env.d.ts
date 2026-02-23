/// <reference types="vite/client" />

import type { AppApi } from '../../preload/index'

declare global {
  interface Window {
    api: AppApi
  }
}

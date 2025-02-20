// QrCode: Custom Elements Define Library, ES Module/ES5 Target
import { defineCustomElement } from './qr-code.core.js';
import {
  BpQRCode
} from './qr-code.components.js';

export function defineCustomElements(window, opts) {
  defineCustomElement(window, [
    BpQRCode
  ], opts);
}
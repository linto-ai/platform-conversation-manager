import '../../stencil.core';
import { EventEmitter } from '../../stencil.core';
import { QRCodeAnimation, AnimationPreset } from './animations';
export declare class BpQRCode {
    qrCodeElement: HTMLElement;
    contents: string;
    protocol: string;
    moduleColor: string;
    positionRingColor: string;
    positionCenterColor: string;
    maskXToYRatio: number;
    squares: boolean;
    data: string;
    moduleCount: number;
    codeRendered: EventEmitter;
    /**
     * The first update must run after load to query the created shadowRoot for
     * slotted nodes.
     */
    componentDidLoad(): void;
    componentDidUpdate(): void;
    updateQR(): void;
    animateQRCode(animation?: AnimationPreset | QRCodeAnimation): void;
    getModuleCount(): number;
    executeAnimation(animation: QRCodeAnimation): void;
    generateQRCodeSVG(contents: string, maskCenter: boolean): string;
    render(): JSX.Element;
}

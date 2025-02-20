import { QRCodeEntity } from './animations';
export declare const distanceBetween: (x1: number, y1: number, x2: number, y2: number) => number;
declare enum HorizontalFocalPoint {
    Left = 0,
    Middle = 1,
    Right = 2
}
declare enum VerticalFocalPoint {
    Top = 0,
    Center = 1,
    Bottom = 2
}
export declare const translatePoint: (edgeLength: number) => (x: number, y: number, hFocus: HorizontalFocalPoint, vFocus: VerticalFocalPoint) => {
    adjustedX: number;
    adjustedY: number;
};
export declare const innermostPoint: (x: number, y: number, count: number, entity: QRCodeEntity) => {
    adjustedX: number;
    adjustedY: number;
};
/**
 * Derived from https://github.com/sktt/springish-css/
 */
export declare const underdampedHarmonicOscillationMaximums: (amplitude: number, stiffness: number, damping: number) => {
    time: number;
    amplitude: number;
}[];
export declare const range: (length: number, begin?: number) => number[];
export declare const scaleOscillationsToOffset: (beginningOffset: number, endingOffset: number, maximums: {
    time: number;
    amplitude: number;
}[]) => {
    offset: number;
    value: number;
}[];
export declare const applyToValues: (keyframes: {
    offset: number;
    value: number;
}[], operation: (value: number) => string | number) => {
    offset: number;
    value: string | number;
}[];
export {};

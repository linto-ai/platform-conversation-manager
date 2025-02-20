import { AddAnimationOptions } from 'just-animate/types/lib/core/types';
export declare enum QRCodeEntity {
    Module = "module",
    PositionRing = "position-ring",
    PositionCenter = "position-center",
    Icon = "icon"
}
export declare type QRCodeAnimation = (targets: any, modulePositionX: number, modulePositionY: number, count: number, entityType: QRCodeEntity) => AddAnimationOptions;
export declare enum AnimationPreset {
    FadeInTopDown = "FadeInTopDown",
    FadeInCenterOut = "FadeInCenterOut",
    RadialRipple = "RadialRipple",
    RadialRippleIn = "RadialRippleIn",
    MaterializeIn = "MaterializeIn"
}
export declare const getAnimationPreset: (name: string) => QRCodeAnimation;

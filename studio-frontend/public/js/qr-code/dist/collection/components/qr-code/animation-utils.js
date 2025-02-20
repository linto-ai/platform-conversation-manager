import { QRCodeEntity } from './animations';
export const distanceBetween = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
var HorizontalFocalPoint;
(function (HorizontalFocalPoint) {
    HorizontalFocalPoint[HorizontalFocalPoint["Left"] = 0] = "Left";
    HorizontalFocalPoint[HorizontalFocalPoint["Middle"] = 1] = "Middle";
    HorizontalFocalPoint[HorizontalFocalPoint["Right"] = 2] = "Right";
})(HorizontalFocalPoint || (HorizontalFocalPoint = {}));
var VerticalFocalPoint;
(function (VerticalFocalPoint) {
    VerticalFocalPoint[VerticalFocalPoint["Top"] = 0] = "Top";
    VerticalFocalPoint[VerticalFocalPoint["Center"] = 1] = "Center";
    VerticalFocalPoint[VerticalFocalPoint["Bottom"] = 2] = "Bottom";
})(VerticalFocalPoint || (VerticalFocalPoint = {}));
export const translatePoint = (edgeLength) => {
    return (x, y, hFocus, vFocus) => {
        return {
            adjustedX: hFocus === HorizontalFocalPoint.Left
                ? x
                : hFocus === HorizontalFocalPoint.Right
                    ? x + edgeLength
                    : x + edgeLength / 2,
            adjustedY: vFocus === VerticalFocalPoint.Top
                ? y
                : vFocus === VerticalFocalPoint.Bottom
                    ? y + edgeLength
                    : y + edgeLength / 2,
        };
    };
};
const adjustRing = translatePoint(7);
const adjustCenter = translatePoint(3);
function focalPoint(value, center, less, equal, greater) {
    return value < center ? less : value > center ? greater : equal;
}
export const innermostPoint = (x, y, count, entity) => {
    const center = count / 2;
    const horizontalFocus = focalPoint(x, center, HorizontalFocalPoint.Right, HorizontalFocalPoint.Middle, HorizontalFocalPoint.Left);
    const verticalFocus = focalPoint(y, center, VerticalFocalPoint.Bottom, VerticalFocalPoint.Center, VerticalFocalPoint.Top);
    return entity === QRCodeEntity.PositionCenter
        ? adjustCenter(x, y, horizontalFocus, verticalFocus)
        : entity === QRCodeEntity.PositionRing
            ? adjustRing(x, y, horizontalFocus, verticalFocus)
            : { adjustedX: x, adjustedY: y };
};
/**
 * Derived from https://github.com/sktt/springish-css/
 */
export const underdampedHarmonicOscillationMaximums = (amplitude, stiffness, damping) => {
    const MIN_Y = 0.01;
    const offset = 0;
    const dampingRatio = stiffness - Math.pow(damping, 2);
    if (dampingRatio < 0)
        throw new Error('This method only supports underdamped oscillation.');
    const omega = Math.sqrt(dampingRatio);
    const amp = (t) => amplitude * Math.pow(Math.E, -damping * t);
    const y = (t) => amp(t) * Math.cos(omega * t + offset);
    const yMax = (p) => (Math.atan(-damping / omega) + p * Math.PI - offset) / omega;
    const maximums = [];
    maximums.push({ time: 0, amplitude: y(0) });
    for (var a = 0; Math.abs(maximums[maximums.length - 1].amplitude) > MIN_Y; a++) {
        if (yMax(a) >= 0) {
            maximums.push({ time: yMax(a), amplitude: y(yMax(a)) });
        }
    }
    return maximums;
};
export const range = (length, begin = 0) => Array.from({ length }, (_, index) => begin + index);
export const scaleOscillationsToOffset = (beginningOffset, endingOffset, maximums) => {
    const availableTime = endingOffset - beginningOffset;
    const unscaledEndTime = maximums[maximums.length - 1].time;
    const scalingFactor = availableTime / unscaledEndTime;
    return maximums.map(({ time, amplitude }) => ({
        offset: beginningOffset + time * scalingFactor,
        value: amplitude,
    }));
};
export const applyToValues = (keyframes, operation) => keyframes.map((keyframe) => ({
    offset: keyframe.offset,
    value: operation(keyframe.value),
}));

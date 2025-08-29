/**
 * Borrowed from open-source code: https://github.com/quidone/react-native-wheel-picker
 * Special thanks to the authors for their contribution to the open-source community.
 */
export const degToRad = (deg) => (Math.PI * deg) / 180;
// Calculates the height of the element after rotating it relative to the user's screen.
const calcHeight = (degree, itemHeight) => itemHeight * Math.cos(degToRad(degree));
export const calcPickerHeight = (faces, itemHeight) => {
    if (faces.length === 7) {
        return itemHeight * 5;
    }
    return faces.reduce((r, v) => r + calcHeight(Math.abs(v.deg), itemHeight), 0);
};
export const calcHeightOffsets = (itemHeight) => {
    const h1 = itemHeight / 2;
    const h2 = h1 + calcHeight(30, itemHeight);
    const h3 = h2 + calcHeight(60, itemHeight);
    return [h1, h2, h3];
};
export const createFaces = (itemHeight, visibleCount) => {
    // e.g [30, 60, 90]
    const getDegreesRelativeCenter = () => {
        const maxStep = Math.trunc((visibleCount + 2) / 2); // + 2 because there are 2 more faces at 90 degrees
        const stepDegree = 90 / maxStep;
        const result = [];
        for (let i = 1; i <= maxStep; i++) {
            result.push(i * stepDegree);
        }
        return result;
    };
    const getScreenHeightsAndOffsets = (degrees) => {
        const screenHeights = degrees.map((deg) => calcHeight(deg, itemHeight));
        const freeSpaces = screenHeights.map((screenHeight) => itemHeight - screenHeight);
        const offsets = freeSpaces.map((freeSpace, index) => {
            let offset = freeSpace / 2;
            for (let i = 0; i < index; i++) {
                offset += freeSpaces[i];
            }
            return offset;
        });
        return [screenHeights, offsets];
    };
    const getOpacity = (index) => {
        const map = {
            0: 0,
            1: 0.8,
            2: 0.9
        };
        return map[index] ?? Math.min(1, map[2] + index * 0.05);
    };
    const degrees = getDegreesRelativeCenter();
    const [screenHeight, offsets] = getScreenHeightsAndOffsets(degrees);
    const scales = [0.973, 0.9, 0.8];
    return [
        // top items
        ...degrees
            .map((degree, index) => {
            return {
                index: -1 * (index + 1),
                deg: degree,
                opacity: getOpacity(degrees.length - 1 - index),
                offsetY: -1 * offsets[index],
                scale: scales[index],
                screenHeight: screenHeight[index]
            };
        })
            .reverse(),
        // center item
        { index: 0, deg: 0, opacity: 1, offsetY: 0, scale: 1, screenHeight: itemHeight },
        // bottom items
        ...degrees.map((degree, index) => {
            return {
                index: index + 1,
                deg: -1 * degree,
                opacity: getOpacity(degrees.length - 1 - index),
                offsetY: offsets[index],
                scale: scales[index],
                screenHeight: screenHeight[index]
            };
        })
    ];
};

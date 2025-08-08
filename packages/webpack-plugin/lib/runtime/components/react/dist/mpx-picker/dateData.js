export const wrapDate = (union = '') => (num) => String(num).padStart(2, '0') + union;
export const START_YEAR = 1900;
export const END_YEAR = 2099;
export const years = Array.from({ length: 200 }, (_, index) => index + START_YEAR + '年');
export const months = Array.from({ length: 12 }, (_, index) => index + 1).map(wrapDate('月'));
export const daysInMonthLength = (year, month) => {
    return month === 2
        ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
            ? 29
            : 28
        : [4, 6, 9, 11].includes(month)
            ? 30
            : 31;
};
export const daysInMonth = (year, month) => {
    return Array.from({ length: daysInMonthLength(year, month) }, (_, index) => index + 1).map(wrapDate('日'));
};

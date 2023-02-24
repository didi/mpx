/**
 * @file common util methods
 */
/**
 * 预处理一次常量对象，处理掉不符合标识符规则的变量，目前只处理'.'，用于在JSON/style中使用的场景
 * @param {object} defs 待处理的常量
 * @returns {object} 处理完毕的常量对象
 */
declare function preProcessDefs(defs: any): any;
export { preProcessDefs };

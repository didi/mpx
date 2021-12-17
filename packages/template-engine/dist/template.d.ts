interface Component {
    nodeName: string;
    attributes: Attributes;
}
interface Components {
    [key: string]: Record<string, string>;
}
interface ComponentConfig {
    includes: Set<string>;
    exclude: Set<string>;
    thirdPartyComponents: Map<string, Set<string>>;
    runtimeComponents: Map<string, Set<string>>;
    includeAll: boolean;
    internalComponents: Map<string, Set<string>>;
}
export interface IAdapter {
    if: string;
    else: string;
    elseif: string;
    for: string;
    forItem: string;
    forIndex: string;
    key: string;
    xs?: string;
    type: string;
}
export declare type Attributes = Record<string, string>;
export declare class BaseTemplate {
    protected exportExpr: string;
    protected isSupportRecursive: boolean;
    protected supportXS: boolean;
    protected miniComponents: Components;
    protected modifyCompProps?: (compName: string, target: Record<string, string>) => Record<string, string>;
    protected modifyLoopBody?: (child: string, nodeName: string) => string;
    protected modifyLoopContainer?: (children: string, nodeName: string) => string;
    protected modifyTemplateResult?: (res: string, nodeName: string, level: number, children: string) => string;
    Adapter: IAdapter;
    /** 组件列表 */
    internalComponents: Record<string, Record<string, string>>;
    /** 可以 focus 聚焦的组件 */
    focusComponents: Set<string>;
    /** 不需要渲染子节点的元素 */
    voidElements: Set<string>;
    /** 可以递归调用自身的组件 */
    nestElements: Map<string, number>;
    private buildAttribute;
    protected replacePropName(name: string, value: string, _componentName?: string): string;
    protected createMiniComponents(components: any): any;
    protected buildBaseTemplate(): string;
    protected buildThirdPartyAttr(attrs: Set<string>): string;
    protected buildComponentTemplate(comp: Component, level: number): string;
    private getChildren;
    protected buildFocusComponentTemplte(comp: Component, level: number): string;
    protected buildStandardComponentTemplate(comp: Component, level: number): string;
    protected buildPlainTextTemplate(level: number): string;
    protected buildThirdPartyTemplate(level: number, componentConfig: ComponentConfig): string;
    protected buildBlockTemplate(level: number): string;
    protected buildContainerTemplate(level: number, restart?: boolean): string;
    protected dataKeymap(keymap: string): string;
    protected getEvents(): any;
    protected getAttrValue(value: string, _key: string, _nodeName: string): string;
    protected buildXsTemplate(): string;
    buildPageTemplate: (baseTempPath: string) => string;
    buildBaseComponentTemplate: (ext: string) => string;
    buildCustomComponentTemplate: (ext: string) => string;
    buildXScript: () => string;
    mergeComponents(ctx: any, patch: Record<string, Record<string, string>>): void;
    protected buildXSTmplName(): string;
    protected buildXSTmpExtra(): string;
}
export declare class RecursiveTemplate extends BaseTemplate {
    isSupportRecursive: boolean;
    buildTemplate: (componentConfig: ComponentConfig) => string;
}
export declare class UnRecursiveTemplate extends BaseTemplate {
    isSupportRecursive: boolean;
    private _baseLevel;
    private componentConfig;
    set baseLevel(lv: number);
    get baseLevel(): number;
    buildTemplate: (componentConfig: ComponentConfig) => string;
    protected buildFloor(level: number, components: string[], restart?: boolean): string;
    protected buildOptimizeFloor(level: number, components: string[], restart?: boolean): string;
    protected buildXSTmplName(): string;
    protected buildXSTmpExtra(): string;
}
export {};

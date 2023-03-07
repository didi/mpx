"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ad_1 = __importDefault(require("./ad"));
const block_1 = __importDefault(require("./block"));
const button_1 = __importDefault(require("./button"));
const camera_1 = __importDefault(require("./camera"));
const canvas_1 = __importDefault(require("./canvas"));
const checkbox_group_1 = __importDefault(require("./checkbox-group"));
const checkbox_1 = __importDefault(require("./checkbox"));
const cover_image_1 = __importDefault(require("./cover-image"));
const cover_view_1 = __importDefault(require("./cover-view"));
const form_1 = __importDefault(require("./form"));
const hypen_tag_name_1 = __importDefault(require("./hypen-tag-name"));
const icon_1 = __importDefault(require("./icon"));
const image_1 = __importDefault(require("./image"));
const input_1 = __importDefault(require("./input"));
const live_player_1 = __importDefault(require("./live-player"));
const live_pusher_1 = __importDefault(require("./live-pusher"));
const map_1 = __importDefault(require("./map"));
const movable_area_1 = __importDefault(require("./movable-area"));
const movable_view_1 = __importDefault(require("./movable-view"));
const navigator_1 = __importDefault(require("./navigator"));
const picker_view_column_1 = __importDefault(require("./picker-view-column"));
const picker_view_1 = __importDefault(require("./picker-view"));
const picker_1 = __importDefault(require("./picker"));
const progress_1 = __importDefault(require("./progress"));
const radio_group_1 = __importDefault(require("./radio-group"));
const radio_1 = __importDefault(require("./radio"));
const rich_text_1 = __importDefault(require("./rich-text"));
const scroll_view_1 = __importDefault(require("./scroll-view"));
const slider_1 = __importDefault(require("./slider"));
const swiper_item_1 = __importDefault(require("./swiper-item"));
const swiper_1 = __importDefault(require("./swiper"));
const switch_1 = __importDefault(require("./switch"));
const template_1 = __importDefault(require("./template"));
const text_1 = __importDefault(require("./text"));
const textarea_1 = __importDefault(require("./textarea"));
const unsupported_1 = __importDefault(require("./unsupported"));
const video_1 = __importDefault(require("./video"));
const view_1 = __importDefault(require("./view"));
const web_view_1 = __importDefault(require("./web-view"));
const wxs_1 = __importDefault(require("./wxs"));
const component_1 = __importDefault(require("./component"));
function getComponentConfigs({ warn, error }) {
    const print = ({ platform, tag, type = 'property', isError = false }) => arg => {
        if (type === 'tag') {
            error(`<${arg}> is not supported in ${platform} environment!`);
            return;
        }
        let msg;
        switch (type) {
            case 'event':
                msg = `<${tag}> does not support [bind${arg}] event in ${platform} environment!`;
                break;
            case 'property':
                msg = `<${tag}> does not support [${arg && arg.name}] property in ${platform} environment!`;
                break;
            case 'value':
                msg = `<${tag}>'s property '${arg && arg.name}' does not support '[${arg && arg.value}]' value in ${platform} environment!`;
                break;
            case 'tagRequiredProps':
                msg = `<${tag}> should have '${arg}' attr in ali environment!`;
                break;
            case 'value-attr-uniform':
                msg = `The internal attribute name of the <${tag}>'s attribute '${arg && arg.value}' is not supported in the ali environment, Please check!`;
                break;
            default:
                msg = `<${tag}>'s transform has some error happened!`;
        }
        isError ? error(msg) : warn(msg);
    };
    // 转换规则只需以微信为基准配置微信和支付宝的差异部分，比如微信和支付宝都支持但是写法不一致，或者微信支持而支付宝不支持的部分(抛出错误或警告)
    return [
        ...(0, unsupported_1.default)({ print }),
        (0, ad_1.default)({ print }),
        (0, view_1.default)({ print }),
        (0, scroll_view_1.default)({ print }),
        (0, swiper_1.default)({ print }),
        (0, swiper_item_1.default)({ print }),
        (0, movable_view_1.default)({ print }),
        (0, movable_area_1.default)({ print }),
        (0, cover_view_1.default)({ print }),
        (0, cover_image_1.default)({ print }),
        (0, text_1.default)({ print }),
        (0, rich_text_1.default)({ print }),
        (0, progress_1.default)({ print }),
        (0, button_1.default)({ print }),
        (0, checkbox_group_1.default)({ print }),
        (0, checkbox_1.default)({ print }),
        (0, radio_group_1.default)({ print }),
        (0, radio_1.default)({ print }),
        (0, form_1.default)({ print }),
        (0, input_1.default)({ print }),
        (0, picker_1.default)({ print }),
        (0, picker_view_1.default)({ print }),
        (0, picker_view_column_1.default)({ print }),
        (0, slider_1.default)({ print }),
        (0, switch_1.default)({ print }),
        (0, textarea_1.default)({ print }),
        (0, navigator_1.default)({ print }),
        (0, image_1.default)({ print }),
        (0, map_1.default)({ print }),
        (0, canvas_1.default)({ print }),
        (0, wxs_1.default)({ print }),
        (0, template_1.default)({ print }),
        (0, block_1.default)({ print }),
        (0, icon_1.default)({ print }),
        (0, web_view_1.default)({ print }),
        (0, video_1.default)({ print }),
        (0, camera_1.default)({ print }),
        (0, live_player_1.default)({ print }),
        (0, live_pusher_1.default)({ print }),
        (0, hypen_tag_name_1.default)({ print }),
        (0, component_1.default)({ print })
    ];
}
exports.default = getComponentConfigs;
//# sourceMappingURL=index.js.map
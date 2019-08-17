export const IS_EXIST_TOUCH_EVENT = window.ontouchstart === null;
export const DEVICE_CLICK_EVENT_TYPE = (IS_EXIST_TOUCH_EVENT) ? "touchend" : "click";

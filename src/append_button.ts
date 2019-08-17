import { DEVICE_CLICK_EVENT_TYPE } from "./constants"

const BUTTON_CLASSNAME = "fixed_global_nav_opener fixed_button pc_view_hidden";
const BUTTON_ID = "fixedGlobalNavOpener";
const BUTTON_TITLE = "メニューを開く";

/**
 * 追従ボタンをbodyに追加する
 * @param  callback クリック時に起こすコールバック関数を受け取る
 */
export const appendFixedButton = (callback: Function) => {
  const buttonEl = document.createElement("button");
  buttonEl.type = "button";
  buttonEl.className = BUTTON_CLASSNAME;
  buttonEl.id = BUTTON_ID;
  buttonEl.title = BUTTON_TITLE;

  const svgIcon = createSvgIcon();
  buttonEl.appendChild(svgIcon);

  buttonEl.addEventListener(DEVICE_CLICK_EVENT_TYPE, () => callback());
  document.body.appendChild(buttonEl);
}

/**
 * ページトップへ戻るアイコンとなるSVG要素を生成して返す
 * icon material: material.io baseline-arrow_upward
 * @return 生成したSVG要素
 */
const createSvgIcon = (): SVGElement => {
  // XML namespace
  const NAMESPACE = "http://www.w3.org/2000/svg";

  // create svg element
  const svgEl = document.createElementNS(NAMESPACE, "svg");
  svgEl.setAttribute("viewBox", "0 0 24 24");
  svgEl.setAttribute("class", "svg_icon icon_menu");
  svgEl.setAttribute("role", "img");

  // create svg title element
  const titleEl = document.createElementNS(NAMESPACE,"title");
  titleEl.textContent = BUTTON_TITLE;
  svgEl.appendChild(titleEl);

  // create svg path element
  const pathEl = document.createElementNS(NAMESPACE, "path");
  pathEl.setAttribute("class", "svg_main_color");
  pathEl.setAttribute("d", "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z");
  svgEl.appendChild(pathEl);

  return svgEl;
}

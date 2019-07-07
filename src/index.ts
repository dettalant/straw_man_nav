// 決め打ちのid名やらclass名たち
const
  // グローバルナビゲーションコンテナid名
  NAV_CONTAINER_ID = "globalNavContainer",
  // 親要素id名
  NAV_ID = "globalNav",
  // クリック可能要素class名
  NAV_CLIP_NAME = "global_nav_clip",
  // クリックすると現れる要素class名
  NAV_CLIP_WRAPPER_NAME = "global_nav_clip_wrapper",
  // スマホ版グローバルナビゲーションを開閉するボタン
  NAV_OPENER_ID = "globalNavOpener",
  // 要素に付与してページに変化を起こすclass名
  STATE_OPENED = "is_opened",
  // モーダル要素を表示させるclass名
  STATE_VISIBLE = "is_visible";

class NavManagerError implements Error {
  public name = "NavManagerError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

/**
 * NavManager初期化時のエラー。主に必須HTMLElementを取得できなかった際の致命的エラーを扱う。
 * @param targetName [description]
 */
class InitializeError extends NavManagerError {}

class NavManager {
  globalNav: HTMLElement;
  globalNavContainer: HTMLElement;
  globalNavClips: HTMLCollectionOf<Element>;
  globalNavOpener: HTMLElement;
  modalShadow: HTMLElement;

  constructor() {
    const globalNavContainer = document.getElementById(NAV_CONTAINER_ID);
    if (globalNavContainer === null) {
      throw new InitializeError("#" + NAV_CONTAINER_ID + "の取得ができませんでした");
    }

    const globalNav = document.getElementById(NAV_ID);
    if (globalNav === null) {
      throw new InitializeError("#" + NAV_ID + "の取得ができませんでした");
    }

    const globalNavClips = globalNav.getElementsByClassName(NAV_CLIP_NAME);
    if (globalNavClips === null) {
      throw new InitializeError("." + NAV_CLIP_NAME + "の取得ができませんでした");
    }

    const globalNavOpener = document.getElementById(NAV_OPENER_ID);
    if (globalNavOpener === null) {
      throw new InitializeError("#" + NAV_OPENER_ID + "の取得ができませんでした");
    }

    this.globalNav = globalNav;
    this.globalNavContainer = globalNavContainer;
    this.globalNavClips = globalNavClips;
    this.globalNavOpener = globalNavOpener;
    this.modalShadow = this.createModalShadowElement();

    // インスタンス生成時にdocument.bodyへと追加
    document.body.appendChild(this.modalShadow);
  }

  /**
   * スマホ版スライドグローバルナビゲーションを開く
   */
  openSlideNavMenu() {
    this.globalNavContainer.classList.add(STATE_OPENED);
    this.modalShadow.classList.add(STATE_VISIBLE);
  }

  /**
   * スマホ版スライドグローバルナビゲーションを閉じる
   */
  closeSlideNavMenu() {
    // 速度的な効果があるかは知らないけど、
    // とりあえずクラス名にSTATE_OPENEDが入っているかどうかの判定をしておく
    if (this.globalNavContainer.className.indexOf(STATE_OPENED) !== -1) {
      this.globalNavContainer.classList.remove(STATE_OPENED);
    }
    this.modalShadow.classList.remove(STATE_VISIBLE);
  }

  /**
   * 単一のドロップダウンメニューを開く
   * @param  el ドロップダウンのボタン要素。 see NAV_CLIP_NAME
   */
  openDropDownClip(el: Element) {
    if (el instanceof HTMLElement) {
      // スマホ版グローバルナビゲーション表示のために、子要素の高さをdatasetに追加する
      el.style.maxHeight = el.scrollHeight + "px";
    }

    el.classList.add(STATE_OPENED);
  }

  /**
   * 単一のドロップダウンメニューを閉じる
   * @param  el ドロップダウンのボタン要素。 see NAV_CLIP_NAME
   */
  closeDropDownClip(el: Element) {
    if (el instanceof HTMLElement) {
      // ドロップダウン展開時に付与するmax-height値を削除しておく
      el.style.maxHeight = "";
    }

    el.classList.remove(STATE_OPENED);
  }

  /**
   * 全てのドロップダウンメニューを問答無用で閉じる
   */
  closeDropDownClipAll() {
    // 全ての`.global_nav_clip`要素のクラス名からSTATE_OPENEDの中身を消去
    const navClipsLen = this.globalNavClips.length;
    for (let i = 0; i < navClipsLen; i++) {
      const clip = this.globalNavClips[i];
      this.closeDropDownClip(clip);
    }
  }

  /**
   * クリックしたら開閉するドロップダウンメニューのクラス名変更処理
   * TODO: この処理がどうも洗練されてないので修正したい
   * @param  el クラス名変更対象とする要素
   */
  clickEventHandler(el: Element) {
    if (el.className.indexOf(STATE_OPENED) !== -1) {
      // クリックした要素のクラス名にSTATE_OPENED内容が存在する場合はメニューを閉じるだけ
      this.closeDropDownClip(el)
      return;
    }

    // クリックした要素のクラス名にSTATE_OPENED内容が存在しなければ、
    // 全てのドロップダウンを閉じてから一つを開く
    this.closeDropDownClipAll();

    // クリックした要素だけ再度展開する
    this.openDropDownClip(el);
  }

  /**
   * 入力されたクリックイベントから、その他要素がクリックされたかどうかを判定する
   * @param  event      クリックイベントのステート変数
   * @param  classNames 判定するクラス名を入れたarray
   * @return その他要素がクリックされたのならtrue
   */
  isOtherElementsClick(e: MouseEvent, classNames: string[]): boolean {

    // どれも対処しにくいエラーだけど実害がないやつなので、そのままオーケー扱いとする
    // return時にはtrue、特に意味のない場所をクリックした扱いにしておく
    if (e.target === null) {
      return true;
    } else if (!(e.target instanceof Element)) {
      return true;
    } else if (e.target.parentElement === null) {
      // <html>か<body>をクリックした時の処理
      return true;
    }

    const tagName = e.target.tagName.toUpperCase();
    let checkEl;
    if (tagName === "USE") {
      // <use>要素の場合は親の親要素を取得
      checkEl = e.target.parentElement.parentElement;
    } else if (tagName === "SVG") {
      // <svg>要素の場合は親要素を取得
      checkEl = e.target.parentElement;
    } else {
      // その他要素の場合はそのまま取得
      checkEl = e.target;
    }

    if (checkEl === null) {
      return true;
    }

    const checkElementClassName = checkEl.className;
    const classNamesLen = classNames.length;
    for (let i = 0; i < classNamesLen; i++) {
      if (checkElementClassName.indexOf(classNames[i]) !== -1) {
        // array内の文字列を含んでいたら早期リターン
        return false;
      }
    }

    // names配列内文字列を含んでいない = 関係ない要素をクリックした扱いとする
    return true;
  }

  /**
   * ふわっと辺りを暗くするモーダルシャドウのための要素を生成
   * @return 生成したモーダルシャドウElement
   */
  createModalShadowElement(): HTMLElement {
    const modalEl = document.createElement("div");
    modalEl.classList.add("modal_shadow");
    return modalEl;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // NavManagerクラスの初期化
  const navManager = new NavManager();

  // 他要素をクリックした際の処理をイベント登録
  document.addEventListener("click", function(e) {
    const checkNames = [NAV_CLIP_NAME, NAV_CLIP_WRAPPER_NAME];
    if (navManager.isOtherElementsClick(e, checkNames)) {
      // ボタン以外をクリックした際の処理
      // 全てのドロップダウンメニューを閉じる
      navManager.closeDropDownClipAll();
    }
  }, false);

  // グローバルナビゲーション内のリスト格納要素をクリックした際の処理をイベント登録
  const navClipsLen = navManager.globalNavClips.length;
  for (let i = 0; i < navClipsLen; i++) {
    let clip = navManager.globalNavClips[i]
    clip.addEventListener("click", () => {
      navManager.clickEventHandler(clip);
    }, false);
  }

  // グローバルナビゲーション開閉ボタンをクリックした際の処理をイベント登録
  navManager.globalNavOpener.addEventListener("click", () => {
    navManager.openSlideNavMenu()
  }, false);

  navManager.modalShadow.addEventListener("click", () => {
    navManager.closeSlideNavMenu();
  }, false)

  // resize時にスマホ版表示グローバルナビゲーションを閉じる処理を、
  // 負荷軽減させつつ行う
  let timeoutId: number = 0;
  window.addEventListener("resize", () => {
    if (timeoutId) {
      return;
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = 0;
      navManager.closeSlideNavMenu();
      navManager.closeDropDownClipAll();
    }, 200)
  }, false)
})

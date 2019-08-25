import { IS_EXIST_TOUCH_EVENT, DEVICE_CLICK_EVENT_TYPE } from "./constants"

class NavManagerError implements Error {
  public name = "NavManagerError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

interface NavManagerState {
  // スワイプ操作が行われた場合にはtrueとなる
  isSwiping: boolean;
  // モーダル展開時に一時保管するスクロール量
  scrollY: number;
}

interface NavManagerInitArgs {
  navContainerId: string;
  navId: string;
  navClipClassName: string;
  navClipWrapperClassName: string;
  navCloseElClassName: string;
  navClipUncloseElClassName: string;
  navOpenerId: string;
  stateOpened: string;
  stateVisible: string;
}

/**
 * NavManager初期化時のエラー。主に必須HTMLElementを取得できなかった際の致命的エラーを扱う。
 * @param targetName [description]
 */
class InitializeError extends NavManagerError {}

export default class NavManager {
  args: NavManagerInitArgs;
  globalNav: HTMLElement;
  globalNavContainer: HTMLElement;
  globalNavClips: HTMLCollectionOf<Element>;
  globalNavOpener: HTMLElement;
  globalNavCloseElements: HTMLCollectionOf<Element>;
  modalShadow: HTMLElement;
  states: NavManagerState = {
    isSwiping: false,
    scrollY: 0,
  };

  constructor(initArgs?: NavManagerInitArgs) {
    this.args = (initArgs) ? initArgs : {
      navContainerId: "globalNavContainer",
      navId: "globalNav",
      navClipClassName: "global_nav_clip",
      navClipWrapperClassName: "global_nav_clip_wrapper",
      navCloseElClassName: "is_close_global_nav",
      navClipUncloseElClassName: "is_unclose_global_nav_clip",
      navOpenerId: "globalNavOpener",
      stateOpened: "is_opened",
      stateVisible: "is_visible",
    }

    this.globalNavCloseElements = document.getElementsByClassName(this.args.navCloseElClassName)

    const globalNavContainer = document.getElementById(this.args.navContainerId);
    if (globalNavContainer === null) {
      throw new InitializeError("#" + this.args.navContainerId + "の取得ができませんでした");
    }

    const globalNav = document.getElementById(this.args.navId);
    if (globalNav === null) {
      throw new InitializeError("#" + this.args.navId + "の取得ができませんでした");
    }

    const globalNavClips = globalNav.getElementsByClassName(this.args.navClipClassName);
    if (globalNavClips === null) {
      throw new InitializeError("." + this.args.navClipClassName + "の取得ができませんでした");
    }

    const globalNavOpener = document.getElementById(this.args.navOpenerId);
    if (globalNavOpener === null) {
      throw new InitializeError("#" + this.args.navOpenerId + "の取得ができませんでした");
    }

    this.globalNav = globalNav;
    this.globalNavContainer = globalNavContainer;
    this.globalNavClips = globalNavClips;
    this.globalNavOpener = globalNavOpener;
    this.modalShadow = this.createModalShadowElement();

    // インスタンス生成時にdocument.bodyへと追加
    document.body.appendChild(this.modalShadow);

    if (IS_EXIST_TOUCH_EVENT) {
      this.appendSwipeValidationEvent();
    }
  }

  /**
   * スマホ版スライドグローバルナビゲーションを開く
   */
  openSlideNavMenu() {
    // モーダルウィンドウ展開時はbodyのスクロールを止める
    this.pinBodyScroll();

    this.globalNavContainer.classList.add(this.args.stateOpened);
    this.modalShadow.classList.add(this.args.stateVisible);
  }

  /**
   * スマホ版スライドグローバルナビゲーションを閉じる
   */
  closeSlideNavMenu() {
    // 一時的に止めていたbodyスクロールを再開させる
    this.unpinBodyScroll();

    // 速度的な効果があるかは知らないけど、
    // とりあえずクラス名にthis.args.stateOpenedが入っているかどうかの判定をしておく
    if (this.globalNavContainer.className.indexOf(this.args.stateOpened) !== -1) {
      this.globalNavContainer.classList.remove(this.args.stateOpened);
    }
    this.modalShadow.classList.remove(this.args.stateVisible);
  }

  /**
   * document.bodyのスクロールを止める
   * またその際のスクロール位置を取得しておく
   */
  pinBodyScroll() {
    this.states.scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + this.states.scrollY + "px";
  }

  /**
   * document.bodyのスクロールを再開させる
   */
  unpinBodyScroll() {
    document.body.style.position = "";
    document.body.style.top = "";

    if (this.states.scrollY !== 0) {
      // scrollYが0の際はバグを防ぐため、またそうする意味もないのでスクロールはさせない
      window.scrollTo(0, this.states.scrollY);
    }
  }

  /**
   * 単一のドロップダウンメニューを開く
   * @param  el ドロップダウンのボタン要素。 see this.args.navClipClassName
   */
  openDropDownClip(el: Element) {
    // 一部スマホではel.scrollHeightで求めている値を取得できてないっぽいので
    // 自前で値を足し合わせる
    const calcScrollHeight = (el: HTMLElement): number => {
      let result = 0;

      const loopLen = el.children.length;
      for (let i = 0; i < loopLen; i++) {
        const childEl = el.children[i];
        if (childEl instanceof HTMLElement) {
          const scrollHeight = childEl.scrollHeight;
          const offsetHeight = childEl.offsetHeight;

          // scrollHeightとoffsetHeightのどちらか高い方を足し合わせる
          result += (scrollHeight > offsetHeight) ? scrollHeight : offsetHeight;
        }
      }

      return result;
    }

    if (el instanceof HTMLElement) {
      // スマホ版グローバルナビゲーション表示のために、子要素の高さをdatasetに追加する
      el.style.maxHeight = calcScrollHeight(el) + "px";
    }

    el.classList.add(this.args.stateOpened);
  }

  /**
   * 単一のドロップダウンメニューを閉じる
   * @param  el ドロップダウンのボタン要素。 see this.args.navClipClassName
   */
  closeDropDownClip(el: Element) {
    if (el instanceof HTMLElement) {
      // ドロップダウン展開時に付与するmax-height値を削除しておく
      el.style.maxHeight = "";
    }

    el.classList.remove(this.args.stateOpened);
  }

  /**
   * 全てのドロップダウンメニューを問答無用で閉じる
   */
  closeDropDownClipAll() {
    // 全ての`.global_nav_clip`要素のクラス名からthis.args.stateOpenedの中身を消去
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
    if (el.className.indexOf(this.args.stateOpened) !== -1) {
      // クリックした要素のクラス名にthis.args.stateOpened内容が存在する場合はメニューを閉じるだけ
      this.closeDropDownClip(el)
      return;
    }

    // クリックした要素のクラス名にthis.args.stateOpened内容が存在しなければ、
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
  isOtherElementsClick(e: MouseEvent | TouchEvent, classNames: string[]): boolean {

    // どれも対処しにくいエラーだけど実害がないやつなので、そのままオーケー扱いとする
    // return時にはtrue、特に意味のない場所をクリックした扱いにしておく
    if (e.target === null) {
      return true;
    } else if (!(e.target instanceof Element)) {
      return true;
    }

    // Jqueryのclosest的な挙動の関数。引数にとったtagNameと一致する、一番近い親要素を返す。
    // もしdocumentまで遡ってしまったらdocumentを返す。
    const closestElement = (el: Element, name: string): Element => {
      const elTagName = el.tagName.toUpperCase();
      const tagName = name.toUpperCase();
      if (elTagName === tagName) {
        return el;
      } else if (elTagName !== tagName && el.parentElement !== null) {
        return closestElement(el.parentElement, tagName);
      }
      return el;
    }

    // グローバルナビゲーション項目の親要素は両方ともdivなのでそれを鑑みて取得
    const checkEl = closestElement(e.target, "div");

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
   * クリックされた要素が「クリックするとグローバルナビゲーションを閉じる要素」だった場合
   * trueを返す
   *
   * @param  e クリックイベントかタッチイベント
   * @return   グローバルナビゲーションを閉じる要素をクリックしていたらtrue
   */
  isCloseElementClick(e: MouseEvent | TouchEvent): boolean {
    let isClickCloseEl = false;

    if (e.target instanceof HTMLElement
      && e.target.className.indexOf(this.args.navCloseElClassName) !== -1
    ) {
      isClickCloseEl = true;
    }

    return isClickCloseEl;
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

  /**
   * swipe時にtouchendをキャンセルする処理のために、
   * swipeを行っているかを判定するイベントを追加する
   */
  appendSwipeValidationEvent() {
    // スマホ判定を一応行っておく
    if (IS_EXIST_TOUCH_EVENT) {
      // touchend指定時の、スワイプ判定追加記述
      // NOTE: 若干やっつけ気味
      window.addEventListener("touchstart", () => {
        this.states.isSwiping = false;
      });

      window.addEventListener("touchmove", () => {
        if (!this.states.isSwiping) {
          // 無意味な上書きは一応避ける
          this.states.isSwiping = true;
        }
      })
    }
  }

  /**
   * 外部から呼び出すことを想定している各種イベント登録関数
   */
  public registerNavEvents() {
    // 他要素をクリックした際の処理をイベント登録
    document.addEventListener(DEVICE_CLICK_EVENT_TYPE, (e) => {
      if (this.states.isSwiping) {
        return;
      }

      const checkNames = [this.args.navClipClassName, this.args.navClipWrapperClassName];
      if (this.isOtherElementsClick(e, checkNames)) {
        // ボタン以外をクリックした際の処理
        // 全てのドロップダウンメニューを閉じる
        this.closeDropDownClipAll();
      }
    }, false);

    // グローバルナビゲーション内のリスト格納要素をクリックした際の処理をイベント登録
    const navClipsLen = this.globalNavClips.length;
    for (let i = 0; i < navClipsLen; i++) {
      let clip = this.globalNavClips[i]
      clip.addEventListener(DEVICE_CLICK_EVENT_TYPE, (e) => {
        if (this.states.isSwiping
          || e.target instanceof HTMLElement && e.target.className.indexOf(this.args.navClipUncloseElClassName) !== -1
        ){
          return;
        }

        this.clickEventHandler(clip);
      }, false);
    }

    // グローバルナビゲーション開閉ボタンをクリックした際の処理をイベント登録
    this.globalNavOpener.addEventListener(DEVICE_CLICK_EVENT_TYPE, () => {
      if (this.states.isSwiping) return;

      this.openSlideNavMenu()
    }, false);

    const closeSlideNavMenuHandler = () => {
      if (this.states.isSwiping) return;

      this.closeSlideNavMenu();
    }

    this.modalShadow.addEventListener(DEVICE_CLICK_EVENT_TYPE, closeSlideNavMenuHandler, false)

    // グローバルナビゲーションを閉じるクラス名が付与されている要素にもイベントをつけておく
    const globalNavCloseElementsLen = this.globalNavCloseElements.length;
    for (let i = 0; i < globalNavCloseElementsLen; i++) {
      const el = this.globalNavCloseElements[i];
      el.addEventListener(DEVICE_CLICK_EVENT_TYPE, closeSlideNavMenuHandler, false);
    }
  }
}

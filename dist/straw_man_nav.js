/*!
 *   straw_man_nav.js
 * See {@link https://github.com/dettalant/straw_man_nav}
 *
 * @author dettalant
 * @version v0.4.0
 * @license MIT License
 */
var strawManNav = (function () {
  'use strict';

  var IS_EXIST_TOUCH_EVENT = window.ontouchstart === null;
  var DEVICE_CLICK_EVENT_TYPE = (IS_EXIST_TOUCH_EVENT) ? "touchend" : "click";

  var NavManagerError = function NavManagerError(message) {
      this.message = message;
      this.name = "NavManagerError";
  };
  NavManagerError.prototype.toString = function toString () {
      return this.name + ": " + this.message;
  };
  /**
   * NavManager初期化時のエラー。主に必須HTMLElementを取得できなかった際の致命的エラーを扱う。
   * @param targetName [description]
   */
  var InitializeError = /*@__PURE__*/(function (NavManagerError) {
      function InitializeError () {
          NavManagerError.apply(this, arguments);
      }if ( NavManagerError ) InitializeError.__proto__ = NavManagerError;
      InitializeError.prototype = Object.create( NavManagerError && NavManagerError.prototype );
      InitializeError.prototype.constructor = InitializeError;

      

      return InitializeError;
  }(NavManagerError));
  var NavManager = function NavManager(initArgs) {
      this.states = {
          isSwiping: false,
          scrollY: 0,
      };
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
      };
      this.globalNavCloseElements = document.getElementsByClassName(this.args.navCloseElClassName);
      var globalNavContainer = document.getElementById(this.args.navContainerId);
      if (globalNavContainer === null) {
          throw new InitializeError("#" + this.args.navContainerId + "の取得ができませんでした");
      }
      var globalNav = document.getElementById(this.args.navId);
      if (globalNav === null) {
          throw new InitializeError("#" + this.args.navId + "の取得ができませんでした");
      }
      var globalNavClips = globalNav.getElementsByClassName(this.args.navClipClassName);
      if (globalNavClips === null) {
          throw new InitializeError("." + this.args.navClipClassName + "の取得ができませんでした");
      }
      var globalNavOpener = document.getElementById(this.args.navOpenerId);
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
  };
  /**
   * スマホ版スライドグローバルナビゲーションを開く
   */
  NavManager.prototype.openSlideNavMenu = function openSlideNavMenu () {
      // モーダルウィンドウ展開時はbodyのスクロールを止める
      this.pinBodyScroll();
      this.globalNavContainer.classList.add(this.args.stateOpened);
      this.modalShadow.classList.add(this.args.stateVisible);
  };
  /**
   * スマホ版スライドグローバルナビゲーションを閉じる
   */
  NavManager.prototype.closeSlideNavMenu = function closeSlideNavMenu () {
      // 一時的に止めていたbodyスクロールを再開させる
      this.unpinBodyScroll();
      // 速度的な効果があるかは知らないけど、
      // とりあえずクラス名にthis.args.stateOpenedが入っているかどうかの判定をしておく
      if (this.globalNavContainer.className.indexOf(this.args.stateOpened) !== -1) {
          this.globalNavContainer.classList.remove(this.args.stateOpened);
      }
      this.modalShadow.classList.remove(this.args.stateVisible);
  };
  /**
   * document.bodyのスクロールを止める
   * またその際のスクロール位置を取得しておく
   */
  NavManager.prototype.pinBodyScroll = function pinBodyScroll () {
      this.states.scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + this.states.scrollY + "px";
  };
  /**
   * document.bodyのスクロールを再開させる
   */
  NavManager.prototype.unpinBodyScroll = function unpinBodyScroll () {
      document.body.style.position = "";
      document.body.style.top = "";
      if (this.states.scrollY !== 0) {
          // scrollYが0の際はバグを防ぐため、またそうする意味もないのでスクロールはさせない
          window.scrollTo(0, this.states.scrollY);
      }
  };
  /**
   * 単一のドロップダウンメニューを開く
   * @param  el ドロップダウンのボタン要素。 see this.args.navClipClassName
   */
  NavManager.prototype.openDropDownClip = function openDropDownClip (el) {
      // 一部スマホではel.scrollHeightで求めている値を取得できてないっぽいので
      // 自前で値を足し合わせる
      var calcScrollHeight = function (el) {
          var result = 0;
          var loopLen = el.children.length;
          for (var i = 0; i < loopLen; i++) {
              var childEl = el.children[i];
              if (childEl instanceof HTMLElement) {
                  var scrollHeight = childEl.scrollHeight;
                  var offsetHeight = childEl.offsetHeight;
                  // scrollHeightとoffsetHeightのどちらか高い方を足し合わせる
                  result += (scrollHeight > offsetHeight) ? scrollHeight : offsetHeight;
              }
          }
          return result;
      };
      if (el instanceof HTMLElement) {
          // スマホ版グローバルナビゲーション表示のために、子要素の高さをdatasetに追加する
          el.style.maxHeight = calcScrollHeight(el) + "px";
      }
      el.classList.add(this.args.stateOpened);
  };
  /**
   * 単一のドロップダウンメニューを閉じる
   * @param  el ドロップダウンのボタン要素。 see this.args.navClipClassName
   */
  NavManager.prototype.closeDropDownClip = function closeDropDownClip (el) {
      if (el instanceof HTMLElement) {
          // ドロップダウン展開時に付与するmax-height値を削除しておく
          el.style.maxHeight = "";
      }
      el.classList.remove(this.args.stateOpened);
  };
  /**
   * 全てのドロップダウンメニューを問答無用で閉じる
   */
  NavManager.prototype.closeDropDownClipAll = function closeDropDownClipAll () {
      // 全ての`.global_nav_clip`要素のクラス名からthis.args.stateOpenedの中身を消去
      var navClipsLen = this.globalNavClips.length;
      for (var i = 0; i < navClipsLen; i++) {
          var clip = this.globalNavClips[i];
          this.closeDropDownClip(clip);
      }
  };
  /**
   * クリックしたら開閉するドロップダウンメニューのクラス名変更処理
   * TODO: この処理がどうも洗練されてないので修正したい
   * @param  el クラス名変更対象とする要素
   */
  NavManager.prototype.clickEventHandler = function clickEventHandler (el) {
      if (el.className.indexOf(this.args.stateOpened) !== -1) {
          // クリックした要素のクラス名にthis.args.stateOpened内容が存在する場合はメニューを閉じるだけ
          this.closeDropDownClip(el);
          return;
      }
      // クリックした要素のクラス名にthis.args.stateOpened内容が存在しなければ、
      // 全てのドロップダウンを閉じてから一つを開く
      this.closeDropDownClipAll();
      // クリックした要素だけ再度展開する
      this.openDropDownClip(el);
  };
  /**
   * 入力されたクリックイベントから、その他要素がクリックされたかどうかを判定する
   * @param  event  クリックイベントのステート変数
   * @param  classNames 判定するクラス名を入れたarray
   * @return その他要素がクリックされたのならtrue
   */
  NavManager.prototype.isOtherElementsClick = function isOtherElementsClick (e, classNames) {
      // どれも対処しにくいエラーだけど実害がないやつなので、そのままオーケー扱いとする
      // return時にはtrue、特に意味のない場所をクリックした扱いにしておく
      if (e.target === null) {
          return true;
      }
      else if (!(e.target instanceof Element)) {
          return true;
      }
      // Jqueryのclosest的な挙動の関数。引数にとったtagNameと一致する、一番近い親要素を返す。
      // もしdocumentまで遡ってしまったらdocumentを返す。
      var closestElement = function (el, name) {
          var elTagName = el.tagName.toUpperCase();
          var tagName = name.toUpperCase();
          if (elTagName === tagName) {
              return el;
          }
          else if (elTagName !== tagName && el.parentElement !== null) {
              return closestElement(el.parentElement, tagName);
          }
          return el;
      };
      // グローバルナビゲーション項目の親要素は両方ともdivなのでそれを鑑みて取得
      var checkEl = closestElement(e.target, "div");
      var checkElementClassName = checkEl.className;
      var classNamesLen = classNames.length;
      for (var i = 0; i < classNamesLen; i++) {
          if (checkElementClassName.indexOf(classNames[i]) !== -1) {
              // array内の文字列を含んでいたら早期リターン
              return false;
          }
      }
      // names配列内文字列を含んでいない = 関係ない要素をクリックした扱いとする
      return true;
  };
  /**
   * クリックされた要素が「クリックするとグローバルナビゲーションを閉じる要素」だった場合
   * trueを返す
   *
   * @param  e クリックイベントかタッチイベント
   * @return   グローバルナビゲーションを閉じる要素をクリックしていたらtrue
   */
  NavManager.prototype.isCloseElementClick = function isCloseElementClick (e) {
      var isClickCloseEl = false;
      if (e.target instanceof HTMLElement
          && e.target.className.indexOf(this.args.navCloseElClassName) !== -1) {
          isClickCloseEl = true;
      }
      return isClickCloseEl;
  };
  /**
   * ふわっと辺りを暗くするモーダルシャドウのための要素を生成
   * @return 生成したモーダルシャドウElement
   */
  NavManager.prototype.createModalShadowElement = function createModalShadowElement () {
      var modalEl = document.createElement("div");
      modalEl.classList.add("modal_shadow");
      return modalEl;
  };
  /**
   * swipe時にtouchendをキャンセルする処理のために、
   * swipeを行っているかを判定するイベントを追加する
   */
  NavManager.prototype.appendSwipeValidationEvent = function appendSwipeValidationEvent () {
          var this$1 = this;

      // スマホ判定を一応行っておく
      if (IS_EXIST_TOUCH_EVENT) {
          // touchend指定時の、スワイプ判定追加記述
          // NOTE: 若干やっつけ気味
          window.addEventListener("touchstart", function () {
              this$1.states.isSwiping = false;
          });
          window.addEventListener("touchmove", function () {
              if (!this$1.states.isSwiping) {
                  // 無意味な上書きは一応避ける
                  this$1.states.isSwiping = true;
              }
          });
      }
  };
  /**
   * 外部から呼び出すことを想定している各種イベント登録関数
   */
  NavManager.prototype.registerNavEvents = function registerNavEvents () {
          var this$1 = this;

      // 他要素をクリックした際の処理をイベント登録
      document.addEventListener(DEVICE_CLICK_EVENT_TYPE, function (e) {
          if (this$1.states.isSwiping) {
              return;
          }
          var checkNames = [this$1.args.navClipClassName, this$1.args.navClipWrapperClassName];
          if (this$1.isOtherElementsClick(e, checkNames)) {
              // ボタン以外をクリックした際の処理
              // 全てのドロップダウンメニューを閉じる
              this$1.closeDropDownClipAll();
          }
      }, false);
      // グローバルナビゲーション内のリスト格納要素をクリックした際の処理をイベント登録
      var navClipsLen = this.globalNavClips.length;
      var loop = function ( i ) {
          var clip = this$1.globalNavClips[i];
          clip.addEventListener(DEVICE_CLICK_EVENT_TYPE, function (e) {
              if (this$1.states.isSwiping
                  || e.target instanceof HTMLElement && e.target.className.indexOf(this$1.args.navClipUncloseElClassName) !== -1) {
                  return;
              }
              this$1.clickEventHandler(clip);
          }, false);
      };

          for (var i = 0; i < navClipsLen; i++) loop( i );
      // グローバルナビゲーション開閉ボタンをクリックした際の処理をイベント登録
      this.globalNavOpener.addEventListener(DEVICE_CLICK_EVENT_TYPE, function () {
          if (this$1.states.isSwiping)
              { return; }
          this$1.openSlideNavMenu();
      }, false);
      var closeSlideNavMenuHandler = function () {
          if (this$1.states.isSwiping)
              { return; }
          this$1.closeSlideNavMenu();
      };
      this.modalShadow.addEventListener(DEVICE_CLICK_EVENT_TYPE, closeSlideNavMenuHandler, false);
      // グローバルナビゲーションを閉じるクラス名が付与されている要素にもイベントをつけておく
      var globalNavCloseElementsLen = this.globalNavCloseElements.length;
      for (var i$1 = 0; i$1 < globalNavCloseElementsLen; i$1++) {
          var el = this.globalNavCloseElements[i$1];
          el.addEventListener(DEVICE_CLICK_EVENT_TYPE, closeSlideNavMenuHandler, false);
      }
  };

  return NavManager;

}());

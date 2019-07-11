/*!
 *   straw_man_nav.js
 * See {@link https://github.com/dettalant/straw_man_nav}
 *
 * @author dettalant
 * @version v0.2.2
 * @license MIT License
 */
(function () {
  'use strict';

  // 決め打ちのid名やらclass名たち
  var 
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
  STATE_VISIBLE = "is_visible", DEVICE_CLICK_EVENT_TYPE = (window.ontouchend === null) ? "touchend" : "click";
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
  var NavManager = function NavManager() {
      var globalNavContainer = document.getElementById(NAV_CONTAINER_ID);
      if (globalNavContainer === null) {
          throw new InitializeError("#" + NAV_CONTAINER_ID + "の取得ができませんでした");
      }
      var globalNav = document.getElementById(NAV_ID);
      if (globalNav === null) {
          throw new InitializeError("#" + NAV_ID + "の取得ができませんでした");
      }
      var globalNavClips = globalNav.getElementsByClassName(NAV_CLIP_NAME);
      if (globalNavClips === null) {
          throw new InitializeError("." + NAV_CLIP_NAME + "の取得ができませんでした");
      }
      var globalNavOpener = document.getElementById(NAV_OPENER_ID);
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
  };
  /**
   * スマホ版スライドグローバルナビゲーションを開く
   */
  NavManager.prototype.openSlideNavMenu = function openSlideNavMenu () {
      this.globalNavContainer.classList.add(STATE_OPENED);
      this.modalShadow.classList.add(STATE_VISIBLE);
  };
  /**
   * スマホ版スライドグローバルナビゲーションを閉じる
   */
  NavManager.prototype.closeSlideNavMenu = function closeSlideNavMenu () {
      // 速度的な効果があるかは知らないけど、
      // とりあえずクラス名にSTATE_OPENEDが入っているかどうかの判定をしておく
      if (this.globalNavContainer.className.indexOf(STATE_OPENED) !== -1) {
          this.globalNavContainer.classList.remove(STATE_OPENED);
      }
      this.modalShadow.classList.remove(STATE_VISIBLE);
  };
  /**
   * 単一のドロップダウンメニューを開く
   * @param  el ドロップダウンのボタン要素。 see NAV_CLIP_NAME
   */
  NavManager.prototype.openDropDownClip = function openDropDownClip (el) {
      if (el instanceof HTMLElement) {
          // スマホ版グローバルナビゲーション表示のために、子要素の高さをdatasetに追加する
          el.style.maxHeight = el.scrollHeight + "px";
      }
      el.classList.add(STATE_OPENED);
  };
  /**
   * 単一のドロップダウンメニューを閉じる
   * @param  el ドロップダウンのボタン要素。 see NAV_CLIP_NAME
   */
  NavManager.prototype.closeDropDownClip = function closeDropDownClip (el) {
      if (el instanceof HTMLElement) {
          // ドロップダウン展開時に付与するmax-height値を削除しておく
          el.style.maxHeight = "";
      }
      el.classList.remove(STATE_OPENED);
  };
  /**
   * 全てのドロップダウンメニューを問答無用で閉じる
   */
  NavManager.prototype.closeDropDownClipAll = function closeDropDownClipAll () {
      // 全ての`.global_nav_clip`要素のクラス名からSTATE_OPENEDの中身を消去
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
      if (el.className.indexOf(STATE_OPENED) !== -1) {
          // クリックした要素のクラス名にSTATE_OPENED内容が存在する場合はメニューを閉じるだけ
          this.closeDropDownClip(el);
          return;
      }
      // クリックした要素のクラス名にSTATE_OPENED内容が存在しなければ、
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
      else if (e.target.parentElement === null) {
          // <html>か<body>をクリックした時の処理
          return true;
      }
      var tagName = e.target.tagName.toUpperCase();
      var checkEl;
      if (tagName === "USE") {
          // <use>要素の場合は親の親要素を取得
          checkEl = e.target.parentElement.parentElement;
      }
      else if (tagName === "SVG") {
          // <svg>要素の場合は親要素を取得
          checkEl = e.target.parentElement;
      }
      else {
          // その他要素の場合はそのまま取得
          checkEl = e.target;
      }
      if (checkEl === null) {
          return true;
      }
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
   * ふわっと辺りを暗くするモーダルシャドウのための要素を生成
   * @return 生成したモーダルシャドウElement
   */
  NavManager.prototype.createModalShadowElement = function createModalShadowElement () {
      var modalEl = document.createElement("div");
      modalEl.classList.add("modal_shadow");
      return modalEl;
  };
  document.addEventListener("DOMContentLoaded", function () {
      // NavManagerクラスの初期化
      var navManager = new NavManager();
      // 他要素をクリックした際の処理をイベント登録
      document.addEventListener(DEVICE_CLICK_EVENT_TYPE, function (e) {
          var checkNames = [NAV_CLIP_NAME, NAV_CLIP_WRAPPER_NAME];
          if (navManager.isOtherElementsClick(e, checkNames)) {
              // ボタン以外をクリックした際の処理
              // 全てのドロップダウンメニューを閉じる
              navManager.closeDropDownClipAll();
          }
      }, false);
      // グローバルナビゲーション内のリスト格納要素をクリックした際の処理をイベント登録
      var navClipsLen = navManager.globalNavClips.length;
      var loop = function ( i ) {
          var clip = navManager.globalNavClips[i];
          clip.addEventListener(DEVICE_CLICK_EVENT_TYPE, function () {
              navManager.clickEventHandler(clip);
          }, false);
      };

      for (var i = 0; i < navClipsLen; i++) loop( i );
      // グローバルナビゲーション開閉ボタンをクリックした際の処理をイベント登録
      navManager.globalNavOpener.addEventListener(DEVICE_CLICK_EVENT_TYPE, function () {
          navManager.openSlideNavMenu();
      }, false);
      navManager.modalShadow.addEventListener(DEVICE_CLICK_EVENT_TYPE, function () {
          navManager.closeSlideNavMenu();
      }, false);
      // resize時にスマホ版表示グローバルナビゲーションを閉じる処理を、
      // 負荷軽減させつつ行う
      var timeoutId = 0;
      window.addEventListener("resize", function () {
          if (timeoutId) {
              return;
          }
          timeoutId = window.setTimeout(function () {
              timeoutId = 0;
              navManager.closeSlideNavMenu();
              navManager.closeDropDownClipAll();
          }, 200);
      }, false);
  });

}());

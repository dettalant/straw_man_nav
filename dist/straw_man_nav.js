(function () {
  'use strict';

  // 決め打ちのid名やらclass名たち
  var  
  // クリック可能要素class名
  NAV_CLIP_NAME = "global_nav_clip", 
  // クリックすると現れる要素class名
  NAV_CLIP_WRAPPER_NAME = "global_nav_clip_wrapper", 
  // 要素に付与してページに変化を起こすclass名
  TARGET_STATE_NAME = "is_opened";
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
  var NavManager = function NavManager(targetName) {
      var globalNav = document.getElementById("globalNav");
      if (globalNav === null) {
          throw new InitializeError("#globalNavでの取得ができませんでした");
      }
      var globalNavClips = globalNav.getElementsByClassName("global_nav_clip");
      if (globalNavClips === null) {
          throw new InitializeError(".global_nav_clipでの取得ができませんでした");
      }
      this.globalNav = globalNav;
      this.globalNavClips = globalNavClips;
      this.targetStateName = targetName;
  };
  /**
   * 全てのドロップダウンメニューを問答無用で閉じる
   */
  NavManager.prototype.closeDropDownAll = function closeDropDownAll () {
      // 全ての`.global_nav_clip`要素からクラス名を消去
      var navClipsLen = this.globalNavClips.length;
      for (var i = 0; i < navClipsLen; i++) {
          this.globalNavClips[i].classList.remove(this.targetStateName);
      }
  };
  /**
   * クリックしたら開閉するドロップダウンメニューのクラス名変更処理
   * @param  el クラス名変更対象とする要素
   */
  NavManager.prototype.clickEventHandler = function clickEventHandler (el) {
      if (el.className.indexOf(this.targetStateName) !== -1) {
          // クリックした要素のクラス名に`is_opened`が存在する場合はメニューを閉じるだけ
          el.classList.remove(this.targetStateName);
          return;
      }
      this.closeDropDownAll();
      // クリックした要素にだけ再度クラス名を付与
      el.classList.add(this.targetStateName);
  };
  /**
   * 入力されたクリックイベントから、その他要素がクリックされたかどうかを判定する
   * @param  event  クリックイベントのステート変数
   * @param  classNames 判定するクラス名を入れたarray
   */
  NavManager.prototype.isOtherElementsClick = function isOtherElementsClick (e, classNames) {
      // どれも対処しにくいエラーだけど実害が少ないやつなので、consoleに流すだけして放置
      // return時にはtrue、特に意味のない場所をクリックした扱いにしておく
      if (e.target === null) {
          console.error("取得したMouseEventにTargetがなかった");
          return true;
      }
      else if (!(e.target instanceof Element)) {
          console.error("取得したMouseEventTargetがElementを継承していないやつだった");
          return true;
      }
      else if (e.target.parentElement === null) {
          console.error("取得したMouseEvent Targetに親要素がなかった");
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
          console.error("MouseEventからHTMLElementを取得することができませんでした");
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
  document.addEventListener("DOMContentLoaded", function () {
      // NavManagerクラスの初期化
      var navManager = new NavManager(TARGET_STATE_NAME);
      // 他要素をクリックした際の処理をイベント登録
      document.addEventListener("click", function (e) {
          var checkNames = [NAV_CLIP_NAME, NAV_CLIP_WRAPPER_NAME];
          if (navManager.isOtherElementsClick(e, checkNames)) {
              // ボタン以外をクリックした際には全てのドロップダウンメニューを閉じる
              navManager.closeDropDownAll();
          }
      }, false);
      // 当該要素をクリックした際の処理をイベント登録
      var navClipsLen = navManager.globalNavClips.length;
      var loop = function ( i ) {
          var clip = navManager.globalNavClips[i];
          clip.addEventListener("click", function () {
              navManager.clickEventHandler(clip);
          }, false);
      };

      for (var i = 0; i < navClipsLen; i++) loop( i );
  });

}());

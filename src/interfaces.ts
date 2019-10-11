export interface NavManagerState {
  // モーダル展開時に一時保管するスクロール量
  scrollY: number;
}

export interface NavManagerInitArgs {
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

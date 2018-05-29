// Type definitions for window-size 1.0
// Project: https://github.com/jonschlinkert/window-size
// Definitions by: Rong Shen <https://github.com/jacobbubu>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace WindowSize {
  /** get the up-to-date window size. */
  interface Size {
    width: number;
    height: number;
  }

  interface API {
    /** Height of the terminal window.*/
    height: number;

    /** Width of the terminal window.*/
    width: number;

    get(): Size;
  }
}
declare module "window-size" {
  var api: WindowSize.API;
  export = api;
}

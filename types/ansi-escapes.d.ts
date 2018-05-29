/// <reference types="node" />

declare namespace Ansi {
  interface ImageOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: boolean;
  }

  interface Term {
    setCwd(cwd: string): string;
  }

  interface AnsiEscapes {
    cursorTo(x: number, y?: number): string;
    cursorMove(x: number, y?: number): string;
    cursorUp(count: number): string;
    cursorDown(count: number): string;
    cursorForward(count: number): string;
    cursorBackward(count: number): string;

    cursorLeft: string;
    cursorSavePosition: string;
    cursorRestorePosition: string;
    cursorGetPosition: string;
    cursorNextLine: string;
    cursorPrevLine: string;
    cursorHide: string;
    cursorShow: string;

    eraseLines(count: number): string;

    eraseEndLine: string;
    eraseStartLine: string;
    eraseLine: string;
    eraseDown: string;
    eraseUp: string;
    eraseScreen: string;
    scrollUp: string;
    scrollDown: string;

    clearScreen: string;
    beep: string;

    link(text: string, url: string): string;
    image(buf: Buffer, opts?: ImageOptions): string;
    iTerm: Term;
  }
}

declare module "ansi-escapes" {
  var ansiEscapes: Ansi.AnsiEscapes;
  export = ansiEscapes;
}

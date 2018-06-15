// Native
import stream = require("stream");

// Packages
import differ = require("ansi-diff-stream");
import { DiffStream } from "ansi-diff-stream";
import * as esc from "ansi-escapes";
import onKeypress = require("@derhuerst/cli-on-key");
import { Key, OffKeyPress } from "@derhuerst/cli-on-key";

// tslint:disable-next-line no-empty
const noop = () => {};

const enum ActionNames {
  First = "first",
  Abort = "abort",
  Last = "last",
  Reset = "reset",
  Next = "next",
  Submit = "submit",
  Delete = "delete",
  Up = "up",
  Down = "down",
  Right = "right",
  Left = "left"
}

// type ActionMap = { [key in ActionNames]?: (ch: string) => void };

const action = (key: Key): ActionNames | false => {
  if (key.ctrl) {
    if (key.name === "a") return ActionNames.First;
    if (key.name === "c") return ActionNames.Abort;
    if (key.name === "d") return ActionNames.Abort;
    if (key.name === "e") return ActionNames.Last;
    if (key.name === "g") return ActionNames.Reset;
  }
  if (key.name === "return") return ActionNames.Submit;
  if (key.name === "enter") return ActionNames.Submit; // ctrl + J

  if (key.name === "backspace" || key.name === "delete") return ActionNames.Delete;
  if (key.name === "escape") return ActionNames.Abort;
  if (key.name === "tab") return ActionNames.Next;

  if (key.name === "up") return ActionNames.Up;
  if (key.name === "down") return ActionNames.Down;
  if (key.name === "right") return ActionNames.Right;
  if (key.name === "left") return ActionNames.Left;

  return false;
};

const onResize = (stream: stream.Stream, cb: () => void) => {
  stream.on("resize", cb);
  const stopListening = () => {
    stream.removeListener("resize", cb);
  };
  return stopListening;
};

export interface Options {
  value?: any;
  hideCursor?: boolean;

  stdin?: stream.Readable;
  stdout?: stream.Writable;

  render?(x: boolean): void;

  _?(ch: string): void;

  [ActionNames.First]?(key: Key): void;
  [ActionNames.Abort]?(key: Key): void;
  [ActionNames.Last]?(key: Key): void;
  [ActionNames.Reset]?(key: Key): void;
  [ActionNames.Next]?(key: Key): void;
  [ActionNames.Submit]?(key: Key): void;
  [ActionNames.Delete]?(key: Key): void;
  [ActionNames.Up]?(key: Key): void;
  [ActionNames.Down]?(key: Key): void;
  [ActionNames.Left]?(key: Key): void;
  [ActionNames.Right]?(key: Key): void;

  [key: string]: any;
}

interface P extends Options {
  aborted: boolean;

  out: DiffStream;
  bell(): void;
  resume(): void;
  pause(): void;
  close(): void;
}

const wrap = (opts: Options) => {
  const p = opts as P;
  p.out = differ();
  p.value = typeof opts.value === "undefined" ? "" : opts.value;
  // p.aborted = typeof opts.aborted !== "undefined" ? opts.aborted : true;
  p.stdin = p.stdin || process.stdin;
  p.stdout = p.stdout || process.stdout;
  p.render = p.render || noop;
  p.out.pipe(p.stdout);

  if ("undefined" === typeof p.hideCursor) {
    p.hideCursor = true;
  }

  p.bell = () => {
    p.stdout.write(esc.beep);
  };
  if ("function" !== typeof p._) p._ = p.bell;

  const onKey = (key: Key) => {
    const a = action(key);
    if (a === false) p._(key.raw);
    else if ("function" === typeof p[a]) {
      p[a](key);
    } else if (a === "abort") {
      p.aborted = true;
      p.close();
    } else {
      p.stdout.write(esc.beep);
    }
  };

  const onNewSize = () => {
    p.out.reset();
    p.render(true);
  };

  let offKeypress: OffKeyPress;
  let offResize: () => void;

  const pause = () => {
    if (!offKeypress) return;
    offKeypress();
    offKeypress = undefined;
    offResize();
    offResize = undefined;
    if (p.hideCursor) {
      p.stdout.write(esc.cursorShow);
    }
  };
  p.pause = pause;
  const resume = () => {
    if (offKeypress) return;
    offKeypress = onKeypress(p.stdin, onKey);
    offResize = onResize(p.stdout, onNewSize);
    if (p.hideCursor) {
      p.stdout.write(esc.cursorHide);
    }
  };
  p.resume = resume;

  return new Promise((resolve, reject) => {
    let isClosed = false;
    const closeHandler = () => p.close();
    p.close = (): void => {
      if (isClosed) return;
      isClosed = true;

      p.out.unpipe(p.stdout);
      pause();

      process.removeListener("beforeExit", closeHandler);
      if (p.aborted) {
        reject(p.value);
      } else {
        resolve(p.value);
      }
    };
    process.addListener("beforeExit", closeHandler);

    if ("function" !== typeof p.submit) p.submit = p.close;
    resume();
    p.render(false); // false means it's not triggered by resize
  });
};

export { action, Key, ActionNames };
export default wrap;

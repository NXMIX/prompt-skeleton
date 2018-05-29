// Native
import stream = require("stream");

// Packages
import differ = require("ansi-diff-stream");
import { DiffStream } from "ansi-diff-stream";
import * as esc from "ansi-escapes";
import onKeypress = require("@derhuerst/cli-on-key");
import { Key, OffKeyPress } from "@derhuerst/cli-on-key";
import { get as termSize } from "window-size";

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

type ActionMap = { [key in ActionNames]?: (ch: string) => void };

const action = (key: Key): ActionNames | false => {
  let code = key.raw.charCodeAt(0);

  if (key.ctrl) {
    if (key.name === "a") return ActionNames.First;
    if (key.name === "c") return ActionNames.Abort;
    if (key.name === "d") return ActionNames.Abort;
    if (key.name === "e") return ActionNames.Last;
    if (key.name === "g") return ActionNames.Reset;
  }
  if (key.name === "return") return ActionNames.Submit;
  if (key.name === "enter") return ActionNames.Submit; // ctrl + J
  if (key.name === "backspace") return ActionNames.Delete;
  if (key.name === "abort") return ActionNames.Abort;
  if (key.name === "escape") return ActionNames.Abort;
  if (key.name === "tab") return ActionNames.Next;

  if (key.name === "up") return ActionNames.Up;
  if (key.name === "down") return ActionNames.Down;
  if (key.name === "right") return ActionNames.Right;
  if (key.name === "left") return ActionNames.Left;
  if (code === 8747) ActionNames.Left; // alt + B
  if (code === 402) return ActionNames.Right; // alt + F

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
  p.out.pipe(process.stdout);

  if ("undefined" === typeof p.hideCursor) {
    p.hideCursor = true;
  }

  p.bell = () => {
    process.stdout.write(esc.beep);
  };
  if ("function" !== typeof p._) p._ = p.bell;

  const onKey = (key: Key) => {
    let a = action(key);
    if (a === false) p._(key.raw);
    else if ("function" === typeof p[a]) {
      p[a](key);
    } else if (a === "abort") {
      p.close();
    } else {
      process.stdout.write(esc.beep);
    }
  };

  const onNewSize = () => {
    const { width, height } = termSize();
    p.out.reset();
    p.render(true);
  };

  let offKeypress: OffKeyPress, offResize: () => void;

  const pause = () => {
    if (!offKeypress) return;
    offKeypress();
    offKeypress = null;
    offResize();
    offResize = null;
    if (p.hideCursor) {
      p.out.write(esc.cursorShow);
    }
  };
  p.pause = pause;
  const resume = () => {
    if (offKeypress) return;
    offKeypress = onKeypress(process.stdin, onKey);
    offResize = onResize(process.stdout, onNewSize);
    if (p.hideCursor) {
      p.out.write(esc.cursorHide);
    }
  };
  p.resume = resume;

  return new Promise((resolve, reject) => {
    let isClosed = false;
    p.close = (): void => {
      if (isClosed) return null;
      isClosed = true;

      p.out.unpipe(process.stdout);
      pause();

      if (p.aborted) reject(p.value);
      else resolve(p.value);
    };
    process.on("beforeExit", () => p.close());

    if ("function" !== typeof p.submit) p.submit = p.close;
    resume();
    p.render(true);
  });
};

export { action, Key, ActionNames };
export default wrap;

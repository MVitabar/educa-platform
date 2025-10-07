declare module 'marked' {
  interface MarkedOptions {
    highlight?: (code: string, lang?: string, escaped?: boolean) => string | void;
    pedantic?: boolean;
    gfm?: boolean;
    breaks?: boolean;
    sanitize?: boolean | typeof DOMPurify.sanitize;
    smartLists?: boolean;
    smartypants?: boolean;
    xhtml?: boolean;
  }
}

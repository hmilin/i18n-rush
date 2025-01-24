import { HtmlParser } from '@angular/compiler';

const parser = new HtmlParser();

export default function parseAngularTemplate(code: string, url: string) {
  return parser.parse(code, url);
}

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('测试', () => {
  const demoDir = `${__dirname}/demo`;
  mkdirSync(demoDir, { recursive: true });
  const testHtmlFilePath = resolve(demoDir, './test.component.html');
  const testTsFilePath = resolve(demoDir, './test.component.ts');
  const testHtmlContent = `<div>测试</div>`;
  const expectedHtmlContent = `<div i18n>测试</div>\n`;
  const testTsContent = `
  import { Component } from '@angular/core';

  @Component({
    selector: 'app-test',
    template: '<div>测试</div>',
  })
  export class TestComponent {
    title = '测试标题';
  }
`;

  const expectedTsContent = `import { Component } from '@angular/core';
@Component({
  selector: 'app-test',
  template: '<div i18n>测试</div>',
})
export class TestComponent {
  title = $localize\`测试标题\`;
}
`;

  beforeAll(() => {
    writeFileSync(testHtmlFilePath, testHtmlContent, 'utf-8');
    writeFileSync(testTsFilePath, testTsContent, 'utf-8');
  });

  afterAll(() => {
    unlinkSync(testHtmlFilePath);
    unlinkSync(testTsFilePath);
  });

  it('should inject i18n keys into Angular HTML template', () => {
    execSync(`pnpm dev inject -p ${demoDir} -f angular -l ng-i18n`);

    const result = readFileSync(testHtmlFilePath, 'utf-8');
    expect(result).toBe(expectedHtmlContent);
  });

  it('should inject i18n keys into Angular TS file', () => {
    execSync(`pnpm dev inject -p ${demoDir} -f angular -l ng-i18n`);

    const result = readFileSync(testTsFilePath, 'utf-8');
    expect(result).toBe(expectedTsContent);
  });
});

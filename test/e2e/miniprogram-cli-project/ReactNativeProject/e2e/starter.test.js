describe('MPX RN DEMO Page e2e test', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  it('renders home page correctly', async () => {
    // wait for app load
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.text('MPX RN DEMO'))).toBeVisible();
  });

  it('counter increases by 2 when button is clicked', async () => {
    await expect(element(by.id('counter'))).toHaveText('0');
    await element(by.id('counterBtn')).tap();
    await expect(element(by.id('counter'))).toHaveText('2');
    await element(by.id('counterBtn')).tap();
    await expect(element(by.id('counter'))).toHaveText('4');
  });

  it('input syncs with display', async () => {
    await element(by.id('input')).replaceText('mpxTest');
    await expect(element(by.id('inputResult'))).toHaveText('mpxTest');
  });

  it('renders the list with 3 items', async () => {
    await expect(element(by.id('listItem-0'))).toBeVisible();
    await expect(element(by.id('listItem-1'))).toBeVisible();
    await expect(element(by.id('listItem-2'))).toBeVisible();
    await expect(element(by.text('Apple'))).toBeVisible();
    await expect(element(by.text('Banana'))).toBeVisible();
    await expect(element(by.text('Orange'))).toBeVisible();
  });


  it('other feature', async () => {
    // verify page2 content
    await expect(element(by.id('page2-defs'))).toBeVisible();
    await expect(element(by.id('page2-mixins'))).toBeVisible();
    await expect(element(by.id('page2-i18n'))).toBeVisible();
    await expect(element(by.id('page2-defs'))).toHaveText('defs: default def');
    await expect(element(by.id('page2-mixins'))).toHaveText('mixins data: 电视');
    await expect(element(by.id('page2-i18n'))).toHaveText('i18n: hello world');
  });

  it('should take screenshot for common', async () => {
    // screenshot for documentation/debug
    await device.takeScreenshot('common');
  });
});
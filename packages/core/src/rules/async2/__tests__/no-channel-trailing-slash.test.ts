import { outdent } from 'outdent';
import { lintDocument } from '../../../lint.js';
import { parseYamlToDocument, replaceSourceWithRef } from '../../../../__tests__/utils.js';
import { BaseResolver } from '../../../resolve.js';
import { createConfig } from '../../../config/index.js';

describe('no-channel-trailing-slash', () => {
  it('should report on trailing slash in a channel path', async () => {
    const document = parseYamlToDocument(
      outdent`
          asyncapi: '2.6.0'
          info:
            title: Excellent API
            version: 1.0.0
          channels:
            /trailing/:
              subscribe:
                message:
                  messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'no-channel-trailing-slash': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      [
        {
          "location": [
            {
              "pointer": "#/channels/~1trailing~1",
              "reportOnKey": true,
              "source": "asyncapi.yaml",
            },
          ],
          "message": "\`/trailing/\` should not have a trailing slash.",
          "ruleId": "no-channel-trailing-slash",
          "severity": "error",
          "suggest": [],
        },
      ]
    `);
  });

  it('should not report on if no trailing slash in path', async () => {
    const document = parseYamlToDocument(
      outdent`
          asyncapi: '2.6.0'
          info:
            title: Excellent API
            version: 1.0.0
          channels:
            /expected:
              subscribe:
                message:
                  messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'no-channel-trailing-slash': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`[]`);
  });

  it('should not report on trailing slash in path if the path is root', async () => {
    const document = parseYamlToDocument(
      outdent`
          asyncapi: '2.6.0'
          info:
            title: Excellent API
            version: 1.0.0
          channels:
            /:
              subscribe:
                message:
                  messageId: Message1
        `,
      'foobar.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'no-channel-trailing-slash': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`[]`);
  });
});

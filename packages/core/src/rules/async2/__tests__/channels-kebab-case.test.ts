import { outdent } from 'outdent';
import { lintDocument } from '../../../lint.js';
import { parseYamlToDocument, replaceSourceWithRef } from '../../../../__tests__/utils.js';
import { BaseResolver } from '../../../resolve.js';
import { createConfig } from '../../../config/index.js';

describe('Async2 channels-kebab-case', () => {
  it('should report on no kebab-case channel path', async () => {
    const document = parseYamlToDocument(
      outdent`
        asyncapi: '2.6.0'
        info:
          title: Cool API
          version: 1.0.0
        channels:
          NOT_A_KEBAB:
            subscribe:
              message:
                messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'channels-kebab-case': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      [
        {
          "location": [
            {
              "pointer": "#/channels/NOT_A_KEBAB",
              "reportOnKey": true,
              "source": "asyncapi.yaml",
            },
          ],
          "message": "\`NOT_A_KEBAB\` does not use kebab-case.",
          "ruleId": "channels-kebab-case",
          "severity": "error",
          "suggest": [],
        },
      ]
    `);
  });

  it('should report on snake_case in channel path', async () => {
    const document = parseYamlToDocument(
      outdent`
        asyncapi: '2.6.0'
        info:
          title: Cool API
          version: 1.0.0
        channels:
          snake_kebab:
            subscribe:
              message:
                messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'channels-kebab-case': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      [
        {
          "location": [
            {
              "pointer": "#/channels/snake_kebab",
              "reportOnKey": true,
              "source": "asyncapi.yaml",
            },
          ],
          "message": "\`snake_kebab\` does not use kebab-case.",
          "ruleId": "channels-kebab-case",
          "severity": "error",
          "suggest": [],
        },
      ]
    `);
  });

  it('should allow trailing slash in channel path with "channels-kebab-case" rule', async () => {
    const document = parseYamlToDocument(
      outdent`
        asyncapi: '2.6.0'
        info:
          title: Cool API
          version: 1.0.0
        channels:
          kebab/:
            subscribe:
              message:
                messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({
        rules: {
          'paths-kebab-case': 'error',
          'no-path-trailing-slash': 'off',
        },
      }),
    });
    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`[]`);
  });

  it('words with hyphens are allowed with "channels-kebab-case" rule', async () => {
    const document = parseYamlToDocument(
      outdent`
        asyncapi: '2.6.0'
        info:
          title: Cool API
          version: 1.0.0
        channels:
          kebab-with-longer-channel-path:
            subscribe:
              message:
                messageId: Message1
        `,
      'asyncapi.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({
        rules: {
          'paths-kebab-case': 'error',
        },
      }),
    });
    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`[]`);
  });
});

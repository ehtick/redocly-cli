import { outdent } from 'outdent';
import { lintDocument } from '../../../lint.js';
import { parseYamlToDocument, replaceSourceWithRef } from '../../../../__tests__/utils.js';
import { BaseResolver } from '../../../resolve.js';
import { createConfig } from '../../../config/index.js';

describe('no-invalid-parameter-examples', () => {
  it('should report on invalid falsy example', async () => {
    const document = parseYamlToDocument(
      outdent`
        openapi: 3.1.0
        paths:
          /results:
            get:
              parameters:
                - name: username
                  in: query
                  schema:
                    type: string
                    maxLength: 15
                  example: false
      `,
      'foobar.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await createConfig({ rules: { 'no-invalid-parameter-examples': 'error' } }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      [
        {
          "from": {
            "pointer": "#/paths/~1results/get/parameters/0",
            "source": "foobar.yaml",
          },
          "location": [
            {
              "pointer": "#/paths/~1results/get/parameters/0/example",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Example value must conform to the schema: type must be string.",
          "ruleId": "no-invalid-parameter-examples",
          "severity": "error",
          "suggest": [],
        },
      ]
    `);
  });
});

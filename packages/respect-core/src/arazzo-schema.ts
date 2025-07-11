export const operationMethod = {
  type: 'string',
  enum: [
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'head',
    'options',
    'trace',
    'connect',
    'query',
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS',
    'TRACE',
    'CONNECT',
    'QUERY',
  ],
} as const;
const openAPISourceDescriptionSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['openapi'] },
    url: { type: 'string' },
    'x-serverUrl': { type: 'string' },
  },
  additionalProperties: false,
  required: ['name', 'type', 'url'],
} as const;
const arazzoSourceDescriptionSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['arazzo'] },
    url: { type: 'string' },
  },
  additionalProperties: false,
  required: ['name', 'type', 'url'],
} as const;
export const sourceDescriptionSchema = {
  type: 'object',
  oneOf: [openAPISourceDescriptionSchema, arazzoSourceDescriptionSchema],
} as const;
const sourceDescriptionsSchema = {
  type: 'array',
  items: sourceDescriptionSchema,
} as const;
export const extendedSecurity = {
  type: 'object',
  properties: {
    schemeName: { type: 'string' },
    values: { type: 'object' },
    scheme: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['apiKey', 'http', 'oauth2', 'openIdConnect', 'mutualTLS'] },
        description: { type: 'string' },
        name: { type: 'string' },
        in: { type: 'string', enum: ['query', 'header', 'cookie'] },
        scheme: { type: 'string' },
        bearerFormat: { type: 'string' },
        flows: {
          type: 'object',
          properties: {
            implicit: {
              type: 'object',
              properties: {
                refreshUrl: { type: 'string' },
                scopes: { type: 'object', additionalProperties: { type: 'string' } },
                authorizationUrl: { type: 'string' },
              },
              required: ['authorizationUrl', 'scopes'],
            },
            password: {
              type: 'object',
              properties: {
                refreshUrl: { type: 'string' },
                scopes: { type: 'object', additionalProperties: { type: 'string' } },
                tokenUrl: { type: 'string' },
              },
              required: ['tokenUrl', 'scopes'],
            },
            clientCredentials: {
              type: 'object',
              properties: {
                refreshUrl: { type: 'string' },
                scopes: { type: 'object', additionalProperties: { type: 'string' } },
                tokenUrl: { type: 'string' },
              },
              required: ['tokenUrl', 'scopes'],
            },
            authorizationCode: {
              type: 'object',
              properties: {
                refreshUrl: { type: 'string' },
                authorizationUrl: { type: 'string' },
                scopes: { type: 'object', additionalProperties: { type: 'string' } },
                tokenUrl: { type: 'string' },
              },
              required: ['authorizationUrl', 'tokenUrl', 'scopes'],
            },
          },
        },
        openIdConnectUrl: { type: 'string' },
      },
      required: ['type'],
    },
  },
  required: ['values'],
  requiredOneOf: ['schemeName', 'scheme'],
} as const;
export const extendedSecurityList = {
  type: 'array',
  items: extendedSecurity,
} as const;
export const extendedOperation = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    method: operationMethod,
  },
  additionalProperties: false,
  required: ['url', 'method'],
} as const;
export const reusableObject = {
  type: 'object',
  properties: {
    reference: { type: 'string' },
    value: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
  },
  required: ['reference'],
  additionalProperties: false,
} as const;
export const parameter = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      properties: {
        in: { type: 'string', enum: ['header', 'query', 'path', 'cookie'] },
        name: { type: 'string' },
        value: {
          oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
        },
      },
      required: ['name', 'value'],
      additionalProperties: false,
    },
    reusableObject,
  ],
} as const;
const parameters = {
  type: 'array',
  items: parameter,
} as const;
export const infoObject = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    summary: { type: 'string' },
    version: { type: 'string' },
  },
  additionalProperties: false,
  required: ['title', 'version'],
} as const;
export const replacement = {
  type: 'object',
  properties: {
    target: { type: 'string' },
    value: {
      oneOf: [
        { type: 'string' },
        { type: 'object' },
        { type: 'array' },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
  },
} as const;
export const requestBody = {
  type: 'object',
  properties: {
    contentType: { type: 'string' },
    payload: {
      oneOf: [
        { type: 'string' },
        { type: 'object', additionalProperties: true },
        { type: 'array' },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
    encoding: { type: 'string' },
    replacements: {
      type: 'array',
      items: replacement,
    },
  },
  additionalProperties: false,
  required: ['payload'],
} as const;
export const criteriaObject = {
  type: 'object',
  properties: {
    condition: { type: 'string' },
    context: { type: 'string' },
    type: {
      oneOf: [
        { type: 'string', enum: ['regex', 'jsonpath', 'simple', 'xpath'] },
        {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['jsonpath'] },
            version: { type: 'string', enum: ['draft-goessner-dispatch-jsonpath-00'] },
          },
        },
        {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['xpath'] },
            version: { type: 'string', enum: ['xpath-30', 'xpath-20', 'xpath-10'] },
          },
        },
      ],
    },
  },
  required: ['condition'],
  additionalProperties: false,
} as const;
const criteriaObjects = {
  type: 'array',
  items: criteriaObject,
} as const;
export const onSuccessObject = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['goto', 'end'] },
    stepId: { type: 'string' },
    workflowId: { type: 'string' },
    criteria: criteriaObjects,
  },
  additionalProperties: false,
  required: ['type', 'name'],
} as const;
const onSuccessList = {
  type: 'array',
  items: {
    oneOf: [onSuccessObject, reusableObject],
  },
} as const;
export const onFailureObject = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['goto', 'retry', 'end'] },
    workflowId: { type: 'string' },
    stepId: { type: 'string' },
    retryAfter: { type: 'number' },
    retryLimit: { type: 'number' },
    criteria: criteriaObjects,
  },
  additionalProperties: false,
  required: ['type', 'name'],
} as const;
const onFailureList = {
  type: 'array',
  items: {
    oneOf: [onFailureObject, reusableObject],
  },
} as const;
export const step = {
  type: 'object',
  properties: {
    stepId: { type: 'string' },
    description: { type: 'string' },
    operationId: { type: 'string' },
    operationPath: { type: 'string' },
    workflowId: { type: 'string' },
    parameters: parameters,
    successCriteria: criteriaObjects,
    onSuccess: onSuccessList,
    onFailure: onFailureList,
    outputs: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
          },
          {
            type: 'array',
          },
          {
            type: 'boolean',
          },
          {
            type: 'number',
          },
        ],
      },
    },
    'x-operation': extendedOperation,
    'x-security': extendedSecurityList,
    requestBody: requestBody,
  },
  required: ['stepId'],
  oneOf: [
    { required: ['x-operation'] },
    { required: ['operationId'] },
    { required: ['operationPath'] },
    { required: ['workflowId'] },
  ],
} as const;
const steps = {
  type: 'array',
  items: step,
} as const;
const JSONSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'],
    },
    format: {
      type: 'string',
    },
    properties: {
      type: 'object',
      additionalProperties: true,
    },
    required: {
      type: 'array',
      items: { type: 'string' },
    },
    items: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['type'],
  additionalProperties: true,
} as const;
export const workflow = {
  type: 'object',
  properties: {
    workflowId: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    parameters: parameters,
    dependsOn: { type: 'array', items: { type: 'string' } },
    inputs: JSONSchema,
    outputs: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    },
    steps: steps,
    successActions: {
      type: 'array',
      items: {
        oneOf: [onSuccessObject, reusableObject],
      },
    },
    failureActions: {
      type: 'array',
      items: onFailureObject,
    },
    'x-security': extendedSecurityList,
  },
  additionalProperties: false,
  required: ['workflowId', 'steps'],
} as const;
const workflows = {
  type: 'array',
  items: workflow,
} as const;
export const arazzoSchema = {
  type: 'object',
  properties: {
    arazzo: { type: 'string', enum: ['1.0.0'] },
    info: infoObject,
    sourceDescriptions: sourceDescriptionsSchema,
    workflows: workflows,
    components: {
      type: 'object',
      properties: {
        inputs: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: true,
            properties: {
              type: {
                type: 'string',
              },
              properties: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['type'],
          },
        },
        parameters: {
          type: 'object',
          additionalProperties: parameter,
        },
        successActions: {
          type: 'object',
          additionalProperties: onSuccessObject,
        },
        failureActions: {
          type: 'object',
          additionalProperties: onFailureObject,
        },
      },
    },
  },
  additionalProperties: false,
  required: ['arazzo', 'info', 'sourceDescriptions', 'workflows'],
} as const;

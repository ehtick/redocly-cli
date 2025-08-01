import { type RawGovernanceConfig } from './types.js';

const minimal: RawGovernanceConfig<'built-in'> = {
  rules: {
    struct: 'error',
    'no-unresolved-refs': 'error',
  },
  oas2Rules: {
    'boolean-parameter-prefixes': 'off',
    'info-contact': 'off',
    'info-license': 'off',
    'info-license-strict': 'off',
    'no-path-trailing-slash': 'warn',
    'no-identical-paths': 'warn',
    'no-ambiguous-paths': 'warn',
    'no-invalid-schema-examples': 'off',
    'no-invalid-parameter-examples': 'off',
    'no-http-verbs-in-paths': 'off',
    'no-enum-type-mismatch': 'warn',
    'no-required-schema-properties-undefined': 'warn',
    'no-schema-type-mismatch': 'warn',
    'operation-summary': 'warn',
    'operation-operationId': 'warn',
    'operation-operationId-unique': 'warn',
    'operation-operationId-url-safe': 'warn',
    'operation-description': 'off',
    'operation-2xx-response': 'warn',
    'operation-4xx-response': 'off',
    'operation-parameters-unique': 'warn',
    'operation-tag-defined': 'off',
    'operation-singular-tag': 'off',
    'parameter-description': 'off',
    'path-declaration-must-exist': 'warn',
    'path-not-include-query': 'warn',
    'path-parameters-defined': 'warn',
    'paths-kebab-case': 'off',
    'path-http-verbs-order': 'off',
    'path-params-defined': 'off',
    'path-segment-plural': 'off',
    'required-string-property-missing-min-length': 'off',
    'response-contains-header': 'off',
    'request-mime-type': 'off',
    'response-contains-property': 'off',
    'response-mime-type': 'off',
    'security-defined': 'warn',
    'spec-strict-refs': 'off',
    'scalar-property-missing-example': 'off',
    'tag-description': 'warn',
    'tags-alphabetical': 'off',
    'no-duplicated-tag-names': 'off',
  },
  oas3_0Rules: {
    'array-parameter-serialization': 'off',
    'boolean-parameter-prefixes': 'off',
    'component-name-unique': 'off',
    'info-contact': 'off',
    'info-license': 'off',
    'info-license-strict': 'off',
    'no-ambiguous-paths': 'warn',
    'no-path-trailing-slash': 'warn',
    'no-identical-paths': 'warn',
    'no-invalid-schema-examples': 'off',
    'no-invalid-parameter-examples': 'off',
    'no-http-verbs-in-paths': 'off',
    'no-enum-type-mismatch': 'warn',
    'no-required-schema-properties-undefined': 'warn',
    'no-schema-type-mismatch': 'warn',
    'no-invalid-media-type-examples': {
      severity: 'warn',
      allowAdditionalProperties: false,
    },
    'no-server-example.com': 'warn',
    'no-server-trailing-slash': 'error',
    'no-empty-servers': 'warn',
    'no-example-value-and-externalValue': 'warn',
    'no-unused-components': 'warn',
    'no-undefined-server-variable': 'warn',
    'no-server-variables-empty-enum': 'error',
    'nullable-type-sibling': 'warn',
    'operation-summary': 'warn',
    'operation-operationId': 'warn',
    'operation-operationId-unique': 'warn',
    'operation-operationId-url-safe': 'warn',
    'operation-description': 'off',
    'operation-2xx-response': 'warn',
    'operation-4xx-response': 'off',
    'operation-4xx-problem-details-rfc7807': 'off',
    'operation-parameters-unique': 'warn',
    'operation-tag-defined': 'off',
    'operation-singular-tag': 'off',
    'parameter-description': 'off',
    'path-declaration-must-exist': 'warn',
    'path-not-include-query': 'warn',
    'path-parameters-defined': 'warn',
    'paths-kebab-case': 'off',
    'path-http-verbs-order': 'off',
    'path-params-defined': 'off',
    'path-segment-plural': 'off',
    'required-string-property-missing-min-length': 'off',
    'response-contains-header': 'off',
    'request-mime-type': 'off',
    'response-contains-property': 'off',
    'response-mime-type': 'off',
    'security-defined': 'warn',
    'spec-strict-refs': 'off',
    'scalar-property-missing-example': 'off',
    'spec-components-invalid-map-name': 'warn',
    'tag-description': 'warn',
    'tags-alphabetical': 'off',
    'no-duplicated-tag-names': 'off',
  },
  oas3_1Rules: {
    'array-parameter-serialization': 'off',
    'boolean-parameter-prefixes': 'off',
    'component-name-unique': 'off',
    'info-contact': 'off',
    'info-license': 'off',
    'info-license-strict': 'off',
    'no-path-trailing-slash': 'warn',
    'no-identical-paths': 'warn',
    'no-ambiguous-paths': 'warn',
    'no-invalid-schema-examples': 'off',
    'no-invalid-parameter-examples': 'off',
    'no-http-verbs-in-paths': 'off',
    'no-enum-type-mismatch': 'warn',
    'no-required-schema-properties-undefined': 'warn',
    'no-schema-type-mismatch': 'warn',
    'no-invalid-media-type-examples': 'warn',
    'no-server-example.com': 'warn',
    'no-server-trailing-slash': 'error',
    'no-empty-servers': 'warn',
    'no-example-value-and-externalValue': 'warn',
    'no-unused-components': 'warn',
    'no-undefined-server-variable': 'warn',
    'no-server-variables-empty-enum': 'error',
    'operation-summary': 'warn',
    'operation-operationId': 'warn',
    'operation-operationId-unique': 'warn',
    'operation-operationId-url-safe': 'warn',
    'operation-description': 'off',
    'operation-2xx-response': 'warn',
    'operation-4xx-response': 'off',
    'operation-4xx-problem-details-rfc7807': 'off',
    'operation-parameters-unique': 'warn',
    'operation-tag-defined': 'off',
    'operation-singular-tag': 'off',
    'parameter-description': 'off',
    'path-declaration-must-exist': 'warn',
    'path-not-include-query': 'warn',
    'path-parameters-defined': 'warn',
    'paths-kebab-case': 'off',
    'path-http-verbs-order': 'off',
    'path-params-defined': 'off',
    'path-segment-plural': 'off',
    'required-string-property-missing-min-length': 'off',
    'response-contains-header': 'off',
    'request-mime-type': 'off',
    'response-contains-property': 'off',
    'response-mime-type': 'off',
    'security-defined': 'warn',
    'spec-strict-refs': 'off',
    'scalar-property-missing-example': 'off',
    'spec-components-invalid-map-name': 'warn',
    'tag-description': 'warn',
    'tags-alphabetical': 'off',
    'no-duplicated-tag-names': 'off',
  },
  async2Rules: {
    'channels-kebab-case': 'off',
    'info-contact': 'off',
    'info-license-strict': 'off',
    'no-channel-trailing-slash': 'off',
    'operation-operationId': 'warn',
    'tag-description': 'warn',
    'tags-alphabetical': 'off',
    'no-duplicated-tag-names': 'off',
    'no-required-schema-properties-undefined': 'warn',
    'no-enum-type-mismatch': 'warn',
    'no-schema-type-mismatch': 'warn',
  },
  async3Rules: {
    'channels-kebab-case': 'off',
    'info-contact': 'off',
    'info-license-strict': 'off',
    'no-channel-trailing-slash': 'off',
    'operation-operationId': 'warn',
    'tag-description': 'warn',
    'tags-alphabetical': 'off',
    'no-duplicated-tag-names': 'off',
    'no-required-schema-properties-undefined': 'warn',
    'no-enum-type-mismatch': 'warn',
    'no-schema-type-mismatch': 'warn',
  },
  arazzo1Rules: {
    'criteria-unique': 'off',
    'no-criteria-xpath': 'off',
    'parameters-unique': 'off',
    'requestBody-replacements-unique': 'off',
    'sourceDescription-type': 'off',
    'sourceDescriptions-not-empty': 'off',
    'step-onSuccess-unique': 'off',
    'step-onFailure-unique': 'off',
    'stepId-unique': 'error',
    'sourceDescription-name-unique': 'off',
    'respect-supported-versions': 'off',
    'workflowId-unique': 'error',
    'workflow-dependsOn': 'off',
    'no-x-security-scheme-name-without-openapi': 'off',
    'x-security-scheme-required-values': 'off',
    'no-x-security-scheme-name-in-workflow': 'off',
    'no-required-schema-properties-undefined': 'warn',
    'no-enum-type-mismatch': 'warn',
    'no-schema-type-mismatch': 'warn',
  },
  overlay1Rules: {
    'info-contact': 'off',
  },
};

export default minimal;

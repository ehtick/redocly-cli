import type {
  Oas3SecurityScheme,
  ApiKeyAuth,
  BasicAuth,
  BearerAuth,
  OpenIDAuth,
  OAuth2Auth,
  MutualTLSAuth,
} from './openapi.js';

export interface InfoObject {
  title: string;
  description?: string;
  summary?: string;
  version: string;
}

export interface OpenAPISourceDescription {
  name: string;
  type: 'openapi';
  url: string;
  'x-serverUrl'?: string;
}

export interface ArazzoSourceDescription {
  name: string;
  type: 'arazzo';
  url: string;
}

export type SourceDescription = OpenAPISourceDescription | ArazzoSourceDescription;

export interface Parameter {
  in?: 'header' | 'query' | 'path' | 'cookie';
  name: string;
  value: string | number | boolean;
  reference?: string;
}

export type ExtendedSecurity =
  | {
      schemeName: string;
      values: Record<string, string>;
    }
  | {
      scheme: Oas3SecurityScheme;
      values: Record<string, string>;
    };

export type ResolvedSecurity =
  | {
      scheme: ApiKeyAuth;
      values: {
        apiKey: string;
      };
    }
  | {
      scheme: BasicAuth;
      values: {
        username: string;
        password: string;
      };
    }
  | {
      scheme: BearerAuth;
      values: {
        token: string;
      };
    }
  | {
      scheme: OAuth2Auth;
      values: {
        accessToken: string;
      };
    }
  | {
      scheme: OpenIDAuth;
      values: {
        accessToken: string;
      };
    }
  | {
      scheme: MutualTLSAuth;
      values: Record<string, unknown>;
    };

export interface ExtendedOperation {
  url: string;
  method:
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'head'
    | 'options'
    | 'trace'
    | 'connect'
    | 'query'
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE'
    | 'CONNECT'
    | 'QUERY';
}

export interface Replacement {
  target: string;
  value: string | object | any[];
}

export interface RequestBody {
  contentType?: string;
  payload: string | object | any[];
  encoding?: string;
  replacements?: Replacement[];
}

export interface CriteriaObject {
  condition: string;
  context?: string;
  type?:
    | 'regex'
    | 'jsonpath'
    | 'simple'
    | 'xpath'
    | {
        type: 'jsonpath';
        version: 'draft-goessner-dispatch-jsonpath-00';
      }
    | {
        type: 'xpath';
        version: 'xpath-30' | 'xpath-20' | 'xpath-10';
      };
}

export interface OnSuccessObject {
  name: string;
  type: 'goto' | 'end';
  stepId?: string;
  workflowId?: string;
  criteria?: CriteriaObject[];
}

export interface OnFailureObject {
  name: string;
  type: 'goto' | 'retry' | 'end';
  workflowId?: string;
  stepId?: string;
  retryAfter?: number;
  retryLimit?: number;
  criteria?: CriteriaObject[];
}

export interface Step {
  stepId: string;
  description?: string;
  operationId?: string;
  operationPath?: string;
  workflowId?: string;
  parameters?: Parameter[];
  successCriteria?: CriteriaObject[];
  onSuccess?: OnSuccessObject[];
  onFailure?: OnFailureObject[];
  outputs?: {
    [key: string]: string | object | any[] | boolean | number;
  };
  'x-operation'?: ExtendedOperation;
  'x-security'?: ExtendedSecurity[];
  requestBody?: RequestBody;
}

export interface Workflow {
  workflowId: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  dependsOn?: string[];
  inputs?: {
    type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
    properties?: {
      [key: string]: any;
    };
    required?: string[];
    items?: {
      [key: string]: any;
    };
  };
  outputs?: {
    [key: string]: string;
  };
  steps: Step[];
  successActions?: OnSuccessObject[];
  failureActions?: OnFailureObject[];
  'x-security'?: ExtendedSecurity[];
}

export interface ArazzoDefinition {
  arazzo: '1.0.1';
  info: InfoObject;
  sourceDescriptions: SourceDescription[];
  workflows: Workflow[];
  components?: {
    inputs?: {
      [key: string]: {
        type: string;
        properties?: {
          [key: string]: any;
        };
      };
    };
    parameters?: {
      [key: string]: Parameter;
    };
    successActions?: {
      [key: string]: OnSuccessObject;
    };
    failureActions?: {
      [key: string]: OnFailureObject;
    };
  };
}

export const VERSION_PATTERN = /^1\.0\.\d+(-.+)?$/;

export const ARAZZO_VERSIONS_SUPPORTED_BY_RESPECT = ['1.0.1'];

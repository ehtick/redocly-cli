import * as path from 'node:path';
import { red, blue, yellow, green } from 'colorette';
import { performance } from 'node:perf_hooks';
import {
  BaseResolver,
  formatProblems,
  getTotals,
  detectSpec,
  bundleDocument,
  isRef,
  dequal,
  logger,
  isString,
  isPlainObject,
  keysOf,
} from '@redocly/openapi-core';
import {
  getFallbackApisOrExit,
  printExecutionTime,
  sortTopLevelKeysForOas,
  getAndValidateFileExtension,
  writeToFileByExtension,
} from '../utils/miscellaneous.js';
import { exitWithError } from '../utils/error.js';
import { COMPONENTS, type Oas3Method, OPENAPI3_METHOD_NAMES } from './split/types.js';
import { crawl, startsWithComponents } from './split/index.js';

import type {
  Document,
  Referenced,
  Exact,
  BundleResult,
  Oas3Definition,
  Oas3_1Definition,
  Oas3Parameter,
  Oas3PathItem,
  Oas3Server,
  Oas3Tag,
  SpecVersion,
} from '@redocly/openapi-core';
import type { CommandArgs } from '../wrapper.js';
import type { VerifyConfigOptions } from '../types.js';

const Tags = 'tags';
const xTagGroups = 'x-tagGroups';
let potentialConflictsTotal = 0;

type JoinDocumentContext = {
  api: string;
  apiFilename: string;
  apiTitle?: string;
  tags: Oas3Tag[];
  potentialConflicts: any;
  tagsPrefix: string;
  componentsPrefix: string | undefined;
};

export type JoinArgv = {
  apis: string[];
  'prefix-tags-with-info-prop'?: string;
  'prefix-tags-with-filename'?: boolean;
  'prefix-components-with-info-prop'?: string;
  'without-x-tag-groups'?: boolean;
  output?: string;
} & VerifyConfigOptions;

export async function handleJoin({
  argv,
  config,
  version: packageVersion,
  collectSpecData,
}: CommandArgs<JoinArgv>) {
  const startedAt = performance.now();

  const {
    'prefix-components-with-info-prop': prefixComponentsWithInfoProp,
    'prefix-tags-with-filename': prefixTagsWithFilename,
    'prefix-tags-with-info-prop': prefixTagsWithInfoProp,
    'without-x-tag-groups': withoutXTagGroups,
    output,
  } = argv;

  const usedTagsOptions = [
    prefixTagsWithFilename && 'prefix-tags-with-filename',
    prefixTagsWithInfoProp && 'prefix-tags-with-info-prop',
    withoutXTagGroups && 'without-x-tag-groups',
  ].filter(Boolean);

  if (usedTagsOptions.length > 1) {
    return exitWithError(
      `You use ${yellow(usedTagsOptions.join(', '))} together.\nPlease choose only one!`
    );
  }

  const apis = await getFallbackApisOrExit(argv.apis, config);
  if (apis.length < 2) {
    return exitWithError(`At least 2 APIs should be provided.`);
  }

  const fileExtension = getAndValidateFileExtension(output || apis[0].path);
  const specFilename = output || `openapi.${fileExtension}`;

  const externalRefResolver = new BaseResolver(config.resolve);
  const documents = await Promise.all(
    apis.map(
      ({ path }) => externalRefResolver.resolveDocument(null, path, true) as Promise<Document>
    )
  );

  const decorators = new Set([
    ...Object.keys(config.decorators.oas3_0),
    ...Object.keys(config.decorators.oas3_1),
    ...Object.keys(config.decorators.oas2),
  ]);
  config.skipDecorators(Array.from(decorators));

  const preprocessors = new Set([
    ...Object.keys(config.preprocessors.oas3_0),
    ...Object.keys(config.preprocessors.oas3_1),
    ...Object.keys(config.preprocessors.oas2),
  ]);
  config.skipPreprocessors(Array.from(preprocessors));

  const bundleResults = await Promise.all(
    documents.map((document) =>
      bundleDocument({
        document,
        config,
        externalRefResolver: new BaseResolver(config.resolve),
      }).catch((e) => {
        exitWithError(`${e.message}: ${blue(document.source.absoluteRef)}`);
      })
    )
  );

  for (const { problems, bundle: document } of bundleResults as BundleResult[]) {
    const fileTotals = getTotals(problems);
    if (fileTotals.errors) {
      formatProblems(problems, {
        totals: fileTotals,
        version: packageVersion,
      });
      exitWithError(
        `❌ Errors encountered while bundling ${blue(
          document.source.absoluteRef
        )}: join will not proceed.`
      );
    }
  }

  let oasVersion: SpecVersion | null = null;
  for (const document of documents) {
    try {
      const version = detectSpec(document.parsed);
      collectSpecData?.(document.parsed);
      if (version !== 'oas3_0' && version !== 'oas3_1') {
        return exitWithError(
          `Only OpenAPI 3.0 and OpenAPI 3.1 are supported: ${blue(document.source.absoluteRef)}.`
        );
      }

      oasVersion = oasVersion ?? version;
      if (oasVersion !== version) {
        return exitWithError(
          `All APIs must use the same OpenAPI version: ${blue(document.source.absoluteRef)}.`
        );
      }
    } catch (e) {
      return exitWithError(`${e.message}: ${blue(document.source.absoluteRef)}.`);
    }
  }

  const joinedDef: any = {};
  const potentialConflicts = {
    tags: {},
    paths: {},
    components: {},
    webhooks: {},
  };

  addInfoSectionAndSpecVersion(documents, prefixComponentsWithInfoProp);

  for (const document of documents) {
    const openapi = document.parsed;
    const { tags, info } = openapi;
    const api = path.relative(process.cwd(), document.source.absoluteRef);
    const apiFilename = getApiFilename(api);
    const tagsPrefix = prefixTagsWithFilename
      ? apiFilename
      : getInfoPrefix(info, prefixTagsWithInfoProp, 'tags');
    const componentsPrefix = getInfoPrefix(info, prefixComponentsWithInfoProp, COMPONENTS);

    if (openapi.hasOwnProperty('x-tagGroups')) {
      logger.warn(`warning: x-tagGroups at ${blue(api)} will be skipped \n`);
    }

    const context = {
      api,
      apiFilename,
      apiTitle: info?.title,
      tags,
      potentialConflicts,
      tagsPrefix,
      componentsPrefix,
    };
    if (tags) {
      populateTags(context);
    }
    collectServers(openapi);
    collectExternalDocs(openapi, context);
    collectPaths(openapi, context);
    collectComponents(openapi, context);
    collectWebhooks(oasVersion!, openapi, context);
    if (componentsPrefix) {
      replace$Refs(openapi, componentsPrefix);
    }
  }

  iteratePotentialConflicts(potentialConflicts, withoutXTagGroups);
  const noRefs = true;

  if (potentialConflictsTotal) {
    return exitWithError(`Please fix conflicts before running ${yellow('join')}.`);
  }

  writeToFileByExtension(sortTopLevelKeysForOas(joinedDef), specFilename, noRefs);

  printExecutionTime('join', startedAt, specFilename);

  function populateTags({
    api,
    apiFilename,
    apiTitle,
    tags,
    potentialConflicts,
    tagsPrefix,
    componentsPrefix,
  }: JoinDocumentContext) {
    if (!joinedDef.hasOwnProperty(Tags)) {
      joinedDef[Tags] = [];
    }
    if (!potentialConflicts.tags.hasOwnProperty('all')) {
      potentialConflicts.tags['all'] = {};
    }
    if (withoutXTagGroups && !potentialConflicts.tags.hasOwnProperty('description')) {
      potentialConflicts.tags['description'] = {};
    }
    for (const tag of tags) {
      const entrypointTagName = addPrefix(tag.name, tagsPrefix);
      if (tag.description) {
        tag.description = addComponentsPrefix(tag.description, componentsPrefix!);
      }

      const tagDuplicate = joinedDef.tags.find((t: Oas3Tag) => t.name === entrypointTagName);

      if (tagDuplicate && withoutXTagGroups) {
        // If tag already exist and `without-x-tag-groups` option,
        // check if description are different for potential conflicts warning.
        const isTagDescriptionNotEqual =
          tag.hasOwnProperty('description') && tagDuplicate.description !== tag.description;

        potentialConflicts.tags.description[entrypointTagName].push(
          ...(isTagDescriptionNotEqual ? [api] : [])
        );
      } else if (!tagDuplicate) {
        // Instead add tag to joinedDef if there no duplicate;
        tag['x-displayName'] = tag['x-displayName'] || tag.name;
        tag.name = entrypointTagName;
        joinedDef.tags.push(tag);

        if (withoutXTagGroups) {
          potentialConflicts.tags.description[entrypointTagName] = [api];
        }
      }

      if (!withoutXTagGroups) {
        const groupName = apiTitle || apiFilename;
        createXTagGroups(groupName);
        if (!tagDuplicate) {
          populateXTagGroups(entrypointTagName, getIndexGroup(groupName));
        }
      }

      const doesEntrypointExist =
        !potentialConflicts.tags.all[entrypointTagName] ||
        (potentialConflicts.tags.all[entrypointTagName] &&
          !potentialConflicts.tags.all[entrypointTagName].includes(api));
      potentialConflicts.tags.all[entrypointTagName] = [
        ...(potentialConflicts.tags.all[entrypointTagName] || []),
        ...(!withoutXTagGroups && doesEntrypointExist ? [api] : []),
      ];
    }
  }

  function getIndexGroup(name: string): number {
    return joinedDef[xTagGroups].findIndex((item: any) => item.name === name);
  }

  function createXTagGroups(name: string) {
    if (!joinedDef.hasOwnProperty(xTagGroups)) {
      joinedDef[xTagGroups] = [];
    }

    if (!joinedDef[xTagGroups].some((g: any) => g.name === name)) {
      joinedDef[xTagGroups].push({ name, tags: [] });
    }

    const indexGroup = getIndexGroup(name);

    if (!joinedDef[xTagGroups][indexGroup].hasOwnProperty(Tags)) {
      joinedDef[xTagGroups][indexGroup][Tags] = [];
    }
  }

  function populateXTagGroups(entrypointTagName: string, indexGroup: number) {
    if (
      !joinedDef[xTagGroups][indexGroup][Tags].find((t: Oas3Tag) => t.name === entrypointTagName)
    ) {
      joinedDef[xTagGroups][indexGroup][Tags].push(entrypointTagName);
    }
  }

  function collectServers(openapi: Oas3Definition | Oas3_1Definition) {
    const { servers } = openapi;
    if (servers) {
      if (!joinedDef.hasOwnProperty('servers')) {
        joinedDef['servers'] = [];
      }
      for (const server of servers) {
        if (!joinedDef.servers.some((s: any) => s.url === server.url)) {
          joinedDef.servers.push(server);
        }
      }
    }
  }

  function collectExternalDocs(
    openapi: Oas3Definition | Oas3_1Definition,
    { api }: JoinDocumentContext
  ) {
    const { externalDocs } = openapi;
    if (externalDocs) {
      if (joinedDef.hasOwnProperty('externalDocs')) {
        logger.warn(`warning: skip externalDocs from ${blue(path.basename(api))} \n`);
        return;
      }
      joinedDef['externalDocs'] = externalDocs;
    }
  }

  function collectPaths(
    openapi: Oas3Definition | Oas3_1Definition,
    {
      apiFilename,
      apiTitle,
      api,
      potentialConflicts,
      tagsPrefix,
      componentsPrefix,
    }: JoinDocumentContext
  ) {
    const { paths } = openapi;
    const operationsSet = new Set(OPENAPI3_METHOD_NAMES);
    if (paths) {
      if (!joinedDef.hasOwnProperty('paths')) {
        joinedDef['paths'] = {};
      }

      for (const path of keysOf(paths)) {
        if (!joinedDef.paths.hasOwnProperty(path)) {
          joinedDef.paths[path] = {};
        }
        if (!potentialConflicts.paths.hasOwnProperty(path)) {
          potentialConflicts.paths[path] = {};
        }

        const pathItem = paths[path] as Oas3PathItem;

        for (const field of keysOf(pathItem)) {
          if (operationsSet.has(field as Oas3Method)) {
            collectPathOperation(pathItem, path, field as Oas3Method);
          }
          if (field === 'servers') {
            collectPathServers(pathItem, path);
          }
          if (field === 'parameters') {
            collectPathParameters(pathItem, path);
          }
          if (typeof pathItem[field] === 'string') {
            collectPathStringFields(pathItem, path, field);
          }
        }
      }
    }

    function collectPathStringFields(
      pathItem: Oas3PathItem,
      path: string | number,
      field: keyof Oas3PathItem
    ) {
      const fieldValue = pathItem[field];
      if (
        joinedDef.paths[path].hasOwnProperty(field) &&
        joinedDef.paths[path][field] !== fieldValue
      ) {
        logger.warn(`warning: different ${field} values in ${path}\n`);
        return;
      }
      joinedDef.paths[path][field] = fieldValue;
    }

    function collectPathServers(pathItem: Oas3PathItem, path: string | number) {
      if (!pathItem.servers) {
        return;
      }

      if (!joinedDef.paths[path].hasOwnProperty('servers')) {
        joinedDef.paths[path].servers = [];
      }

      for (const server of pathItem.servers) {
        let isFoundServer = false;
        for (const pathServer of joinedDef.paths[path].servers) {
          if (pathServer.url === server.url) {
            if (!isServersEqual(pathServer, server)) {
              exitWithError(`Different server values for (${server.url}) in ${path}.`);
            }
            isFoundServer = true;
          }
        }

        if (!isFoundServer) {
          joinedDef.paths[path].servers.push(server);
        }
      }
    }

    function collectPathParameters(pathItem: Oas3PathItem, path: string | number) {
      if (!pathItem.parameters) {
        return;
      }
      if (!joinedDef.paths[path].hasOwnProperty('parameters')) {
        joinedDef.paths[path].parameters = [];
      }

      for (const parameter of pathItem.parameters as Referenced<Oas3Parameter>[]) {
        let isFoundParameter = false;

        for (const pathParameter of joinedDef.paths[path]
          .parameters as Referenced<Oas3Parameter>[]) {
          // Compare $ref only if both are reference objects
          if (isRef(pathParameter) && isRef(parameter)) {
            if (pathParameter['$ref'] === parameter['$ref']) {
              isFoundParameter = true;
            }
          }
          // Compare properties only if both are reference objects
          if (!isRef(pathParameter) && !isRef(parameter)) {
            if (pathParameter.name === parameter.name && pathParameter.in === parameter.in) {
              if (!dequal(pathParameter.schema, parameter.schema)) {
                exitWithError(`Different parameter schemas for (${parameter.name}) in ${path}.`);
              }
              isFoundParameter = true;
            }
          }
        }

        if (!isFoundParameter) {
          joinedDef.paths[path].parameters.push(parameter);
        }
      }
    }

    function collectPathOperation(
      pathItem: Oas3PathItem,
      path: string | number,
      operation: Oas3Method
    ) {
      const pathOperation = pathItem[operation];

      if (!pathOperation) {
        return;
      }

      joinedDef.paths[path][operation] = pathOperation;
      potentialConflicts.paths[path][operation] = [
        ...(potentialConflicts.paths[path][operation] || []),
        api,
      ];

      const { operationId } = pathOperation;

      if (operationId) {
        if (!potentialConflicts.paths.hasOwnProperty('operationIds')) {
          potentialConflicts.paths['operationIds'] = {};
        }
        potentialConflicts.paths.operationIds[operationId] = [
          ...(potentialConflicts.paths.operationIds[operationId] || []),
          api,
        ];
      }

      const { tags, security } = joinedDef.paths[path][operation];

      if (tags) {
        joinedDef.paths[path][operation].tags = tags.map((tag: string) =>
          addPrefix(tag, tagsPrefix)
        );
        populateTags({
          api,
          apiFilename,
          apiTitle,
          tags: formatTags(tags),
          potentialConflicts,
          tagsPrefix,
          componentsPrefix,
        });
      } else {
        joinedDef.paths[path][operation]['tags'] = [addPrefix('other', tagsPrefix || apiFilename)];
        populateTags({
          api,
          apiFilename,
          apiTitle,
          tags: formatTags(['other']),
          potentialConflicts,
          tagsPrefix: tagsPrefix || apiFilename,
          componentsPrefix,
        });
      }
      if (!security && openapi.hasOwnProperty('security')) {
        joinedDef.paths[path][operation]['security'] = addSecurityPrefix(
          openapi.security,
          componentsPrefix!
        );
      } else if (pathOperation.security) {
        joinedDef.paths[path][operation].security = addSecurityPrefix(
          pathOperation.security,
          componentsPrefix!
        );
      }
    }
  }

  function isServersEqual(serverOne: Oas3Server, serverTwo: Oas3Server) {
    if (serverOne.description === serverTwo.description) {
      return dequal(serverOne.variables, serverTwo.variables);
    }

    return false;
  }

  function collectComponents(
    openapi: Oas3Definition,
    { api, potentialConflicts, componentsPrefix }: JoinDocumentContext
  ) {
    const { components } = openapi;
    if (components) {
      if (!joinedDef.hasOwnProperty(COMPONENTS)) {
        joinedDef[COMPONENTS] = {};
      }
      for (const [component, componentObj] of Object.entries(components)) {
        if (!potentialConflicts[COMPONENTS].hasOwnProperty(component)) {
          potentialConflicts[COMPONENTS][component] = {};
          joinedDef[COMPONENTS][component] = {};
        }
        for (const item of Object.keys(componentObj)) {
          const componentPrefix = addPrefix(item, componentsPrefix!);
          potentialConflicts.components[component][componentPrefix] = [
            ...(potentialConflicts.components[component][item] || []),
            { [api]: componentObj[item] },
          ];
          joinedDef.components[component][componentPrefix] = componentObj[item];
        }
      }
    }
  }

  function collectWebhooks(
    oasVersion: SpecVersion,
    openapi: Exact<Oas3Definition | Oas3_1Definition>,
    {
      apiFilename,
      apiTitle,
      api,
      potentialConflicts,
      tagsPrefix,
      componentsPrefix,
    }: JoinDocumentContext
  ) {
    const webhooks = oasVersion === 'oas3_1' ? 'webhooks' : 'x-webhooks';
    const openapiWebhooks = openapi[webhooks];
    if (openapiWebhooks) {
      if (!joinedDef.hasOwnProperty(webhooks)) {
        joinedDef[webhooks] = {};
      }
      for (const webhook of Object.keys(openapiWebhooks)) {
        joinedDef[webhooks][webhook] = openapiWebhooks[webhook];

        if (!potentialConflicts.webhooks.hasOwnProperty(webhook)) {
          potentialConflicts.webhooks[webhook] = {};
        }
        for (const operation of Object.keys(openapiWebhooks[webhook])) {
          potentialConflicts.webhooks[webhook][operation] = [
            ...(potentialConflicts.webhooks[webhook][operation] || []),
            api,
          ];
        }
        for (const operationKey of Object.keys(joinedDef[webhooks][webhook])) {
          const { tags } = joinedDef[webhooks][webhook][operationKey];
          if (tags) {
            joinedDef[webhooks][webhook][operationKey].tags = tags.map((tag: string) =>
              addPrefix(tag, tagsPrefix)
            );
            populateTags({
              api,
              apiFilename,
              apiTitle,
              tags: formatTags(tags),
              potentialConflicts,
              tagsPrefix,
              componentsPrefix,
            });
          }
        }
      }
    }
  }

  function addInfoSectionAndSpecVersion(
    documents: any,
    prefixComponentsWithInfoProp: string | undefined
  ) {
    const firstApi = documents[0];
    const openapi = firstApi.parsed;
    const componentsPrefix = getInfoPrefix(openapi.info, prefixComponentsWithInfoProp, COMPONENTS);
    if (!openapi.openapi) exitWithError('Version of specification is not found.');
    if (!openapi.info) exitWithError('Info section is not found in specification.');
    if (openapi.info?.description) {
      openapi.info.description = addComponentsPrefix(openapi.info.description, componentsPrefix);
    }
    joinedDef.openapi = openapi.openapi;
    joinedDef.info = openapi.info;
  }
}

function doesComponentsDiffer(curr: object, next: object) {
  return !dequal(Object.values(curr)[0], Object.values(next)[0]);
}

function validateComponentsDifference(files: any) {
  let isDiffer = false;
  for (let i = 0, len = files.length; i < len; i++) {
    const next = files[i + 1];
    if (next && doesComponentsDiffer(files[i], next)) {
      isDiffer = true;
    }
  }
  return isDiffer;
}

function iteratePotentialConflicts(potentialConflicts: any, withoutXTagGroups?: boolean) {
  for (const group of Object.keys(potentialConflicts)) {
    for (const [key, value] of Object.entries(potentialConflicts[group])) {
      const conflicts = filterConflicts(value as object);
      if (conflicts.length) {
        if (group === COMPONENTS) {
          for (const [_, conflict] of Object.entries(conflicts)) {
            if (validateComponentsDifference(conflict[1])) {
              conflict[1] = conflict[1].map((c: string) => Object.keys(c)[0]);
              showConflicts(green(group) + ' => ' + key, [conflict]);
              potentialConflictsTotal += 1;
            }
          }
        } else {
          if (withoutXTagGroups && group === 'tags') {
            duplicateTagDescriptionWarning(conflicts);
          } else {
            potentialConflictsTotal += conflicts.length;
            showConflicts(green(group) + ' => ' + key, conflicts);
          }
        }

        if (group === 'tags' && !withoutXTagGroups) {
          prefixTagSuggestion(conflicts.length);
        }
      }
    }
  }
}

function duplicateTagDescriptionWarning(conflicts: [string, any][]) {
  const tagsKeys = conflicts.map(([tagName]) => `\`${tagName}\``);
  const joinString = yellow(', ');
  logger.warn(
    `\nwarning: ${tagsKeys.length} conflict(s) on the ${red(
      tagsKeys.join(joinString)
    )} tags description.\n`
  );
}

function prefixTagSuggestion(conflictsLength: number) {
  logger.info(
    green(
      `\n${conflictsLength} conflict(s) on tags.\nSuggestion: please use ${blue(
        'prefix-tags-with-filename'
      )}, ${blue('prefix-tags-with-info-prop')} or ${blue(
        'without-x-tag-groups'
      )} to prevent naming conflicts.\n\n`
    )
  );
}

function showConflicts(key: string, conflicts: any) {
  for (const [path, files] of conflicts) {
    logger.warn(`Conflict on ${key} : ${red(path)} in files: ${blue(files)} \n`);
  }
}

function filterConflicts(entities: object) {
  return Object.entries(entities).filter(([_, files]) => files.length > 1);
}

function getApiFilename(filePath: string) {
  return path.basename(filePath, path.extname(filePath));
}

function addPrefix(tag: string, tagsPrefix: string) {
  return tagsPrefix ? tagsPrefix + '_' + tag : tag;
}

function formatTags(tags: string[]) {
  return tags.map((tag: string) => ({ name: tag }));
}

function addComponentsPrefix(description: string, componentsPrefix: string) {
  return description.replace(/"(#\/components\/.*?)"/g, (match) => {
    const componentName = path.basename(match);
    return match.replace(componentName, addPrefix(componentName, componentsPrefix));
  });
}

function addSecurityPrefix(security: any, componentsPrefix: string) {
  return componentsPrefix
    ? security?.map((s: any) => {
        const joinedSecuritySchema = {};
        for (const [key, value] of Object.entries(s)) {
          Object.assign(joinedSecuritySchema, { [componentsPrefix + '_' + key]: value });
        }
        return joinedSecuritySchema;
      })
    : security;
}

function getInfoPrefix(info: any, prefixArg: string | undefined, type: string) {
  if (!prefixArg) return '';
  if (!info) exitWithError('Info section is not found in specification.');
  if (!info[prefixArg])
    exitWithError(
      `${yellow(`prefix-${type}-with-info-prop`)} argument value is not found in info section.`
    );
  if (!isString(info[prefixArg]))
    exitWithError(`${yellow(`prefix-${type}-with-info-prop`)} argument value should be string.`);
  if (info[prefixArg].length > 50)
    exitWithError(
      `${yellow(
        `prefix-${type}-with-info-prop`
      )} argument value length should not exceed 50 characters.`
    );
  return info[prefixArg].replaceAll(/\s/g, '_');
}

function replace$Refs(obj: unknown, componentsPrefix: string) {
  crawl(obj, (node: Record<string, unknown>) => {
    if (isRef(node) && startsWithComponents(node.$ref)) {
      const name = path.basename(node.$ref);
      node.$ref = node.$ref.replace(name, componentsPrefix + '_' + name);
    } else if (isPlainObject(node.discriminator) && isPlainObject(node.discriminator.mapping)) {
      const { mapping } = node.discriminator;
      for (const name of Object.keys(mapping)) {
        const mappingPointer = mapping[name];
        if (typeof mappingPointer === 'string' && startsWithComponents(mappingPointer)) {
          mapping[name] = mappingPointer
            .split('/')
            .map((name, i, arr) => {
              return arr.length - 1 === i && !name.includes(componentsPrefix)
                ? componentsPrefix + '_' + name
                : name;
            })
            .join('/');
        }
      }
    }
  });
}

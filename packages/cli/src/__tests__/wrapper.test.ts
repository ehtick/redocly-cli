import * as process from 'node:process';
import { loadConfigAndHandleErrors } from '../utils/miscellaneous.js';
import { sendTelemetry } from '../utils/telemetry.js';
import { commandWrapper } from '../wrapper.js';
import { handleLint } from '../commands/lint.js';
import { type Config, detectSpec } from '@redocly/openapi-core';

const originalFetch = global.fetch;

describe('commandWrapper', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.mock('@redocly/openapi-core', async () => {
      const actual = await vi.importActual('@redocly/openapi-core');
      return {
        ...actual,
        detectSpec: vi.fn(),
      };
    });
    vi.mock('../utils/miscellaneous.js');
    vi.mock('../utils/telemetry.js');
    vi.mock('../commands/lint.js');
  });
  afterEach(() => {
    global.fetch = originalFetch;
    process.env.REDOCLY_TELEMETRY = undefined;
  });

  it('should send telemetry if there is "telemetry: on" in the config', async () => {
    vi.mocked(loadConfigAndHandleErrors).mockImplementation(async () => {
      return { resolvedConfig: { telemetry: 'on' } } as Config;
    });
    vi.mocked(detectSpec).mockImplementationOnce(() => {
      return 'oas3_1';
    });
    vi.mocked(handleLint).mockImplementation(async ({ collectSpecData }) => {
      collectSpecData?.({ openapi: '3.1.0' });
    });
    process.env.REDOCLY_TELEMETRY = 'on';

    const wrappedHandler = commandWrapper(handleLint);
    await wrappedHandler({} as any);
    expect(handleLint).toHaveBeenCalledTimes(1);
    expect(sendTelemetry).toHaveBeenCalledTimes(1);
    expect(sendTelemetry).toHaveBeenCalledWith({
      config: {
        resolvedConfig: {
          telemetry: 'on',
        },
      },
      argv: {},
      exit_code: 0,
      spec_version: 'oas3_1',
      spec_keyword: 'openapi',
      spec_full_version: '3.1.0',
      respect_x_security_auth_types: [],
    });
  });

  it('should not collect spec version if the file is not parsed to json', async () => {
    vi.mocked(loadConfigAndHandleErrors).mockImplementation(async () => {
      return { resolvedConfig: { telemetry: 'on' } } as Config;
    });
    vi.mocked(handleLint).mockImplementation(async ({ collectSpecData }: any) => {
      collectSpecData();
    });
    process.env.REDOCLY_TELEMETRY = 'on';

    const wrappedHandler = commandWrapper(handleLint);
    await wrappedHandler({} as any);
    expect(handleLint).toHaveBeenCalledTimes(1);
    expect(sendTelemetry).toHaveBeenCalledTimes(1);
    expect(sendTelemetry).toHaveBeenCalledWith({
      config: {
        resolvedConfig: {
          telemetry: 'on',
        },
      },
      argv: {},
      exit_code: 0,
      spec_version: undefined,
      spec_keyword: undefined,
      spec_full_version: undefined,
      respect_x_security_auth_types: [],
    });
  });

  it('should NOT send telemetry if there is "telemetry: off" in the config', async () => {
    vi.mocked(loadConfigAndHandleErrors).mockImplementation(async () => {
      return { resolvedConfig: { telemetry: 'off' } } as Config;
    });
    process.env.REDOCLY_TELEMETRY = 'on';

    const wrappedHandler = commandWrapper(handleLint);
    await wrappedHandler({} as any);
    expect(handleLint).toHaveBeenCalledTimes(1);

    expect(sendTelemetry).toHaveBeenCalledTimes(0);
  });
});

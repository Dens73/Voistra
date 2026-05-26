type DebugLogger = ((...args: unknown[]) => void) & {
  enabled: boolean;
  namespace: string;
  extend: (suffix: string) => DebugLogger;
};

export default function debug(namespace: string): DebugLogger {
  const logger = (() => undefined) as DebugLogger;
  logger.enabled = false;
  logger.namespace = namespace;
  logger.extend = (suffix: string) => debug(`${namespace}:${suffix}`);
  return logger;
}

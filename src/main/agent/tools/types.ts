export type ToolOk<T> = {
  ok: true;
  data: T;
};

export type ToolError = {
  ok: false;
  error: string;
};

export type ToolResult<T> = ToolOk<T> | ToolError;

export function ok<T>(data: T): ToolOk<T> {
  return { ok: true, data };
}

export function fail(error: string): ToolError {
  return { ok: false, error };
}

export type ToolDefinition<INPUT, OUTPUT> = {
  description: string;
  parameters: unknown;
  execute: (params: INPUT) => Promise<OUTPUT>;
};

export type ToolExecution<TParams, TResult> = (params: TParams) => Promise<TResult>;

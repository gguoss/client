// Copyright 2017-2018 @polkadot/client-wasm authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { WasmExtraImports } from '../types';

export default function createImports (memory: WebAssembly.Memory | null | undefined, table: WebAssembly.Table, imports: WasmExtraImports = {}): { [index: string]: any } {
  return Object.assign({}, imports, {
    env: Object.assign({
      memory,
      memoryBase:
        memory
          ? 0
          : void 0,
      table,
      tableBase:
        table
          ? 0
          : void 0
    }, imports.env || {})
  });
}

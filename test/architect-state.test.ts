import { describe, it, expect } from 'vitest';
import { applyMutationsToState, EMPTY_STATE } from '../src/core/architect/state.js';

describe('applyMutationsToState', () => {
  it('creates and updates nodes based on MutationPartial xml', async () => {
    const state = structuredClone(EMPTY_STATE);
    const createXml = `
<MutationPartial>
  <Module mutationType="Create" id="Common.module">
    <![CDATA[
      {
        "title": "公共模块",
        "businessDesc": "公共能力",
        "techSummary": "提供共享实体",
        "dependency": {
          "moduleIds": []
        }
      }
    ]]>
  </Module>
</MutationPartial>`;

    const createResult = await applyMutationsToState(state, createXml);
    expect(createResult).toHaveLength(1);
    expect(state.Module['Common.module'].version).toBe(1);
    expect(state.Module['Common.module'].title).toBe('公共模块');

    const updateXml = `
<MutationPartial>
  <Module mutationType="Update" id="Common.module">
    <![CDATA[
      {
        "title": "公共模块",
        "businessDesc": "公共能力（更新）",
        "techSummary": "提供共享实体",
        "dependency": {
          "moduleIds": []
        }
      }
    ]]>
  </Module>
</MutationPartial>`;

    const updateResult = await applyMutationsToState(state, updateXml);
    expect(updateResult).toHaveLength(1);
    expect(state.Module['Common.module'].version).toBe(2);
    expect(state.Module['Common.module'].businessDesc).toContain('更新');
  });
});

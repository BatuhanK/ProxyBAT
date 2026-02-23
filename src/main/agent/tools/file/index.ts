import { buildFsRead } from "./fsRead";
import { buildFsWriteDefinition as buildFsWrite } from "./fsWrite";
import { buildFsEditDefinition as buildFsEdit } from "./fsEdit";
import { buildFsGlobDefinition as buildFsGlob } from "./fsGlob";
import { buildFsGrepDefinition as buildFsGrep } from "./fsGrep";
import { buildFsListDefinition as buildFsList } from "./fsList";

export function buildFileTools(
  workspacePath: string,
  onFileWrite?: (path: string) => void,
) {
  return {
    fs_read: buildFsRead(workspacePath),
    fs_write: buildFsWrite(workspacePath, onFileWrite),
    fs_edit: buildFsEdit(workspacePath, onFileWrite),
    fs_glob: buildFsGlob(workspacePath),
    fs_grep: buildFsGrep(workspacePath),
    fs_list: buildFsList(workspacePath),
  };
}

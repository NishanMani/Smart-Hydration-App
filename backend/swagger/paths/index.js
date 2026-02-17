import { analyticsPaths } from "./analyticsPaths.js";
import { authPaths } from "./authPaths.js";
import { reminderPaths } from "./reminderPaths.js";
import { systemPaths } from "./systemPaths.js";
import { userPaths } from "./userPaths.js";
import { waterPaths } from "./waterPaths.js";

const paths = {
  ...systemPaths,
  ...authPaths,
  ...userPaths,
  ...waterPaths,
  ...analyticsPaths,
  ...reminderPaths,
};

export default paths;

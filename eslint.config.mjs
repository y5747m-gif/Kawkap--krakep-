import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // هذه التأثيرات تربط الحالة بواجهات المتصفح/الموقع وتعمل دون حلقات تحديث.
    "rules": { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "node_modules/**", "public/uploads/**", "next-env.d.ts"]),
]);

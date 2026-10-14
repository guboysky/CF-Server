import { spawnSync } from 'node:child_process'
// Explicit startup timezone avoids Windows retaining the DST test's TZ after deletion.
for(const file of ['src/lib/format.test.ts','src/lib/api.test.ts','src/lib/display.test.ts','src/lib/map.test.ts','src/lib/country.test.ts']) {
  const result = spawnSync(process.execPath,[file],{stdio:'inherit',env:{...process.env,TZ:process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone}})
  if(result.status !== 0) process.exit(result.status || 1)
}

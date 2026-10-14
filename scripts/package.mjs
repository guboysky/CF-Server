import { readFileSync, mkdirSync, mkdtempSync, cpSync, statSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join, relative, isAbsolute } from 'node:path'
import { spawnSync } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
const root = resolve(import.meta.dirname,'..')
const manifest = JSON.parse(readFileSync(join(root,'theme.json'),'utf8'))
for(const key of ['name','short','description','version','author','url']) if(typeof manifest[key] !== 'string') throw new Error('Missing field: '+key)
if(!/^[\w-]+$/.test(manifest.short)) throw new Error('Invalid theme short name')
statSync(join(root,'dist/index.html'))
const release = join(root,'release'); mkdirSync(release,{recursive:true})
const stage = mkdtempSync(join(release,'stage-')); const theme = join(stage,manifest.short); mkdirSync(theme)
for(const file of ['theme.json','dist','preview.png','LICENSE','LICENSE-CF']) cpSync(join(root,file),join(theme,file),{recursive:true})
const archive = join(release,'theme.tar.gz')
// The upload installer reads theme.json directly at the archive root and
// creates the <short>/ installation directory itself.
const result = spawnSync('tar',['-czf',archive,'-C',theme,'theme.json','dist','preview.png','LICENSE','LICENSE-CF'],{stdio:'inherit'})
if(result.status !== 0) throw new Error('tar failed')
gunzipSync(readFileSync(archive)) // Checks gzip trailer, size and checksum.
const listed = spawnSync('tar',['-tzf',archive],{encoding:'utf8'})
if(listed.status !== 0) throw new Error('Cannot read archive entries')
const paths = listed.stdout.trim().split(/\r?\n/)
for(const required of ['theme.json','dist/index.html']) {
  if(!paths.includes(required)) throw new Error('Installer requires archive-root entry: '+required)
}
if(paths.some(path => path.startsWith(manifest.short+'/'))) throw new Error('Extra theme directory in archive')
const extracted = spawnSync('tar',['-xOf',archive,'theme.json'],{encoding:'utf8'})
if(extracted.status !== 0) throw new Error('Cannot read packaged manifest')
const packedManifest = JSON.parse(extracted.stdout)
if(packedManifest.short !== manifest.short || packedManifest.version !== manifest.version) throw new Error('Packaged manifest mismatch')
let count = 0, total = 0
function check(dir) {for(const entry of readdirSync(dir,{withFileTypes:true})) {count++; const path = join(dir,entry.name); if(entry.isDirectory()) check(path); else {const size = statSync(path).size; if(size > 8*1024*1024) throw new Error('File too large'); total += size}}}
check(theme)
if(count > 2000 || total > 64*1024*1024 || statSync(archive).size > 32*1024*1024) throw new Error('Package exceeds hub limits')
// Remove only this run's staging directory, after validating its resolved path.
const stagingRelative = relative(release,resolve(stage))
if(isAbsolute(stagingRelative) || stagingRelative.startsWith('..') || !stagingRelative.startsWith('stage-')) throw new Error('Unsafe staging directory')
rmSync(stage,{recursive:true,force:true})
console.log(`Validated ${manifest.short} ${manifest.version}: ${count} entries, ${statSync(archive).size} bytes\n${archive}`)

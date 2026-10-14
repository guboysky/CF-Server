import assert from 'node:assert/strict'
import { normalizeCountry, mergeCountries } from './country.ts'
assert.equal(normalizeCountry(' fr\n'),'FR')
assert.equal(normalizeCountry('hk'),'HK')
for(const value of ['',null,undefined,'unknown','USA','—']) assert.equal(normalizeCountry(value),'')
const before: {id:number;name:string;country?:string}[]=[{id:1,name:'A',country:'FR'},{id:2,name:'B',country:'HK'}]
assert.equal(mergeCountries([{id:1,name:'A'}],before)[0].country,'FR')
assert.equal(mergeCountries([{id:1,name:'A',country:''}],before)[0].country,'')
assert.equal(mergeCountries([{id:1,name:'A',country:' ca '}],before)[0].country,'CA')
assert.equal(mergeCountries([{id:1,name:'New'}],before)[0].country,'')
assert.deepEqual(mergeCountries([],before),[])
console.log('country normalization and partial-snapshot retention verified')

<script setup>
defineProps({ name: String, size: { type: [Number, String], default: 18 } })
const paths = {
  wallet: 'M3 5h17v15H3z M3 5V3h14 M15 10h7v6h-7z M18 13h.01',
  pulse: 'M2 12h4l3-7 5 14 3-7h5', cpu: 'M4 4h16v16H4z M8 8h8v8H8z M9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3',
  memory: 'M3 6h18v12H3z M7 10v4m5-4v4m5-4v4M6 18v3m4-3v3m4-3v3m4-3v3', disk: 'M5 3h14v18H5z M8 6h8M8 17h.01M12 17h4',
  traffic: 'M8 3v16m-4-4 4 4 4-4M16 21V5m-4 4 4-4 4 4', network: 'M4 4h6v6H4z M14 14h6v6h-6z M7 10v7h7M10 7h7v7',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', calendar: 'M4 5h16v16H4z M4 10h16M8 2v6m8-6v6',
  warning: 'm12 3 10 18H2z M12 9v5m0 3h.01', search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  grid: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z', list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
  columns: 'M3 3h18v18H3z M9 3v18m6-18v18', star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  settings: 'm9 3 6 0 1 3 3 1 2 5-2 3-3 1-1 3H9l-1-3-3-1-2-5 2-3 3-1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  back: 'M20 12H4m6-6-6 6 6 6', arrow: 'M7 17 17 7M7 7h10v10', upload: 'M12 20V4m-5 5 5-5 5 5', download: 'M12 4v16m-5-5 5 5 5-5',
  info: 'M12 11v6m0-10h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', server: 'M4 3h16v7H4z M4 14h16v7H4z M8 6h.01M8 17h.01',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5M14 3l-4 18', chevron: 'm9 5 7 7-7 7'
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.server"/></svg></template>

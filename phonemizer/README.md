# Phonemizer.js

Simple text to phones converter using eSpeak NG.

## Basic usage

```js
import { phonemize } from "phonemizer";

const phonemes = await phonemize("Hello world.");
console.log(phonemes); // ['həlˈəʊ wˈɜːld']
```

Alternatively, you can load the library from a CDN as follows:

```html
<script type="module">
  import { phonemize } from "https://cdn.jsdelivr.net/npm/phonemizer";

  const phonemes = await phonemize("Hello world.");
  console.log(phonemes); // ['həlˈəʊ wˈɜːld']
</script>
```

<details>

```js
const { phonemize } = require("phonemizer");

(async () => {
  const phonemes = await phonemize("Hello world.");
  console.log(phonemes); // ['həlˈəʊ wˈɜːld']
})();
```

<summary>CommonJS usage</summary>

</details>

## Advanced Usage

1. List supported voices

   ```js
   import { list_voices } from "phonemizer";
   console.dir(await list_voices(), { depth: null });
   ```

   <details>

   <summary>Example output</summary>

   ```js
   [
     {
       name: "English (Caribbean)",
       identifier: "gmw/en-029",
       languages: [
         { priority: 5, name: "en-029" },
         { priority: 10, name: "en" },
       ],
     },
     {
       name: "English (Great Britain)",
       identifier: "gmw/en",
       languages: [
         { priority: 2, name: "en-gb" },
         { priority: 2, name: "en" },
       ],
     },
     {
       name: "English (Scotland)",
       identifier: "gmw/en-GB-scotland",
       languages: [
         { priority: 5, name: "en-gb-scotland" },
         { priority: 4, name: "en" },
       ],
     },
     {
       name: "English (Lancaster)",
       identifier: "gmw/en-GB-x-gbclan",
       languages: [
         { priority: 5, name: "en-gb-x-gbclan" },
         { priority: 3, name: "en-gb" },
         { priority: 5, name: "en" },
       ],
     },
     {
       name: "English (West Midlands)",
       identifier: "gmw/en-GB-x-gbcwmd",
       languages: [
         { priority: 5, name: "en-gb-x-gbcwmd" },
         { priority: 9, name: "en-gb" },
         { priority: 9, name: "en" },
       ],
     },
     {
       name: "English (Received Pronunciation)",
       identifier: "gmw/en-GB-x-rp",
       languages: [
         { priority: 5, name: "en-gb-x-rp" },
         { priority: 4, name: "en-gb" },
         { priority: 5, name: "en" },
       ],
     },
     {
       name: "English (America)",
       identifier: "gmw/en-US",
       languages: [
         { priority: 2, name: "en-us" },
         { priority: 3, name: "en" },
       ],
     },
     {
       name: "English (America, New York City)",
       identifier: "gmw/en-US-nyc",
       languages: [{ priority: 5, name: "en-us-nyc" }],
     },
   ];
   ```

   </details>

2. Select different language/voice

   ```js
   import { phonemize } from "phonemizer";

   const phonemes = await phonemize("Hello world.", "en-gb-scotland");
   console.log(phonemes); // [ 'həlˈoː wˈʌɹld' ]
   ```
